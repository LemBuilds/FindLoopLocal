import { getStore, persistStore, generateId, now } from "./local-store";
import type { LocalStoreData, Row } from "./local-store";

type TableName = keyof LocalStoreData;

interface Filter {
  type: "eq" | "neq" | "is" | "in" | "lt" | "gte" | "ilike";
  column: string;
  value: unknown;
}

interface RelSpec {
  resultKey: string;
  table: TableName;
  fkInMain?: string;
  fkInRelated?: string;
  many: boolean;
  fields: string[] | null;
}

const IMPLICIT_RELATIONS: Record<string, Omit<RelSpec, "fields">> = {
  listing_photos: {
    resultKey: "listing_photos",
    table: "listing_photos",
    fkInRelated: "listing_id",
    many: true,
  },
  profiles: {
    resultKey: "profiles",
    table: "profiles",
    fkInMain: "user_id",
    many: false,
  },
};

const ALIAS_TABLE_MAP: Record<string, TableName> = {
  listing: "listings",
  lost_listing: "listings",
  found_listing: "listings",
  profiles: "profiles",
  listing_photos: "listing_photos",
};

function splitTopLevel(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of str) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSelect(selectStr: string): { mainFields: string[] | null; relations: RelSpec[] } {
  const trimmed = selectStr.trim();
  if (!trimmed || trimmed === "*") return { mainFields: null, relations: [] };

  const parts = splitTopLevel(trimmed);
  const mainFields: string[] = [];
  const relations: RelSpec[] = [];
  let hasWildcard = false;

  for (const part of parts) {
    const p = part.trim();
    const parenIdx = p.indexOf("(");
    if (parenIdx === -1) {
      if (p === "*") hasWildcard = true;
      else mainFields.push(p);
      continue;
    }

    const beforeParen = p.substring(0, parenIdx).trim();
    const innerStr = p.substring(parenIdx + 1, p.lastIndexOf(")")).trim();
    const innerFields = innerStr
      ? innerStr.split(",").map((f) => f.trim()).filter(Boolean)
      : null;

    const colonIdx = beforeParen.indexOf(":");
    if (colonIdx === -1) {
      const implicit = IMPLICIT_RELATIONS[beforeParen];
      if (implicit) relations.push({ ...implicit, fields: innerFields });
    } else {
      const alias = beforeParen.substring(0, colonIdx).trim();
      const fkOrAlias = beforeParen.substring(colonIdx + 1).trim();
      const table: TableName =
        ALIAS_TABLE_MAP[alias] ??
        ALIAS_TABLE_MAP[fkOrAlias] ??
        (fkOrAlias as TableName);
      relations.push({
        resultKey: alias,
        table,
        fkInMain: fkOrAlias,
        many: false,
        fields: innerFields,
      });
    }
  }

  return {
    mainFields: hasWildcard ? null : mainFields.length > 0 ? mainFields : null,
    relations,
  };
}

function pickFields(row: Row, fields: string[] | null): Row {
  if (!fields) return { ...row };
  const result: Row = {};
  for (const f of fields) result[f] = row[f];
  return result;
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) => {
    for (const f of filters) {
      const val = row[f.column];
      switch (f.type) {
        case "eq":
          if (val !== f.value) return false;
          break;
        case "neq":
          if (val === f.value) return false;
          break;
        case "is":
          if (f.value === null ? val !== null : val !== f.value) return false;
          break;
        case "in":
          if (!(f.value as unknown[]).includes(val)) return false;
          break;
        case "lt":
          if (!(String(val ?? "") < String(f.value ?? ""))) return false;
          break;
        case "gte":
          if (!(String(val ?? "") >= String(f.value ?? ""))) return false;
          break;
        case "ilike": {
          const pattern = String(f.value)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/%/g, ".*")
            .replace(/_/g, ".");
          if (!new RegExp(pattern, "i").test(String(val ?? ""))) return false;
          break;
        }
      }
    }
    return true;
  });
}

function joinRelations(rows: Row[], relations: RelSpec[], store: LocalStoreData): Row[] {
  if (relations.length === 0) return rows;
  return rows.map((row) => {
    const result = { ...row };
    for (const rel of relations) {
      const relTable = store[rel.table] as Record<string, Row>;
      const relRows = Object.values(relTable);
      if (rel.fkInRelated) {
        const matching = relRows.filter((rr) => rr[rel.fkInRelated!] === row.id);
        result[rel.resultKey] = matching.map((rr) => pickFields(rr, rel.fields));
      } else if (rel.fkInMain) {
        const fkVal = row[rel.fkInMain];
        const matching = relRows.find((rr) => rr.id === fkVal) ?? null;
        result[rel.resultKey] = matching ? pickFields(matching, rel.fields) : null;
      }
    }
    return result;
  });
}

const KNOWN_OPS = ["eq", "neq", "ilike", "lt", "gte", "is", "in"];

function applyOrFilter(rows: Row[], orStr: string): Row[] {
  const clauses = orStr.split(",").map((c) => c.trim());

  return rows.filter((row) =>
    clauses.some((clause) => {
      const parts = clause.split(".");
      if (parts.length >= 4 && KNOWN_OPS.includes(parts[2])) {
        // rel.col.op.value
        const [relKey, colKey, op, ...valueParts] = parts;
        const value = valueParts.join(".");
        const relObj = row[relKey] as Row | undefined;
        if (!relObj) return false;
        const v = relObj[colKey];
        if (op === "eq") return String(v) === value;
        if (op === "neq") return String(v) !== value;
      } else if (parts.length >= 3 && KNOWN_OPS.includes(parts[1])) {
        // col.op.value
        const [colKey, op, ...valueParts] = parts;
        const value = valueParts.join(".");
        const v = row[colKey];
        if (op === "ilike") {
          const pattern = value
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/%/g, ".*")
            .replace(/_/g, ".");
          return new RegExp(pattern, "i").test(String(v ?? ""));
        }
        if (op === "eq") return String(v) === value;
        if (op === "neq") return String(v) !== value;
      }
      return false;
    })
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { data: any; error: null; count?: number };

export class QueryBuilder {
  private _table: TableName;
  private _selectStr = "*";
  private _isCount = false;
  private _filters: Filter[] = [];
  private _orFilter?: string;
  private _orderCol?: string;
  private _orderAsc = true;
  private _limitN?: number;
  private _operation: "select" | "insert" | "update" | "delete" = "select";
  private _mutationData?: Row | Row[];
  private _selectAfterMutation = false;

  constructor(table: TableName) {
    this._table = table;
  }

  select(fields = "*", options?: { count?: "exact"; head?: boolean }): this {
    if (this._operation !== "select") {
      this._selectAfterMutation = true;
      this._selectStr = fields;
      return this;
    }
    this._selectStr = fields;
    this._isCount = options?.count === "exact";
    return this;
  }

  eq(column: string, value: unknown): this {
    this._filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this._filters.push({ type: "neq", column, value });
    return this;
  }

  is(column: string, value: unknown): this {
    this._filters.push({ type: "is", column, value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this._filters.push({ type: "in", column, value: values });
    return this;
  }

  lt(column: string, value: unknown): this {
    this._filters.push({ type: "lt", column, value });
    return this;
  }

  or(filter: string): this {
    this._orFilter = filter;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this._orderCol = column;
    this._orderAsc = options?.ascending ?? true;
    return this;
  }

  limit(n: number): this {
    this._limitN = n;
    return this;
  }

  insert(data: Row | Row[]): this {
    this._operation = "insert";
    this._mutationData = data;
    return this;
  }

  update(data: Row): this {
    this._operation = "update";
    this._mutationData = data;
    return this;
  }

  delete(): this {
    this._operation = "delete";
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async single(): Promise<{ data: any; error: null }> {
    const result = await this._execute();
    const rows = Array.isArray(result.data) ? result.data : [result.data].filter(Boolean);
    return { data: rows[0] ?? null, error: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then<TResult1 = QueryResult, TResult2 = never>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled as never, onrejected as never);
  }

  private async _execute(): Promise<QueryResult> {
    const store = getStore();
    const tableData = store[this._table] as Record<string, Row>;

    if (this._operation === "insert") {
      const data = this._mutationData!;
      if (Array.isArray(data)) {
        const inserted: Row[] = [];
        for (const item of data) {
          const id = (item.id as string) ?? generateId();
          const row: Row = { id, created_at: now(), ...item };
          tableData[id] = row;
          inserted.push(row);
        }
        persistStore();
        return { data: inserted, error: null };
      } else {
        const id = (data.id as string) ?? generateId();
        const row: Row = { id, created_at: now(), ...data };
        tableData[id] = row;
        persistStore();
        return { data: [row], error: null };
      }
    }

    if (this._operation === "update") {
      const data = this._mutationData as Row;
      let rows = Object.values(tableData);
      rows = applyFilters(rows, this._filters);
      const updated: Row[] = [];
      for (const row of rows) {
        const u = { ...row, ...data };
        tableData[u.id as string] = u;
        updated.push(u);
      }
      persistStore();
      if (this._selectAfterMutation) return { data: updated, error: null };
      return { data: null, error: null };
    }

    if (this._operation === "delete") {
      let rows = Object.values(tableData);
      rows = applyFilters(rows, this._filters);
      for (const row of rows) delete tableData[row.id as string];
      persistStore();
      return { data: null, error: null };
    }

    // SELECT
    let rows = Object.values(tableData);
    rows = applyFilters(rows, this._filters);

    const { mainFields, relations } = parseSelect(this._selectStr);

    if (relations.length > 0) {
      rows = joinRelations(rows, relations, store);
    }

    if (this._orFilter) {
      rows = applyOrFilter(rows, this._orFilter);
    }

    if (this._orderCol) {
      const col = this._orderCol;
      const asc = this._orderAsc;
      rows.sort((a, b) => {
        const av = String(a[col] ?? "");
        const bv = String(b[col] ?? "");
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    if (this._limitN !== undefined) rows = rows.slice(0, this._limitN);

    if (this._isCount) return { data: null, error: null, count: rows.length };

    const result = rows.map((r) => pickFields(r, mainFields));
    return { data: result, error: null };
  }
}

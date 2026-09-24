"use client";

async function localFetch(endpoint: string, body: Record<string, unknown>) {
  const r = await fetch(`/api/local/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: r.ok ? "Unexpected server response" : `Server error (${r.status})` };
  }
}

class ClientQueryBuilder {
  private _table: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _filters: { col: string; val: any }[] = [];
  private _selectFields = "*";

  constructor(table: string) {
    this._table = table;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(fields = "*"): this {
    this._selectFields = fields;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq(col: string, val: any): this {
    this._filters.push({ col, val });
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async single(): Promise<{ data: any; error: null }> {
    const res = await fetch("/api/local/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: this._table,
        filters: this._filters,
        select: this._selectFields,
      }),
    }).then((r) => r.json());
    const rows = res.data ?? [];
    return { data: rows[0] ?? null, error: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then(resolve: (v: { data: any; error: null }) => void) {
    fetch("/api/local/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: this._table,
        filters: this._filters,
        select: this._selectFields,
      }),
    })
      .then((r) => r.json())
      .then((res) => resolve({ data: res.data ?? [], error: null }));
    return this;
  }
}

export function createClient() {
  return {
    auth: {
      async signUp(params: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string } };
      }) {
        const res = await localFetch("signup", {
          email: params.email,
          password: params.password,
          full_name: params.options?.data?.full_name ?? "",
        });
        return { error: res.error ? { message: res.error } : null };
      },

      async signInWithPassword(params: { email: string; password: string }) {
        const res = await localFetch("login", {
          email: params.email,
          password: params.password,
        });
        return { error: res.error ? { message: res.error } : null };
      },

      async signOut() {
        await localFetch("logout", {});
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async getUser(): Promise<{ data: { user: any }; error: null }> {
        const res = await fetch("/api/local/auth/user").then((r) => r.json());
        return { data: { user: res.user ?? null }, error: null };
      },

      async resetPasswordForEmail(email: string, options?: unknown) {
        void email; void options;
        return { error: null as { message: string } | null };
      },

      onAuthStateChange(callback: (event: unknown, session: unknown) => void) {
        void callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },

    from(table: string) {
      return new ClientQueryBuilder(table);
    },
  };
}

import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { getStore } from "@/lib/local-store";
import { QueryBuilder } from "@/lib/local-query";
import type { LocalStoreData } from "@/lib/local-store";

type TableName = keyof LocalStoreData;

function sessionUserId(): string | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get("fl_session")?.value;
    if (!raw) return null;
    return Buffer.from(raw, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        const userId = sessionUserId();
        if (!userId) return { data: { user: null }, error: null };
        const store = getStore();
        const user = store.users[userId];
        if (!user) return { data: { user: null }, error: null };
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: { full_name: user.full_name },
            },
          },
          error: null,
        };
      },

      async signOut() {
        try {
          const cookieStore = cookies();
          cookieStore.delete("fl_session");
        } catch {}
      },
    },

    from(table: string) {
      return new QueryBuilder(table as TableName);
    },

    storage: {
      from(bucket: string) {
        void bucket;
        return {
          async upload(
            storagePath: string,
            data: Buffer,
            options: { contentType: string; upsert: boolean }
          ) {
            void options;
            try {
              const dest = path.join(
                process.cwd(),
                "public",
                "uploads",
                storagePath
              );
              fs.mkdirSync(path.dirname(dest), { recursive: true });
              fs.writeFileSync(dest, data);
              return { error: null };
            } catch (err) {
              return { error: { message: String(err) } };
            }
          },
        };
      },
    },

    async rpc(fn: string, params: Record<string, unknown>) {
      void fn; void params;
      return { data: false, error: null };
    },
  };
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LocalUser {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

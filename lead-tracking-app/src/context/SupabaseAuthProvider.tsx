"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../utils/supabaseClient";
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type User = {
  id: string;
  email: string;
  role: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        fetchUser(data.session.user.id);
      } else {
        setLoading(false);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent, session: Session | null
    ) => {
      if (session?.user) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", userId)
      .single();
    if (data) {
      setUser(data);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within SupabaseAuthProvider");
  return context;
} 
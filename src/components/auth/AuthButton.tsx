"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  const supabase = createClient();

  // Check auth state on mount
  if (typeof window !== "undefined") {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">
          {user.email}
        </span>
        <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
          Salir
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2">
        {sent ? (
          <p className="text-sm text-green-600 font-medium">
            ¡Revisa tu email!
          </p>
        ) : (
          <form onSubmit={handleLogin} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base text-sm py-2 w-48"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm py-2 px-4"
            >
              {loading ? "..." : "Acceder"}
            </button>
          </form>
        )}
        <button
          onClick={() => setShowForm(false)}
          className="btn-ghost text-sm py-2"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="btn-secondary text-sm py-2 px-4"
    >
      Acceder
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/auth/AuthModal";

export default function AuthButton() {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
        <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
          Salir
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-secondary text-sm py-2 px-4">
        Acceder
      </button>
      {showModal && createPortal(
        <AuthModal
          onClose={() => setShowModal(false)}
          onContinueAsGuest={() => setShowModal(false)}
          onGoogleRedirect={() => {}}
        />,
        document.body
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AuthModalProps {
  onContinueAsGuest: () => void;
  onClose: () => void;
  onGoogleRedirect?: () => void; // kept for API compat, unused
}

export default function AuthModal({ onContinueAsGuest, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          onClose(); // email confirmation disabled — logged in directly
        } else {
          setConfirmSent(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de autenticación";
      if (msg.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirma tu email antes de iniciar sesión.");
      } else if (msg.includes("User already registered")) {
        setError("Ya tienes cuenta. Inicia sesión.");
        setMode("signin");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "signin"
              ? "Accede para guardar tus análisis."
              : "Crea una cuenta gratis para guardar todos tus análisis."}
          </p>
        </div>

        {confirmSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">¡Revisa tu email!</p>
            <p className="text-sm text-gray-500">
              Hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label-base">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label-base">Contraseña</label>
              <input
                type="password"
                placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  {mode === "signin" ? "Entrando..." : "Creando cuenta..."}
                </>
              ) : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>
        )}

        {/* Mode toggle */}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
          >
            {mode === "signin" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>

        {/* Continue as guest */}
        <div className="mt-3 text-center">
          <button
            onClick={onContinueAsGuest}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4"
          >
            Continuar sin cuenta →
          </button>
          <p className="text-xs text-gray-400 mt-1">El análisis no se guardará</p>
        </div>
      </div>
    </div>
  );
}

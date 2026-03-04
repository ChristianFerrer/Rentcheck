import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="container-app py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Error de autenticación
      </h1>
      <p className="text-gray-500 mb-8">
        El enlace ha caducado o es inválido. Por favor, inténtalo de nuevo.
      </p>
      <Link href="/" className="btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
}

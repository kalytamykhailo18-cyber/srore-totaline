"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }
      // Hard navigation so the new cookie is sent with the next request
      window.location.href = "/admin";
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-16 min-h-[calc(100vh-200px)]">
      <div className="max-w-sm w-full bg-white border rounded-2xl shadow-md p-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Refrigeración Perez" className="w-20 h-20 mx-auto rounded-full mb-3" />
          <h1 className="text-xl font-bold text-brand-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">Refrigeración Perez</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-800/20"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 text-sm font-medium text-white bg-brand-800 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

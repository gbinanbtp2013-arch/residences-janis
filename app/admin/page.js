"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseUrl } from "../../lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlConfiguree = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cleConfiguree = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(`${error.message} (code ${error.status ?? "?"})`);
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
    } catch (err) {
      setError(`Erreur technique : ${err.message}`);
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <h2 style={{ marginBottom: 6 }}>Connexion administrateur</h2>
        <p style={{ color: "var(--ink-soft)", marginTop: 0, marginBottom: 20 }}>
          Réservé à la gestion des Résidences Janis.
        </p>

        {(!urlConfiguree || !cleConfiguree) && (
          <p className="error-text">
            Configuration incomplète :{" "}
            {!urlConfiguree && "l'adresse Supabase (URL) est absente. "}
            {!cleConfiguree && "la clé Supabase est absente. "}
            Vérifiez les variables sur Vercel puis redéployez sans cache.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          Adresse utilisée par le site : {supabaseUrl || "(aucune)"}
        </p>
      </div>
    </div>
  );
}

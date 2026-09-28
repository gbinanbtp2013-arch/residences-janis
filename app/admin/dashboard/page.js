"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { formatDateFR } from "../../../lib/availability";

const EMPTY_FORM = {
  titre: "",
  quartier: "",
  prix: "",
  unite: "nuit",
  description: "",
  disponible: true,
};

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [studios, setStudios] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [datesStudioId, setDatesStudioId] = useState(null);
  const [periodes, setPeriodes] = useState([]);
  const [nouvellePeriode, setNouvellePeriode] = useState({ date_debut: "", date_fin: "", note: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin");
      } else {
        setSession(data.session);
      }
      setCheckingSession(false);
    });
  }, [router]);

  useEffect(() => {
    if (session) loadStudios();
  }, [session]);

  async function loadStudios() {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setStudios(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFile(null);
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      titre: s.titre || "",
      quartier: s.quartier || "",
      prix: s.prix || "",
      unite: s.unite || "nuit",
      description: s.description || "",
      disponible: s.disponible ?? true,
    });
    setFile(null);
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer ce studio ?")) return;
    await supabase.from("studios").delete().eq("id", id);
    if (datesStudioId === id) setDatesStudioId(null);
    loadStudios();
  }

  async function openDates(studioId) {
    setDatesStudioId(studioId);
    setNouvellePeriode({ date_debut: "", date_fin: "", note: "" });
    const { data, error } = await supabase
      .from("indisponibilites")
      .select("*")
      .eq("studio_id", studioId)
      .order("date_debut", { ascending: true });
    if (!error) setPeriodes(data || []);
  }

  async function ajouterPeriode(e) {
    e.preventDefault();
    if (!nouvellePeriode.date_debut || !nouvellePeriode.date_fin) return;
    await supabase.from("indisponibilites").insert({
      studio_id: datesStudioId,
      date_debut: nouvellePeriode.date_debut,
      date_fin: nouvellePeriode.date_fin,
      note: nouvellePeriode.note,
    });
    openDates(datesStudioId);
  }

  async function supprimerPeriode(id) {
    await supabase.from("indisponibilites").delete().eq("id", id);
    openDates(datesStudioId);
  }

  async function uploadPhoto(studioId) {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${studioId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("studio-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("studio-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        titre: form.titre,
        quartier: form.quartier,
        prix: Number(form.prix) || 0,
        unite: form.unite,
        description: form.description,
        disponible: form.disponible,
      };

      let studioId = editingId;

      if (editingId) {
        const { error: updateError } = await supabase
          .from("studios")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("studios")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        studioId = data.id;
      }

      if (file && studioId) {
        const imageUrl = await uploadPhoto(studioId);
        if (imageUrl) {
          await supabase.from("studios").update({ image_url: imageUrl }).eq("id", studioId);
        }
      }

      resetForm();
      loadStudios();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession) return <div className="admin-shell">Vérification…</div>;
  if (!session) return null;

  return (
    <div className="admin-shell">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>Gérer les studios</h2>
        <button className="ghost" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>{editingId ? "Modifier le studio" : "Ajouter un studio"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Titre</label>
            <input
              required
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Quartier</label>
            <input
              required
              value={form.quartier}
              onChange={(e) => setForm({ ...form, quartier: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Prix (FCFA)</label>
            <input
              required
              type="number"
              min="0"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Unité</label>
            <select
              value={form.unite}
              onChange={(e) => setForm({ ...form, unite: e.target.value })}
            >
              <option value="nuit">par nuit</option>
              <option value="mois">par mois</option>
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="disponible"
              checked={form.disponible}
              onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
              style={{ width: "auto" }}
            />
            <label htmlFor="disponible" style={{ margin: 0 }}>
              Visible sur le site public
            </label>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter"}
            </button>
            {editingId && (
              <button className="ghost" type="button" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list">
        {studios.map((s) => (
          <div className="admin-row" key={s.id}>
            <div>
              <strong>{s.titre}</strong>
              <div className="meta">
                {s.quartier} — {Number(s.prix).toLocaleString("fr-FR")} FCFA / {s.unite}{" "}
                {!s.disponible && "— masqué"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ghost" onClick={() => openDates(s.id)}>
                Gérer les dates
              </button>
              <button className="ghost" onClick={() => startEdit(s)}>
                Modifier
              </button>
              <button className="ghost" onClick={() => handleDelete(s.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {datesStudioId && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>
              Dates occupées — {studios.find((s) => s.id === datesStudioId)?.titre}
            </h3>
            <button className="ghost" onClick={() => setDatesStudioId(null)}>Fermer</button>
          </div>

          <div className="admin-list" style={{ marginTop: 14 }}>
            {periodes.length === 0 && (
              <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                Aucune période occupée enregistrée — le studio apparaît comme disponible.
              </p>
            )}
            {periodes.map((p) => (
              <div className="admin-row" key={p.id}>
                <div>
                  <strong>{formatDateFR(p.date_debut)} → {formatDateFR(p.date_fin)}</strong>
                  {p.note && <div className="meta">{p.note}</div>}
                </div>
                <button className="ghost" onClick={() => supprimerPeriode(p.id)}>Supprimer</button>
              </div>
            ))}
          </div>

          <form onSubmit={ajouterPeriode} style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Occupé du</label>
              <input
                type="date"
                required
                value={nouvellePeriode.date_debut}
                onChange={(e) => setNouvellePeriode({ ...nouvellePeriode, date_debut: e.target.value })}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Au</label>
              <input
                type="date"
                required
                min={nouvellePeriode.date_debut}
                value={nouvellePeriode.date_fin}
                onChange={(e) => setNouvellePeriode({ ...nouvellePeriode, date_fin: e.target.value })}
              />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
              <label>Note (optionnel)</label>
              <input
                type="text"
                placeholder="Ex. réservation en cours"
                value={nouvellePeriode.note}
                onChange={(e) => setNouvellePeriode({ ...nouvellePeriode, note: e.target.value })}
              />
            </div>
            <button className="primary" type="submit">Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}

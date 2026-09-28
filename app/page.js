"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { getAvailabilityStatus, checkRangeAvailability, formatDateFR, todayStr } from "../lib/availability";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

function formatFCFA(n) {
  return Number(n || 0).toLocaleString("fr-FR") + " FCFA";
}

function bookingLink(studio, debut, fin) {
  const dates = debut && fin ? ` du ${formatDateFR(debut)} au ${formatDateFR(fin)}` : "";
  const msg = `Bonjour, je souhaite réserver le studio "${studio.titre}" (${studio.quartier})${dates} — ${formatFCFA(
    studio.prix
  )}/${studio.unite}. Merci de me confirmer la disponibilité.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function StudioCard({ studio, periodes }) {
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [verif, setVerif] = useState(null); // null | { libre: true } | { libre: false, prochaineDateLibre }

  const statut = useMemo(() => getAvailabilityStatus(periodes), [periodes]);

  function handleVerifier() {
    if (!debut || !fin || debut > fin) {
      setVerif({ libre: false, erreurSaisie: true });
      return;
    }
    setVerif(checkRangeAvailability(periodes, debut, fin));
  }

  const peutReserver = !verif || verif.libre;

  return (
    <article className="listing-card">
      <div
        className="listing-photo"
        style={{ backgroundImage: studio.image_url ? `url(${studio.image_url})` : "none" }}
      >
        <span className="quartier-tag">{studio.quartier}</span>
      </div>
      <div className="listing-body">
        <h3>{studio.titre}</h3>
        <p className="desc">{studio.description}</p>
        <div className="listing-price">
          {formatFCFA(studio.prix)} <span>/ {studio.unite}</span>
        </div>

        <div className={`avail-badge ${statut.occupeMaintenant ? "occupe" : "libre"}`}>
          {statut.occupeMaintenant
            ? `Occupé — libre à partir du ${formatDateFR(statut.libreLe)}`
            : "Disponible maintenant"}
        </div>

        <div className="date-check">
          <div className="date-row">
            <label>
              Arrivée
              <input type="date" value={debut} min={todayStr()} onChange={(e) => { setDebut(e.target.value); setVerif(null); }} />
            </label>
            <label>
              Départ
              <input type="date" value={fin} min={debut || todayStr()} onChange={(e) => { setFin(e.target.value); setVerif(null); }} />
            </label>
          </div>
          <button type="button" className="btn-check" onClick={handleVerifier}>
            Vérifier ces dates
          </button>

          {verif && verif.erreurSaisie && (
            <p className="verif-msg warn">Choisissez une date d'arrivée et de départ valides.</p>
          )}
          {verif && !verif.erreurSaisie && !verif.libre && (
            <p className="verif-msg warn">
              Déjà réservé sur cette période — prochaine date libre : {formatDateFR(verif.prochaineDateLibre)}.
            </p>
          )}
          {verif && verif.libre && (
            <p className="verif-msg ok">Disponible sur ces dates — vous pouvez réserver.</p>
          )}
        </div>

        <a
          className={`btn-book ${!peutReserver ? "disabled" : ""}`}
          href={peutReserver ? bookingLink(studio, debut, fin) : "#"}
          onClick={(e) => { if (!peutReserver) e.preventDefault(); }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Réserver via WhatsApp
        </a>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [studios, setStudios] = useState([]);
  const [periodesParStudio, setPeriodesParStudio] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: studiosData, error: studiosError }, { data: periodesData, error: periodesError }] =
        await Promise.all([
          supabase.from("studios").select("*").eq("disponible", true).order("created_at", { ascending: false }),
          supabase.from("indisponibilites").select("*"),
        ]);
      if (!active) return;
      if (!studiosError) setStudios(studiosData || []);
      if (!periodesError) {
        const grouped = {};
        (periodesData || []).forEach((p) => {
          grouped[p.studio_id] = grouped[p.studio_id] || [];
          grouped[p.studio_id].push(p);
        });
        setPeriodesParStudio(grouped);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <>
      <header className="site">
        <div className="wrap">
          <div className="logo">
            Les Résidences <em>Janis</em>
          </div>
          <a className="admin-link" href="/admin">Espace administrateur</a>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="section-head">
            <h2>Nos studios disponibles</h2>
            <p>
              Studios meublés dans plusieurs quartiers d'Abomey-Calavi. Vérifiez la disponibilité
              et réservez directement par WhatsApp.
            </p>
          </div>

          {loading && <p>Chargement des studios…</p>}

          {!loading && studios.length === 0 && (
            <div className="empty-state">
              Aucun studio n'est publié pour le moment. Connectez-vous à l'espace administrateur pour en ajouter.
            </div>
          )}

          <div className="listing-grid">
            {studios.map((s) => (
              <StudioCard key={s.id} studio={s} periodes={periodesParStudio[s.id] || []} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

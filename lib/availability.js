// Toutes les dates sont des chaînes "AAAA-MM-JJ" (comparables directement).

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Fusionne les périodes qui se chevauchent ou se touchent (fin+1 = début suivant). */
function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => (a.date_debut < b.date_debut ? -1 : 1));
  const merged = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.date_debut <= addDays(last.date_fin, 1)) {
      if (r.date_fin > last.date_fin) last.date_fin = r.date_fin;
    } else {
      merged.push({ date_debut: r.date_debut, date_fin: r.date_fin });
    }
  }
  return merged;
}

/**
 * Renvoie l'état de disponibilité d'un studio à partir d'aujourd'hui :
 * { occupeMaintenant: bool, libreLe: "AAAA-MM-JJ" | null }
 * libreLe est la date à partir de laquelle le studio est libre en continu
 * (null si déjà libre maintenant).
 */
export function getAvailabilityStatus(periodes) {
  const merged = mergeRanges(periodes);
  const today = todayStr();
  const current = merged.find((r) => r.date_debut <= today && today <= r.date_fin);
  if (!current) return { occupeMaintenant: false, libreLe: null };
  return { occupeMaintenant: true, libreLe: addDays(current.date_fin, 1) };
}

/**
 * Vérifie si la période demandée [debut, fin] est libre.
 * Renvoie { libre: true } ou { libre: false, prochaineDateLibre }.
 */
export function checkRangeAvailability(periodes, debut, fin) {
  const merged = mergeRanges(periodes);
  const overlapping = merged.filter((r) => debut <= r.date_fin && fin >= r.date_debut);
  if (overlapping.length === 0) return { libre: true };
  const lastEnd = overlapping.reduce((max, r) => (r.date_fin > max ? r.date_fin : max), overlapping[0].date_fin);
  return { libre: false, prochaineDateLibre: addDays(lastEnd, 1) };
}

export function formatDateFR(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export { todayStr };

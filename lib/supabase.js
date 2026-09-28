import { createClient } from "@supabase/supabase-js";

// Nettoyage automatique des valeurs saisies sur Vercel :
// espaces, guillemets, "/" final, chemin en trop, "https://" oublié.
function nettoyerUrl(valeur) {
  let url = (valeur || "").trim().replace(/^["']+|["']+$/g, "");
  url = url.replace(/\/(rest|auth|storage)\/v1.*$/i, "");
  url = url.replace(/\/+$/, "");
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}

function nettoyerCle(valeur) {
  return (valeur || "").trim().replace(/^["']+|["']+$/g, "");
}

export const supabaseUrl = nettoyerUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = nettoyerCle(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Variables Supabase manquantes. Vérifiez les variables d'environnement sur Vercel."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

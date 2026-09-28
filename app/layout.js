import "./globals.css";

export const metadata = {
  title: "Les Résidences Janis — Studios meublés & location de véhicules",
  description:
    "Studios meublés dans plusieurs quartiers d'Abomey-Calavi et location de véhicules.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

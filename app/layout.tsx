import type { Metadata, Viewport } from "next";
import { Cinzel, Great_Vibes, Lato } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Longo Bucco Beauty Studio",
    template: "%s | Longo Bucco Beauty Studio",
  },
  description:
    "Agende seu horário no Longo Bucco Beauty Studio: unhas, tranças e depilação. Rua Itaboraí, nº 19, Heliópolis, Belford Roxo.",
  applicationName: "Longo Bucco Beauty Studio",
  icons: {
    icon: [{ url: "/brand/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/brand/apple-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Longo Bucco", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FBF1E5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${greatVibes.variable} ${lato.variable}`}
    >
      <body className="min-h-dvh bg-cream font-sans text-coffee antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

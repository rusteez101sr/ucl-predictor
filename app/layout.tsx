import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { Nav } from "@/components/Nav";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "UCL Predictor",
  description:
    "UEFA Champions League knockout predictions — trophy odds, match sims, and live updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-pitch-fade font-sans antialiased">
        <Nav />
        <DemoBanner />
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-xs text-cl-muted">
          Demo mode runs with zero API keys · sample data in /data
        </footer>
      </body>
    </html>
  );
}

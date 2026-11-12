import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { RunProvider } from "@/lib/store/RunProvider";
import { EvidenceDrawerProvider } from "@/lib/store/EvidenceDrawerProvider";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { AppShell } from "@/components/app-shell/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// IC Memo type system: a serif voice for headings and key figures, a sober
// sans for UI and body, mono only for document references and IDs.
const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WinBack — Autonomous first-pass diligence",
  description: "Extraction, benchmark, portfolio impact, and evidence-linked decision support for PE deal teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <RunProvider>
          <TooltipProvider>
            <EvidenceDrawerProvider>
              <AppShell>{children}</AppShell>
              <EvidenceDrawer />
            </EvidenceDrawerProvider>
          </TooltipProvider>
        </RunProvider>
        <Toaster />
      </body>
    </html>
  );
}

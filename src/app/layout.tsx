import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import HeaderAuth from "@/components/HeaderAuth";

export const metadata: Metadata = {
  title: "PromptPro — Estúdio Pro de Fotos com IA",
  description: "Gere fotos profissionais com inteligência artificial. Estúdio virtual com estilos editoriais, corporativos, artísticos e muito mais.",
};

async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let credits: number | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('credits_balance').eq('id', user.id).single();
    credits = data?.credits_balance ?? null;
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{
        background: "rgba(10,10,15,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          PromptPro
        </Link>

        {/* Busca central */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar estilos..."
              className="w-full pl-9 pr-4 py-2 rounded-full text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              readOnly
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-auto">
          <Link href="/restaurar" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            Restaurar
          </Link>
          <Link href="/upscale" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            Melhorar HD
          </Link>
          <Link href="/expert" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            Expert
          </Link>
        </nav>

        {/* Auth state */}
        <HeaderAuth user={user ? { email: user.email } : null} credits={credits} />
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ paddingTop: "64px", minHeight: "100vh" }}>
        <Header />
        {children}
      </body>
    </html>
  );
}

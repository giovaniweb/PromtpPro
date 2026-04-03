'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin/styles',       icon: '⚡', label: 'Copyright Shield'     },
  { href: '/admin/users',        icon: '👥', label: 'Usuários & Créditos'  },
  { href: '/admin/prompts-bulk', icon: '📥', label: 'Importação em Massa'  },
  { href: '/admin/gallery',      icon: '🗂️', label: 'Gestão de Catálogo'  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 min-h-[calc(100vh-40px)] p-4 hidden md:block">
      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 px-2">
        Admin
      </p>
      <nav className="space-y-1">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

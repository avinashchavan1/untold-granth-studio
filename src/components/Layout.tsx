import clsx from "clsx";
import { BadgeCheck, CalendarRange, BookOpen, Clapperboard, Lightbulb, LayoutDashboard, ListOrdered, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSession } from "./Auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/reels", label: "Reels", icon: Clapperboard },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/plan", label: "Plan", icon: ListOrdered },
  { to: "/world", label: "Cast & world", icon: Users },
  { to: "/profiles", label: "Profiles", icon: BadgeCheck },
  { to: "/docs", label: "Style & docs", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="grid gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => clsx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition",
            isActive ? "bg-gold text-night-950" : "text-parchment/80 hover:bg-night-800 hover:text-parchment")}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-night-950 p-5 text-parchment lg:flex">
        <div className="grid gap-8">
          <Brand />
          {nav}
        </div>
        <Footer email={session?.user.email} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-night-950 px-4 py-3 text-parchment lg:hidden" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <Brand />
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-night-800"><Menu /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
            <div className="h-full w-72 bg-night-950 p-5 text-parchment" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between"><Brand /><button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-night-800"><X /></button></div>
              {nav}
              <div className="mt-8"><Footer email={session?.user.email} /></div>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}><Outlet /></main>
      </div>
    </div>
  );
}

const Brand = () => (
  <div className="flex items-center gap-3">
    <img src="/favicon.svg" alt="" className="h-9 w-9" />
    <div className="leading-tight">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Studio</div>
      <div className="font-display text-lg font-extrabold tracking-wider">Untold Granth</div>
    </div>
  </div>
);

const Footer = ({ email }: { email?: string }) => (
  <div className="grid gap-2 border-t border-night-800 pt-4 text-xs text-parchment/60">
    <div className="truncate" title={email}>{email}</div>
    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-left text-parchment/70 hover:text-parchment"><LogOut size={14} /> Sign out</button>
  </div>
);

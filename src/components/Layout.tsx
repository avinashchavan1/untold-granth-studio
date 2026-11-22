import clsx from "clsx";
import { BadgeCheck, CalendarRange, BookOpen, Clapperboard, Lightbulb, LayoutDashboard, ListOrdered, LogOut, Menu, MonitorPlay, MoreHorizontal, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useSession } from "./Auth";
import WorkBar from "./WorkBar";
import { CHANNEL } from "../lib/channel";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/reels", label: "Reels", icon: Clapperboard },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/plan", label: "Plan", icon: ListOrdered },
  { to: "/longform", label: "Long-form", icon: MonitorPlay },
  { to: "/world", label: "Cast & world", icon: Users },
  { to: "/profiles", label: "Profiles", icon: BadgeCheck },
  { to: "/docs", label: "Style & docs", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

const TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/timeline", label: "Timeline", icon: CalendarRange },
  { to: "/reels", label: "Reels", icon: Clapperboard },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
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
        <div className="sticky top-0 z-20">
        <header className="flex items-center justify-between bg-night-950 px-4 py-3 text-parchment lg:hidden" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <Brand />
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-night-800"><Menu /></button>
        </header>
        <WorkBar />
        </div>
        {open && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
            <div className="h-full w-72 bg-night-950 p-5 text-parchment" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-center justify-between"><Brand /><button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-night-800"><X /></button></div>
              {nav}
              <div className="mt-8"><Footer email={session?.user.email} /></div>
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-10"><Outlet /></main>
        {/* phone: thumb-reach tab bar with the pages used most */}
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-night-800 bg-night-950/95 text-parchment backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Main">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => clsx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", isActive ? "text-gold" : "text-parchment/70")}>
              <Icon size={22} /> {label}
            </NavLink>
          ))}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-parchment/70" aria-label="More pages"><MoreHorizontal size={22} /> More</button>
        </nav>
      </div>
    </div>
  );
}

const Brand = () => (
  <div className="flex items-center gap-3">
    <img src="/favicon.svg" alt="" className="h-9 w-9" />
    <div className="leading-tight">
      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Studio</div>
      <div className="font-display text-lg font-extrabold tracking-wider">{CHANNEL.name}</div>
    </div>
  </div>
);

const Footer = ({ email }: { email?: string }) => (
  <div className="grid gap-2 border-t border-night-800 pt-4 text-xs text-parchment/60">
    <div className="truncate" title={email}>{email}</div>
    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 text-left text-parchment/70 hover:text-parchment"><LogOut size={14} /> Sign out</button>
  </div>
);

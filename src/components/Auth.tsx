import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isAdmin } from "../lib/api";
import { supabase } from "../lib/supabase";
import { Button, Spinner } from "./ui";
import { CHANNEL } from "../lib/channel";

const Ctx = createContext<{ session: Session | null }>({ session: null });
export const useSession = () => useContext(Ctx).session;

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (session) isAdmin().then(setAdmin);
    else setAdmin(undefined);
  }, [session]);

  if (session === undefined) return <div className="grid h-full place-items-center"><Spinner size="screen" label="Opening the studio…" /></div>;
  if (!session) return <Login />;
  if (admin === undefined) return <div className="grid h-full place-items-center"><Spinner size="screen" label="Checking access…" /></div>;
  if (!admin)
    return (
      <Shell>
        <h1 className="font-display text-2xl font-extrabold">No access yet</h1>
        <p className="mt-2 text-sm text-parchment/70">You're signed in as <b>{session.user.email}</b>, but this email isn't on the studio's editor list. Ask the owner to add it in Settings → People.</p>
        <Button className="mt-5" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </Shell>
    );
  return <Ctx.Provider value={{ session }}>{children}</Ctx.Provider>;
}

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="grid min-h-full place-items-center bg-night-950 px-4 py-10 text-parchment">
    <div className="w-full max-w-md rounded-3xl border border-night-700 bg-night-900 p-8 shadow-2xl">
      <div className="mb-6 flex items-center gap-3">
        <img src={__APP_ICON__} alt="" className="h-10 w-10 rounded-lg" />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Studio</div>
          <div className="font-display text-xl font-extrabold tracking-wider">{CHANNEL.name}</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  return (
    <Shell>
      <h1 className="font-display text-2xl font-extrabold">Sign in</h1>
      <p className="mt-1 text-sm text-parchment/70">We'll email you a one-time sign-in link. No password needed.</p>
      <form
        className="mt-6 grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setState("sending");
          const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin, shouldCreateUser: true } });
          if (error) { setState("error"); setMsg(error.message); } else setState("sent");
        }}
      >
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-parchment/60">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-night-700 bg-night-950 px-4 py-3 text-base text-parchment outline-none focus:border-gold" placeholder="you@example.com" />
        <Button type="submit" variant="primary" disabled={state === "sending"} className="mt-1 !bg-gold py-3 !text-night-950 hover:!bg-gold-soft">{state === "sending" ? "Sending…" : "Email me a sign-in link"}</Button>
      </form>
      {state === "sent" && <p className="mt-4 rounded-xl bg-emerald-950 p-3 text-sm text-emerald-300">Check your inbox for <b>{email}</b> and tap the link. You can close this tab.</p>}
      {state === "error" && <p className="mt-4 rounded-xl bg-vermilion/15 p-3 text-sm text-red-300">{msg}</p>}
    </Shell>
  );
}

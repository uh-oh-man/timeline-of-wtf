import { LogIn, ShieldAlert, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import JokeButton from "./JokeButton";

const makeAccountMessages = [
  "Account creation is currently handled by yelling at the admin.",
  "Self-registration has been disabled because the timeline has trust issues.",
  "New accounts require three references, a blood oath, and one suspiciously specific lore theory.",
  "Request submitted directly into the trash.",
];

const loginFailureMessages = [
  "Credentials rejected. The archive looked at them and said no.",
  "Wrong password. The timeline remains legally protected.",
  "Access denied. Nice try, lore burglar.",
];

const loginSuccessMessages = [
  "Login accepted. Please abuse this power responsibly.",
  "Welcome back. The archive is now slightly more concerned.",
  "Editor privileges unlocked. God help the timeline.",
];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function AccountWindow({ session, onLogin, onLogout, onClose }) {
  const [username, setUsername] = useState(session?.username || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const canEdit = Boolean(session?.canEditRealTimeline);
  const sessionMessage = useMemo(() => {
    if (!session) return "No fake credentials recognized. The archive is squinting.";
    return canEdit
      ? "Mock editor privileges are active for the shared timeline."
      : "Logged in as a mock viewer. Official nonsense remains behind glass.";
  }, [canEdit, session]);

  function submitLogin(event) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setMessage(pick(loginFailureMessages));
      return;
    }

    const nextSession = onLogin(username.trim());
    setPassword("");
    setMessage(nextSession?.canEditRealTimeline ? pick(loginSuccessMessages) : "Login accepted. Viewer clearance granted. The edit button remains disappointed.");
  }

  function makeAccount() {
    setMessage(pick(makeAccountMessages));
  }

  return (
    <FloatingWindow
      title="Archive Login"
      subtitle="Prove you are allowed to touch the official nonsense."
      onClose={onClose}
      widthClass="max-w-xl"
      zIndexClass="z-[63]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
    >
      <div className="grid gap-5">
        <section className="rounded-3xl border border-sky-300/20 bg-sky-500/10 p-4">
          <div className="flex gap-3">
            <UserRound className="mt-1 h-6 w-6 flex-none text-sky-100" aria-hidden="true" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-sky-100">Mock Account System</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                Frontend-only placeholder. No credentials go anywhere. Real auth must be enforced by a backend later.
              </p>
              <p className="mt-2 text-sm font-black text-white">{sessionMessage}</p>
            </div>
          </div>
        </section>

        <form onSubmit={submitLogin} className="grid gap-4">
          <label className="grid gap-2 text-sm font-black text-zinc-100">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-4 text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-300 focus:border-sky-300/50 focus:ring-4 focus:ring-sky-300/25"
              placeholder="admin-ish names get fake editor clearance"
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-zinc-100">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-4 text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-300 focus:border-red-300/50 focus:ring-4 focus:ring-red-300/25"
              placeholder="not sent, not real, still judged"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-300/30"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login
            </button>
            <JokeButton
              type="button"
              onClick={makeAccount}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              reactionType="petty"
            >
              Make Account
            </JokeButton>
          </div>
        </form>

        {message ? (
          <p className="rounded-2xl border border-yellow-200/20 bg-yellow-300/10 p-3 text-sm font-bold leading-6 text-yellow-50">
            {message}
          </p>
        ) : null}

        {session ? (
          <button
            type="button"
            onClick={() => {
              onLogout();
              setMessage("Logged out. The archive has forgotten your face with suspicious speed.");
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        ) : null}

        <div className="flex gap-3 rounded-3xl border border-white/10 bg-black/25 p-4">
          <ShieldAlert className="mt-1 h-5 w-5 flex-none text-red-100" aria-hidden="true" />
          <p className="text-xs leading-5 text-zinc-300">
            This is not secure and does not pretend to be. Later, real login goes to a backend, receives a real session,
            and the backend enforces who can edit the shared archive.
          </p>
        </div>
      </div>
    </FloatingWindow>
  );
}

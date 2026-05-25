import { MessageCircle, ShieldCheck, Sparkles, TimerReset, Waypoints } from "lucide-react";
import {
  clonePeerPermissions,
  defaultPeerPermissions,
  detectPermissionPreset,
  peerPermissionGroups,
  peerPermissionPresets,
  summarizePeerPermissions,
} from "../data/peerPermissions";
import { cx } from "../utils/helpers";

const GROUP_ICONS = {
  timeline: Waypoints,
  gamesQueue: ShieldCheck,
  chat: MessageCircle,
  lime: Sparkles,
  persistence: TimerReset,
};

function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-left transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
    >
      <span className="min-w-0">
        <span className="block text-sm font-black text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-zinc-400">{description}</span>
      </span>
      <span
        className={cx(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
          checked ? "border-emerald-300/40 bg-emerald-500/35" : "border-white/20 bg-zinc-800",
        )}
        aria-hidden="true"
      >
        <span
          className={cx(
            "inline-block h-5 w-5 rounded-full bg-white transition",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </span>
    </button>
  );
}

export default function PeerGuestPermissions({
  guest,
  onChange,
}) {
  const permissions = clonePeerPermissions(guest?.permissions || defaultPeerPermissions);
  const activePreset = detectPermissionPreset(permissions);

  function setPermission(groupId, key, nextValue) {
    const nextPermissions = {
      ...permissions,
      [groupId]: {
        ...permissions[groupId],
        [key]: nextValue,
      },
    };
    onChange?.(nextPermissions);
  }

  function applyPreset(presetId) {
    const preset = peerPermissionPresets.find((item) => item.id === presetId);
    if (!preset) return;
    onChange?.(clonePeerPermissions(preset.permissions));
  }

  function setGroup(groupId, enabled) {
    const group = permissions[groupId] || {};
    const nextGroup = Object.fromEntries(
      Object.keys(group).map((key) => [key, Boolean(enabled)]),
    );
    onChange?.({
      ...permissions,
      [groupId]: nextGroup,
    });
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-400">Permission Presets</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {peerPermissionPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                activePreset === preset.id
                  ? "border-sky-200/35 bg-sky-500/20 text-sky-50"
                  : "border-white/15 bg-zinc-900/70 text-zinc-200 hover:bg-zinc-800",
              )}
            >
              {preset.label}
            </button>
          ))}
          <span className="rounded-full border border-white/15 bg-zinc-900/70 px-3 py-1.5 text-xs font-black text-zinc-300">
            {activePreset === "custom" ? "Custom" : "Preset active"}
          </span>
        </div>
      </article>

      <div className="grid gap-3 md:grid-cols-2">
        {peerPermissionGroups.map((group) => {
          const Icon = GROUP_ICONS[group.id] || ShieldCheck;
          return (
            <article key={group.id} className="rounded-3xl border border-white/12 bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-zinc-100">
                    <Icon className="h-4 w-4 text-sky-100" aria-hidden="true" />
                    {group.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{group.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setGroup(group.id, true)}
                    className="rounded-lg border border-emerald-300/30 bg-emerald-500/15 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-500/25"
                  >
                    Allow All
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroup(group.id, false)}
                    className="rounded-lg border border-red-300/30 bg-red-500/10 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-500/20"
                  >
                    Block All
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {group.items.map((item) => (
                  <Toggle
                    key={item.key}
                    checked={Boolean(permissions[group.id]?.[item.key])}
                    onChange={() => setPermission(group.id, item.key, !permissions[group.id]?.[item.key])}
                    label={item.label}
                    description={item.description}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-zinc-400">Summary: {summarizePeerPermissions(permissions)}</p>
    </section>
  );
}

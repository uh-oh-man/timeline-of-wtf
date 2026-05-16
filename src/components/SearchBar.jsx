import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <label className="relative block">
      <span className="sr-only">Search the timeline</span>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-300"
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-3xl border border-white/15 bg-zinc-900/90 py-4 pl-12 pr-12 text-sm text-zinc-50 caret-red-300 outline-none transition placeholder:text-zinc-300 focus:border-red-300/50 focus:ring-4 focus:ring-red-400/30"
        placeholder="Search timeline disasters, games, tags, or cursed theories..."
        type="search"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300/25"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

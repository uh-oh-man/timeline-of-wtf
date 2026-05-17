import { Film, ImagePlus, Palette, PlusCircle, Shuffle, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CUSTOM_OPTION, cx, getGameYear, joinLines, splitLines, uniqueByName } from "../utils/helpers";
import { DEFAULT_ACCENT_COLOR, getEventAccentColor, normalizeHexColor } from "../utils/colorUtils";
import { filesToStagedMedia, formatFileSize, getMediaUrl, isImageMedia, isVideoMedia } from "../utils/mediaUtils";

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-4 text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-300 focus:border-red-300/50 focus:ring-4 focus:ring-red-400/30";

const ghostButtonClass =
  "rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-4 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25";

const randomAccentColors = ["#22d3ee", "#ef4444", "#a78bfa", "#f59e0b", "#22c55e", "#3b82f6"];

function emptyDraft() {
  return {
    year: "",
    selectedSource: CUSTOM_OPTION,
    customSource: "",
    selectedTag: CUSTOM_OPTION,
    customTag: "",
    title: "",
    summary: "",
    accentColor: "",
    directConnections: [],
    connectionNotes: "",
    media: [],
  };
}

export default function DisasterForm({
  disasters,
  games,
  tags,
  editingDisaster,
  onSave,
  onDelete,
  onClose,
}) {
  const [draft, setDraft] = useState(emptyDraft);
  const mediaInputRef = useRef(null);
  const isEditing = Boolean(editingDisaster);

  useEffect(() => {
    if (!editingDisaster) {
      setDraft(emptyDraft());
      return;
    }

    const sourceInList = games.some((game) => game === editingDisaster.source);
    const tagInList = tags.some((tag) => tag === editingDisaster.tag);

    setDraft({
      year: editingDisaster.year || "",
      selectedSource: sourceInList ? editingDisaster.source : CUSTOM_OPTION,
      customSource: sourceInList ? "" : editingDisaster.source || "",
      selectedTag: tagInList ? editingDisaster.tag : CUSTOM_OPTION,
      customTag: tagInList ? "" : editingDisaster.tag || "",
      title: editingDisaster.title || "",
      summary: editingDisaster.summary || "",
      accentColor: normalizeHexColor(editingDisaster.accentColor),
      directConnections: editingDisaster.directConnections || [],
      connectionNotes: joinLines(editingDisaster.connections),
      media: editingDisaster.media || [],
    });
  }, [editingDisaster, games, tags]);

  const currentSource = useMemo(() => {
    return draft.selectedSource === CUSTOM_OPTION ? draft.customSource.trim() : draft.selectedSource;
  }, [draft.customSource, draft.selectedSource]);

  const connectionOptions = useMemo(() => {
    return games.filter((game) => game && game !== currentSource);
  }, [games, currentSource]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      directConnections: current.directConnections.filter((game) => game !== currentSource),
    }));
  }, [currentSource]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSourceChange(value) {
    setDraft((current) => {
      const knownYear = value !== CUSTOM_OPTION ? getGameYear(disasters, value) : "";
      return {
        ...current,
        selectedSource: value,
        customSource: value === CUSTOM_OPTION ? current.customSource : "",
        year: current.year || knownYear,
        directConnections: current.directConnections.filter((game) => game !== value),
      };
    });
  }

  function toggleConnection(game) {
    setDraft((current) => {
      const exists = current.directConnections.includes(game);
      return {
        ...current,
        directConnections: exists
          ? current.directConnections.filter((item) => item !== game)
          : [...current.directConnections, game],
      };
    });
  }

  function clearForm() {
    if (editingDisaster) {
      const sourceInList = games.some((game) => game === editingDisaster.source);
      const tagInList = tags.some((tag) => tag === editingDisaster.tag);

      setDraft({
        year: editingDisaster.year || "",
        selectedSource: sourceInList ? editingDisaster.source : CUSTOM_OPTION,
        customSource: sourceInList ? "" : editingDisaster.source || "",
        selectedTag: tagInList ? editingDisaster.tag : CUSTOM_OPTION,
        customTag: tagInList ? "" : editingDisaster.tag || "",
        title: editingDisaster.title || "",
        summary: editingDisaster.summary || "",
        accentColor: normalizeHexColor(editingDisaster.accentColor),
        directConnections: editingDisaster.directConnections || [],
        connectionNotes: joinLines(editingDisaster.connections),
        media: editingDisaster.media || [],
      });
      return;
    }

    setDraft(emptyDraft());
  }

  async function handleMediaFiles(files) {
    const stagedMedia = await filesToStagedMedia(files, editingDisaster?.id || "");
    setDraft((current) => ({
      ...current,
      media: [...(Array.isArray(current.media) ? current.media : []), ...stagedMedia],
    }));
  }

  function removeMedia(mediaId) {
    setDraft((current) => ({
      ...current,
      media: (current.media || []).filter((media) => media.id !== mediaId),
    }));
  }

  function updateMediaCaption(mediaId, caption) {
    setDraft((current) => ({
      ...current,
      media: (current.media || []).map((media) =>
        media.id === mediaId ? { ...media, caption } : media,
      ),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const source = currentSource;
    const tag = draft.selectedTag === CUSTOM_OPTION ? draft.customTag.trim() : draft.selectedTag;

    if (!draft.year.trim() || !source || !draft.title.trim() || !draft.summary.trim()) {
      window.alert("The archive demands a year, game, title, and summary. It is needy like that.");
      return;
    }

    if (!tag) {
      window.alert("Pick a tag or invent one. The bureaucracy needs a sticker.");
      return;
    }

    const didSave = onSave({
      id: editingDisaster?.id,
      sortOrder: editingDisaster?.sortOrder,
      year: draft.year.trim(),
      title: draft.title.trim(),
      source,
      tag,
      summary: draft.summary.trim(),
      ...(normalizeHexColor(draft.accentColor) ? { accentColor: normalizeHexColor(draft.accentColor) } : {}),
      connections: splitLines(draft.connectionNotes),
      directConnections: uniqueByName(draft.directConnections).filter((game) => game !== source),
      media: draft.media || [],
    });

    if (!editingDisaster && didSave !== false) {
      setDraft(emptyDraft());
    }
  }

  function handleDelete() {
    if (!editingDisaster) return;
    onDelete(editingDisaster.id);
  }

  return (
    <motion.section
      id="disaster-form"
      className="rounded-[1.8rem] border border-red-300/30 bg-zinc-950/95 p-6 shadow-2xl shadow-black/50 backdrop-blur md:p-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-red-100">Archive Intake Form</p>
          <h2 className="mt-1 text-3xl font-black text-white">
            {isEditing ? "Edit Disaster" : "Add New Disaster"}
          </h2>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {isEditing ? "Rewrite history. Very normal behavior." : "Feed the timeline. The timeline hungers."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900 text-zinc-100 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300/25"
          aria-label="Close disaster form"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-black text-zinc-100">
            Year
            <input
              value={draft.year}
              onChange={(event) => updateField("year", event.target.value)}
              className={inputClass}
              placeholder="Year, ex: 2077"
            />
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-black text-zinc-100" htmlFor="game-select">
              Game / Source
            </label>
            <select
              id="game-select"
              value={draft.selectedSource}
              onChange={(event) => handleSourceChange(event.target.value)}
              className={inputClass}
            >
              <option value={CUSTOM_OPTION}>Pre-existing games...</option>
              {games.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
            {draft.selectedSource === CUSTOM_OPTION ? (
              <input
                value={draft.customSource}
                onChange={(event) => updateField("customSource", event.target.value)}
                className={`${inputClass} py-3 text-sm`}
                placeholder="Game name, ex: Cyberpunk 2077"
              />
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-black text-zinc-100" htmlFor="tag-select">
              Tag
            </label>
            <select
              id="tag-select"
              value={draft.selectedTag}
              onChange={(event) => updateField("selectedTag", event.target.value)}
              className={inputClass}
            >
              <option value={CUSTOM_OPTION}>Custom tag...</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {draft.selectedTag === CUSTOM_OPTION ? (
              <input
                value={draft.customTag}
                onChange={(event) => updateField("customTag", event.target.value)}
                className={`${inputClass} py-3 text-sm`}
                placeholder="Type custom tag here"
              />
            ) : null}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-black text-zinc-100">
          Title
          <input
            value={draft.title}
            onChange={(event) => updateField("title", event.target.value)}
            className={inputClass}
            placeholder="Event title, ex: The Robot Arm Incident"
          />
        </label>

        <label className="grid gap-2 text-sm font-black text-zinc-100">
          Summary
          <textarea
            value={draft.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            className={`${inputClass} min-h-32`}
            placeholder="What happened? Make it stupid. Make it canon."
          />
        </label>

        <section className="grid gap-3 rounded-3xl border border-white/15 bg-black/25 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-100">
                <Palette className="h-4 w-4 text-sky-100" aria-hidden="true" />
                Disaster Accent Color
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-300">
                This color stains the timeline. Probably permanently.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="h-12 w-12 rounded-2xl border border-white/20 shadow-lg"
                style={{
                  background: normalizeHexColor(draft.accentColor) || getEventAccentColor({
                    source: currentSource,
                    tag: draft.selectedTag === CUSTOM_OPTION ? draft.customTag : draft.selectedTag,
                    title: draft.title,
                  }),
                  boxShadow: `0 0 24px ${normalizeHexColor(draft.accentColor) || DEFAULT_ACCENT_COLOR}55`,
                }}
                aria-hidden="true"
              />
              <input
                type="color"
                value={normalizeHexColor(draft.accentColor) || DEFAULT_ACCENT_COLOR}
                onChange={(event) => updateField("accentColor", event.target.value)}
                className="h-12 w-16 cursor-pointer rounded-2xl border border-white/15 bg-zinc-900 p-1 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                aria-label="Pick disaster accent color"
              />
              <button
                type="button"
                onClick={() => updateField("accentColor", randomAccentColors[Math.floor(Math.random() * randomAccentColors.length)])}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                Randomize Color
              </button>
              <button
                type="button"
                onClick={() => updateField("accentColor", "")}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                Use Default
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 rounded-3xl border border-white/15 bg-black/25 p-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-100">Directly Connected Games</p>
            <p className="mt-1 text-xs text-zinc-300">Only game-to-game connections go into the node web.</p>
          </div>
          {connectionOptions.length ? (
            <div className="flex flex-wrap gap-2">
              {connectionOptions.map((game) => {
                const active = draft.directConnections.includes(game);
                return (
                  <button
                    key={game}
                    type="button"
                    onClick={() => toggleConnection(game)}
                    aria-pressed={active}
                    className={cx(
                      "rounded-2xl border px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                      active
                        ? "border-sky-300/50 bg-sky-500/25 text-sky-50"
                        : "border-white/15 bg-zinc-900/80 text-zinc-100 hover:bg-white/10",
                    )}
                  >
                    {game}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-200">
              Add at least one other game first. Can&apos;t connect spaghetti to itself, sadly.
            </p>
          )}
        </div>

        <label className="grid gap-2 text-sm font-black text-zinc-100">
          Optional Connection Notes
          <textarea
            value={draft.connectionNotes}
            onChange={(event) => updateField("connectionNotes", event.target.value)}
            className={`${inputClass} min-h-28`}
            placeholder={"Optional connection notes. These stay on the timeline card only. The node web is game-to-game, because note spaghetti was getting weird."}
          />
        </label>

        <section className="grid gap-3 rounded-3xl border border-sky-300/20 bg-sky-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-sky-100">Suspicious Proof</p>
              <p className="mt-1 text-xs leading-5 text-zinc-300">
                Evidence is stored locally. The timeline does not phone home, it just judges you from this browser.
              </p>
              <p className="mt-1 text-xs leading-5 text-yellow-100">
                Media persistence is session-only until IndexedDB evidence storage is promoted from the basement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Attach Evidence
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              multiple
              className="sr-only"
              onChange={(event) => {
                handleMediaFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {draft.media?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {draft.media.map((media) => (
                <div key={media.id} className="grid gap-3 rounded-2xl border border-white/12 bg-black/25 p-3">
                  <div className="flex gap-3">
                  <div className="h-16 w-20 flex-none overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                    {isImageMedia(media) && getMediaUrl(media) ? (
                      <img src={getMediaUrl(media)} alt="" className="h-full w-full object-cover" />
                    ) : isVideoMedia(media) ? (
                      <div className="grid h-full w-full place-items-center text-sky-100">
                        <Film className="h-5 w-5" aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[0.65rem] font-black text-zinc-400">
                        MEDIA
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{media.fileName}</p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {media.fileType || "unknown type"} - {formatFileSize(media.fileSize)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeMedia(media.id)}
                      className="mt-2 text-xs font-black text-red-100 underline decoration-red-300/30 underline-offset-4 hover:text-red-50"
                    >
                      Remove evidence
                    </button>
                  </div>
                  </div>
                  <label className="grid gap-1 text-xs font-black text-zinc-200">
                    Optional caption / dumb explanation
                    <input
                      value={media.caption || ""}
                      onChange={(event) => updateMediaCaption(media.id, event.target.value)}
                      className="rounded-xl border border-white/15 bg-zinc-900/95 px-3 py-2 text-sm font-medium text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-400 focus:border-sky-300/45 focus:ring-4 focus:ring-sky-300/20"
                      placeholder="Comment on this evidence..."
                    />
                  </label>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-950/50 transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
            >
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
              {isEditing ? "Update Disaster" : "Save Disaster"}
            </button>
            <button
              type="button"
              onClick={clearForm}
              className={ghostButtonClass}
            >
              {isEditing ? "Reset Changes" : "Clear Form"}
            </button>
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/40 bg-red-500/10 px-5 py-4 text-sm font-black text-red-100 transition hover:bg-red-500/20 focus:outline-none focus:ring-4 focus:ring-red-300/25"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete Disaster
            </button>
          ) : null}
        </div>
      </form>
    </motion.section>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  History,
  RotateCcw,
  Trash2,
  Plus,
  Columns,
  AlignLeft,
  Clock,
  Sparkles,
  Shield,
  FileText,
  AlertCircle,
  Loader2,
  GitCommit,
  GitCompare,
} from "lucide-react";
import {
  createChapterSnapshot,
  getChapterSnapshots,
  getChapterSnapshotContent,
  deleteChapterSnapshot,
  restoreChapterSnapshot,
} from "@/lib/actions";
import { diffParagraphs, ParagraphDiff } from "@/lib/diff";
import { cn } from "@/lib/utils";

interface SnapshotListItem {
  id: string;
  label: string;
  note: string | null;
  type: string;
  title: string;
  wordCount: number;
  createdAt: Date | string;
}

interface SnapshotFullContent extends SnapshotListItem {
  content: string | null;
  chapterId: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  currentTitle: string;
  currentContent: string;
  currentWordCount: number;
  onRestore: (restoredChapter: {
    title: string;
    content: string | null;
    wordCount: number;
  }) => void;
}

function countWords(str?: string): number {
  if (!str) return 0;
  const trimmed = str.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  chapterId,
  currentTitle,
  currentContent,
  currentWordCount,
  onRestore,
}: VersionHistoryModalProps) {
  const [snapshots, setSnapshots] = useState<SnapshotListItem[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [snapshotContents, setSnapshotContents] = useState<Record<string, SnapshotFullContent>>({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Comparison mode: "revision" (like git commit view vs parent) or "current" (vs live draft)
  const [compareMode, setCompareMode] = useState<"revision" | "current">("revision");

  // View mode: inline or side-by-side
  const [viewMode, setViewMode] = useState<"inline" | "side-by-side">("inline");

  // Create snapshot inline form
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // Restore confirmation dialog state
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete confirmation state
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load snapshots list when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewLabel("");
      setNewNote("");
      setIsRestoreConfirmOpen(false);
      setDeletingSnapshotId(null);
      return;
    }

    async function loadSnapshots() {
      setIsLoadingList(true);
      try {
        const list = await getChapterSnapshots(chapterId);
        setSnapshots(list);
        if (list.length > 0 && !selectedSnapshotId) {
          setSelectedSnapshotId(list[0].id);
        }
      } catch (err: any) {
        toast.error("Failed to load version history: " + (err.message || "Unknown error"));
      } finally {
        setIsLoadingList(false);
      }
    }

    loadSnapshots();
  }, [isOpen, chapterId]);

  // Load selected snapshot full content
  useEffect(() => {
    if (!selectedSnapshotId) return;

    if (snapshotContents[selectedSnapshotId]) {
      return; // Already cached
    }

    async function loadContent() {
      setIsLoadingContent(true);
      try {
        const full = await getChapterSnapshotContent(selectedSnapshotId!);
        setSnapshotContents((prev) => ({
          ...prev,
          [selectedSnapshotId!]: full as SnapshotFullContent,
        }));
      } catch (err: any) {
        toast.error("Failed to load snapshot content: " + (err.message || "Unknown error"));
      } finally {
        setIsLoadingContent(false);
      }
    }

    loadContent();
  }, [selectedSnapshotId, snapshotContents]);

  // Identify index and parent snapshot (in createdAt DESC order, parent is at index + 1)
  const selectedSnapshotIndex = useMemo(() => {
    return snapshots.findIndex((s) => s.id === selectedSnapshotId);
  }, [snapshots, selectedSnapshotId]);

  const activeSnapshot = selectedSnapshotId ? snapshotContents[selectedSnapshotId] : null;

  const parentSnapshot = useMemo(() => {
    if (selectedSnapshotIndex < 0 || selectedSnapshotIndex >= snapshots.length - 1) {
      return null;
    }
    return snapshots[selectedSnapshotIndex + 1];
  }, [snapshots, selectedSnapshotIndex]);

  const isInitialSnapshot = useMemo(() => {
    return (
      selectedSnapshotIndex === snapshots.length - 1 ||
      (snapshots.length > 0 && parentSnapshot === null)
    );
  }, [selectedSnapshotIndex, snapshots.length, parentSnapshot]);

  // If comparing vs previous revision, ensure parent's content is also fetched
  useEffect(() => {
    if (!parentSnapshot || compareMode !== "revision") return;
    if (snapshotContents[parentSnapshot.id]) return;

    async function loadParent() {
      try {
        const full = await getChapterSnapshotContent(parentSnapshot!.id);
        setSnapshotContents((prev) => ({
          ...prev,
          [parentSnapshot!.id]: full as SnapshotFullContent,
        }));
      } catch (err: any) {
        console.error("Failed to load parent snapshot:", err);
      }
    }

    loadParent();
  }, [parentSnapshot, compareMode, snapshotContents]);

  // Compute diffs
  const diffs: ParagraphDiff[] = useMemo(() => {
    if (!activeSnapshot) return [];

    if (compareMode === "revision") {
      // Compare this snapshot against its parent (or empty string if it's the initial snapshot)
      const baseContent = parentSnapshot
        ? snapshotContents[parentSnapshot.id]?.content || ""
        : "";
      const targetContent = activeSnapshot.content || "";
      return diffParagraphs(baseContent, targetContent);
    } else {
      // Compare this snapshot against the current live editor draft
      return diffParagraphs(activeSnapshot.content || "", currentContent || "");
    }
  }, [
    activeSnapshot,
    parentSnapshot,
    snapshotContents,
    currentContent,
    compareMode,
  ]);

  // Calculate Git-like statistics (words added, words removed, modified paragraphs)
  const diffStats = useMemo(() => {
    let addedParas = 0;
    let removedParas = 0;
    let modifiedParas = 0;
    let unchangedParas = 0;

    let wordsAdded = 0;
    let wordsRemoved = 0;

    for (const d of diffs) {
      if (d.type === "added") {
        addedParas++;
        wordsAdded += countWords(d.newText);
      } else if (d.type === "removed") {
        removedParas++;
        wordsRemoved += countWords(d.oldText);
      } else if (d.type === "modified") {
        modifiedParas++;
        d.wordDiffs?.forEach((token) => {
          if (token.type === "added") wordsAdded += countWords(token.value);
          else if (token.type === "removed") wordsRemoved += countWords(token.value);
        });
      } else {
        unchangedParas++;
      }
    }

    return {
      addedParas,
      removedParas,
      modifiedParas,
      unchangedParas,
      wordsAdded,
      wordsRemoved,
    };
  }, [diffs]);

  // Handle Take Snapshot
  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      toast.error("Please enter a name for the snapshot");
      return;
    }

    setIsSavingSnapshot(true);
    try {
      const created = await createChapterSnapshot(chapterId, {
        label: newLabel.trim(),
        note: newNote.trim() || undefined,
        type: "manual",
        title: currentTitle,
        content: currentContent,
        wordCount: currentWordCount,
      });

      // Cache full content immediately
      setSnapshotContents((prev) => ({
        ...prev,
        [created.id]: created as SnapshotFullContent,
      }));

      // Update snapshot list
      setSnapshots((prev) => [
        {
          id: created.id,
          label: created.label,
          note: created.note,
          type: created.type,
          title: created.title,
          wordCount: created.wordCount,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);

      setSelectedSnapshotId(created.id);
      setIsCreating(false);
      setNewLabel("");
      setNewNote("");
      toast.success("Snapshot created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create snapshot");
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!selectedSnapshotId || !activeSnapshot) return;

    setIsRestoring(true);
    try {
      const restored = await restoreChapterSnapshot(selectedSnapshotId, {
        title: currentTitle,
        content: currentContent,
        wordCount: currentWordCount,
      });

      onRestore({
        title: restored.title,
        content: restored.content,
        wordCount: restored.wordCount,
      });

      toast.success(
        `Restored to "${activeSnapshot.label}". An automatic backup of your draft was created.`
      );
      setIsRestoreConfirmOpen(false);
      onClose();
    } catch (err: any) {
      toast.error("Failed to restore snapshot: " + (err.message || "Unknown error"));
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Delete Snapshot
  const handleConfirmDelete = async (snapshotId: string) => {
    setIsDeleting(true);
    try {
      await deleteChapterSnapshot(snapshotId);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));

      // Remove from cache
      setSnapshotContents((prev) => {
        const next = { ...prev };
        delete next[snapshotId];
        return next;
      });

      if (selectedSnapshotId === snapshotId) {
        const remaining = snapshots.filter((s) => s.id !== snapshotId);
        setSelectedSnapshotId(remaining.length > 0 ? remaining[0].id : null);
      }

      toast.success("Snapshot deleted");
      setDeletingSnapshotId(null);
    } catch (err: any) {
      toast.error("Failed to delete snapshot: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "milestone":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-medium"
          >
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            Milestone
          </Badge>
        );
      case "auto-backup":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10 font-medium"
          >
            <Shield className="w-2.5 h-2.5 mr-1" />
            Auto-backup
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 font-medium"
          >
            <FileText className="w-2.5 h-2.5 mr-1" />
            Manual
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      {/* Spacious Modal: Overrides base sm:max-w-lg with sm:max-w-[95vw] lg:max-w-6xl xl:max-w-[1440px] */}
      <DialogContent className="w-[95vw] sm:max-w-[95vw] lg:max-w-6xl xl:max-w-[1440px] h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-3.5 border-b border-border/70 flex flex-row items-center justify-between space-y-0 shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base md:text-lg font-semibold tracking-tight flex items-center gap-2">
                Version History
                <Badge variant="secondary" className="font-normal text-[11px] px-2 py-0">
                  {snapshots.length} {snapshots.length === 1 ? "snapshot" : "snapshots"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Inspect revision diffs (like Git commits), compare against your current live draft, and safely restore.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Main 2-column layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Snapshot Timeline */}
          <div className="w-full md:w-88 xl:w-96 border-r border-border/70 flex flex-col bg-muted/20 shrink-0">
            {/* Action Bar */}
            <div className="p-3 border-b border-border/60 bg-background/50">
              {!isCreating ? (
                <Button
                  onClick={() => setIsCreating(true)}
                  size="sm"
                  className="w-full justify-center gap-1.5 shadow-sm text-xs font-medium h-9"
                >
                  <Plus className="w-4 h-4" />
                  Take Snapshot Now
                </Button>
              ) : (
                <form
                  onSubmit={handleSaveSnapshot}
                  className="space-y-2.5 p-3 bg-card rounded-lg border border-border text-xs shadow-sm"
                >
                  <div className="font-semibold text-foreground text-xs flex items-center justify-between">
                    <span>New Snapshot</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {currentWordCount} words
                    </span>
                  </div>
                  <Input
                    placeholder="Snapshot label (e.g. Chapter 1 Final Draft)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-8 text-xs"
                    autoFocus
                  />
                  <Textarea
                    placeholder="Optional note on changes made in this draft..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                  <div className="flex items-center gap-1.5 justify-end pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setNewLabel("");
                        setNewNote("");
                      }}
                      className="h-7 text-xs px-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingSnapshot || !newLabel.trim()}
                      className="h-7 text-xs px-3.5"
                    >
                      {isSavingSnapshot ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Snapshots List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40 p-2.5 space-y-1.5">
              {isLoadingList ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Loading versions...</span>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4 text-center">
                  <Clock className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
                  <p className="text-xs font-medium">No snapshots yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click "Take Snapshot Now" to record your first revision.
                  </p>
                </div>
              ) : (
                snapshots.map((item, idx) => {
                  const isSelected = item.id === selectedSnapshotId;

                  // Git-like delta calculation:
                  // For the oldest snapshot (root), delta is its entire wordCount (+N words).
                  // For subsequent snapshots, delta is difference from the preceding snapshot in history.
                  const predecessor = snapshots[idx + 1];
                  const predecessorWordCount = predecessor ? predecessor.wordCount : 0;
                  const revisionDelta = item.wordCount - predecessorWordCount;
                  const isRoot = !predecessor;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSnapshotId(item.id)}
                      className={`group relative rounded-xl p-3 transition-all cursor-pointer text-left border ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 shadow-sm"
                          : "hover:bg-muted/60 border-border/30 hover:border-border/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-semibold text-xs text-foreground line-clamp-1">
                          {item.label}
                        </span>
                        {getTypeBadge(item.type)}
                      </div>

                      {item.note && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 italic">
                          "{item.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 mt-2.5 pt-1 border-t border-border/30">
                        <span className="flex items-center gap-1 text-[10.5px]">
                          <Clock className="w-3 h-3 opacity-60" />
                          {formatRelativeTime(item.createdAt)} · {item.wordCount} words
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Git-like revision delta */}
                          {isRoot ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-500 bg-emerald-500/10 font-mono font-medium"
                            >
                              +{item.wordCount}
                            </Badge>
                          ) : revisionDelta > 0 ? (
                            <span className="text-emerald-500 font-mono font-medium text-[11px]">
                              +{revisionDelta}
                            </span>
                          ) : revisionDelta < 0 ? (
                            <span className="text-rose-500 font-mono font-medium text-[11px]">
                              {revisionDelta}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[11px]">
                              ±0
                            </span>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSnapshotId(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Snapshot count footer */}
            <div className="p-2.5 text-[11px] text-muted-foreground text-center border-t border-border/60 bg-muted/40 font-medium">
              {snapshots.length} {snapshots.length === 1 ? "version" : "versions"} saved
            </div>
          </div>

          {/* Right Panel: Diff Viewer */}
          <div className="flex-1 flex flex-col bg-card overflow-hidden min-w-0">
            {activeSnapshot ? (
              <>
                {/* Diff Viewer Toolbar */}
                <div className="px-6 py-3 border-b border-border/70 flex items-center justify-between gap-4 bg-background/60 shrink-0">
                  <div className="flex flex-col min-w-0 shrink">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm md:text-base text-foreground truncate">
                        {activeSnapshot.label}
                      </h4>
                      {getTypeBadge(activeSnapshot.type)}
                      {isInitialSnapshot && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 shrink-0"
                        >
                          Initial Version
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      Recorded {new Date(activeSnapshot.createdAt).toLocaleString()} ·{" "}
                      <span className="font-medium text-foreground">{activeSnapshot.wordCount} words</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    {/* Comparison Target Toggle (Git Commit vs Live Draft) */}
                    <div className="inline-flex items-center bg-muted/80 p-1 rounded-lg border border-border/70 text-xs gap-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setCompareMode("revision")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer",
                          compareMode === "revision"
                            ? "bg-background text-foreground font-semibold shadow-sm border border-border/70"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
                        )}
                        title="Show changes introduced in this snapshot (vs previous revision, like git commit)"
                      >
                        <GitCommit
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            compareMode === "revision" ? "text-primary" : "text-muted-foreground/70"
                          )}
                        />
                        <span>Snapshot Changes</span>
                        {compareMode === "revision" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompareMode("current")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer",
                          compareMode === "current"
                            ? "bg-background text-foreground font-semibold shadow-sm border border-border/70"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
                        )}
                        title="Compare this snapshot against current live editor draft"
                      >
                        <GitCompare
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            compareMode === "current" ? "text-primary" : "text-muted-foreground/70"
                          )}
                        />
                        <span>vs Live Draft</span>
                        {compareMode === "current" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>

                    {/* View Mode Toggle (Inline / Side-by-Side) */}
                    <div className="inline-flex items-center bg-muted/80 p-1 rounded-lg border border-border/70 text-xs gap-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setViewMode("inline")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer",
                          viewMode === "inline"
                            ? "bg-background text-foreground font-semibold shadow-sm border border-border/70"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
                        )}
                      >
                        <AlignLeft
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            viewMode === "inline" ? "text-primary" : "text-muted-foreground/70"
                          )}
                        />
                        <span>Inline</span>
                        {viewMode === "inline" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("side-by-side")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer",
                          viewMode === "side-by-side"
                            ? "bg-background text-foreground font-semibold shadow-sm border border-border/70"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent"
                        )}
                      >
                        <Columns
                          className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            viewMode === "side-by-side" ? "text-primary" : "text-muted-foreground/70"
                          )}
                        />
                        <span>Side by Side</span>
                        {viewMode === "side-by-side" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>

                    {/* Restore CTA */}
                    <Button
                      onClick={() => setIsRestoreConfirmOpen(true)}
                      size="sm"
                      variant="default"
                      className="h-8 gap-1.5 text-xs font-medium shadow-sm ml-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Version
                    </Button>
                  </div>
                </div>

                {/* Diff Stats Banner */}
                <div className="px-6 py-1.5 bg-muted/30 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-4 text-[11px]">
                    <span>
                      {compareMode === "revision"
                        ? isInitialSnapshot
                          ? "Changes in this snapshot:"
                          : `Changes vs previous (${parentSnapshot?.label || "base"}):`
                        : "Changes vs current draft:"}
                    </span>
                    <span className="text-emerald-500 font-medium">
                      +{diffStats.wordsAdded} words added ({diffStats.addedParas} paras)
                    </span>
                    <span className="text-rose-500 font-medium">
                      -{diffStats.wordsRemoved} words removed ({diffStats.removedParas} paras)
                    </span>
                    {diffStats.modifiedParas > 0 && (
                      <span className="text-amber-500 font-medium">
                        ~{diffStats.modifiedParas} modified
                      </span>
                    )}
                    <span className="opacity-70">
                      {diffStats.unchangedParas} unchanged
                    </span>
                  </div>

                  <span className="text-[11px] font-mono opacity-80">
                    Net:{" "}
                    {diffStats.wordsAdded - diffStats.wordsRemoved > 0
                      ? `+${diffStats.wordsAdded - diffStats.wordsRemoved}`
                      : `${diffStats.wordsAdded - diffStats.wordsRemoved}`}{" "}
                    words
                  </span>
                </div>

                {/* Diff Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 font-serif leading-relaxed text-sm md:text-base">
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground gap-2 font-sans">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs">Calculating diff...</span>
                    </div>
                  ) : diffs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center font-sans p-6">
                      <History className="w-8 h-8 opacity-30 mb-2" />
                      <p className="text-sm font-medium">No differences detected</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {compareMode === "revision"
                          ? "This snapshot has identical content to the previous version."
                          : "The current editor draft matches this snapshot exactly."}
                      </p>
                    </div>
                  ) : viewMode === "inline" ? (
                    /* Inline Diff */
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {diffs.map((para, idx) => {
                        if (para.type === "added") {
                          return (
                            <div
                              key={idx}
                              className="bg-emerald-500/10 border-l-3 border-emerald-500 text-foreground px-4 py-2 rounded-r text-[14.5px] leading-relaxed"
                            >
                              <span className="select-none text-emerald-500 font-mono text-xs mr-2.5 font-bold">
                                +
                              </span>
                              {para.newText}
                            </div>
                          );
                        }

                        if (para.type === "removed") {
                          return (
                            <div
                              key={idx}
                              className="bg-rose-500/10 border-l-3 border-rose-500 text-muted-foreground line-through opacity-75 px-4 py-2 rounded-r text-[14.5px] leading-relaxed"
                            >
                              <span className="select-none text-rose-500 font-mono text-xs mr-2.5 font-bold">
                                -
                              </span>
                              {para.oldText}
                            </div>
                          );
                        }

                        if (para.type === "modified") {
                          return (
                            <div
                              key={idx}
                              className="bg-amber-500/5 border-l-3 border-amber-500/70 px-4 py-2 rounded-r text-[14.5px] leading-relaxed"
                            >
                              <span className="select-none text-amber-500 font-mono text-xs mr-2.5 font-bold">
                                ~
                              </span>
                              {para.wordDiffs?.map((token, tokenIdx) => {
                                if (token.type === "added") {
                                  return (
                                    <span
                                      key={tokenIdx}
                                      className="bg-emerald-500/20 text-emerald-400 font-medium px-0.5 rounded"
                                    >
                                      {token.value}
                                    </span>
                                  );
                                }
                                if (token.type === "removed") {
                                  return (
                                    <span
                                      key={tokenIdx}
                                      className="bg-rose-500/20 text-rose-400 line-through opacity-75 px-0.5 rounded"
                                    >
                                      {token.value}
                                    </span>
                                  );
                                }
                                return <span key={tokenIdx}>{token.value}</span>;
                              })}
                            </div>
                          );
                        }

                        // Unchanged
                        return (
                          <p key={idx} className="text-foreground/90 text-[14.5px] px-4 leading-relaxed">
                            {para.oldText}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    /* Side-by-Side Diff */
                    <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto font-serif">
                      {/* Column headers */}
                      <div className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center justify-between">
                        <span>
                          {compareMode === "revision"
                            ? parentSnapshot
                              ? `Previous (${parentSnapshot.label})`
                              : "Previous (Initial / None)"
                            : `Snapshot (${activeSnapshot.label})`}
                        </span>
                      </div>
                      <div className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center justify-between">
                        <span>
                          {compareMode === "revision"
                            ? `Snapshot (${activeSnapshot.label})`
                            : "Current Editor Draft"}
                        </span>
                      </div>

                      {/* Paired rows */}
                      {diffs.map((para, idx) => (
                        <React.Fragment key={idx}>
                          {/* Left Column */}
                          <div
                            className={`p-3.5 rounded-md text-[14px] leading-relaxed ${
                              para.type === "removed"
                                ? "bg-rose-500/10 border-l-2 border-rose-500 line-through opacity-75"
                                : para.type === "modified"
                                ? "bg-amber-500/5 border-l-2 border-amber-500/60"
                                : para.type === "added"
                                ? "opacity-25 italic text-xs font-sans flex items-center text-muted-foreground bg-muted/20"
                                : "text-foreground/90"
                            }`}
                          >
                            {para.type === "added" ? (
                              compareMode === "revision" && isInitialSnapshot
                                ? "(Initial draft — no previous text)"
                                : "(Not present in this version)"
                            ) : para.type === "modified" ? (
                              para.wordDiffs?.map((token, tIdx) => {
                                if (token.type === "removed") {
                                  return (
                                    <span
                                      key={tIdx}
                                      className="bg-rose-500/20 text-rose-400 line-through font-medium px-0.5 rounded"
                                    >
                                      {token.value}
                                    </span>
                                  );
                                }
                                if (token.type === "unchanged") {
                                  return <span key={tIdx}>{token.value}</span>;
                                }
                                return null;
                              })
                            ) : (
                              para.oldText
                            )}
                          </div>

                          {/* Right Column */}
                          <div
                            className={`p-3.5 rounded-md text-[14px] leading-relaxed ${
                              para.type === "added"
                                ? "bg-emerald-500/10 border-l-2 border-emerald-500 text-foreground"
                                : para.type === "modified"
                                ? "bg-amber-500/5 border-l-2 border-amber-500/60"
                                : para.type === "removed"
                                ? "opacity-25 italic text-xs font-sans flex items-center text-muted-foreground bg-muted/20"
                                : "text-foreground/90"
                            }`}
                          >
                            {para.type === "removed" ? (
                              "(Deleted in revision)"
                            ) : para.type === "modified" ? (
                              para.wordDiffs?.map((token, tIdx) => {
                                if (token.type === "added") {
                                  return (
                                    <span
                                      key={tIdx}
                                      className="bg-emerald-500/20 text-emerald-400 font-medium px-0.5 rounded"
                                    >
                                      {token.value}
                                    </span>
                                  );
                                }
                                if (token.type === "unchanged") {
                                  return <span key={tIdx}>{token.value}</span>;
                                }
                                return null;
                              })
                            ) : (
                              para.newText
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <History className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
                <p className="text-sm font-medium">Select a version from the timeline</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose any snapshot on the left to review changes against its predecessor or your live draft.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreConfirmOpen} onOpenChange={(open: boolean) => !open && setIsRestoreConfirmOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <AlertCircle className="w-5 h-5" />
              <DialogTitle className="text-base font-semibold">Restore Chapter Snapshot?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              This will overwrite your current editor draft with the version saved as{" "}
              <strong className="text-foreground font-medium">"{activeSnapshot?.label}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Automatic Safety Backup
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Don't worry — an automatic backup of your live draft will be created before restoring, so no work is permanently lost.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRestoreConfirmOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="gap-1.5"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Restore
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingSnapshotId)}
        onOpenChange={(open: boolean) => !open && setDeletingSnapshotId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Delete Snapshot?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete this snapshot? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingSnapshotId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingSnapshotId && handleConfirmDelete(deletingSnapshotId)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

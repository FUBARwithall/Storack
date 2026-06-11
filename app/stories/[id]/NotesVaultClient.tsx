"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Plus,
    Trash2,
    Link as LinkIcon,
    Paperclip,
    Loader2,
    Save,
    Check,
    AlertCircle,
    ExternalLink
} from "lucide-react";
import { createNote, updateNote, deleteNote, uploadResearchFile, deleteResearchFile, deleteUploadedFile } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadedFileDto {
    id: string;
    url: string;
    size: number;
    fileName: string | null;
    createdAt: Date | string;
}

interface Note {
    id: string;
    title: string;
    content: string | null;
    type: string;
    links: string[];
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    uploadedFiles?: UploadedFileDto[];
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface NotesVaultClientProps {
    notes: Note[];
    storyId: string;
}

export function NotesVaultClient({ notes: initialNotes, storyId }: NotesVaultClientProps) {
    const [activeTab, setActiveTab] = useState<"general" | "research" | "scratchpad">("general");
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isPending, startTransition] = useTransition();

    // Link/File states
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [newLinkLabel, setNewLinkLabel] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scratchpad state
    const scratchpad = notes.find(n => n.type === "scratchpad");
    const [scratchContent, setScratchContent] = useState(scratchpad?.content || "");
    const [scratchHasChanges, setScratchHasChanges] = useState(false);
    const [scratchSaveStatus, setScratchSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scratchAutosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Setup active note details when selected
    useEffect(() => {
        if (selectedNote) {
            setNoteTitle(selectedNote.title);
            setNoteContent(selectedNote.content || "");
            setHasChanges(false);
            setSaveStatus('idle');
        } else {
            setNoteTitle("");
            setNoteContent("");
            setHasChanges(false);
        }
    }, [selectedNote]);

    // Track changes for active note
    useEffect(() => {
        if (!selectedNote) return;
        const changed = noteTitle !== selectedNote.title || noteContent !== (selectedNote.content || "");
        setHasChanges(changed);
    }, [noteTitle, noteContent, selectedNote]);

    // Active Note Autosave
    useEffect(() => {
        if (!hasChanges || !selectedNote) return;

        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

        autosaveTimer.current = setTimeout(() => {
            handleSaveNote();
        }, 3000); // 3 seconds debounce

        return () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [hasChanges, noteTitle, noteContent, selectedNote]);

    // Scratchpad Autosave
    useEffect(() => {
        if (!scratchHasChanges) return;

        if (scratchAutosaveTimer.current) clearTimeout(scratchAutosaveTimer.current);

        scratchAutosaveTimer.current = setTimeout(() => {
            handleSaveScratchpad();
        }, 2000); // 2 seconds debounce

        return () => {
            if (scratchAutosaveTimer.current) clearTimeout(scratchAutosaveTimer.current);
        };
    }, [scratchHasChanges, scratchContent]);

    const handleCreateNote = async () => {
        startTransition(async () => {
            try {
                const newNote = await createNote(storyId, "New Note", "general");
                setNotes(prev => [newNote, ...prev]);
                setSelectedNote(newNote);
                toast.success("Note created");
            } catch (error) {
                console.error(error);
                toast.error("Failed to create note");
            }
        });
    };

    const handleSaveNote = async () => {
        if (!selectedNote) return;
        setSaveStatus('saving');
        try {
            const updated = await updateNote(selectedNote.id, {
                title: noteTitle,
                content: noteContent
            });
            setNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
            setSelectedNote(updated);
            setSaveStatus('saved');
            setHasChanges(false);
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        startTransition(async () => {
            try {
                await deleteNote(noteId);
                setNotes(prev => prev.filter(n => n.id !== noteId));
                if (selectedNote?.id === noteId) {
                    setSelectedNote(null);
                }
                toast.success("Note deleted");
            } catch (error) {
                console.error(error);
                toast.error("Failed to delete note");
            }
        });
    };

    const handleSaveScratchpad = async () => {
        setScratchSaveStatus('saving');
        try {
            if (scratchpad) {
                const updated = await updateNote(scratchpad.id, {
                    content: scratchContent
                });
                setNotes(prev => prev.map(n => n.id === scratchpad.id ? updated : n));
            } else {
                // Create scratchpad if not exists
                const created = await createNote(storyId, "Scratchpad", "scratchpad");
                const updated = await updateNote(created.id, {
                    content: scratchContent
                });
                setNotes(prev => [updated, ...prev]);
            }
            setScratchSaveStatus('saved');
            setScratchHasChanges(false);
            setTimeout(() => setScratchSaveStatus('idle'), 2000);
        } catch (error) {
            console.error(error);
            setScratchSaveStatus('error');
        }
    };

    const handleCreateResearchTopic = async () => {
        startTransition(async () => {
            try {
                const newNote = await createNote(storyId, "New Topic", "research");
                setNotes(prev => [newNote, ...prev]);
                setSelectedNote(newNote);
                toast.success("Research topic created");
            } catch (error) {
                console.error(error);
                toast.error("Failed to create topic");
            }
        });
    };

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedNote || !newLinkUrl.trim()) return;

        let formattedUrl = newLinkUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const currentLinks = selectedNote.links || [];
        if (currentLinks.includes(formattedUrl)) {
            toast.error("Link already added to this topic");
            return;
        }

        const updatedLinks = [...currentLinks, formattedUrl];

        startTransition(async () => {
            try {
                const updated = await updateNote(selectedNote.id, {
                    links: updatedLinks
                });
                setNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
                setSelectedNote(updated);
                setNewLinkUrl("");
                setNewLinkLabel("");
                toast.success("Link added to topic");
            } catch (error) {
                console.error(error);
                toast.error("Failed to add link");
            }
        });
    };

    const handleDeleteLinkFromNote = (linkToDelete: string) => {
        if (!selectedNote) return;

        const updatedLinks = (selectedNote.links || []).filter(l => l !== linkToDelete);

        startTransition(async () => {
            try {
                const updated = await updateNote(selectedNote.id, {
                    links: updatedLinks
                });
                setNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
                setSelectedNote(updated);
                toast.success("Link removed");
            } catch (error) {
                console.error(error);
                toast.error("Failed to remove link");
            }
        });
    };

    const handleFileUploadForNote = async (e: React.ChangeEvent<HTMLInputElement>, noteId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        toast.loading("Uploading file...", { id: "uploading" });

        try {
            const res = await uploadResearchFile(storyId, noteId, formData);
            if (res.error) {
                toast.error(res.error, { id: "uploading" });
            } else if (res.success && res.note) {
                const uploadedNote = res.note as Note;
                setNotes(prev => prev.map(n => n.id === noteId ? uploadedNote : n));
                if (selectedNote?.id === noteId) {
                    setSelectedNote(uploadedNote);
                }
                toast.success("File uploaded successfully", { id: "uploading" });
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed", { id: "uploading" });
        }
    };

    const handleDeleteFileFromNote = async (fileId: string, noteId: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            const res = await deleteResearchFile(fileId);
            if (res.error) {
                toast.error(res.error);
            } else {
                setNotes(prev => prev.map(n => {
                    if (n.id === noteId) {
                        return {
                            ...n,
                            uploadedFiles: (n.uploadedFiles || []).filter(f => f.id !== fileId)
                        };
                    }
                    return n;
                }));
                if (selectedNote?.id === noteId) {
                    setSelectedNote(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            uploadedFiles: (prev.uploadedFiles || []).filter(f => f.id !== fileId)
                        };
                    });
                }
                toast.success("File deleted successfully");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete file");
        }
    };

    const handleDeleteLegacyFile = async (noteId: string) => {
        if (!selectedNote || !selectedNote.fileUrl || !confirm("Are you sure you want to delete this file?")) return;
        try {
            await deleteUploadedFile(selectedNote.fileUrl);
            
            const updated = await updateNote(noteId, {
                fileUrl: null,
                fileName: null,
                fileSize: null
            });
            
            setNotes(prev => prev.map(n => n.id === noteId ? updated : n));
            setSelectedNote(updated);
            toast.success("File deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete file");
        }
    };

    const formatBytes = (bytes: number | null) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const generalNotes = notes.filter(n => n.type === "general");
    const researchItems = notes.filter(n => n.type === "research");

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
            {/* Vault Sidebar Tabs */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-card border rounded-xl p-3 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Vault Sections</div>
                
                <Button
                    variant={activeTab === "general" ? "default" : "ghost"}
                    className="justify-start font-medium text-sm"
                    onClick={() => { setActiveTab("general"); setSelectedNote(null); }}
                >
                    <FileText className="mr-2 h-4 w-4" /> General Notes
                </Button>
                <Button
                    variant={activeTab === "research" ? "default" : "ghost"}
                    className="justify-start font-medium text-sm"
                    onClick={() => { setActiveTab("research"); setSelectedNote(null); }}
                >
                    <Paperclip className="mr-2 h-4 w-4" /> Research & Links
                </Button>
                <Button
                    variant={activeTab === "scratchpad" ? "default" : "ghost"}
                    className="justify-start font-medium text-sm"
                    onClick={() => { setActiveTab("scratchpad"); setSelectedNote(null); }}
                >
                    <Save className="mr-2 h-4 w-4" /> Quick Scratchpad
                </Button>

                {activeTab === "general" && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                        <Button className="w-full justify-center text-xs h-9" size="sm" onClick={handleCreateNote}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Create Note
                        </Button>
                        <div className="max-h-[250px] overflow-y-auto space-y-1 mt-2">
                            {generalNotes.map(note => (
                                <div
                                    key={note.id}
                                    className={cn(
                                        "flex justify-between items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer group transition-all",
                                        selectedNote?.id === note.id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setSelectedNote(note)}
                                >
                                    <span className="truncate flex-1 pr-2">{note.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-5 w-5 rounded opacity-0 group-hover:opacity-100 active:scale-95",
                                            selectedNote?.id === note.id ? "text-primary-foreground hover:bg-primary-foreground/20 hover:text-white" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {generalNotes.length === 0 && (
                                <p className="text-[11px] text-muted-foreground/80 italic text-center py-4">No notes created yet</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "research" && (
                    <div className="mt-4 border-t pt-4 space-y-2">
                        <Button className="w-full justify-center text-xs h-9" size="sm" onClick={handleCreateResearchTopic}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Create Topic
                        </Button>
                        <div className="max-h-[250px] overflow-y-auto space-y-1 mt-2">
                            {researchItems.map(topic => (
                                <div
                                    key={topic.id}
                                    className={cn(
                                        "flex justify-between items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer group transition-all",
                                        selectedNote?.id === topic.id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setSelectedNote(topic)}
                                >
                                    <span className="truncate flex-1 pr-2">{topic.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-5 w-5 rounded opacity-0 group-hover:opacity-100 active:scale-95",
                                            selectedNote?.id === topic.id ? "text-primary-foreground hover:bg-primary-foreground/20 hover:text-white" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(topic.id); }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {researchItems.length === 0 && (
                                <p className="text-[11px] text-muted-foreground/80 italic text-center py-4">No topics created yet</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Display Area */}
            <div className="flex-1 min-w-0 bg-card border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-start">
                
                {/* GENERAL NOTES TAB */}
                {activeTab === "general" && (
                    selectedNote ? (
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b pb-3">
                                <input
                                    type="text"
                                    value={noteTitle}
                                    onChange={e => setNoteTitle(e.target.value)}
                                    className="bg-transparent border-none text-xl font-bold text-foreground focus:ring-0 p-0 w-full placeholder:text-muted-foreground/50"
                                    placeholder="Note Title"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    {saveStatus === 'saving' && (
                                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                        </span>
                                    )}
                                    {saveStatus === 'saved' && (
                                        <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                            <Check className="h-3 w-3" /> Saved
                                        </span>
                                    )}
                                    {saveStatus === 'error' && (
                                        <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                                            <AlertCircle className="h-3 w-3" /> Error
                                        </span>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={handleSaveNote}
                                        disabled={!hasChanges || saveStatus === 'saving'}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={noteContent}
                                onChange={e => setNoteContent(e.target.value)}
                                placeholder="Type note details here (Markdown supported)..."
                                className="flex-1 w-full min-h-[350px] font-sans text-sm resize-none bg-background focus-visible:ring-0 focus-visible:border-primary border-none p-3 rounded-lg outline-none"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                            <h3 className="text-lg font-semibold">General Notes</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                Keep track of outline segments, ideas, snippets, and comments. Click &ldquo;Create Note&rdquo; in the sidebar or select a note to begin editing.
                            </p>
                        </div>
                    )
                )}

                {/* RESEARCH & LINKS TAB */}
                {activeTab === "research" && (
                    selectedNote ? (
                        <div className="space-y-6 flex-1 flex flex-col min-h-0">
                            {/* Topic Title and Status */}
                            <div className="flex items-center justify-between border-b pb-3 shrink-0">
                                <input
                                    type="text"
                                    value={noteTitle}
                                    onChange={e => setNoteTitle(e.target.value)}
                                    placeholder="Topic Title (e.g. Midway Atoll)"
                                    className="bg-transparent border-none text-xl font-bold text-foreground focus:ring-0 p-0 w-full placeholder:text-muted-foreground/50"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                    {saveStatus === 'saving' && (
                                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                        </span>
                                    )}
                                    {saveStatus === 'saved' && (
                                        <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                            <Check className="h-3 w-3" /> Saved
                                        </span>
                                    )}
                                    {saveStatus === 'error' && (
                                        <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                                            <AlertCircle className="h-3 w-3" /> Error
                                        </span>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                        onClick={handleSaveNote}
                                        disabled={!hasChanges || saveStatus === 'saving'}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>

                            {/* Description/Content Textarea */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Topic Notes & Summary</div>
                                <Textarea
                                    value={noteContent}
                                    onChange={e => setNoteContent(e.target.value)}
                                    placeholder="Summarize your research details, dates, key findings here..."
                                    className="w-full min-h-[120px] max-h-[200px] font-sans text-sm resize-none bg-background focus-visible:ring-1 focus-visible:ring-primary border p-3 rounded-lg outline-none"
                                />
                            </div>

                            {/* Symmetric 2 Columns for Links and Attachments */}
                            <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0 overflow-y-auto pr-1">
                                {/* Links Section */}
                                <div className="space-y-4 flex flex-col min-h-0">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1 shrink-0">
                                        <LinkIcon className="h-3.5 w-3.5" /> Research Links
                                    </h4>

                                    <form onSubmit={handleAddLink} className="space-y-2 shrink-0">
                                        <Input
                                            placeholder="Link Name / Label"
                                            value={newLinkLabel}
                                            onChange={e => setNewLinkLabel(e.target.value)}
                                            className="h-8 text-xs bg-background"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="URL (e.g. wikipedia.org/...)"
                                                value={newLinkUrl}
                                                onChange={e => setNewLinkUrl(e.target.value)}
                                                className="h-8 text-xs bg-background flex-1"
                                                required
                                            />
                                            <Button type="submit" size="sm" className="h-8 text-xs shrink-0">Add Link</Button>
                                        </div>
                                    </form>

                                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[150px]">
                                        {(selectedNote.links || []).map((link, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 rounded-lg border bg-background/50 hover:border-primary/40 transition-all">
                                                <div className="min-w-0 pr-2 flex-1">
                                                    <a
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium text-foreground hover:text-primary truncate block hover:underline"
                                                    >
                                                        {link}
                                                    </a>
                                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                                        {link}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive active:scale-95 shrink-0"
                                                    onClick={() => handleDeleteLinkFromNote(link)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {(selectedNote.links || []).length === 0 && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4">No reference links added yet</p>
                                        )}
                                    </div>
                                </div>

                                {/* Files Section */}
                                <div className="space-y-4 flex flex-col min-h-0">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1 shrink-0">
                                        <Paperclip className="h-3.5 w-3.5" /> File Attachments
                                    </h4>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => handleFileUploadForNote(e, selectedNote.id)}
                                    />

                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-[72px] border-dashed border-2 flex flex-col justify-center items-center text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-all cursor-pointer shrink-0"
                                    >
                                        <Paperclip className="h-5 w-5 mb-1 opacity-70" />
                                        Upload Document (PDF, Word, Images)
                                    </Button>

                                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[150px]">
                                        {(selectedNote.uploadedFiles || []).map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-2 rounded-lg border bg-background/50 hover:border-primary/40 transition-all">
                                                <div className="min-w-0 pr-2 flex-1">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium text-foreground hover:text-primary truncate block hover:underline"
                                                    >
                                                        {item.fileName || "Uploaded File"}
                                                    </a>
                                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                                        {formatBytes(item.size)}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive active:scale-95 shrink-0"
                                                    onClick={() => handleDeleteFileFromNote(item.id, selectedNote.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {/* Legacy File Attachment */}
                                        {selectedNote.fileUrl && !(selectedNote.uploadedFiles || []).some(f => f.url === selectedNote.fileUrl) && (
                                            <div className="flex justify-between items-center p-2 rounded-lg border bg-background/50 hover:border-primary/40 transition-all">
                                                <div className="min-w-0 pr-2 flex-1">
                                                    <a
                                                        href={selectedNote.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-medium text-foreground hover:text-primary truncate block hover:underline"
                                                    >
                                                        {selectedNote.fileName || "Legacy Attachment"}
                                                    </a>
                                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                                        {formatBytes(selectedNote.fileSize)} (Legacy)
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive active:scale-95 shrink-0"
                                                    onClick={() => handleDeleteLegacyFile(selectedNote.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                        {(selectedNote.uploadedFiles || []).length === 0 && !selectedNote.fileUrl && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4">No uploaded files yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <LinkIcon className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                            <h3 className="text-lg font-semibold">Research Vault</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                Create a research topic (like setting, technology, or history references) to attach text briefs, web links, and file uploads.
                            </p>
                        </div>
                    )
                )}

                {/* SCRATCHPAD TAB */}
                {activeTab === "scratchpad" && (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold">Quick Scratchpad</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Quick thoughts, formatting tests, or copy-paste storage. Autosaves as you type.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {scratchSaveStatus === 'saving' && (
                                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                    </span>
                                )}
                                {scratchSaveStatus === 'saved' && (
                                    <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                                        <Check className="h-3 w-3" /> Autosaved
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={handleSaveScratchpad}
                                    disabled={!scratchHasChanges || scratchSaveStatus === 'saving'}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            value={scratchContent}
                            onChange={e => {
                                setScratchContent(e.target.value);
                                setScratchHasChanges(true);
                            }}
                            placeholder="Write down temporary thoughts..."
                            className="flex-1 w-full min-h-[380px] font-sans text-sm resize-none bg-background focus-visible:ring-0 focus-visible:border-primary border-none p-3 rounded-lg outline-none"
                        />
                    </div>
                )}

            </div>
        </div>
    );
}

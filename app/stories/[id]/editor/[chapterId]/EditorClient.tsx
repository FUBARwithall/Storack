"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import SearchAndReplace from "@sereneinserenade/tiptap-search-and-replace"

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            size: {
                default: 'large',
                parseHTML: (element) => element.getAttribute('data-size') || 'large',
                renderHTML: (attributes) => {
                    return {
                        'data-size': attributes.size,
                    };
                },
            },
            align: {
                default: 'center',
                parseHTML: (element) => element.getAttribute('data-align') || 'center',
                renderHTML: (attributes) => {
                    return {
                        'data-align': attributes.align,
                    };
                },
            },
        };
    },
});

import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
    ArrowLeft,
    Save,
    Settings,
    MoreVertical,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    Eraser,
    Image as ImageIcon,
    Loader2,
    Check,
    AlertCircle,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Search,
    ChevronUp,
    ChevronDown,
    X,
    type LucideIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createChapter, updateChapter, deleteChapter, uploadEditorImage } from "@/lib/actions";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EditorClientProps {
    story: { id: string; title: string; worldId: string; chapters: any[] };
    chapter: {
        id: string;
        title: string;
        content: string | null;
        wordCount: number;
        status: string;
        order: number
    };
}

export function EditorClient({ story, chapter: initialChapter }: EditorClientProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialChapter.title);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [wordCount, setWordCount] = useState(initialChapter.wordCount);
    const [hasChanges, setHasChanges] = useState(false);
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImageActive, setIsImageActive] = useState(false);
    const [imageAttributes, setImageAttributes] = useState<{ size?: string; align?: string }>({});
    
    // Find & Replace States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);

    const updateImageState = useCallback((editorInstance: any) => {
        if (!editorInstance) return;
        const active = editorInstance.isActive('image');
        setIsImageActive(active);
        if (active) {
            const attrs = editorInstance.getAttributes('image');
            setImageAttributes({
                size: attrs.size || 'large',
                align: attrs.align || 'center'
            });
        } else {
            setImageAttributes({});
        }
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            CustomImage,
            Placeholder.configure({
                placeholder: 'Once upon a time...',
            }),
            SearchAndReplace.configure({
                searchResultClass: 'search-result',
            }),
        ],
        immediatelyRender: false,
        content: initialChapter.content || "",
        parseOptions: {
            preserveWhitespace: 'full',
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-none flex-1 w-full min-h-[500px] font-serif text-justify',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Tab') {
                    event.preventDefault();
                    if (editor?.isActive('bulletList') || editor?.isActive('orderedList')) {
                        return false;
                    }
                    editor?.commands.insertContent('\u00A0\u00A0\u00A0\u00A0');
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const text = editor.getText();

            setHasChanges(title !== initialChapter.title || html !== (initialChapter.content || ""));

            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            setWordCount(words);
            updateImageState(editor);
        },
        onSelectionUpdate: ({ editor }) => {
            updateImageState(editor);
        },
        onFocus: ({ editor }) => {
            updateImageState(editor);
        },
        onBlur: ({ editor }) => {
            updateImageState(editor);
        },
        onCreate: ({ editor }) => {
            updateImageState(editor);
        },
    });

    const navigateSearchResult = useCallback((direction: 'next' | 'prev') => {
        if (!editor) return;
        if (direction === 'next') editor.commands.nextSearchResult();
        else editor.commands.previousSearchResult();
        // Dispatch empty transaction to force plugin to re-run & repaint decorations
        editor.view.dispatch(editor.view.state.tr);
        // Wait for DOM paint, then scroll the current match into view natively
        requestAnimationFrame(() => {
            const el = editor.view.dom.querySelector('.search-result-current');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }, [editor]);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const formData = new FormData();
        formData.append("image", file);

        setSaveStatus('saving');
        try {
            const result = await uploadEditorImage(formData);
            if (result && result.imageUrl) {
                editor.chain().focus().setImage({ src: result.imageUrl }).run();
                setIsImageActive(true);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error("Upload error:", error);
            setSaveStatus('error');
        }
    }, [editor]);

    // Handle title changes for hasChanges
    useEffect(() => {
        if (editor) {
            const html = editor.getHTML();
            setHasChanges(title !== initialChapter.title || html !== (initialChapter.content || ""));
        }
    }, [title, editor, initialChapter]);

    const handleSave = useCallback(async () => {
        if (isSaving || !editor) return;

        setIsSaving(true);
        setSaveStatus('saving');

        const content = editor.getHTML();

        try {
            if (initialChapter.id === 'new') {
                const newChapter = await createChapter(story.id, story.worldId, {
                    title: title,
                    order: story.chapters.length + 1
                });

                await updateChapter(newChapter.id, {
                    content: content,
                    wordCount: wordCount
                });

                router.push(`/stories/${story.id}/editor/${newChapter.id}`);
            } else {
                await updateChapter(initialChapter.id, {
                    title: title,
                    content: content,
                    wordCount: wordCount
                });
                router.refresh();
            }
            setSaveStatus('saved');
            setHasChanges(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, initialChapter.id, story.id, story.worldId, story.chapters.length, title, wordCount, router, editor]);

    // Autosave — debounce 10 detik setelah ada perubahan
    useEffect(() => {
        if (!hasChanges || isSaving || initialChapter.id === 'new') return;

        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

        autosaveTimer.current = setTimeout(() => {
            handleSave();
        }, 300000);

        return () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, [hasChanges, isSaving, initialChapter.id, handleSave]);

    const handleDelete = useCallback(async () => {
        if (initialChapter.id === 'new') {
            router.push(`/stories/${story.id}`);
            return;
        }

        if (!confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteChapter(initialChapter.id, story.id);
            router.push(`/stories/${story.id}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete chapter:", error);
            alert("Failed to delete chapter. Please try again.");
        }
    }, [initialChapter.id, router, story.id]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey)) {
                if (e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    handleSave();
                }
                if (e.key.toLowerCase() === 'f') {
                    e.preventDefault();
                    setIsSearchOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-screen bg-background font-sans">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror {
                    min-height: 300px;
                    padding-bottom: 50px;
                    white-space: pre-wrap;
                }
                .ProseMirror p {
                    text-align: justify;
                }
                .ProseMirror strong { font-weight: bold; }
                .ProseMirror em { font-style: italic; }
                .ProseMirror u { text-decoration: underline; }
                .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; }
                .ProseMirror-selectednode {
                    outline: 2px solid var(--primary);
                    outline-offset: 2px;
                    border-radius: 0.375rem;
                }
                .search-result {
                    background-color: rgba(250, 204, 21, 0.3); /* yellow-400 30% */
                    border-radius: 0.125rem;
                }
                .search-result-current {
                    background-color: rgba(234, 179, 8, 0.6); /* yellow-500 60% */
                    outline: 1px solid var(--primary);
                    border-radius: 0.125rem;
                }
            `}} />

            {/* Editor Header */}
            <header className="flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
                <div className="flex items-center gap-4 flex-1">
                    <Link href={`/stories/${story.id}`} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-foreground focus:ring-0 p-0 w-full placeholder:text-muted-foreground/50"
                            placeholder="Chapter Title"
                        />
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium truncate">{story.title}</p>
                    </div>

                </div>

                <div className="flex items-center gap-2">
                    {hasChanges && saveStatus === 'idle' && (
                        <span className="hidden md:flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            Unsaved changes
                        </span>
                    )}
                    {saveStatus === 'saving' && (
                        <span className="hidden md:flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="hidden md:flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 border border-green-500/20">
                            <Check className="h-3 w-3" />
                            Changes saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="hidden md:flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive border border-destructive/20">
                            <AlertCircle className="h-3 w-3" />
                            Save failed
                        </span>
                    )}
                    <span className="hidden sm:block text-xs font-medium text-muted-foreground border-r pr-4 mr-2">{wordCount.toLocaleString()} WORDS</span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Chapter Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex justify-between">
                                <span>Status</span>
                                <span className="text-xs text-muted-foreground">{initialChapter.status}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex justify-between">
                                <span>Order</span>
                                <span className="text-xs text-muted-foreground">Chapter {initialChapter.order}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={handleDelete}
                            >
                                Delete Chapter
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                            "gap-2 transition-all duration-300",
                            hasChanges ? "shadow-md bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Export as TXT</DropdownMenuItem>
                            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Focus Mode</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Find & Replace Panel */}
            {isSearchOpen && (
                <div className="border-b bg-background p-3 flex flex-col gap-2 shadow-sm animate-in slide-in-from-top duration-200">
                    <div className="max-w-3xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 flex-1 w-full">
                            {/* Find Input */}
                            <div className="relative flex items-center min-w-[200px] flex-1">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        editor.commands.setSearchTerm(e.target.value);
                                    }}
                                    placeholder="Find..."
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-20"
                                    autoFocus
                                />
                                <div className="absolute right-2 flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-5 w-5 rounded text-[10px]",
                                            caseSensitive ? "bg-primary/20 text-primary" : "text-muted-foreground"
                                        )}
                                        onClick={() => {
                                            const newVal = !caseSensitive;
                                            setCaseSensitive(newVal);
                                            editor.commands.setCaseSensitive(newVal);
                                        }}
                                        title="Match Case"
                                    >
                                        Aa
                                    </Button>
                                </div>
                            </div>

                            {/* Replace Input */}
                            <input
                                type="text"
                                value={replaceTerm}
                                onChange={(e) => {
                                    setReplaceTerm(e.target.value);
                                    editor.commands.setReplaceTerm(e.target.value);
                                }}
                                placeholder="Replace with..."
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[200px] flex-1"
                            />

                            {/* Navigation & Replace Buttons */}
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onMouseDown={(e) => { e.preventDefault(); navigateSearchResult('prev'); }}
                                    disabled={!searchTerm}
                                    title="Previous Match"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onMouseDown={(e) => { e.preventDefault(); navigateSearchResult('next'); }}
                                    disabled={!searchTerm}
                                    title="Next Match"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs font-semibold"
                                    onMouseDown={(e) => { e.preventDefault(); editor.commands.replace(); }}
                                    disabled={!searchTerm}
                                >
                                    Replace
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs font-semibold"
                                    onMouseDown={(e) => { e.preventDefault(); editor.commands.replaceAll(); }}
                                    disabled={!searchTerm}
                                >
                                    Replace All
                                </Button>
                            </div>
                        </div>

                        {/* Right side status & close */}
                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {searchTerm && (
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {(() => {
                                        const storage = (editor.storage as any).searchAndReplace;
                                        if (storage) {
                                            const total = storage.results?.length || 0;
                                            const current = total > 0 ? (storage.resultIndex ?? 0) + 1 : 0;
                                            return `${current}/${total}`;
                                        }
                                        return '0/0';
                                    })()}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchTerm('');
                                    setReplaceTerm('');
                                    editor.commands.setSearchTerm('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Toolbar */}
            <div className="flex items-center justify-center gap-2 border-b bg-muted/30 p-2 z-10 sticky top-16">
                <div className="flex items-center rounded-lg bg-background shadow-sm border p-0.5">
                    <ToolbarButton
                        icon={Bold}
                        label="Bold"
                        active={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    />
                    <ToolbarButton
                        icon={Italic}
                        label="Italic"
                        active={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    />
                    <ToolbarButton
                        icon={UnderlineIcon}
                        label="Underline"
                        active={editor.isActive('underline')}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    />
                    <div className="mx-1.5 h-4 w-px bg-border/60" />
                    <ToolbarButton
                        icon={Eraser}
                        label="Clear Text"
                        onClick={() => editor.chain().focus().clearContent().run()}
                    />
                    <ToolbarButton
                        icon={List}
                        label="Bullet List"
                        active={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    />
                    <div className="mx-1.5 h-4 w-px bg-border/60" />
                    <ToolbarButton
                        icon={ImageIcon}
                        label="Insert Image"
                        onClick={() => fileInputRef.current?.click()}
                    />
                    <ToolbarButton
                        icon={Search}
                        label="Find & Replace (Ctrl+F)"
                        active={isSearchOpen}
                        onClick={() => setIsSearchOpen(prev => !prev)}
                    />
                    {isImageActive && (
                        <>
                            <div className="mx-1.5 h-4 w-px bg-border/60" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { size: 'small' }).run();
                                    setImageAttributes(prev => ({ ...prev, size: 'small' }));
                                }}
                                className={cn(
                                    "h-8 px-2.5 text-xs font-semibold rounded-md transition-colors",
                                    imageAttributes.size === 'small' ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                Small
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { size: 'medium' }).run();
                                    setImageAttributes(prev => ({ ...prev, size: 'medium' }));
                                }}
                                className={cn(
                                    "h-8 px-2.5 text-xs font-semibold rounded-md transition-colors",
                                    imageAttributes.size === 'medium' ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                Medium
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { size: 'large' }).run();
                                    setImageAttributes(prev => ({ ...prev, size: 'large' }));
                                }}
                                className={cn(
                                    "h-8 px-2.5 text-xs font-semibold rounded-md transition-colors",
                                    imageAttributes.size === 'large' || !imageAttributes.size ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                Large
                            </Button>
                            <div className="mx-1 h-4 w-px bg-border/60" />
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Align Left"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { align: 'left' }).run();
                                    setImageAttributes(prev => ({ ...prev, align: 'left' }));
                                }}
                                className={cn(
                                    "h-8 w-8 rounded-md transition-colors",
                                    imageAttributes.align === 'left' ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Align Center"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { align: 'center' }).run();
                                    setImageAttributes(prev => ({ ...prev, align: 'center' }));
                                }}
                                className={cn(
                                    "h-8 w-8 rounded-md transition-colors",
                                    imageAttributes.align === 'center' || !imageAttributes.align ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Align Right"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    editor.chain().focus().updateAttributes('image', { align: 'right' }).run();
                                    setImageAttributes(prev => ({ ...prev, align: 'right' }));
                                }}
                                className={cn(
                                    "h-8 w-8 rounded-md transition-colors",
                                    imageAttributes.align === 'right' ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <AlignRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <main
                className="flex-1 overflow-y-auto bg-background selection:bg-primary/20 flex flex-col"
                onClick={() => editor.commands.focus()}
            >
                <div className="w-full py-8 sm:py-16 flex-1 flex flex-col bg-background">
                    <div className="max-w-3xl mx-auto w-full px-5 sm:px-8 md:px-0">
                        <EditorContent editor={editor} className="flex-1" />
                    </div>
                </div>
            </main>

            {/* Footer / Status Bar */}
            <footer className="h-8 border-t bg-muted/10 px-4 flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                <div className="flex items-center gap-4">
                    <span>Draft Mode</span>
                    <span>Spellcheck: On</span>
                    {hasChanges && saveStatus === 'idle' && !isSaving && (
                        <span className="text-yellow-500">Autosave in 5m...</span>
                    )}
                    {saveStatus === 'saving' && (
                        <span className="text-primary">Autosaving...</span>
                    )}
                </div>
                <div>
                    Storack Editor v1.0
                </div>
            </footer>
        </div>
    );
}

function ToolbarButton({ icon: Icon, label, onClick, active }: { icon: LucideIcon, label: string, onClick?: () => void, active?: boolean }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            title={label}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick?.();
            }}
            className={cn(
                "h-8 w-8 rounded-md transition-all active:scale-90 active:bg-primary/10",
                active ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}

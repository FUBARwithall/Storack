"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, FileText, MoreVertical, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { reorderChapters } from "@/lib/actions";
import { formatRelativeTime } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteChapter } from "@/lib/actions";

interface Chapter {
    id: string;
    title: string;
    order: number;
    wordCount: number;
    status: string;
    lastEdited: Date | string;
}

interface ChapterListClientProps {
    chapters: Chapter[];
    storyId: string;
}

export function ChapterListClient({ chapters: initialChapters, storyId }: ChapterListClientProps) {
    const [chapters, setChapters] = useState<Chapter[]>(() => 
        [...initialChapters].sort((a, b) => a.order - b.order)
    );
    const [isPending, startTransition] = useTransition();

    const handleMove = async (index: number, direction: "up" | "down") => {
        if (isPending) return;
        
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= chapters.length) return;

        const updated = [...chapters];
        // Swap
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;

        // Correct order numbers
        const finalChapters = updated.map((ch, idx) => ({
            ...ch,
            order: idx + 1
        }));

        setChapters(finalChapters);

        startTransition(async () => {
            try {
                await reorderChapters(storyId, finalChapters.map(ch => ch.id));
                toast.success("Chapters reordered successfully");
            } catch (error) {
                console.error(error);
                toast.error("Failed to save new chapter order");
                // Revert to original on failure
                setChapters([...initialChapters].sort((a, b) => a.order - b.order));
            }
        });
    };

    const handleDelete = async (chapterId: string) => {
        if (!confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) return;
        try {
            await deleteChapter(chapterId, storyId);
            setChapters(prev => prev.filter(ch => ch.id !== chapterId).map((ch, idx) => ({ ...ch, order: idx + 1 })));
            toast.success("Chapter deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete chapter");
        }
    };

    if (chapters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 bg-background/50">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Write your first chapter</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">Every great adventure begins with a single word. Start yours today.</p>
                <div className="mt-8">
                    <Link href={`/stories/${storyId}/editor/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Chapter
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {chapters.map((chapter, index) => (
                <Card key={chapter.id} className="relative group hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99] active:border-primary/50 active:bg-primary/5 bg-card border-border">
                    {/* Main click triggers navigating to chapter hub */}
                    <Link href={`/stories/${storyId}/chapters/${chapter.id}`} className="absolute inset-0 z-0" aria-label={chapter.title} />
                    
                    <CardContent className="flex items-center justify-between p-3 sm:p-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Reordering Controls */}
                            <div className="relative z-10 flex flex-col items-center gap-0.5 mr-1 select-none">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                                    onClick={() => handleMove(index, "up")}
                                    disabled={index === 0 || isPending}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    {chapter.order}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                                    onClick={() => handleMove(index, "down")}
                                    disabled={index === chapters.length - 1 || isPending}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="min-w-0">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors font-serif text-sm sm:text-base truncate">
                                    <Link href={`/stories/${storyId}/editor/${chapter.id}`} className="relative z-10 hover:underline">
                                        {chapter.title}
                                    </Link>
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-body truncate">
                                    {chapter.wordCount.toLocaleString()} words • {formatRelativeTime(chapter.lastEdited)}
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-4 ml-2">
                            {isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                            <Badge
                                variant={chapter.status === 'Completed' ? 'default' : 'outline'}
                                className={cn(
                                    chapter.status === 'Editing' && "border-primary/50 text-primary bg-primary/5 font-semibold"
                                )}
                            >
                                {chapter.status}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 active:scale-90 active:bg-muted">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/stories/${storyId}/editor/${chapter.id}`}>
                                            Edit Content
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/stories/${storyId}/chapters/${chapter.id}`}>
                                            Manage Cast & Setting
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleDelete(chapter.id)}
                                    >
                                        Delete Chapter
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

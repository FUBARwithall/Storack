"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { updateStory, uploadStoryCover, deleteStory } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useRef } from "react";

interface StorySettingsProps {
    story: {
        id: string;
        title: string;
        genre: string | null;
        synopsis: string | null;
        status: string;
        coverImage: string | null;
        tags: string[];
    };
    className?: string;
}

const GENRE_LIST = [
    "Fantasy",
    "Sci-Fi",
    "Thriller",
    "Romance",
    "Mystery",
    "Horror",
    "Historical Fiction",
    "Contemporary",
    "Non-Fiction",
    "Comedy",
    "Drama",
    "Adventure",
    "Other"
];

export function StorySettings({ story, className }: StorySettingsProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: story.title,
        genre: story.genre || "",
        status: story.status,
        synopsis: story.synopsis || "",
        coverImage: story.coverImage || "",
        tagsString: story.tags.join(", ")
    });

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append("coverImage", file);

            const result = await uploadStoryCover(story.id, uploadFormData);
            if (result.success && result.imageUrl) {
                setFormData(prev => ({ ...prev, coverImage: result.imageUrl! }));
                router.refresh();
            } else {
                alert("Upload failed: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during upload");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const tags = formData.tagsString
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag !== "");

            await updateStory(story.id, {
                title: formData.title,
                genre: formData.genre,
                status: formData.status,
                synopsis: formData.synopsis,
                coverImage: formData.coverImage,
                tags: tags
            });

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update story");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this story? This will permanently delete all chapters, characters, notes, and other content associated with this story. This action cannot be undone.")) {
            return;
        }
        setIsLoading(true);
        try {
            await deleteStory(story.id);
            setOpen(false);
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Failed to delete story");
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Story Settings</DialogTitle>
                        <DialogDescription>
                            Edit your story details. Upload a cover or change the genre.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 font-sans">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-foreground/80">Title</Label>
                            <Input
                                id="title"
                                className="bg-background/50 border-muted-foreground/30 focus:border-primary transition-all duration-200"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="genre" className="text-foreground/80">Genre</Label>
                                <Select
                                    value={formData.genre}
                                    onValueChange={(value) => setFormData({ ...formData, genre: value })}
                                >
                                    <SelectTrigger id="genre" className="bg-background/50 border-muted-foreground/30">
                                        <SelectValue placeholder="Select genre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENRE_LIST.map(g => (
                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status" className="text-foreground/80">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger id="status" className="bg-background/50 border-muted-foreground/30">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Editing">Editing</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label className="text-foreground/80">Story Cover</Label>
                            <div className="flex gap-4 items-center group">
                                <div
                                    className="relative h-28 w-20 shrink-0 border border-muted-foreground/30 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all duration-300"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {formData.coverImage ? (
                                        <img
                                            src={formData.coverImage}
                                            alt="Preview"
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground px-1 text-center">No Image</span>
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                                        <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Local Upload</p>
                                    <p className="text-xs text-muted-foreground">Select an image from your device</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        className="h-7 text-xs px-2 mt-2 font-normal"
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {isUploading ? "Uploading..." : "Click to Upload"}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-1.5 mt-1">
                                <Label htmlFor="coverUrl" className="text-[11px] text-muted-foreground">Or provide an external URL</Label>
                                <Input
                                    id="coverUrl"
                                    placeholder="https://example.com/image.jpg"
                                    className="text-xs h-8 bg-background/50"
                                    value={formData.coverImage}
                                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2 text-foreground/80">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                className="bg-background/50 border-muted-foreground/30 focus:border-primary transition-all duration-200"
                                placeholder="magic, adventure, hero"
                                value={formData.tagsString}
                                onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2 text-foreground/80">
                            <Label htmlFor="synopsis">Synopsis</Label>
                            <Textarea
                                id="synopsis"
                                placeholder="What is your story about?"
                                className="min-h-[140px] resize-none bg-background/50 border-muted-foreground/30 focus:border-primary transition-all duration-200"
                                value={formData.synopsis}
                                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 rounded-b-lg border-t mt-4 sm:justify-between flex-col-reverse sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium w-full sm:w-auto"
                        >
                            Delete Story
                        </Button>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted font-medium w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading} className="shadow-md hover:shadow-lg transition-all px-6 w-full sm:w-auto">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Story Settings
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

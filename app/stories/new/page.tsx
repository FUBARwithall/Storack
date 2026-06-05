"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { createStory, getOrCreateDefaultWorld, uploadStoryCover } from "@/lib/actions";

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

export default function NewStoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [genre, setGenre] = useState("");
    const [synopsis, setSynopsis] = useState("");
    const [coverImage, setCoverImage] = useState("");

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // We need a temporary story ID or handle upload after creation?
            // Actually, for "New Story", we might just want to store it as a temp file
            // OR, create the story first with placeholder and then upload.
            // Let's keep it simple: for NEW stories, we'll allow URL or just wait for settings.
            // BUT, the user wants upload here too.
            // Let's use a base64 preview for now and upload once created?
            // BETTER: create the story with basic info, then we have an ID, then upload.

            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const world = await getOrCreateDefaultWorld();

            // If coverImage is base64, we might need to handle it differently.
            // But let's see if we can create the story first.
            const story = await createStory(world.id, {
                title,
                genre,
                synopsis,
                coverImage: coverImage.startsWith('data:') ? undefined : coverImage
            });

            // If we have a base64 image, upload it now that we have an ID
            if (coverImage.startsWith('data:')) {
                const blob = await (await fetch(coverImage)).blob();
                const file = new File([blob], "cover.png", { type: blob.type });
                const formData = new FormData();
                formData.append("coverImage", file);
                await uploadStoryCover(story.id, formData);
            }

            router.push(`/stories/${story.id}`);
        } catch (err) {
            console.error("Failed to create story:", err);
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-background font-sans">
            <div className="border-b px-8 py-6">
                <Link href="/stories" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stories
                </Link>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Create New Project</h1>
                <p className="mt-2 text-muted-foreground">Start a new journey. Every detail matters.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-10">

                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-foreground/80">Project Title</label>
                        <Input
                            required
                            type="text"
                            placeholder="e.g., The Last Starship"
                            className="h-12 text-lg bg-card/50 border-muted-foreground/30 focus:border-primary transition-all duration-200"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-foreground/80">Genre</label>
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full h-10 rounded-md border border-muted-foreground/30 bg-card/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                            >
                                <option value="">Select a Genre</option>
                                {GENRE_LIST.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-foreground/80">Cover Image</label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative h-24 w-16 shrink-0 border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {coverImage ? (
                                        <img src={coverImage} alt="Preview" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                        <Upload className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="xs"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Choose File
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground">PNG, JPG up to 10MB</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-foreground/80">Synopsis</label>
                        <textarea
                            rows={6}
                            value={synopsis}
                            onChange={(e) => setSynopsis(e.target.value)}
                            placeholder="What is your story about?"
                            className="w-full rounded-md border border-muted-foreground/30 bg-card/50 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t">
                        <Link href="/stories">
                            <Button type="button" variant="ghost" className="px-6 hover:bg-muted font-medium">Cancel</Button>
                        </Link>
                        <Button type="submit" isLoading={loading} className="px-8 shadow-md hover:shadow-lg transition-all scale-105">
                            {!loading && <BookOpen className="mr-2 h-4 w-4" />}
                            Create Story Project
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}


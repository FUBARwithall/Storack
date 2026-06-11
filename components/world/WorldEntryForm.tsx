"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createLocation, updateLocation } from "@/lib/actions";
import { Globe, MapPin, Shield, Book, Zap, Box, Loader2, ChevronLeft, Upload, X } from "lucide-react";

interface WorldEntryFormProps {
    worldId: string;
    storyId?: string;
    stories?: any[];
    entry?: any;
    onSave: () => void;
    onCancel: () => void;
}

const CATEGORIES = [
    { value: 'Location', icon: <MapPin className="h-4 w-4" /> },
    { value: 'Faction', icon: <Shield className="h-4 w-4" /> },
    { value: 'Lore', icon: <Book className="h-4 w-4" /> },
    { value: 'System', icon: <Zap className="h-4 w-4" /> },
    { value: 'Object', icon: <Box className="h-4 w-4" /> },
];

export function WorldEntryForm({ worldId, storyId, stories = [], entry, onSave, onCancel }: WorldEntryFormProps) {
    const [name, setName] = useState(entry?.name || "");
    const [type, setType] = useState(entry?.type || "Location");
    const [description, setDescription] = useState(entry?.description || "");
    const [mapUrl, setMapUrl] = useState(entry?.mapUrl || "");
    const [imageUrl, setImageUrl] = useState(entry?.imageUrl || "");
    const [selectedStoryId, setSelectedStoryId] = useState(entry?.storyId || storyId || "none");
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = !!entry;

    useEffect(() => {
        if (entry) {
            setName(entry.name || "");
            setType(entry.type || "Location");
            setDescription(entry.description || "");
            setMapUrl(entry.mapUrl || "");
            setImageUrl(entry.imageUrl || "");
            setSelectedStoryId(entry.storyId || "none");
        } else {
            setSelectedStoryId(storyId || "none");
        }
    }, [entry, storyId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const data = {
                name,
                type,
                description,
                mapUrl: mapUrl || undefined,
                imageUrl: imageUrl || undefined,
                storyId: selectedStoryId === "none" ? null : selectedStoryId
            };
            if (isEdit) {
                await updateLocation(entry.id, data);
            } else {
                await createLocation(worldId, data);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save world entry:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-5xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? "Edit World Entry" : "Create World Entry"}</CardTitle>
                <CardDescription>
                    Document a location, faction, lore, or system in your world.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-8">
                        {/* Image Section */}
                        <div className="flex justify-center flex-col items-center gap-4">
                            <div
                                className="aspect-video rounded-2xl p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
                                style={{ width: '100%', maxWidth: 480 }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imageUrl ? (
                                    <>
                                        <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-10 w-10 text-white drop-shadow-md" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setImageUrl(""); }}
                                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                                        <Upload className="h-10 w-10" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Upload Reference Image</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Entry Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. The Silver Peaks"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11 bg-card/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger id="type" className="h-11 bg-card/50">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    <div className="flex items-center gap-2">
                                                        {cat.icon}
                                                        <span>{cat.value}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="story" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Associated Story</Label>
                                    <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                                        <SelectTrigger id="story" className="h-11 bg-card/50">
                                            <SelectValue placeholder="Global (World-wide)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Global (World-wide)</SelectItem>
                                            {stories.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Lore</Label>
                                <Textarea
                                    id="description"
                                    placeholder="A brief summary or detailed history..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-card/50 min-h-[150px] resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mapUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference URL (Optional)</Label>
                                <Input
                                    id="mapUrl"
                                    placeholder="https://..."
                                    value={mapUrl}
                                    onChange={(e) => setMapUrl(e.target.value)}
                                    className="h-11 bg-card/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            isLoading={isLoading}
                        >
                            {isEdit ? "Update Entry" : "Save Entry"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

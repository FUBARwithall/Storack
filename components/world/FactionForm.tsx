"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createFaction, updateFaction } from "@/lib/actions";
import { Loader2, Upload, X } from "lucide-react";

interface FactionFormProps {
    worldId: string;
    worldName?: string;
    storyId?: string;
    stories?: any[];
    entry?: any;
    onSave: () => void;
    onCancel: () => void;
}

export function FactionForm({ worldId, worldName, storyId, stories = [], entry, onSave, onCancel }: FactionFormProps) {
    const [name, setName] = useState(entry?.name || "");
    const [type, setType] = useState(entry?.type || "Faction");
    const [description, setDescription] = useState(entry?.description || "");
    const [imageUrl, setImageUrl] = useState(entry?.imageUrl || "");
    const [selectedStoryId, setSelectedStoryId] = useState(entry?.storyId || storyId || "none");
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = !!entry;

    useEffect(() => {
        if (entry) {
            setName(entry.name || "");
            setType(entry.type || "Faction");
            setDescription(entry.description || "");
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
                imageUrl: imageUrl || undefined,
                storyId: selectedStoryId === "none" ? null : selectedStoryId
            };
            if (isEdit) {
                await updateFaction(entry.id, data);
            } else {
                await createFaction(worldId, data);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save faction:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-5xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? "Edit Faction" : "Create Faction"}</CardTitle>
                <CardDescription>
                    Document a group, organization, or guild in your world.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        {/* Left Column: Image Section */}
                        <div className="lg:col-span-5 flex flex-col gap-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reference Image</Label>
                            <div
                                className="flex-1 min-h-[220px] rounded-2xl p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imageUrl ? (
                                    <>
                                        <img src={imageUrl} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
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

                        {/* Right Column: Form Fields */}
                        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Faction Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. The Silver Vanguard"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11 bg-card/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Organization Type</Label>
                                        <Input
                                            id="type"
                                            placeholder="e.g. Faction, Guild, Alliance"
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            required
                                            className="h-11 bg-card/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="story" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Associated Story</Label>
                                        <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                                            <SelectTrigger id="story" className="h-11 w-full bg-card/50">
                                                <SelectValue placeholder={`Global (${worldName || "World-wide"})`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Global ({worldName || "World-wide"})</SelectItem>
                                                {stories.map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Lore</Label>
                        <Textarea
                            id="description"
                            placeholder="A brief summary or detailed history of this organization..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-card/50 min-h-[150px] resize-none"
                        />
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
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update Faction" : "Save Faction"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

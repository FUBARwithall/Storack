"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLocation, updateLocation } from "@/lib/actions";
import { Globe, MapPin, Shield, Book, Zap, Box, Loader2 } from "lucide-react";

interface WorldEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    worldId: string;
    entry?: {
        id: string;
        name: string;
        type: string | null;
        description: string | null;
        mapUrl?: string | null;
    };
}

const CATEGORIES = [
    { value: 'Location', icon: <MapPin className="h-4 w-4" /> },
    { value: 'Faction', icon: <Shield className="h-4 w-4" /> },
    { value: 'Lore', icon: <Book className="h-4 w-4" /> },
    { value: 'Magic System', icon: <Zap className="h-4 w-4" /> },
    { value: 'Object', icon: <Box className="h-4 w-4" /> },
];

export function WorldEntryModal({ isOpen, onClose, worldId, entry }: WorldEntryModalProps) {
    const [name, setName] = useState(entry?.name || "");
    const [type, setType] = useState(entry?.type || "Location");
    const [description, setDescription] = useState(entry?.description || "");
    const [mapUrl, setMapUrl] = useState(entry?.mapUrl || "");
    const [isLoading, setIsLoading] = useState(false);

    const isEdit = !!entry;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsLoading(true);
        try {
            // Only Location is fully supported in schema right now
            // If we add Lore/Faction models later, we can branch here
            if (isEdit) {
                await updateLocation(entry.id, {
                    name,
                    type,
                    description,
                    mapUrl: mapUrl || undefined
                });
            } else {
                await createLocation(worldId, {
                    name,
                    type,
                    description,
                    mapUrl: mapUrl || undefined
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save world entry:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] animate-in fade-in zoom-in duration-300">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Globe className="h-5 w-5" />
                        </div>
                        {isEdit ? "Update Entry" : "Create World Entry"}
                    </DialogTitle>
                    <DialogDescription>
                        Document a location, faction, or piece of lore in your world.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="entry-name" className="text-sm font-semibold">Entry Name</Label>
                            <Input
                                id="entry-name"
                                placeholder="e.g. The Silver Peaks"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2 col-span-2 sm:col-span-1">
                            <Label htmlFor="entry-type" className="text-sm font-semibold">Category</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger id="entry-type" className="h-10">
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entry-desc" className="text-sm font-semibold">Description</Label>
                        <Textarea
                            id="entry-desc"
                            placeholder="A brief summary of this entry..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px] resize-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entry-url" className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Reference/Map URL
                            <span className="text-[10px] uppercase tracking-wider font-normal">Optional</span>
                        </Label>
                        <Input
                            id="entry-url"
                            placeholder="https://..."
                            value={mapUrl}
                            onChange={(e) => setMapUrl(e.target.value)}
                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name} className="shadow-lg shadow-primary/20">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update Entry" : "Create Entry"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLocation, updateLocation } from "@/lib/actions";
import { MapPin, Loader2 } from "lucide-react";

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    worldId: string;
    entry?: {
        id: string;
        name: string;
        description: string | null;
        mapUrl?: string | null;
    };
}

export function LocationModal({ isOpen, onClose, worldId, entry }: LocationModalProps) {
    const [name, setName] = useState(entry?.name || "");
    const [description, setDescription] = useState(entry?.description || "");
    const [mapUrl, setMapUrl] = useState(entry?.mapUrl || "");
    const [isLoading, setIsLoading] = useState(false);

    const isEdit = !!entry;

    useEffect(() => {
        if (entry) {
            setName(entry.name || "");
            setDescription(entry.description || "");
            setMapUrl(entry.mapUrl || "");
        } else {
            setName("");
            setDescription("");
            setMapUrl("");
        }
    }, [entry, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsLoading(true);
        try {
            if (isEdit) {
                await updateLocation(entry.id, {
                    name,
                    description,
                    mapUrl: mapUrl || undefined
                });
            } else {
                await createLocation(worldId, {
                    name,
                    description,
                    mapUrl: mapUrl || undefined
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save location:", error);
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
                            <MapPin className="h-5 w-5" />
                        </div>
                        {isEdit ? "Update Location" : "Create Location"}
                    </DialogTitle>
                    <DialogDescription>
                        Document a location in your world.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="entry-name" className="text-sm font-semibold">Location Name</Label>
                        <Input
                            id="entry-name"
                            placeholder="e.g. The Silver Peaks"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entry-desc" className="text-sm font-semibold">Description</Label>
                        <Textarea
                            id="entry-desc"
                            placeholder="A brief summary of this location..."
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
                            {isEdit ? "Update Location" : "Create Location"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

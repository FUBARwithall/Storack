"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createLocation, updateLocation } from "@/lib/actions";
import { Loader2, Upload, X, ChevronLeft, MapPin } from "lucide-react";
import LOCATION_TYPES from "@/lib/locationTypes";

interface LocationFormProps {
    worldId: string;
    worldName?: string;
    storyId?: string;
    stories?: any[];
    locations?: any[];
    entry?: any;
    onSave: () => void;
    onCancel: () => void;
}

// Helper to recursively find descendant IDs to prevent circular parenting
const getDescendantIds = (locId: string, allLocs: any[]): string[] => {
    const descendants: string[] = [];
    const children = allLocs.filter(l => l.parentId === locId);
    for (const child of children) {
        descendants.push(child.id);
        descendants.push(...getDescendantIds(child.id, allLocs));
    }
    return descendants;
};

export function LocationForm({ worldId, worldName, storyId, stories = [], locations = [], entry, onSave, onCancel }: LocationFormProps) {
    const [name, setName] = useState(entry?.name || "");
    const [description, setDescription] = useState(entry?.description || "");
    const [mapUrl, setMapUrl] = useState(entry?.mapUrl || "");
    const [imageUrl, setImageUrl] = useState(entry?.imageUrl || "");
    const [selectedStoryId, setSelectedStoryId] = useState(entry?.storyId || storyId || "none");
    const [selectedParentId, setSelectedParentId] = useState(entry?.parentId || "none");
    const [locationType, setLocationType] = useState(entry?.type || "none");
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = !!entry;

    useEffect(() => {
        if (entry) {
            setName(entry.name || "");
            setDescription(entry.description || "");
            setMapUrl(entry.mapUrl || "");
            setImageUrl(entry.imageUrl || "");
            setSelectedStoryId(entry.storyId || "none");
            setSelectedParentId(entry.parentId || "none");
            setLocationType(entry.type || "none");
        } else {
            setSelectedStoryId(storyId || "none");
            setSelectedParentId("none");
            setLocationType("none");
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
                type: locationType === "none" ? undefined : locationType,
                description,
                mapUrl: mapUrl || undefined,
                imageUrl: imageUrl || undefined,
                storyId: selectedStoryId === "none" ? null : selectedStoryId,
                parentId: selectedParentId === "none" ? null : selectedParentId
            };
            if (isEdit) {
                await updateLocation(entry.id, data);
            } else {
                await createLocation(worldId, data);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save location:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const excludedIds = entry ? [entry.id, ...getDescendantIds(entry.id, locations)] : [];
    const parentOptions = locations.filter((loc: any) => !excludedIds.includes(loc.id));
    const currentTypeObj = LOCATION_TYPES.flatMap(g => g.items).find(i => i.value === locationType);

    return (
        <Card className="w-full max-w-4xl mx-auto border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4 border-b flex flex-row items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onCancel} className="shrink-0 h-10 w-10 bg-secondary/50 rounded-full hover:bg-secondary">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        {isEdit ? "Edit Location" : "Create Location"}
                    </CardTitle>
                    <CardDescription>
                        Document a location in your world.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
                        <div className="lg:col-span-3 flex flex-col gap-2">
                            <div
                                className="w-full max-w-[220px] aspect-square rounded-3xl p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow-md mx-auto lg:mx-0"
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
                        <div className="lg:col-span-9 space-y-2.5">
                            <div className="flex items-center gap-2">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Location Name :</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. The Silver Peaks"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="story" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Story :</Label>
                                    <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                                        <SelectTrigger id="story" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                            <SelectValue placeholder={`Global (${worldName || "World-wide"})`} />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="max-h-60">
                                            <SelectItem value="none">Global ({worldName || "World-wide"})</SelectItem>
                                            {stories.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="parent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Parent :</Label>
                                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                                        <SelectTrigger id="parent" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                            <SelectValue placeholder="None (Top Level)" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="max-h-60">
                                            <SelectItem value="none">None (Top Level)</SelectItem>
                                            {parentOptions.map((loc: any) => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="locationType" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Type :</Label>
                                    <Select value={locationType} onValueChange={setLocationType}>
                                        <SelectTrigger id="locationType" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                            {currentTypeObj ? (
                                                <div className="flex items-center gap-2">
                                                    <currentTypeObj.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="text-sm text-foreground">{currentTypeObj.label}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="text-sm text-muted-foreground">None</span>
                                                </div>
                                            )}
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="max-h-64 w-[var(--radix-select-trigger-width)]">
                                            <SelectItem value="none">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>None</span>
                                                </div>
                                            </SelectItem>
                                            {LOCATION_TYPES.map((group) => (
                                                <SelectGroup key={group.group}>
                                                    <SelectLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase px-2 py-1 bg-secondary/10 rounded-sm mt-2 mb-1">
                                                        {group.group}
                                                    </SelectLabel>
                                                    {group.items.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>
                                                            <div className="flex items-center gap-2">
                                                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                                                <span>{item.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="mapUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Reference URL :</Label>
                                    <Input
                                        id="mapUrl"
                                        placeholder="https://..."
                                        value={mapUrl}
                                        onChange={(e) => setMapUrl(e.target.value)}
                                        className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                    />
                                </div>
                            </div>
                        </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description & Lore</Label>
                        <Textarea
                            id="description"
                            placeholder="A brief summary or detailed history of this location..."
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
                            {isEdit ? "Update Location" : "Save Location"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

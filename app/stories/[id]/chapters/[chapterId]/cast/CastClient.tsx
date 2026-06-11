"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, MapPin, Search, Check, Info, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateChapterWorldElements } from "@/lib/actions";

interface CastClientProps {
    story: { id: string; title: string };
    chapter: {
        id: string;
        title: string;
        order: number;
        characters: { id: string }[];
        locations: { id: string }[];
    };
    availableCharacters: {
        id: string;
        name: string;
        role: string | null;
        avatarUrl: string | null;
    }[];
    availableLocations: {
        id: string;
        name: string;
        type: string | null;
        imageUrl: string | null;
    }[];
}

export function CastClient({ story, chapter, availableCharacters, availableLocations }: CastClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    // Track checked state locally
    const [selectedCharIds, setSelectedCharIds] = useState<string[]>(
        chapter.characters.map((c) => c.id)
    );
    const [selectedLocIds, setSelectedLocIds] = useState<string[]>(
        chapter.locations.map((l) => l.id)
    );

    // Search filters
    const [charSearch, setCharSearch] = useState("");
    const [locSearch, setLocSearch] = useState("");

    // Group locations by type (Location, Faction, Lore, Object, etc.)
    const getGroupedLocations = () => {
        const groups: Record<string, typeof availableLocations> = {};
        
        // Filter first
        const filtered = availableLocations.filter((loc) =>
            loc.name.toLowerCase().includes(locSearch.toLowerCase())
        );

        filtered.forEach((loc) => {
            const type = loc.type || "Other";
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(loc);
        });

        return groups;
    };

    const groupedLocations = getGroupedLocations();
    const filteredCharacters = availableCharacters.filter((char) =>
        char.name.toLowerCase().includes(charSearch.toLowerCase())
    );

    const initialCharIds = chapter.characters.map((c) => c.id);
    const initialLocIds = chapter.locations.map((l) => l.id);

    const hasChanges =
        selectedCharIds.length !== initialCharIds.length ||
        selectedLocIds.length !== initialLocIds.length ||
        selectedCharIds.some((id) => !initialCharIds.includes(id)) ||
        selectedLocIds.some((id) => !initialLocIds.includes(id));

    const handleSave = async () => {
        if (saveStatus === "saving") return;
        setSaveStatus("saving");
        try {
            await updateChapterWorldElements(chapter.id, {
                characterIds: selectedCharIds,
                locationIds: selectedLocIds,
            });
            setSaveStatus("saved");
            router.refresh();
            setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
            console.error(error);
            setSaveStatus("error");
        }
    };

    const toggleCharacter = (id: string) => {
        const nextIds = selectedCharIds.includes(id)
            ? selectedCharIds.filter((x) => x !== id)
            : [...selectedCharIds, id];
        
        setSelectedCharIds(nextIds);
    };

    const toggleLocation = (id: string) => {
        const nextIds = selectedLocIds.includes(id)
            ? selectedLocIds.filter((x) => x !== id)
            : [...selectedLocIds, id];

        setSelectedLocIds(nextIds);
    };

    const totalTaggedCount = selectedCharIds.length + selectedLocIds.length;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header Toolbar */}
            <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 bg-background/95 backdrop-blur sticky top-0 z-20">
                <div className="flex items-center gap-4 flex-1 col-span-2">
                    <Link href={`/stories/${story.id}/chapters/${chapter.id}`} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-foreground truncate">
                            Cast & Setting &bull; Chapter {chapter.order}
                        </h1>
                        <p className="text-xs text-muted-foreground truncate">{chapter.title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {saveStatus === "saving" && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-primary font-medium animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                        </span>
                    )}
                    {saveStatus === "saved" && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <Check className="h-3.5 w-3.5" /> Changes saved
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-destructive font-medium">
                            Error saving
                        </span>
                    )}
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                        {totalTaggedCount} tagged
                    </Badge>
                    
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || saveStatus === "saving"}
                        className={cn(
                            "gap-2 transition-all duration-300 shadow-sm",
                            hasChanges
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {saveStatus === "saving" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 space-y-8">
                {/* Intro notice */}
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3 text-sm text-blue-600 dark:text-blue-400">
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                        Select characters, factions, lore, objects, and locations to associate them with this chapter. Tap the <strong>Save</strong> button to commit your changes. Only elements linked to <strong>{story.title}</strong> can be tagged here.
                    </p>
                </div>

                {availableCharacters.length === 0 && availableLocations.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                        <CardHeader>
                            <Users className="h-10 w-10 text-muted-foreground opacity-45 mx-auto mb-2" />
                            <CardTitle>No elements linked to this story yet</CardTitle>
                            <CardDescription className="max-w-md mx-auto">
                                To tag cast members or locations, you must first associate characters or world entries with this story.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/stories/${story.id}`}>
                                <Button>Go to Story Details</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Characters Panel */}
                        <Card className="bg-card flex flex-col h-fit">
                            <CardHeader className="space-y-1.5 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" /> Characters
                                    </CardTitle>
                                    <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                                        {selectedCharIds.length}/{availableCharacters.length} selected
                                    </span>
                                </div>
                                <CardDescription>Select characters participating in this chapter.</CardDescription>
                                
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                                    <Input
                                        placeholder="Search characters..."
                                        value={charSearch}
                                        onChange={(e) => setCharSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pt-0">
                                {filteredCharacters.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">No characters found</p>
                                ) : (
                                    filteredCharacters.map((char) => {
                                        const isSelected = selectedCharIds.includes(char.id);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => toggleCharacter(char.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 active:scale-[0.99]",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                                                        : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 bg-muted border flex items-center justify-center">
                                                        {char.avatarUrl ? (
                                                            <img src={char.avatarUrl} alt={char.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold font-serif">
                                                                {char.name[0]?.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold truncate leading-none text-foreground">{char.name}</p>
                                                        {char.role && (
                                                            <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">{char.role}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0",
                                                    isSelected ? "bg-primary border-primary text-primary-foreground scale-100" : "border-muted-foreground/30 text-transparent scale-90"
                                                )}>
                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Setting / World Entries Panel */}
                        <Card className="bg-card flex flex-col h-fit">
                            <CardHeader className="space-y-1.5 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" /> Setting & Lore
                                    </CardTitle>
                                    <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                                        {selectedLocIds.length}/{availableLocations.length} selected
                                    </span>
                                </div>
                                <CardDescription>Tag locations, factions, lore, objects, etc. featured in this chapter.</CardDescription>
                                
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                                    <Input
                                        placeholder="Search world entries..."
                                        value={locSearch}
                                        onChange={(e) => setLocSearch(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 max-h-[500px] overflow-y-auto pt-0">
                                {Object.keys(groupedLocations).length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">No world entries found</p>
                                ) : (
                                    Object.entries(groupedLocations).map(([type, items]) => (
                                        <div key={type} className="space-y-2">
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b pb-1">
                                                {type}s ({items.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {items.map((loc) => {
                                                    const isSelected = selectedLocIds.includes(loc.id);
                                                    return (
                                                        <button
                                                            key={loc.id}
                                                            onClick={() => toggleLocation(loc.id)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 active:scale-[0.99]",
                                                                isSelected
                                                                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                                                                    : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="h-9 w-9 rounded-md overflow-hidden shrink-0 bg-muted border flex items-center justify-center">
                                                                    {loc.imageUrl ? (
                                                                        <img src={loc.imageUrl} alt={loc.name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-xs font-bold">
                                                                            {loc.name[0]?.toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold truncate leading-none text-foreground">{loc.name}</p>
                                                                    <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">{type}</p>
                                                                </div>
                                                            </div>
                                                            <div className={cn(
                                                                "h-5 w-5 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0",
                                                                isSelected ? "bg-primary border-primary text-primary-foreground scale-100" : "border-muted-foreground/30 text-transparent scale-90"
                                                            )}>
                                                                <Check className="h-3 w-3 stroke-[3]" />
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}

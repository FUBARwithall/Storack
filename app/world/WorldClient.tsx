"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Plus, Globe, MoreHorizontal, MapPin, Shield, Book, Zap, Box, User, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LocationForm } from "@/components/world/LocationForm";
import { CharacterForm } from "@/components/characters/CharacterForm";
import { FactionForm } from "@/components/world/FactionForm";
import { LoreForm } from "@/components/world/LoreForm";
import { SystemForm } from "@/components/world/SystemForm";
import { ObjectForm } from "@/components/world/ObjectForm";
import {
    deleteLocation,
    deleteCharacter,
    deleteFaction,
    deleteLore,
    deleteWorldSystem,
    deleteWorldObject
} from "@/lib/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Location {
    id: string;
    name: string;
    type: string | null;
    description: string | null;
    mapUrl: string | null;
    imageUrl: string | null;
    storyId?: string | null;
    story?: { id: string, title: string } | null;
}

interface Character {
    id: string;
    name: string;
    role: string | null;
    avatarUrl: string | null;
    age: string | null;
    gender: string | null;
    species: string | null;
    occupation: string | null;
    personality: string | null;
    backstory: string | null;
    storyId?: string | null;
    story?: { id: string, title: string } | null;
}

interface WorldClientProps {
    initialLocations: Location[];
    initialCharacters: Character[];
    initialFactions?: any[];
    initialLores?: any[];
    initialSystems?: any[];
    initialObjects?: any[];
    worldId: string;
    storyId?: string;
    stories?: any[];
    calendars?: any[];
}

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Location': return <MapPin className="h-4 w-4" />;
        case 'Character': return <User className="h-4 w-4" />;
        case 'Faction': return <Shield className="h-4 w-4" />;
        case 'System': return <Zap className="h-4 w-4" />;
        case 'Object': return <Box className="h-4 w-4" />;
        case 'Lore': return <Book className="h-4 w-4" />;
        default: return <Globe className="h-4 w-4" />;
    }
};

export function WorldClient({
    initialLocations,
    initialCharacters,
    initialFactions = [],
    initialLores = [],
    initialSystems = [],
    initialObjects = [],
    worldId,
    storyId,
    stories = [],
    calendars = []
}: WorldClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Form states
    const [viewMode, setViewMode] = useState<'list' | 'character_form' | 'location_form' | 'faction_form' | 'lore_form' | 'system_form' | 'object_form'>('list');
    const [editingChar, setEditingChar] = useState<any>(undefined);
    const [editingLocation, setEditingLocation] = useState<any>(undefined);
    const [editingFaction, setEditingFaction] = useState<any>(undefined);
    const [editingLore, setEditingLore] = useState<any>(undefined);
    const [editingSystem, setEditingSystem] = useState<any>(undefined);
    const [editingObject, setEditingObject] = useState<any>(undefined);

    // Unified list for display
    const worldItems = [
        ...initialLocations.map(loc => ({
            ...loc,
            avatarUrl: loc.imageUrl,
            species: null,
            occupation: null,
            sourceType: 'location' as const
        })),
        ...initialCharacters.map(char => ({
            ...char,
            type: 'Character',
            description: char.role || 'No role specified',
            sourceType: 'character' as const
        })),
        ...initialFactions.map(fac => ({
            ...fac,
            type: 'Faction',
            category: fac.type,
            avatarUrl: fac.imageUrl,
            species: null,
            occupation: null,
            sourceType: 'faction' as const
        })),
        ...initialLores.map(lore => ({
            ...lore,
            type: 'Lore',
            avatarUrl: lore.imageUrl,
            species: null,
            occupation: null,
            sourceType: 'lore' as const
        })),
        ...initialSystems.map(sys => ({
            ...sys,
            type: 'System',
            avatarUrl: sys.imageUrl,
            species: null,
            occupation: null,
            sourceType: 'system' as const
        })),
        ...initialObjects.map(obj => ({
            ...obj,
            type: 'Object',
            avatarUrl: obj.imageUrl,
            species: null,
            occupation: null,
            sourceType: 'object' as const
        }))
    ];

    const filteredItems = worldItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.type === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Location', 'Character', 'Faction', 'Lore', 'System', 'Object'];

    const handleCreateLocation = () => {
        setEditingLocation(undefined);
        setViewMode('location_form');
    };

    const handleCreateFaction = () => {
        setEditingFaction(undefined);
        setViewMode('faction_form');
    };

    const handleCreateLore = () => {
        setEditingLore(undefined);
        setViewMode('lore_form');
    };

    const handleCreateSystem = () => {
        setEditingSystem(undefined);
        setViewMode('system_form');
    };

    const handleCreateObject = () => {
        setEditingObject(undefined);
        setViewMode('object_form');
    };

    const CreateButton = ({ size = "default", align = "end" }: { size?: "default" | "sm", align?: "end" | "center" }) => {
        if (selectedCategory === "All") {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size={size} className={size === "sm" ? "px-6 h-10 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5" : "shadow-lg shadow-primary/20 h-10 px-6"}>
                            <Plus className="mr-2 h-4 w-4" /> Create Entry
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={align} className="w-48">
                        <DropdownMenuItem onSelect={handleCreateLocation} className="cursor-pointer">
                            <MapPin className="mr-2 h-4 w-4" /> Location
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleCreateFaction} className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" /> Faction
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleCreateLore} className="cursor-pointer">
                            <Book className="mr-2 h-4 w-4" /> Lore
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleCreateSystem} className="cursor-pointer">
                            <Zap className="mr-2 h-4 w-4" /> System
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleCreateObject} className="cursor-pointer">
                            <Box className="mr-2 h-4 w-4" /> Object
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        const getCategoryActionAndDetails = () => {
            switch (selectedCategory) {
                case "Location":
                    return { label: "Create Location", action: handleCreateLocation, icon: <MapPin className="mr-2 h-4 w-4" /> };
                case "Faction":
                    return { label: "Create Faction", action: handleCreateFaction, icon: <Shield className="mr-2 h-4 w-4" /> };
                case "Lore":
                    return { label: "Create Lore", action: handleCreateLore, icon: <Book className="mr-2 h-4 w-4" /> };
                case "System":
                    return { label: "Create System", action: handleCreateSystem, icon: <Zap className="mr-2 h-4 w-4" /> };
                case "Object":
                    return { label: "Create Object", action: handleCreateObject, icon: <Box className="mr-2 h-4 w-4" /> };
                case "Character":
                    return {
                        label: "Create Character",
                        action: () => {
                            setEditingChar(undefined);
                            setViewMode('character_form');
                        },
                        icon: <User className="mr-2 h-4 w-4" />
                    };
                default:
                    return { label: "Create Location", action: handleCreateLocation, icon: <MapPin className="mr-2 h-4 w-4" /> };
            }
        };

        const details = getCategoryActionAndDetails();

        return (
            <Button 
                onClick={details.action} 
                size={size} 
                className={size === "sm" ? "px-6 h-10 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5" : "shadow-lg shadow-primary/20 h-10 px-6"}
            >
                {details.icon} {details.label}
            </Button>
        );
    };

    const handleEdit = (item: any) => {
        if (item.sourceType === 'location') {
            setEditingLocation(item);
            setViewMode('location_form');
        } else if (item.sourceType === 'faction') {
            setEditingFaction(item);
            setViewMode('faction_form');
        } else if (item.sourceType === 'lore') {
            setEditingLore(item);
            setViewMode('lore_form');
        } else if (item.sourceType === 'system') {
            setEditingSystem(item);
            setViewMode('system_form');
        } else if (item.sourceType === 'object') {
            setEditingObject(item);
            setViewMode('object_form');
        } else {
            setEditingChar(item);
            setViewMode('character_form');
        }
    };

    const handleDelete = async (item: any) => {
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            if (item.sourceType === 'location') {
                await deleteLocation(item.id);
            } else if (item.sourceType === 'faction') {
                await deleteFaction(item.id);
            } else if (item.sourceType === 'lore') {
                await deleteLore(item.id);
            } else if (item.sourceType === 'system') {
                await deleteWorldSystem(item.id);
            } else if (item.sourceType === 'object') {
                await deleteWorldObject(item.id);
            } else {
                await deleteCharacter(item.id);
            }
            router.refresh();
        }
    };

    if (viewMode === 'character_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <CharacterForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    character={editingChar}
                    locations={initialLocations}
                    calendars={calendars}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'location_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <LocationForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    entry={editingLocation}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'faction_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <FactionForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    entry={editingFaction}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'lore_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <LoreForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    entry={editingLore}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'system_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <SystemForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    entry={editingSystem}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'object_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <ObjectForm
                    worldId={worldId}
                    storyId={storyId}
                    stories={stories}
                    entry={editingObject}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-full mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Worldbuilding</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Lore, locations, and legends of your universe.</p>
                </div>
                <CreateButton />
            </header>

            {/* Search and Categories */}
            <div className="space-y-6">
                <div className="max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search world database..."
                            className="pl-10 h-10 bg-card/50 shadow-sm border-muted-foreground/20 focus:ring-primary/20 rounded-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap flex-shrink-0 rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300 border ${selectedCategory === cat
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-secondary/40 text-muted-foreground border-transparent hover:border-primary/50 hover:bg-secondary/60 hover:text-primary'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filteredItems.map((item) => (
                        <div
                            key={`${item.sourceType}-${item.id}`}
                            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-card/80"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 shadow-inner overflow-hidden">
                                    {item.avatarUrl ? (
                                        <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <TypeIcon type={item.type || 'Location'} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.name}</h3>
                                        <span className="rounded-full bg-secondary/80 border border-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                            {item.type || 'Entry'}{item.category ? ` • ${item.category}` : ''}
                                        </span>
                                        {item.story && (
                                            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary whitespace-nowrap">
                                                Story: {item.story.title}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground font-medium line-clamp-2">{item.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors">
                                            <MoreHorizontal className="h-4.5 w-4.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onSelect={() => handleEdit(item)} className="cursor-pointer">
                                            <Pencil className="mr-2 h-4 w-4" /> Edit Entry
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDelete(item)} className="text-destructive focus:text-destructive cursor-pointer">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted/40 py-16 bg-card/20 backdrop-blur-sm animate-in fade-in duration-700">
                    <div className="rounded-2xl bg-muted/30 p-5 mb-4 shadow-inner">
                        <Globe className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No entries found</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center leading-relaxed opacity-70">
                        {searchTerm || selectedCategory !== "All"
                            ? "Try broadening your search or choosing a different category."
                            : "Your world is empty. Start recording your locations, factions, lore, systems, or objects."}
                    </p>
                    <div className="mt-8">
                        <CreateButton size="sm" align="center" />
                    </div>
                </div>
            )}
        </div>
    );
}

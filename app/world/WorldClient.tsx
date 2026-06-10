"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Plus, Globe, MoreHorizontal, MapPin, Shield, Book, Zap, Box, User, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorldEntryForm } from "@/components/world/WorldEntryForm";
import { CharacterForm } from "@/components/characters/CharacterForm";
import { deleteLocation, deleteCharacter } from "@/lib/actions";
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
}

interface WorldClientProps {
    initialLocations: Location[];
    initialCharacters: Character[];
    worldId: string;
}

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Location': return <MapPin className="h-4 w-4" />;
        case 'Character': return <User className="h-4 w-4" />;
        case 'Faction': return <Shield className="h-4 w-4" />;
        case 'System': return <Zap className="h-6 w-6" />;
        case 'Object': return <Box className="h-6 w-6" />;
        case 'Lore': return <Book className="h-4 w-4" />;
        default: return <Globe className="h-4 w-4" />;
    }
};

export function WorldClient({ initialLocations, initialCharacters, worldId }: WorldClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Form states
    const [viewMode, setViewMode] = useState<'list' | 'character_form' | 'entry_form'>('list');
    const [editingChar, setEditingChar] = useState<any>(undefined);
    const [editingEntry, setEditingEntry] = useState<any>(undefined);

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
        }))
    ];

    const filteredItems = worldItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.type === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Location', 'Character', 'Faction', 'Lore', 'System', 'Object'];

    const handleCreateEntry = () => {
        setEditingEntry(undefined);
        setViewMode('entry_form');
    };

    const handleEdit = (item: any) => {
        if (item.sourceType === 'location') {
            setEditingEntry(item);
            setViewMode('entry_form');
        } else {
            setEditingChar(item);
            setViewMode('character_form');
        }
    };

    const handleDelete = async (item: any) => {
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            if (item.sourceType === 'location') {
                await deleteLocation(item.id);
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
                    character={editingChar}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    if (viewMode === 'entry_form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <WorldEntryForm
                    worldId={worldId}
                    entry={editingEntry}
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
                <Button onClick={handleCreateEntry} className="shadow-lg shadow-primary/20 h-10 px-6">
                    <Plus className="mr-2 h-4 w-4" /> Create Entry
                </Button>
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
                            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:bg-card/80"
                        >
                            <div className="flex items-start gap-5">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 shadow-inner overflow-hidden">
                                    {item.avatarUrl ? (
                                        <img src={item.avatarUrl} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <TypeIcon type={item.type || 'Location'} />
                                    )}
                                </div>
                                <div className="pl-6">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                                        <span className="rounded-full bg-secondary/80 border border-muted px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                            {item.type || 'Entry'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground font-medium">{item.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center self-end sm:self-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10 transition-colors">
                                            <MoreHorizontal className="h-5 w-5" />
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
                            : "Your world is empty. Start recording your legends and landmarks."}
                    </p>
                    <div className="mt-8">
                        <Button onClick={handleCreateEntry} size="sm" className="px-6 h-10 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                            <Plus className="mr-2 h-4 w-4" /> Create First Entry
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

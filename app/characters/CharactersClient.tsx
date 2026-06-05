"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterForm } from "@/components/characters/CharacterForm";
import { Input } from "@/components/ui/input";
import { deleteCharacter } from "@/lib/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    worldId: string;
}

interface CharactersClientProps {
    initialCharacters: Character[];
    worldId: string;
}

export function CharactersClient({ initialCharacters, worldId }: CharactersClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);

    const filteredCharacters = initialCharacters.filter(char =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.species?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        setEditingCharacter(undefined);
        setViewMode('form');
    };

    const handleEdit = (char: Character) => {
        setEditingCharacter(char);
        setViewMode('form');
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this character?")) {
            await deleteCharacter(id);
            router.refresh();
        }
    };

    if (viewMode === 'form') {
        return (
            <div className="p-6 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <CharacterForm
                    worldId={worldId}
                    character={editingCharacter}
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
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Characters</h1>
                    <p className="text-muted-foreground mt-1 text-sm">The cast of your stories.</p>
                </div>
                <Button onClick={handleCreate} className="shadow-lg shadow-primary/20 h-10 px-6">
                    <Plus className="mr-2 h-4 w-4" /> Create Character
                </Button>
            </header>

            {/* Search */}
            <div className="max-w-md">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
                    <Input
                        type="text"
                        placeholder="Search by name, role, occupation..."
                        className="pl-10 h-10 bg-card/50 shadow-sm border-muted-foreground/20 focus:ring-primary/20 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredCharacters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {filteredCharacters.map((char) => (
                        <Card key={char.id} className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-muted/40 bg-card/60 backdrop-blur-sm">
                            <div className="aspect-[4/5] w-full bg-muted flex items-center justify-center relative overflow-hidden">
                                {char.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={char.avatarUrl}
                                        alt={char.name}
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <User className="h-20 w-20 text-muted-foreground opacity-30" />
                                )}

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-background/80 backdrop-blur-md border border-white/20">
                                                <MoreHorizontal className="h-4 w-4 text-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            <DropdownMenuItem onSelect={() => handleEdit(char)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleDelete(char.id)} className="text-destructive focus:text-destructive cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-end p-4 flex-col justify-end pointer-events-none">
                                    <p className="text-white text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-80">{char.occupation || char.species || "Unknown"}</p>
                                    <h3 className="text-white text-lg font-bold truncate">{char.name}</h3>
                                </div>
                            </div>

                            <CardContent className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{char.role || "Character"}</span>
                                    {char.age && <span className="text-[10px] text-muted-foreground font-medium">{char.age} years</span>}
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{char.name}</h3>
                                    {(char.species || char.occupation) && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                            {char.species}{char.species && char.occupation && " • "}{char.occupation}
                                        </p>
                                    )}
                                </div>

                                {char.backstory && (
                                    <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-1 leading-relaxed border-t border-muted/20 pt-2">
                                        {char.backstory}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add New Card */}
                    <button
                        onClick={handleCreate}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group min-h-[300px]"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3 group-hover:bg-primary group-hover:text-primary-foreground transform group-hover:scale-110 transition-all duration-300 shadow-sm">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-bold text-muted-foreground group-hover:text-primary">Add New Character</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted/40 py-16 bg-card/20 backdrop-blur-sm animate-in fade-in duration-700">
                    <div className="rounded-2xl bg-muted/30 p-5 mb-4 shadow-inner">
                        <User className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No characters found</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center leading-relaxed opacity-70">
                        {searchTerm ? `No results for "${searchTerm}".` : "Your world is quiet. Create your first character to begin."}
                    </p>
                    <div className="mt-8">
                        <Button onClick={handleCreate} size="sm" className="px-6 h-10 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                            <Plus className="mr-2 h-4 w-4" /> {searchTerm ? "Clear Search" : "Create First Character"}
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}

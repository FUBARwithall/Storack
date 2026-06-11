"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createCharacter, updateCharacter } from "@/lib/actions";
import { Loader2, Upload, X, UserCircle, ChevronLeft } from "lucide-react";

interface CharacterFormProps {
    worldId: string;
    storyId?: string;
    stories?: any[];
    character?: any;
    onSave: () => void;
    onCancel: () => void;
}

export function CharacterForm({ worldId, storyId, stories = [], character, onSave, onCancel }: CharacterFormProps) {
    const [name, setName] = useState(character?.name || "");
    const [role, setRole] = useState(character?.role || "Supporting");
    const [avatarUrl, setAvatarUrl] = useState(character?.avatarUrl || "");
    const [age, setAge] = useState(character?.age || "");
    const [gender, setGender] = useState(character?.gender || "");
    const [species, setSpecies] = useState(character?.species || "");
    const [occupation, setOccupation] = useState(character?.occupation || "");
    const [personality, setPersonality] = useState(character?.personality || "");
    const [backstory, setBackstory] = useState(character?.backstory || "");
    const [selectedStoryId, setSelectedStoryId] = useState(character?.storyId || storyId || "none");

    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEdit = !!character;

    useEffect(() => {
        if (character) {
            setName(character.name || "");
            setRole(character.role || "Supporting");
            setAvatarUrl(character.avatarUrl || "");
            setAge(character.age || "");
            setGender(character.gender || "");
            setSpecies(character.species || "");
            setOccupation(character.occupation || "");
            setPersonality(character.personality || "");
            setBackstory(character.backstory || "");
            setSelectedStoryId(character.storyId || "none");
        } else {
            setSelectedStoryId(storyId || "none");
        }
    }, [character, storyId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsLoading(true);
        const data = {
            name, role, avatarUrl, age, gender, species, occupation, personality, backstory,
            storyId: selectedStoryId === "none" ? null : selectedStoryId
        };

        try {
            if (isEdit) {
                await updateCharacter(character.id, data);
            } else {
                await createCharacter(worldId, data);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save character:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6 border-b flex flex-row items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onCancel} className="shrink-0 h-10 w-10 bg-secondary/50 rounded-full hover:bg-secondary">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        {isEdit ? "Edit Profile" : "Create New Character"}
                    </CardTitle>
                    <CardDescription>
                        {isEdit ? "Update this character's details in your universe." : "Define the identity and traits of this individual."}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-0 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex flex-col gap-16">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-4 shrink-0 mb-4">
                            <div
                                className="flex-none aspect-square rounded-3xl p-8 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
                                style={{ width: 256, height: 256 }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarUrl ? (
                                    <>
                                        <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Upload className="h-10 w-10 text-white drop-shadow-md" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setAvatarUrl(""); }}
                                            className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                                        <Upload className="h-12 w-12" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Upload Avatar</span>
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

                        {/* Basic Info Column */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                                    <Input
                                        placeholder="e.g. Kaelen Vance"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11 bg-card/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Narrative Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger className="h-11 bg-card/50">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Protagonist">Protagonist</SelectItem>
                                            <SelectItem value="Antagonist">Antagonist</SelectItem>
                                            <SelectItem value="Supporting">Supporting</SelectItem>
                                            <SelectItem value="Minor">Minor</SelectItem>
                                            <SelectItem value="Mystery">Mystery/Unassigned</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Associated Story</Label>
                                    <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                                        <SelectTrigger className="h-11 bg-card/50">
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

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-muted/30">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age</Label>
                                    <Input placeholder="e.g. 24" value={age} onChange={(e) => setAge(e.target.value)} className="bg-card/50 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                                    <Input placeholder="e.g. Female" value={gender} onChange={(e) => setGender(e.target.value)} className="bg-card/50 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Species</Label>
                                    <Input placeholder="e.g. Human" value={species} onChange={(e) => setSpecies(e.target.value)} className="bg-card/50 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Occupation</Label>
                                    <Input placeholder="e.g. Knight" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="bg-card/50 h-10" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-muted/30">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                Personality & Traits
                            </Label>
                            <Textarea
                                placeholder="Stoic, brave but impulsive..."
                                value={personality}
                                onChange={(e) => setPersonality(e.target.value)}
                                className="bg-card/50 min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                Backstory & Lore
                            </Label>
                            <Textarea
                                placeholder="Where did they come from?"
                                value={backstory}
                                onChange={(e) => setBackstory(e.target.value)}
                                className="bg-card/50 min-h-[160px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading} className="font-medium">
                            Discard
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading || !name} className="shadow-lg shadow-primary/20 font-bold bg-primary text-primary-foreground">
                            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            {isEdit ? "Save Profile" : "Create Character"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

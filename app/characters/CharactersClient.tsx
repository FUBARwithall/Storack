"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, MoreHorizontal, Pencil, Trash2, ChevronLeft, Link as LinkIcon, Heart, Calendar as CalendarIcon, Clock, ShieldAlert, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CharacterForm } from "@/components/characters/CharacterForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    deleteCharacter,
    addCharacterRelationship,
    deleteCharacterRelationship,
    updateCharacterRelationship,
    addCharacterAppearance,
    deleteCharacterAppearance,
    addCharacterSnapshot,
    deleteCharacterSnapshot,
    updateCharacterSnapshot
} from "@/lib/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarEngine, CalendarConfig } from "@/lib/calendar-engine";

// Merges raw Prisma calendar row (config stored as JSON blob) into CalendarConfig
function toCalendarConfig(cal: any): CalendarConfig {
    return { ...cal, ...(cal.config ?? {}), id: cal.id, name: cal.name } as CalendarConfig;
}

function getDisplayState(char: Character) {
    if (char.snapshots && char.snapshots.length > 0) {
        const latest = char.snapshots[char.snapshots.length - 1];
        return {
            name: latest.name || char.name,
            role: latest.role !== null ? latest.role : char.role,
            age: latest.age !== null ? latest.age : char.age,
            gender: latest.gender !== null ? latest.gender : char.gender,
            species: latest.species !== null ? latest.species : char.species,
            occupation: latest.occupation !== null ? latest.occupation : char.occupation,
            avatarUrl: latest.avatarUrl !== null ? latest.avatarUrl : char.avatarUrl,
            backstory: latest.backstory !== null ? latest.backstory : char.backstory,
            personality: latest.personality !== null ? latest.personality : char.personality,
            height: latest.height !== undefined && latest.height !== null ? latest.height : char.height,
            weight: latest.weight !== undefined && latest.weight !== null ? latest.weight : char.weight,
            birthplace: latest.birthplace !== undefined && latest.birthplace !== null ? latest.birthplace : char.birthplace,
            birthdate: latest.birthdate !== undefined && latest.birthdate !== null ? latest.birthdate : char.birthdate,
            deathdate: latest.deathdate !== undefined && latest.deathdate !== null ? latest.deathdate : char.deathdate,
            isSnapshot: true,
            snapshotLabel: latest.label
        };
    }
    return {
        name: char.name,
        role: char.role,
        age: char.age,
        gender: char.gender,
        species: char.species,
        occupation: char.occupation,
        avatarUrl: char.avatarUrl,
        backstory: char.backstory,
        personality: char.personality,
        height: char.height,
        weight: char.weight,
        birthplace: char.birthplace,
        birthdate: char.birthdate,
        deathdate: char.deathdate,
        isSnapshot: false,
        snapshotLabel: ""
    };
}

const isVerticalType = (type: string): boolean => {
    const t = type.toLowerCase();
    return (
        t.includes("parent") ||
        t.includes("child") ||
        t.includes("mentor") ||
        t.includes("apprentice") ||
        t.includes("leader") ||
        t.includes("follower") ||
        t.includes("boss") ||
        t.includes("subordinate") ||
        t.includes("master") ||
        t.includes("servant") ||
        t.includes("superior") ||
        t.includes("underling") ||
        t.includes("creator") ||
        t.includes("creation")
    );
};

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
    storyId?: string | null;
    story?: { id: string, title: string } | null;
    height?: string | null;
    weight?: string | null;
    birthplaceId?: string | null;
    birthplace?: { id: string, name: string } | null;
    birthdate?: any;
    deathdate?: any;
    relationships?: {
        id: string;
        type: string;
        targetId: string;
        target: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }[];
    relatedTo?: {
        id: string;
        type: string;
        characterId: string;
        character: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    }[];
    appearances?: {
        id: string;
        role: string;
        description: string | null;
        eventId: string;
        event: {
            id: string;
            title: string;
            startDate: any;
            endDate: any;
            calendar: any;
        };
        targetCharacter?: {
            id: string;
            name: string;
            avatarUrl: string | null;
        } | null;
    }[];
    snapshots?: {
        id: string;
        label: string;
        note: string | null;
        name: string;
        role: string | null;
        age: string | null;
        gender: string | null;
        species: string | null;
        occupation: string | null;
        personality: string | null;
        backstory: string | null;
        avatarUrl: string | null;
        eventId: string | null;
        event?: {
            id: string;
            title: string;
            startDate: any;
            calendar: any;
        } | null;
        chapterId: string | null;
        chapter?: {
            id: string;
            title: string;
        } | null;
        createdAt: string;
        height?: string | null;
        weight?: string | null;
        birthplaceId?: string | null;
        birthplace?: { id: string, name: string } | null;
        birthdate?: any;
        deathdate?: any;
    }[];
}

interface CharactersClientProps {
    initialCharacters: Character[];
    worldId: string;
    worldName?: string;
    storyId?: string;
    stories?: any[];
    events?: any[];
    chapters?: any[];
    locations?: any[];
    calendars?: any[];
}

export function CharactersClient({ initialCharacters, worldId, worldName, storyId, stories = [], events = [], chapters = [], locations = [], calendars = [] }: CharactersClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'detail' | 'snapshot-form'>('list');
    const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'timeline' | 'history'>('overview');

    // Modals state
    const [isRelationModalOpen, setIsRelationModalOpen] = useState(false);
    const [relationTargetId, setRelationTargetId] = useState("");
    const [relationType, setRelationType] = useState("Friend of");
    const [customRelationType, setCustomRelationType] = useState("");
    const [isRelationSaving, setIsRelationSaving] = useState(false);
    const [editingRelationshipId, setEditingRelationshipId] = useState<string | null>(null);

    const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
    const [appEventId, setAppEventId] = useState("");
    const [appRole, setAppRole] = useState("Present at");
    const [customAppRole, setCustomAppRole] = useState("");
    const [appDescription, setAppDescription] = useState("");
    const [appTargetCharId, setAppTargetCharId] = useState("");
    const [isAppSaving, setIsAppSaving] = useState(false);

    // Snapshot state
    const [snapLabel, setSnapLabel] = useState("");
    const [snapNote, setSnapNote] = useState("");
    const [snapName, setSnapName] = useState("");
    const [snapRole, setSnapRole] = useState("");
    const [snapAge, setSnapAge] = useState("");
    const [snapGender, setSnapGender] = useState("");
    const [snapGenderSelectMode, setSnapGenderSelectMode] = useState<"select" | "custom">("select");
    const [snapSpecies, setSnapSpecies] = useState("");
    const [snapOccupation, setSnapOccupation] = useState("");
    const [snapPersonality, setSnapPersonality] = useState("");
    const [snapBackstory, setSnapBackstory] = useState("");
    const [snapAvatarUrl, setSnapAvatarUrl] = useState("");
    const [snapHeight, setSnapHeight] = useState("");
    const [snapWeight, setSnapWeight] = useState("");
    const [snapEventId, setSnapEventId] = useState("");
    const [snapChapterId, setSnapChapterId] = useState("");
    const [isSnapSaving, setIsSnapSaving] = useState(false);
    const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
    const snapFileInputRef = useRef<HTMLInputElement>(null);

    const filteredCharacters = initialCharacters.filter(char => {
        const display = getDisplayState(char);
        return display.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            display.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            display.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            display.species?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Track current character from updated props
    const activeChar = initialCharacters.find(c => c.id === selectedCharacterId) || editingCharacter;

    const handleCreate = () => {
        setEditingCharacter(undefined);
        setViewMode('form');
    };

    const handleEdit = (char: Character) => {
        setEditingCharacter(char);
        setViewMode('form');
    };

    const handleViewDetail = (char: Character) => {
        setSelectedCharacterId(char.id);
        setActiveTab('overview');
        setViewMode('detail');
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this character?")) {
            await deleteCharacter(id);
            if (selectedCharacterId === id) {
                setViewMode('list');
                setSelectedCharacterId(null);
            }
            router.refresh();
        }
    };

    // Relationship Actions
    const handleSaveRelationship = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChar) return;

        setIsRelationSaving(true);
        const finalType = relationType === "custom" ? customRelationType : relationType;

        try {
            if (editingRelationshipId) {
                await updateCharacterRelationship(worldId, editingRelationshipId, finalType || "Related");
            } else {
                if (!relationTargetId) return;
                await addCharacterRelationship(worldId, {
                    characterId: activeChar.id,
                    targetId: relationTargetId,
                    type: finalType || "Related"
                });
            }
            setIsRelationModalOpen(false);
            setRelationTargetId("");
            setCustomRelationType("");
            setEditingRelationshipId(null);
            router.refresh();
        } catch (err) {
            console.error("Failed to save relationship:", err);
        } finally {
            setIsRelationSaving(false);
        }
    };

    const handleStartEditRelationship = (relId: string, targetId: string, currentType: string) => {
        setEditingRelationshipId(relId);
        setRelationTargetId(targetId);
        
        const standardTypes = ["Parent of", "Child of", "Sibling of", "Spouse of", "Friend of", "Rival of", "Enemy of", "Mentor of", "Apprentice of"];
        if (standardTypes.includes(currentType)) {
            setRelationType(currentType);
            setCustomRelationType("");
        } else {
            setRelationType("custom");
            setCustomRelationType(currentType);
        }
        setIsRelationModalOpen(true);
    };

    const handleDeleteRelationship = async (relId: string) => {
        if (confirm("Delete this relationship?")) {
            try {
                await deleteCharacterRelationship(worldId, relId);
                router.refresh();
            } catch (err) {
                console.error("Failed to delete relationship:", err);
            }
        }
    };

    // Appearance Actions
    const handleAddAppearance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChar || !appEventId) return;

        setIsAppSaving(true);
        const finalRole = appRole === "custom" ? customAppRole : appRole;

        try {
            await addCharacterAppearance(worldId, {
                characterId: activeChar.id,
                eventId: appEventId,
                role: finalRole || "Present",
                description: appDescription || undefined,
                targetCharacterId: appTargetCharId || undefined
            });
            setIsAppearanceModalOpen(false);
            setAppEventId("");
            setCustomAppRole("");
            setAppDescription("");
            setAppTargetCharId("");
            router.refresh();
        } catch (err) {
            console.error("Failed to link timeline event:", err);
        } finally {
            setIsAppSaving(false);
        }
    };

    const handleDeleteAppearance = async (appId: string) => {
        if (confirm("Unlink this character from this timeline event?")) {
            try {
                await deleteCharacterAppearance(worldId, appId);
                router.refresh();
            } catch (err) {
                console.error("Failed to unlink event:", err);
            }
        }
    };

    const handleOpenSnapshotModal = (snapshot?: any) => {
        if (!activeChar) return;
        if (snapshot) {
            setEditingSnapshotId(snapshot.id);
            setSnapLabel(snapshot.label || "");
            setSnapNote(snapshot.note || "");
            setSnapName(snapshot.name || "");
            setSnapRole(snapshot.role || "");
            setSnapAge(snapshot.age || "");
            setSnapGender(snapshot.gender || "");
            setSnapGenderSelectMode(
                snapshot.gender === "Male" || snapshot.gender === "Female" || !snapshot.gender ? "select" : "custom"
            );
            setSnapSpecies(snapshot.species || "");
            setSnapOccupation(snapshot.occupation || "");
            setSnapPersonality(snapshot.personality || "");
            setSnapBackstory(snapshot.backstory || "");
            setSnapAvatarUrl(snapshot.avatarUrl || "");
            setSnapHeight(snapshot.height || "");
            setSnapWeight(snapshot.weight || "");
            setSnapEventId(snapshot.eventId || "none");
            setSnapChapterId(snapshot.chapterId || "none");
        } else {
            setEditingSnapshotId(null);
            setSnapLabel("");
            setSnapNote("");
            setSnapName(activeChar.name || "");
            setSnapRole(activeChar.role || "");
            setSnapAge(activeChar.age || "");
            setSnapGender(activeChar.gender || "");
            setSnapGenderSelectMode(
                activeChar.gender === "Male" || activeChar.gender === "Female" || !activeChar.gender ? "select" : "custom"
            );
            setSnapSpecies(activeChar.species || "");
            setSnapOccupation(activeChar.occupation || "");
            setSnapPersonality(activeChar.personality || "");
            setSnapBackstory(activeChar.backstory || "");
            setSnapAvatarUrl(activeChar.avatarUrl || "");
            setSnapHeight(activeChar.height || "");
            setSnapWeight(activeChar.weight || "");
            setSnapEventId("");
            setSnapChapterId("");
        }
        setViewMode('snapshot-form');
    };

    const handleAddSnapshot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChar || !snapLabel) return;
        setIsSnapSaving(true);
        try {
            if (editingSnapshotId) {
                const existingSnap = activeChar.snapshots?.find(s => s.id === editingSnapshotId);
                await updateCharacterSnapshot(worldId, editingSnapshotId, {
                    label: snapLabel,
                    note: snapNote || undefined,
                    name: snapName,
                    role: snapRole || null,
                    age: snapAge || null,
                    gender: snapGender || null,
                    species: snapSpecies || null,
                    occupation: snapOccupation || null,
                    personality: snapPersonality || null,
                    backstory: snapBackstory || null,
                    avatarUrl: snapAvatarUrl || null,
                    eventId: snapEventId || null,
                    chapterId: snapChapterId || null,
                    height: snapHeight || null,
                    weight: snapWeight || null,
                    birthplaceId: existingSnap?.birthplaceId || activeChar.birthplaceId || null,
                    birthdate: existingSnap?.birthdate || activeChar.birthdate || null,
                    deathdate: existingSnap?.deathdate || activeChar.deathdate || null,
                });
            } else {
                await addCharacterSnapshot(worldId, {
                    characterId: activeChar.id,
                    label: snapLabel,
                    note: snapNote || undefined,
                    name: snapName,
                    role: snapRole || null,
                    age: snapAge || null,
                    gender: snapGender || null,
                    species: snapSpecies || null,
                    occupation: snapOccupation || null,
                    personality: snapPersonality || null,
                    backstory: snapBackstory || null,
                    avatarUrl: snapAvatarUrl || null,
                    eventId: snapEventId || null,
                    chapterId: snapChapterId || null,
                    height: snapHeight || null,
                    weight: snapWeight || null,
                    birthplaceId: activeChar.birthplaceId || null,
                    birthdate: activeChar.birthdate || null,
                    deathdate: activeChar.deathdate || null,
                });
            }
            setViewMode('detail');
            setEditingSnapshotId(null);
            router.refresh();
        } catch (err) {
            console.error("Failed to save snapshot:", err);
        } finally {
            setIsSnapSaving(false);
        }
    };

    const handleDeleteSnapshot = async (snapId: string) => {
        if (confirm("Delete this snapshot? This historical record will be lost.")) {
            try {
                await deleteCharacterSnapshot(worldId, snapId);
                router.refresh();
            } catch (err) {
                console.error("Failed to delete snapshot:", err);
            }
        }
    };

    if (viewMode === 'form') {
        return (
            <div className="p-4 md:p-8 w-full max-w-full mx-auto animate-in fade-in duration-500">
                <CharacterForm
                    worldId={worldId}
                    worldName={worldName}
                    storyId={storyId}
                    stories={stories}
                    character={editingCharacter}
                    locations={locations}
                    calendars={calendars}
                    onSave={() => {
                        setViewMode('list');
                        router.refresh();
                    }}
                    onCancel={() => {
                        setViewMode(selectedCharacterId ? 'detail' : 'list');
                    }}
                />
            </div>
        );
    }

    const handleSnapFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSnapAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (viewMode === 'snapshot-form' && activeChar) {
        return (
            <div className="p-4 md:p-8 w-full max-w-5xl mx-auto animate-in fade-in duration-500">
                <Card className="w-full border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0 pb-4 border-b flex flex-row items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setViewMode('detail')} className="shrink-0 h-10 w-10 bg-secondary/50 rounded-full hover:bg-secondary">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Clock className="h-6 w-6 text-primary" /> {editingSnapshotId ? "Edit Snapshot" : "Create Snapshot"}
                            </CardTitle>
                            <CardDescription>
                                {editingSnapshotId ? "Update this version record of the character." : "Create a new version snapshot to document changes in history."}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <form onSubmit={handleAddSnapshot} className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
                                {/* Left Column: Avatar & Snapshot Settings */}
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Snapshot Avatar Preview</Label>
                                        <div
                                            className="aspect-square rounded-3xl p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow-md w-full"
                                            onClick={() => snapFileInputRef.current?.click()}
                                        >
                                            {snapAvatarUrl ? (
                                                <>
                                                    <img src={snapAvatarUrl} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Upload className="h-10 w-10 text-white drop-shadow-md" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setSnapAvatarUrl(""); }}
                                                        className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                                                    <Upload className="h-10 w-10" />
                                                    <span className="text-sm font-bold uppercase tracking-wider">Upload Avatar</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={snapFileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleSnapFileChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Snapshot Core Configs */}
                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Snapshot Settings</h4>
                                        
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="snapLabel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Snapshot Label *</Label>
                                            <Input
                                                id="snapLabel"
                                                placeholder="e.g. After Timeskip, Post-Curse"
                                                value={snapLabel}
                                                onChange={(e) => setSnapLabel(e.target.value)}
                                                required
                                                className="h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="snapNote" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Change Notes (Optional)</Label>
                                            <Textarea
                                                id="snapNote"
                                                placeholder="Describe what changed in this version and why..."
                                                value={snapNote}
                                                onChange={(e) => setSnapNote(e.target.value)}
                                                className="min-h-[80px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Character Attributes in this Snapshot */}
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Character Attributes in this Version</h4>

                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="snapName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Name :</Label>
                                            <Input
                                                id="snapName"
                                                value={snapName}
                                                onChange={(e) => setSnapName(e.target.value)}
                                                required
                                                className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapRole" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Role :</Label>
                                                <Select value={snapRole} onValueChange={setSnapRole}>
                                                    <SelectTrigger id="snapRole" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
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

                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapOccupation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Occupation :</Label>
                                                <Input
                                                    id="snapOccupation"
                                                    value={snapOccupation}
                                                    onChange={(e) => setSnapOccupation(e.target.value)}
                                                    className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapGender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Gender :</Label>
                                                {snapGenderSelectMode === "select" ? (
                                                    <Select 
                                                        value={snapGender === "Male" || snapGender === "Female" ? snapGender : (snapGender ? "Custom" : "none")} 
                                                        onValueChange={(val) => {
                                                            if (val === "Custom") {
                                                                setSnapGenderSelectMode("custom");
                                                                setSnapGender("");
                                                            } else if (val === "none") {
                                                                setSnapGender("");
                                                            } else {
                                                                setSnapGender(val);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger id="snapGender" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Unknown / Unset</SelectItem>
                                                            <SelectItem value="Male">Male</SelectItem>
                                                            <SelectItem value="Female">Female</SelectItem>
                                                            <SelectItem value="Custom">Custom...</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex-1 flex items-center gap-1">
                                                        <Input 
                                                            id="snapGender"
                                                            placeholder="Type custom gender"
                                                            value={snapGender}
                                                            onChange={(e) => setSnapGender(e.target.value)}
                                                            className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                        />
                                                        <Button 
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSnapGenderSelectMode("select");
                                                                setSnapGender("");
                                                            }}
                                                            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
                                                            title="Back to dropdown"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapSpecies" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Species :</Label>
                                                <Input
                                                    id="snapSpecies"
                                                    value={snapSpecies}
                                                    onChange={(e) => setSnapSpecies(e.target.value)}
                                                    className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapAge" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Age :</Label>
                                                <Input
                                                    id="snapAge"
                                                    value={snapAge}
                                                    onChange={(e) => setSnapAge(e.target.value)}
                                                    className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                />
                                            </div>

                                            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-x-6">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="snapHeight" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Height :</Label>
                                                    <Input
                                                        id="snapHeight"
                                                        value={snapHeight}
                                                        onChange={(e) => setSnapHeight(e.target.value)}
                                                        className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="snapWeight" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Weight :</Label>
                                                    <Input
                                                        id="snapWeight"
                                                        value={snapWeight}
                                                        onChange={(e) => setSnapWeight(e.target.value)}
                                                        className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Story Context Anchoring</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapEvent" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Anchor to Event :</Label>
                                                <Select value={snapEventId} onValueChange={setSnapEventId}>
                                                    <SelectTrigger id="snapEvent" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {events.map(e => {
                                                            const engine = new CalendarEngine(toCalendarConfig(e.calendar));
                                                            return (
                                                                <SelectItem key={e.id} value={e.id}>
                                                                    {e.title} ({engine.formatDate(e.startDate)})
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="snapChapter" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Anchor to Chapter :</Label>
                                                <Select value={snapChapterId} onValueChange={setSnapChapterId}>
                                                    <SelectTrigger id="snapChapter" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all">
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {chapters.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                {c.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Traits & Lore</h4>
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="snapPersonality" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personality</Label>
                                                <Textarea
                                                    id="snapPersonality"
                                                    value={snapPersonality}
                                                    onChange={(e) => setSnapPersonality(e.target.value)}
                                                    className="min-h-[80px] resize-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="snapBackstory" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backstory</Label>
                                                <Textarea
                                                    id="snapBackstory"
                                                    value={snapBackstory}
                                                    onChange={(e) => setSnapBackstory(e.target.value)}
                                                    className="min-h-[80px] resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                                        <Button type="button" variant="outline" onClick={() => setViewMode('detail')} disabled={isSnapSaving}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isSnapSaving || !snapLabel || !snapName}>
                                            {isSnapSaving ? "Saving..." : (editingSnapshotId ? "Save Changes" : "Create Snapshot")}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (viewMode === 'detail' && activeChar) {
        const display = getDisplayState(activeChar);
        // Chronologically sort timeline appearances using respective calendar configs
        const sortedAppearances = [...(activeChar.appearances || [])].sort((a, b) => {
            if (!a.event.calendar || !b.event.calendar) return 0;
            const engineA = new CalendarEngine(toCalendarConfig(a.event.calendar));
            const engineB = new CalendarEngine(toCalendarConfig(b.event.calendar));
            return engineA.compareDates(a.event.startDate, b.event.startDate);
        });

        // Filter out existing relationship targets to avoid duplicates in creation dropdown
        const directRelTargets = activeChar.relationships?.map(r => r.targetId) || [];
        const relatedToTargets = activeChar.relatedTo?.map(r => r.characterId) || [];
        const excludedIds = [activeChar.id, ...directRelTargets, ...relatedToTargets];
        const eligibleCharacters = initialCharacters.filter(c => !excludedIds.includes(c.id));

        // Filter out already linked events
        const linkedEventIds = activeChar.appearances?.map(a => a.eventId) || [];
        const eligibleEvents = events.filter(e => !linkedEventIds.includes(e.id));

        return (
            <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 relative">
                {/* Header Back Row */}
                <div>
                    <Button variant="ghost" onClick={() => setViewMode('list')} className="h-9 px-4 rounded-full">
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back to List
                    </Button>
                </div>

                {/* Master Character Sheet Card */}
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Left Column: Sticky Profile Card */}
                        <div className="shrink-0 w-full lg:w-auto flex justify-center lg:justify-start lg:sticky lg:top-6">
                            <div className="flex flex-col items-center w-full max-w-xs border border-border bg-card/60 backdrop-blur-md rounded-none shadow-md overflow-hidden">
                                <div className="w-full aspect-square bg-muted border-b border-border overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                                    {display.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={display.avatarUrl} alt={display.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-muted-foreground opacity-30" />
                                    )}
                                    {/* Dropdown Action Menu */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-none bg-background/80 hover:bg-background shadow-sm border border-border backdrop-blur-sm">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36 rounded-none">
                                                <DropdownMenuItem onClick={() => handleEdit(activeChar)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(activeChar.id)} className="text-destructive focus:text-destructive cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                
                                <div className="p-5 space-y-4 w-full flex flex-col items-center text-center">
                                    <div>
                                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-none">{display.name}</h1>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary mt-2">
                                            {display.role || "Supporting"}
                                        </p>
                                        {display.isSnapshot && (
                                            <Badge variant="secondary" className="mt-2 text-[10px] py-0.5 px-2 font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 rounded-none">
                                                Active Snapshot: {display.snapshotLabel}
                                            </Badge>
                                        )}
                                        {activeChar.story && (
                                            <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1 mt-2">
                                                Linked Story: <span className="text-foreground font-semibold">{activeChar.story.title}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Quick Metadata Stats (Centered Key-Value Block) */}
                                    <div className="w-full flex flex-col gap-2.5 pt-4 border-t border-muted/20">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Age</span>
                                            <span className="text-foreground font-semibold">{display.age || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Gender</span>
                                            <span className="text-foreground font-semibold">{display.gender || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Species</span>
                                            <span className="text-foreground font-semibold">{display.species || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Occupation</span>
                                            <span className="text-foreground font-semibold">{display.occupation || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Height</span>
                                            <span className="text-foreground font-semibold">{display.height || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Weight</span>
                                            <span className="text-foreground font-semibold">{display.weight || "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t border-muted/10 pt-2.5">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Birthplace</span>
                                            <span className="text-foreground font-semibold truncate max-w-[140px] text-right">{display.birthplace?.name || "—"}</span>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tabs and Details */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Tabs Selector */}
                            <div className="flex overflow-x-auto whitespace-nowrap border-b border-border gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {(['overview', 'relationships', 'timeline', 'history'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all relative capitalize -mb-[2px] ${activeTab === tab
                                                ? "border-primary text-primary"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {tab === "timeline" ? "Timeline & Life Events" : tab === "history" ? "State History" : tab}
                                    </button>
                                ))}
                            </div>

                            {/* Tab contents */}
                            <div className="pt-2">
                                {/* OVERVIEW TAB */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                                                <User className="h-4 w-4 text-primary" /> Personality & Traits
                                            </h3>
                                            <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                {display.personality || "No personality description added yet."}
                                            </p>
                                        </div>
                                        <div className="space-y-3 border-t border-border/40 pt-6">
                                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                                                <Clock className="h-4 w-4 text-primary" /> Backstory & Lore
                                            </h3>
                                            <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                {display.backstory || "No backstory information added yet."}
                                            </p>
                                        </div>

                                        {/* Chronology & Origins */}
                                        {(() => {
                                            const characterCalendarId = display.birthdate?.calendarId || display.deathdate?.calendarId;
                                            const activeCalendar = (characterCalendarId && calendars?.find((c: any) => c.id === characterCalendarId)) || calendars?.[0];
                                            const hasDates = display.birthdate || display.deathdate || display.birthplace;
                                            if (!hasDates) return null;

                                            let birthStr = "—";
                                            let deathStr = "—";

                                            if (activeCalendar) {
                                                const engine = new CalendarEngine(toCalendarConfig(activeCalendar));
                                                if (display.birthdate) {
                                                    birthStr = engine.formatDate(display.birthdate);
                                                }
                                                if (display.deathdate) {
                                                    deathStr = engine.formatDate(display.deathdate);
                                                }
                                            }

                                            return (
                                                <div className="space-y-4 border-t border-border/40 pt-6">
                                                    <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                                                        <CalendarIcon className="h-4 w-4 text-primary" /> Chronology & Origins
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Birth Date</p>
                                                            <p className="text-sm font-semibold text-foreground">{birthStr}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Death Date</p>
                                                            <p className="text-sm font-semibold text-foreground">{deathStr}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Birthplace</p>
                                                            <p className="text-sm font-semibold text-foreground">{display.birthplace?.name || "—"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* RELATIONSHIPS TAB */}
                                {activeTab === 'relationships' && (() => {
                                     const directRelations = activeChar.relationships || [];
                                     const inboundRelations = activeChar.relatedTo || [];
                                     const hasRelations = directRelations.length > 0 || inboundRelations.length > 0;
 
                                     return (
                                         <div className="space-y-6">
                                             <div className="flex items-center justify-between">
                                                 <div>
                                                     <h3 className="font-bold text-lg text-foreground">Relations List</h3>
                                                     <p className="text-xs text-muted-foreground">Connections to other characters in the universe.</p>
                                                 </div>
                                                 <Button size="sm" onClick={() => setIsRelationModalOpen(true)} className="h-9 px-4">
                                                     <Plus className="mr-1.5 h-4 w-4" /> Add Relationship
                                                 </Button>
                                             </div>
 
                                             {hasRelations ? (
                                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                     {directRelations.map((rel) => {
                                                         return (
                                                             <div key={rel.id} className="group relative overflow-hidden bg-card/60 hover:shadow-md transition-all border border-border rounded-none shadow-sm flex flex-col w-full">
                                                                 {/* Relation Type Header */}
                                                                 <div className="pt-3 pb-2 px-3 flex items-center justify-between border-b border-border/10 relative">
                                                                     <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mx-auto">
                                                                         {rel.type}
                                                                     </span>
                                                                     <div className="absolute right-2 top-1.5 z-10">
                                                                         <DropdownMenu>
                                                                             <DropdownMenuTrigger asChild>
                                                                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                                     <MoreHorizontal className="h-4 w-4" />
                                                                                 </Button>
                                                                             </DropdownMenuTrigger>
                                                                             <DropdownMenuContent align="end" className="rounded-none w-36">
                                                                                 <DropdownMenuItem onClick={() => handleStartEditRelationship(rel.id, rel.targetId, rel.type)} className="gap-2 cursor-pointer">
                                                                                     <Pencil className="h-3.5 w-3.5" /> Edit relation
                                                                                 </DropdownMenuItem>
                                                                                 <DropdownMenuItem onClick={() => handleDeleteRelationship(rel.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                                                     <Trash2 className="h-3.5 w-3.5" /> Remove
                                                                                 </DropdownMenuItem>
                                                                             </DropdownMenuContent>
                                                                         </DropdownMenu>
                                                                     </div>
                                                                 </div>
                                                                 
                                                                 {/* Stretched Image */}
                                                                 <div className="w-full aspect-square bg-muted overflow-hidden relative shadow-inner flex items-center justify-center">
                                                                     {rel.target.avatarUrl ? (
                                                                         <img src={rel.target.avatarUrl} alt={rel.target.name} className="h-full w-full object-cover" />
                                                                     ) : (
                                                                         <User className="h-12 w-12 text-zinc-500/20" />
                                                                     )}
                                                                 </div>
 
                                                                 {/* Name Footer */}
                                                                 <div className="py-3 px-2 text-center bg-card/40 border-t border-border/10">
                                                                     <h4 className="text-sm font-bold text-foreground truncate">{rel.target.name}</h4>
                                                                 </div>
                                                             </div>
                                                         );
                                                     })}
 
                                                     {inboundRelations.map((rel) => {
                                                         return (
                                                             <div key={rel.id} className="group relative overflow-hidden bg-card/40 border border-border border-dashed rounded-none shadow-sm flex flex-col w-full">
                                                                 {/* Relation Type Header */}
                                                                 <div className="pt-3 pb-2 px-3 flex items-center justify-between border-b border-border/10 relative">
                                                                     <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mx-auto">
                                                                         {rel.type}
                                                                     </span>
                                                                     <div className="absolute right-2 top-1.5 z-10">
                                                                         <DropdownMenu>
                                                                             <DropdownMenuTrigger asChild>
                                                                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                                     <MoreHorizontal className="h-4 w-4" />
                                                                                 </Button>
                                                                             </DropdownMenuTrigger>
                                                                             <DropdownMenuContent align="end" className="rounded-none w-36">
                                                                                 <DropdownMenuItem onClick={() => handleStartEditRelationship(rel.id, rel.characterId, rel.type)} className="gap-2 cursor-pointer">
                                                                                     <Pencil className="h-3.5 w-3.5" /> Edit relation
                                                                                 </DropdownMenuItem>
                                                                                 <DropdownMenuItem onClick={() => handleDeleteRelationship(rel.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                                                     <Trash2 className="h-3.5 w-3.5" /> Remove
                                                                                 </DropdownMenuItem>
                                                                             </DropdownMenuContent>
                                                                         </DropdownMenu>
                                                                     </div>
                                                                 </div>
                                                                 
                                                                 {/* Stretched Image */}
                                                                 <div className="w-full aspect-square bg-muted overflow-hidden relative shadow-inner flex items-center justify-center">
                                                                     {rel.character.avatarUrl ? (
                                                                         <img src={rel.character.avatarUrl} alt={rel.character.name} className="h-full w-full object-cover" />
                                                                     ) : (
                                                                         <User className="h-12 w-12 text-zinc-500/20" />
                                                                     )}
                                                                 </div>
 
                                                                 {/* Name Footer */}
                                                                 <div className="py-3 px-2 text-center bg-card/40 border-t border-border/10">
                                                                     <h4 className="text-sm font-bold text-foreground truncate">{rel.character.name}</h4>
                                                                 </div>
                                                             </div>
                                                         );
                                                     })}
                                                 </div>
                                             ) : (
                                                 <div className="text-center py-12 border border-dashed rounded-none bg-muted/5 flex flex-col items-center justify-center">
                                                     <Heart className="h-8 w-8 text-muted-foreground/40 mb-3" />
                                                     <h4 className="font-semibold text-foreground">No relationships logged</h4>
                                                     <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">Introduce relations to describe how characters connect inside the chronicle.</p>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}

                                {/* TIMELINE TAB */}
                                {activeTab === 'timeline' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground">Personal Timeline</h3>
                                                <p className="text-xs text-muted-foreground">Chronicle events this character appeared in.</p>
                                            </div>
                                            <Button size="sm" onClick={() => setIsAppearanceModalOpen(true)} className="h-9 px-4">
                                                <Plus className="mr-1.5 h-4 w-4" /> Link Timeline Event
                                            </Button>
                                        </div>

                                        {sortedAppearances.length > 0 ? (
                                            <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 pb-2">
                                                {sortedAppearances.map((app) => {
                                                    const engine = new CalendarEngine(toCalendarConfig(app.event.calendar));
                                                    return (
                                                        <div key={app.id} className="relative pl-6 group">
                                                            {/* Dot */}
                                                            <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm" />

                                                            <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm max-w-2xl relative shadow-sm hover:shadow-md transition-all">
                                                                {/* Date header */}
                                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-bold font-mono text-[10px]">
                                                                        {engine.formatDate(app.event.startDate)}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-muted border px-2 py-0.5 rounded-full">
                                                                        Role: {app.role}
                                                                    </span>
                                                                </div>

                                                                <h4 className="font-bold text-sm text-foreground">{app.event.title}</h4>

                                                                {app.description && (
                                                                    <p className="text-xs text-muted-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">
                                                                        {app.description}
                                                                    </p>
                                                                )}

                                                                {app.targetCharacter && (
                                                                    <div className="flex items-center gap-1.5 mt-2">
                                                                        <span className="text-[10px] text-muted-foreground">involved character</span>
                                                                        <span className="text-[10px] font-semibold text-foreground bg-muted border px-2 py-0.5 rounded-full">
                                                                            {app.targetCharacter.name}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Unlink Action */}
                                                                <Button
                                                                    onClick={() => handleDeleteAppearance(app.id)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/5 flex flex-col items-center justify-center">
                                                <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                                                <h4 className="font-semibold text-foreground">No chronological appearances</h4>
                                                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">Link this character to historical timeline events to record their milestones.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* HISTORY TAB */}
                                {activeTab === 'history' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground">State History</h3>
                                                <p className="text-xs text-muted-foreground">Historical records of how this character changed over time.</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleOpenSnapshotModal()} className="h-9 px-4">
                                                <Plus className="mr-1.5 h-4 w-4" /> Create Snapshot
                                            </Button>
                                        </div>

                                        {activeChar.snapshots && activeChar.snapshots.length > 0 ? (
                                            <div className="relative border-l-2 border-primary/20 ml-4 space-y-6 pb-2">
                                                {activeChar.snapshots.map((snap) => {
                                                    return (
                                                        <div key={snap.id} className="relative pl-6 group">
                                                            {/* Dot */}
                                                            <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-sm" />

                                                             <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm max-w-2xl relative shadow-sm hover:shadow-md transition-all space-y-3">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-bold text-sm text-foreground">{snap.label}</span>
                                                                    {snap.event && (
                                                                        <Badge variant="outline" className="text-[10px] py-0">
                                                                            Event: {snap.event.title}
                                                                        </Badge>
                                                                    )}
                                                                    {snap.chapter && (
                                                                        <Badge variant="outline" className="text-[10px] py-0">
                                                                            Chapter: {snap.chapter.title}
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {snap.note && (
                                                                    <p className="text-xs text-muted-foreground/90 italic bg-muted/30 px-3 py-2 border rounded">
                                                                        "{snap.note}"
                                                                    </p>
                                                                )}

                                                                {/* Card fields snapshot summary */}
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                                                    <div className="text-[11px] bg-muted/40 p-2 border border-border/50">
                                                                        <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[9px]">Age</span>
                                                                        <span className="text-foreground font-semibold">{snap.age || "—"}</span>
                                                                    </div>
                                                                    <div className="text-[11px] bg-muted/40 p-2 border border-border/50">
                                                                        <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[9px]">Occupation</span>
                                                                        <span className="text-foreground font-semibold truncate block">{snap.occupation || "—"}</span>
                                                                    </div>
                                                                    <div className="text-[11px] bg-muted/40 p-2 border border-border/50">
                                                                        <span className="text-muted-foreground block font-medium uppercase tracking-wider text-[9px]">Species</span>
                                                                        <span className="text-foreground font-semibold">{snap.species || "—"}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Top-right dropdown */}
                                                                <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="rounded-none w-36">
                                                                            <DropdownMenuItem onClick={() => handleOpenSnapshotModal(snap)} className="gap-2 cursor-pointer">
                                                                                <Pencil className="h-3.5 w-3.5" /> Edit snapshot
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => handleDeleteSnapshot(snap.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 border border-dashed rounded-none bg-muted/5 flex flex-col items-center justify-center">
                                                <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                                                <h4 className="font-semibold text-foreground">No historical versions</h4>
                                                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">Create snapshot milestones to document age transitions, curses, species transformations, or job changes.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                {/* MODAL: ADD/EDIT RELATIONSHIP */}
                {isRelationModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <Card className="bg-card border border-border rounded-none w-full max-w-md p-6 shadow-xl relative animate-in zoom-in duration-300">
                            <div className="flex items-center justify-between border-b pb-1.5">
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-primary" /> {editingRelationshipId ? "Edit Relationship" : "Add Relationship"}
                                </h3>
                                <button onClick={() => { setIsRelationModalOpen(false); setEditingRelationshipId(null); }} className="text-muted-foreground hover:text-foreground text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleSaveRelationship} className="space-y-4 -mt-1">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Character *</Label>
                                    <Select value={relationTargetId} onValueChange={setRelationTargetId} required disabled={!!editingRelationshipId}>
                                        <SelectTrigger className="bg-card/50 h-10 w-full rounded-none">
                                            <SelectValue placeholder="Select target character" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            {editingRelationshipId ? (
                                                // If editing, show all characters so we can display the correct active name
                                                initialCharacters.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))
                                            ) : eligibleCharacters.length > 0 ? (
                                                eligibleCharacters.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No eligible characters</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
 
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Relationship Type *</Label>
                                    <Select value={relationType} onValueChange={setRelationType}>
                                        <SelectTrigger className="bg-card/50 h-10 w-full rounded-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            <SelectItem value="Parent of">Parent of</SelectItem>
                                            <SelectItem value="Child of">Child of</SelectItem>
                                            <SelectItem value="Sibling of">Sibling of</SelectItem>
                                            <SelectItem value="Spouse of">Spouse of</SelectItem>
                                            <SelectItem value="Friend of">Friend of</SelectItem>
                                            <SelectItem value="Rival of">Rival of</SelectItem>
                                            <SelectItem value="Enemy of">Enemy of</SelectItem>
                                            <SelectItem value="Mentor of">Mentor of</SelectItem>
                                            <SelectItem value="Apprentice of">Apprentice of</SelectItem>
                                            <SelectItem value="custom">Custom Type...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
 
                                {relationType === "custom" && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Relationship Type *</Label>
                                        <Input
                                            placeholder="e.g. Secret Admirer, Arch-nemesis"
                                            value={customRelationType}
                                            onChange={(e) => setCustomRelationType(e.target.value)}
                                            required
                                            className="h-10 bg-card/50 rounded-none"
                                        />
                                    </div>
                                )}
 
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => { setIsRelationModalOpen(false); setEditingRelationshipId(null); }} disabled={isRelationSaving} className="rounded-none">
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isRelationSaving || !relationTargetId || (relationType === "custom" && !customRelationType)} className="rounded-none">
                                        {isRelationSaving ? "Saving..." : (editingRelationshipId ? "Save Changes" : "Add Relation")}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* MODAL: LINK TIMELINE EVENT */}
                {isAppearanceModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <Card className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in zoom-in duration-300">
                            <div className="flex items-center justify-between border-b pb-1.5">
                                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" /> Link Timeline Event
                                </h3>
                                <button onClick={() => setIsAppearanceModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleAddAppearance} className="space-y-4 -mt-1">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline Event *</Label>
                                    <Select value={appEventId} onValueChange={setAppEventId} required>
                                        <SelectTrigger className="bg-card/50 h-10 w-full">
                                            <SelectValue placeholder="Select timeline event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleEvents.length > 0 ? (
                                                eligibleEvents.map(e => {
                                                    const engine = new CalendarEngine(toCalendarConfig(e.calendar));
                                                    return (
                                                        <SelectItem key={e.id} value={e.id}>
                                                            {e.title} ({engine.formatDate(e.startDate)})
                                                        </SelectItem>
                                                    );
                                                })
                                            ) : (
                                                <SelectItem value="none" disabled>No eligible events found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Character's Role *</Label>
                                    <Select value={appRole} onValueChange={setAppRole}>
                                        <SelectTrigger className="bg-card/50 h-10 w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Born">Born</SelectItem>
                                            <SelectItem value="Died">Died</SelectItem>
                                            <SelectItem value="Fought">Fought</SelectItem>
                                            <SelectItem value="Met">Met</SelectItem>
                                            <SelectItem value="Present">Present</SelectItem>
                                            <SelectItem value="custom">Custom Role...</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {appRole === "custom" && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Role *</Label>
                                        <Input
                                            placeholder="e.g. Escaped, Initiated"
                                            value={customAppRole}
                                            onChange={(e) => setCustomAppRole(e.target.value)}
                                            required
                                            className="h-10 bg-card/50"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Involved Character (Optional)</Label>
                                    <Select value={appTargetCharId} onValueChange={setAppTargetCharId}>
                                        <SelectTrigger className="bg-card/50 h-10 w-full">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {initialCharacters
                                                .filter(c => c.id !== activeChar?.id)
                                                .map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Appearance Description (Optional)</Label>
                                    <Textarea
                                        placeholder="Add extra context on their participation or context..."
                                        value={appDescription}
                                        onChange={(e) => setAppDescription(e.target.value)}
                                        className="bg-card/50 min-h-[80px] resize-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAppearanceModalOpen(false)} disabled={isAppSaving}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isAppSaving || !appEventId || (appRole === "custom" && !customAppRole)}>
                                        {isAppSaving ? "Saving..." : "Link Event"}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

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
                    {filteredCharacters.map((char) => {
                        const display = getDisplayState(char);
                        return (
                            <Card
                                key={char.id}
                                onClick={() => handleViewDetail(char)}
                                className="cursor-pointer group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border bg-card/60 backdrop-blur-sm py-0 gap-0"
                            >
                                <div className="aspect-[4/5] w-full bg-muted flex items-center justify-center relative overflow-hidden">
                                    {display.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={display.avatarUrl}
                                            alt={display.name}
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <User className="h-20 w-20 text-muted-foreground opacity-30" />
                                    )}

                                    {char.story && (
                                        <div className="absolute top-2 left-2 z-10 rounded-full bg-background/80 backdrop-blur-md border border-border px-2.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
                                            {char.story.title}
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg bg-background/80 backdrop-blur-md border border-white/20">
                                                    <MoreHorizontal className="h-4 w-4" />
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

                                    {/* Snapshot label pill — bottom-left of image */}
                                    {display.isSnapshot && (
                                        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/20 px-2 py-0.5 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
                                            <ShieldAlert className="h-2.5 w-2.5 text-primary shrink-0" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary truncate max-w-[120px]">{display.snapshotLabel}</span>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-end p-4 flex-col justify-end pointer-events-none">
                                        <p className="text-white text-[10px] font-semibold uppercase tracking-wider mb-0.5 opacity-80">{display.occupation || display.species || "Unknown"}</p>
                                        <h3 className="text-white text-lg font-bold truncate">{display.name}</h3>
                                    </div>
                                </div>

                                <CardContent className="p-3 flex flex-col gap-1.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                                            {display.name}
                                        </h3>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-90 shrink-0">
                                            {display.role || "Character"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span className="truncate">
                                            {display.species}{display.species && display.occupation && " • "}{display.occupation}
                                        </span>
                                        {display.age && <span className="shrink-0">{display.age} yrs</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

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

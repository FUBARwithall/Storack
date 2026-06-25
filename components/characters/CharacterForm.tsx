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
import { DEFAULT_CALENDAR } from "@/lib/calendar-engine";

interface CharacterFormProps {
    worldId: string;
    storyId?: string;
    stories?: any[];
    character?: any;
    locations?: any[];
    calendars?: any[];
    onSave: () => void;
    onCancel: () => void;
}

export function CharacterForm({ worldId, storyId, stories = [], character, locations = [], calendars = [], onSave, onCancel }: CharacterFormProps) {
    const [name, setName] = useState(character?.name || "");
    const [role, setRole] = useState(character?.role || "Supporting");
    const [avatarUrl, setAvatarUrl] = useState(character?.avatarUrl || "");
    const [age, setAge] = useState(character?.age || "");
    const [gender, setGender] = useState(character?.gender || "");
    const [genderSelectMode, setGenderSelectMode] = useState<"select" | "custom">(
        character?.gender === "Male" || character?.gender === "Female" || !character?.gender ? "select" : "custom"
    );
    const [species, setSpecies] = useState(character?.species || "");
    const [occupation, setOccupation] = useState(character?.occupation || "");
    const [personality, setPersonality] = useState(character?.personality || "");
    const [backstory, setBackstory] = useState(character?.backstory || "");
    const [selectedStoryId, setSelectedStoryId] = useState(character?.storyId || storyId || "none");

    const [height, setHeight] = useState(character?.height || "");
    const [weight, setWeight] = useState(character?.weight || "");
    const [birthplaceId, setBirthplaceId] = useState(character?.birthplaceId || "none");

    const [birthYear, setBirthYear] = useState<string>(character?.birthdate?.year?.toString() || "");
    const [birthMonth, setBirthMonth] = useState<string>(character?.birthdate?.monthIndex?.toString() || "0");
    const [birthDay, setBirthDay] = useState<string>(character?.birthdate?.day?.toString() || "");

    const [deathYear, setDeathYear] = useState<string>(character?.deathdate?.year?.toString() || "");
    const [deathMonth, setDeathMonth] = useState<string>(character?.deathdate?.monthIndex?.toString() || "0");
    const [deathDay, setDeathDay] = useState<string>(character?.deathdate?.day?.toString() || "");

    const [calendarId, setCalendarId] = useState<string>(
        character?.birthdate?.calendarId || character?.deathdate?.calendarId || calendars[0]?.id || "none"
    );

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
            setGenderSelectMode(
                character.gender === "Male" || character.gender === "Female" || !character.gender ? "select" : "custom"
            );
            setSpecies(character.species || "");
            setOccupation(character.occupation || "");
            setPersonality(character.personality || "");
            setBackstory(character.backstory || "");
            setSelectedStoryId(character.storyId || "none");
            setHeight(character.height || "");
            setWeight(character.weight || "");
            setBirthplaceId(character.birthplaceId || "none");
            setBirthYear(character.birthdate?.year?.toString() || "");
            setBirthMonth(character.birthdate?.monthIndex?.toString() || "0");
            setBirthDay(character.birthdate?.day?.toString() || "");
            setDeathYear(character.deathdate?.year?.toString() || "");
            setDeathMonth(character.deathdate?.monthIndex?.toString() || "0");
            setDeathDay(character.deathdate?.day?.toString() || "");
            setCalendarId(character.birthdate?.calendarId || character.deathdate?.calendarId || calendars[0]?.id || "none");
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

        const birthdateObj = birthYear ? {
            year: parseInt(birthYear) || 1,
            monthIndex: parseInt(birthMonth) || 0,
            day: parseInt(birthDay) || 1,
            calendarId: calendarId !== "none" ? calendarId : undefined
        } : null;

        const deathdateObj = deathYear ? {
            year: parseInt(deathYear) || 1,
            monthIndex: parseInt(deathMonth) || 0,
            day: parseInt(deathDay) || 1,
            calendarId: calendarId !== "none" ? calendarId : undefined
        } : null;

        const data = {
            name, role, avatarUrl, age, gender, species, occupation, personality, backstory,
            storyId: selectedStoryId === "none" ? null : selectedStoryId,
            height: height || null,
            weight: weight || null,
            birthplaceId: birthplaceId === "none" ? null : birthplaceId,
            birthdate: birthdateObj,
            deathdate: deathdateObj
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
            <CardHeader className="px-0 pt-0 pb-4 border-b flex flex-row items-center gap-4">
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
            <CardContent className="px-0 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
                        {/* Left Column: Avatar Section */}
                        <div className="lg:col-span-5 flex flex-col gap-2">
                            <div
                                className="flex-1 min-h-[220px] rounded-3xl p-4 bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarUrl ? (
                                    <>
                                        <img src={avatarUrl} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
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
                                        <Upload className="h-10 w-10" />
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

                        {/* Right Column: Form Fields */}
                        <div className="lg:col-span-7 space-y-2.5">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Name :</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Kaelen Vance"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="story" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Story :</Label>
                                    <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                                        <SelectTrigger id="story" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
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

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Role :</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger id="role" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
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
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Age :</Label>
                                    <Input id="age" placeholder="e.g. 24" value={age} onChange={(e) => setAge(e.target.value)} className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                </div>

                                <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-x-6">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="height" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Height :</Label>
                                        <Input id="height" placeholder="e.g. 175 cm" value={height} onChange={(e) => setHeight(e.target.value)} className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="weight" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Weight :</Label>
                                        <Input id="weight" placeholder="e.g. 68 kg" value={weight} onChange={(e) => setWeight(e.target.value)} className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="species" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Species :</Label>
                                    <Input id="species" placeholder="e.g. Human" value={species} onChange={(e) => setSpecies(e.target.value)} className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Gender :</Label>
                                    {genderSelectMode === "select" ? (
                                        <Select 
                                            value={gender === "Male" || gender === "Female" ? gender : (gender ? "Custom" : "none")} 
                                            onValueChange={(val) => {
                                                if (val === "Custom") {
                                                    setGenderSelectMode("custom");
                                                    setGender("");
                                                } else if (val === "none") {
                                                    setGender("");
                                                } else {
                                                    setGender(val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger id="gender" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
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
                                                id="gender"
                                                placeholder="Type custom gender"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50"
                                            />
                                            <Button 
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setGenderSelectMode("select");
                                                    setGender("");
                                                }}
                                                className="h-7 w-7 p-0 rounded-full hover:bg-muted"
                                                title="Back to dropdown"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="occupation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Occupation :</Label>
                                    <Input id="occupation" placeholder="e.g. Knight" value={occupation} onChange={(e) => setOccupation(e.target.value)} className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="birthplace" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Birthplace :</Label>
                                    <Select value={birthplaceId} onValueChange={setBirthplaceId}>
                                        <SelectTrigger id="birthplace" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                            <SelectValue placeholder="Unknown / Unset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unknown / Unset</SelectItem>
                                            {locations.map((loc: any) => (
                                                <SelectItem key={loc.id} value={loc.id}>
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Line 6: Calendar System Select */}
                            <div className="flex items-center gap-2">
                                <Label htmlFor="calendar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Calendar System :</Label>
                                <Select value={calendarId} onValueChange={setCalendarId}>
                                    <SelectTrigger id="calendar" className="flex-1 h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                        <SelectValue placeholder="Select a calendar system" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {calendars.length === 0 ? (
                                            <SelectItem value="none">Standard Earth Calendar (Default)</SelectItem>
                                        ) : (
                                            calendars.map((cal: any) => (
                                                <SelectItem key={cal.id} value={cal.id}>
                                                    {cal.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Line 7 & 8: Birth Date & Death Date Pickers (Separate Lines) */}
                            {(() => {
                                const activeCalendar = calendars?.find((c: any) => c.id === calendarId) || calendars?.[0];
                                const activeConfig = activeCalendar ? { ...activeCalendar, ...(activeCalendar.config ?? {}) } : DEFAULT_CALENDAR;
                                const months = activeConfig?.months || [];
                                return (
                                    <div className="flex flex-col gap-2.5">
                                        {/* Birthdate Custom Picker */}
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Birth Date :</Label>
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <Input id="birth-day" type="number" min={1} placeholder="Day" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                                <Select value={birthMonth} onValueChange={setBirthMonth}>
                                                    <SelectTrigger id="birth-month" className="w-full h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m: any, idx: number) => (
                                                            <SelectItem key={idx} value={idx.toString()}>
                                                                {m.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input id="birth-year" type="number" placeholder="Year" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                            </div>
                                        </div>

                                        {/* Deathdate Custom Picker */}
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Death Date :</Label>
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <Input id="death-day" type="number" min={1} placeholder="Day" value={deathDay} onChange={(e) => setDeathDay(e.target.value)} className="h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                                <Select value={deathMonth} onValueChange={setDeathMonth}>
                                                    <SelectTrigger id="death-month" className="w-full h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus:ring-0 focus:border-primary rounded-none !bg-transparent dark:!bg-transparent dark:hover:!bg-transparent px-1 shadow-none transition-all">
                                                        <SelectValue placeholder="Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m: any, idx: number) => (
                                                            <SelectItem key={idx} value={idx.toString()}>
                                                                {m.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input id="death-year" type="number" placeholder="Year" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} className="h-9 border-x-0 border-t-0 border-b border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none !bg-transparent dark:!bg-transparent px-1 shadow-none transition-all placeholder:text-muted-foreground/50" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-muted/30">
                        <div className="space-y-2">
                            <Label htmlFor="personality" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Personality & Traits</Label>
                            <Textarea
                                id="personality"
                                placeholder="Stoic, brave but impulsive..."
                                value={personality}
                                onChange={(e) => setPersonality(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="backstory" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backstory & Lore</Label>
                            <Textarea
                                id="backstory"
                                placeholder="Where did they come from?"
                                value={backstory}
                                onChange={(e) => setBackstory(e.target.value)}
                                className="min-h-[160px] resize-none"
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

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    ArrowLeft,
    FileText,
    Plus,
    MoreVertical,
    Clock
} from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCalendars, getStoryById } from "@/lib/actions";
import { CalendarWidget } from "@/components/world/CalendarWidget";
import { formatRelativeTime } from "@/lib/types";
import { prisma } from "@/lib/db";
import { CharactersClient } from "@/app/characters/CharactersClient";
import { WorldClient } from "@/app/world/WorldClient";
import { StorySettings } from "./StorySettings";
import { ChapterListClient } from "./ChapterListClient";
import { NotesVaultClient } from "./NotesVaultClient";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const story = await getStoryById(id);

    if (!story) {
        notFound();
    }

    const world = await prisma.world.findUnique({
        where: { id: story.worldId }
    });

    if (!world) {
        notFound();
    }

    const calendars = await getCalendars(story.worldId);

    const characters = await prisma.character.findMany({
        where: { storyId: id },
        include: {
            story: true,
            birthplace: {
                select: {
                    id: true,
                    name: true
                }
            },
            relationships: {
                include: {
                    target: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            relatedTo: {
                include: {
                    character: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            appearances: {
                include: {
                    event: {
                        include: {
                            calendar: true
                        }
                    },
                    targetCharacter: {
                        select: { id: true, name: true, avatarUrl: true }
                    }
                }
            },
            snapshots: {
                include: {
                    event: {
                        include: {
                            calendar: true
                        }
                    },
                    chapter: true,
                    birthplace: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    const events = await prisma.timelineEvent.findMany({
        where: { worldId: story.worldId },
        include: {
            calendar: true
        },
        orderBy: { title: 'asc' }
    });

    const worldLocations = await prisma.location.findMany({
        where: { worldId: story.worldId },
        orderBy: { name: 'asc' }
    });

    const locations = (await prisma.location.findMany({
        where: { storyId: id },
        orderBy: { name: 'asc' }
    })).map(loc => ({ ...loc, type: loc.type || 'Location' }));

    const factions = await prisma.organization.findMany({
        where: { storyId: id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const lores = await prisma.lore.findMany({
        where: { storyId: id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const systems = await prisma.worldSystem.findMany({
        where: { storyId: id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const objects = await prisma.worldObject.findMany({
        where: { storyId: id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header Section */}
            <div className="px-3 py-4 sm:px-8 sm:py-6">
                <div className="mb-3 sm:mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground transition-all hover:text-foreground active:scale-[0.98] active:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>

                <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-stretch gap-4 sm:gap-6">
                        <div className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md border group relative transition-transform active:scale-[0.98]">
                            <img
                                src={story.coverImage || "https://images.unsplash.com/photo-1543004218-ee141104975e?q=80&w=1974&auto=format&fit=crop"}
                                alt={story.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            {story.genre && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1">
                                    <p className="text-xs text-white text-center font-medium truncate uppercase tracking-wider">{story.genre}</p>
                                </div>
                            )}
                            <Badge
                                variant={story.status === 'Completed' ? 'default' : 'secondary'}
                                className="absolute right-1.5 top-1.5 px-2 py-0.5 text-[10px] shadow-sm"
                            >
                                {story.status}
                            </Badge>
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                            <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                                <h1 className="max-w-full break-words text-2xl font-bold text-foreground tracking-tight leading-tight sm:text-3xl">{story.title}</h1>
                            </div>

                            {story.synopsis && (
                                <div className="mt-1 max-w-2xl">
                                    <p className="break-words text-sm text-muted-foreground/90 leading-relaxed line-clamp-2">
                                        {story.synopsis}
                                    </p>
                                </div>
                            )}

                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                {story.tags.length > 0 ? (
                                    story.tags.map(tag => (
                                        <span key={tag} className="text-xs font-medium text-muted-foreground">
                                            #{tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No tags added</span>
                                )}
                            </div>

                            <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default">
                                    <FileText className="h-3.5 w-3.5 shrink-0" />
                                    <span className="break-words">{story.wordCount.toLocaleString()} words</span>
                                </div>
                                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    <span className="break-words">Last edited {formatRelativeTime(story.lastEdited)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="flex flex-col gap-3 w-full sm:w-40 shrink-0">
                        <Link href={`/stories/${id}/editor/new`} className="w-full">
                            <Button size="sm" className="w-full shadow-sm active:scale-[0.98]">
                                <Plus className="mr-2 h-4 w-4" /> New Chapter
                            </Button>
                        </Link>
                        <StorySettings story={story} className="w-full shadow-sm active:scale-[0.98]" />
                    </div>
                </div>
            </div>


            {/* Main Content with Tabs */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <div className="border-y bg-background/50 backdrop-blur-sm sticky top-0 z-10 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-8">
                    <TabsList className="bg-transparent h-auto w-max min-w-max p-0 gap-2 rounded-none border-b-0">
                        <TabsTrigger
                            value="overview"
                            className="shrink-0 rounded-none border-none h-12 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none py-0 px-4 sm:px-5 font-semibold transition-all active:scale-[0.97] active:bg-primary/15"
                            style={{ border: 'none' }}
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="characters"
                            className="shrink-0 rounded-none border-none h-12 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none py-0 px-4 sm:px-5 font-semibold transition-all active:scale-[0.97] active:bg-primary/15"
                            style={{ border: 'none' }}
                        >
                            Characters
                        </TabsTrigger>
                        <TabsTrigger
                            value="world"
                            className="shrink-0 rounded-none border-none h-12 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none py-0 px-4 sm:px-5 font-semibold transition-all active:scale-[0.97] active:bg-primary/15"
                            style={{ border: 'none' }}
                        >
                            World
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="shrink-0 rounded-none border-none h-12 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none py-0 px-4 sm:px-5 font-semibold transition-all active:scale-[0.97] active:bg-primary/15"
                            style={{ border: 'none' }}
                        >
                            Notes
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="shrink-0 rounded-none border-none h-12 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none py-0 px-4 sm:px-5 font-semibold transition-all active:scale-[0.97] active:bg-primary/15"
                            style={{ border: 'none' }}
                        >
                            Timeline
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 bg-muted/30">
                    <TabsContent value="overview" className="m-0 p-4 sm:py-5 sm:px-8">
                        <div className="w-full space-y-8">
                            {/* Chapters Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
                                    <div className="flex items-center gap-4">
                                        <Link href={`/stories/${id}/editor/new`}>
                                            <Button variant="outline" size="sm" className="active:scale-[0.98]">
                                                <Plus className="mr-2 h-4 w-4" /> New Chapter
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                 <div className="space-y-3">
                                     <ChapterListClient chapters={story.chapters} storyId={story.id} />
                                 </div>
                            </section>
                        </div>
                    </TabsContent>

                    <TabsContent value="characters" className="m-0">
                        <CharactersClient
                            initialCharacters={characters as any}
                            worldId={story.worldId}
                            storyId={id}
                            stories={[story]}
                            events={events as any}
                            chapters={story.chapters}
                            locations={worldLocations}
                            calendars={calendars}
                        />
                    </TabsContent>
                    <TabsContent value="world" className="m-0">
                        <WorldClient
                            initialCharacters={characters}
                            initialLocations={locations}
                            initialFactions={factions}
                            initialLores={lores}
                            initialSystems={systems}
                            initialObjects={objects}
                            world={{ id: world.id, name: world.name, description: world.description }}
                            storyId={id}
                            stories={[story]}
                            calendars={calendars}
                        />
                    </TabsContent>
                    <TabsContent value="timeline" className="m-0 p-4 sm:py-5 sm:px-8">
                        <div className="max-w-5xl mx-auto">
                            <CalendarWidget
                                chapters={story.chapters}
                                worldId={story.worldId}
                                initialCalendars={calendars}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="notes" className="m-0 p-4 sm:py-5 sm:px-8">
                        <NotesVaultClient notes={(story as any).notes || []} storyId={story.id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

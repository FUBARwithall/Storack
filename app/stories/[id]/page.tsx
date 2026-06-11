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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const story = await getStoryById(id);

    if (!story) {
        notFound();
    }

    const calendars = await getCalendars(story.worldId);

    const characters = await prisma.character.findMany({
        where: { worldId: story.worldId },
        orderBy: { name: 'asc' }
    });

    const locations = await prisma.location.findMany({
        where: { worldId: story.worldId },
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
                    <div className="grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] gap-2 sm:flex sm:items-start sm:gap-6">
                        <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md border group relative transition-transform active:scale-[0.98] sm:h-32 sm:w-24">
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
                                className="absolute right-1.5 top-1.5 px-2 py-0.5 text-[10px] shadow-sm sm:hidden"
                            >
                                {story.status}
                            </Badge>
                        </div>

                        <div className="min-w-0 self-start">
                            <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:gap-3">
                                <h1 className="max-w-full break-words text-2xl font-bold text-foreground tracking-tight leading-tight sm:text-3xl">{story.title}</h1>
                                <Badge variant={story.status === 'Completed' ? 'default' : 'secondary'} className="hidden px-2.5 py-0.5 shrink-0 sm:inline-flex">
                                    {story.status}
                                </Badge>
                            </div>

                            {story.synopsis && (
                                <div className="mt-2 max-w-2xl sm:mt-3">
                                    <p className="break-words text-sm text-muted-foreground/90 leading-relaxed sm:line-clamp-2 sm:hover:line-clamp-none transition-all cursor-pointer italic">
                                        &ldquo;{story.synopsis}&rdquo;
                                    </p>
                                </div>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                                {story.tags.length > 0 ? (
                                    story.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="max-w-full break-all bg-secondary/30 border-secondary/50 text-xs font-normal">
                                            #{tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No tags added</span>
                                )}
                            </div>

                            <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:mt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
                                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="break-words">{story.wordCount.toLocaleString()} words</span>
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span className="break-words">Last edited {formatRelativeTime(story.lastEdited)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <StorySettings story={story} />
                        <Link href={`/stories/${id}/editor/new`} className="w-full sm:w-auto">
                            <Button size="sm" className="w-full shadow-sm active:scale-[0.98] sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> New Chapter
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>


            {/* Main Content with Tabs */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <div className="border-y bg-background/50 backdrop-blur-sm sticky top-0 z-10 overflow-x-auto px-4 sm:px-8">
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
                    <TabsContent value="overview" className="m-0 p-4 sm:p-8">
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
                                    {story.chapters.length > 0 ? (
                                        story.chapters.sort((a, b) => a.order - b.order).map((chapter) => (
                                            <Card key={chapter.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99] active:border-primary/50 active:bg-primary/5 bg-card border-border">
                                                <CardContent className="flex items-center justify-between p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                            {chapter.order}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors font-serif text-base">
                                                                <Link href={`/stories/${story.id}/editor/${chapter.id}`} className="hover:underline">
                                                                    {chapter.title}
                                                                </Link>
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground mt-0.5 font-body">
                                                                {chapter.wordCount.toLocaleString()} words • Last edited {formatRelativeTime(chapter.lastEdited)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Badge
                                                            variant={chapter.status === 'Completed' ? 'default' : 'outline'}
                                                            className={cn(
                                                                chapter.status === 'Editing' && "border-primary/50 text-primary bg-primary/5 font-semibold"
                                                            )}
                                                        >
                                                            {chapter.status}
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 active:scale-90 active:bg-muted">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 bg-background/50">
                                            <div className="rounded-full bg-muted p-4 mb-4">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">Write your first chapter</h3>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">Every great adventure begins with a single word. Start yours today.</p>
                                            <div className="mt-8">
                                                <Link href={`/stories/${id}/editor/new`}>
                                                    <Button>
                                                        <Plus className="mr-2 h-4 w-4" /> Create Chapter
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </TabsContent>

                    <TabsContent value="characters" className="m-0">
                        <CharactersClient
                            initialCharacters={characters}
                            worldId={story.worldId}
                        />
                    </TabsContent>
                    <TabsContent value="world" className="m-0">
                        <WorldClient
                            initialCharacters={characters}
                            initialLocations={locations}
                            worldId={story.worldId}
                        />
                    </TabsContent>
                    <TabsContent value="timeline" className="m-0 p-4 sm:p-8">
                        <div className="max-w-5xl mx-auto">
                            <CalendarWidget
                                chapters={story.chapters}
                                worldId={story.worldId}
                                initialCalendars={calendars}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="notes" className="m-0 p-4 sm:p-8">
                        <div className="text-center py-20">
                            <h2 className="text-xl font-semibold">Research & Notes</h2>
                            <p className="text-muted-foreground mt-2">Notes system coming soon.</p>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

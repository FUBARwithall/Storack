import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    ArrowLeft,
    Settings,
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
import { getOrCreateDefaultWorld, getCalendars, getStoryById } from "@/lib/actions";
import { CalendarWidget } from "@/components/world/CalendarWidget";
import { formatRelativeTime } from "@/lib/types";
import { prisma } from "@/lib/db";
import { CharactersClient } from "@/app/characters/CharactersClient";
import { WorldClient } from "@/app/world/WorldClient";
import { StorySettings } from "./StorySettings";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Data
    const story = await getStoryById(id);
    const world = await getOrCreateDefaultWorld();
    const calendars = await getCalendars(world.id);

    const characters = await prisma.character.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    const locations = await prisma.location.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    if (!story) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header Section */}
            <div className="border-b px-8 py-6">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md border group relative">
                            <img
                                src={story.coverImage || "https://images.unsplash.com/photo-1543004218-ee141104975e?q=80&w=1974&auto=format&fit=crop"}
                                alt={story.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            {story.genre && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1">
                                    <p className="text-[10px] text-white text-center font-medium truncate uppercase tracking-wider">{story.genre}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-3 text-wrap max-w-2xl">
                                <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">{story.title}</h1>
                                <Badge variant={story.status === 'Completed' ? 'default' : 'secondary'} className="px-2.5 py-0.5 shrink-0">
                                    {story.status}
                                </Badge>
                            </div>

                            {story.synopsis && (
                                <div className="mt-3 max-w-2xl">
                                    <p className="text-sm text-muted-foreground/90 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-pointer italic">
                                        "{story.synopsis}"
                                    </p>
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                {story.tags.length > 0 ? (
                                    story.tags.map(tag => (
                                        <Badge key={tag} variant="outline" className="bg-secondary/30 border-secondary/50 text-xs font-normal">
                                            #{tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No tags added</span>
                                )}
                            </div>

                            <div className="mt-1 flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                                    <FileText className="h-4 w-4" />
                                    <span>{story.wordCount.toLocaleString()} words</span>
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
                                    <Clock className="h-4 w-4" />
                                    <span>Last edited {formatRelativeTime(story.lastEdited)}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <StorySettings story={story} />
                        <Link href={`/stories/${id}/editor/new`}>
                            <Button size="sm" className="shadow-sm">
                                <Plus className="mr-2 h-4 w-4" /> New Chapter
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>


            {/* Main Content with Tabs */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <div className="px-8 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <TabsList className="bg-transparent h-auto p-0 gap-2 rounded-none border-b-0">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-4 font-medium transition-all"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="characters"
                            className="rounded-none border-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-4 font-medium transition-all"
                        >
                            Characters
                        </TabsTrigger>
                        <TabsTrigger
                            value="world"
                            className="rounded-none border-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-4 font-medium transition-all"
                        >
                            World
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="rounded-none border-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-4 font-medium transition-all"
                        >
                            Notes
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="rounded-none border-0 data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-4 font-medium transition-all"
                        >
                            Timeline
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 bg-muted/30">
                    <TabsContent value="overview" className="m-0 p-8">
                        <div className="w-full space-y-8">
                            {/* Chapters Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-foreground">Chapters</h2>
                                    <div className="flex items-center gap-4">
                                        <Link href={`/stories/${id}/editor/new`}>
                                            <Button variant="outline" size="sm">
                                                <Plus className="mr-2 h-4 w-4" /> New Chapter
                                            </Button>
                                        </Link>
                                    </div>
                                </div>



                                <div className="space-y-3">
                                    {story.chapters.length > 0 ? (
                                        story.chapters.sort((a, b) => a.order - b.order).map((chapter) => (
                                            <Card key={chapter.id} className="group hover:border-primary/50 transition-all hover:shadow-sm">
                                                <CardContent className="flex items-center justify-between p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                            {chapter.order}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                <Link href={`/stories/${story.id}/editor/${chapter.id}`} className="hover:underline">
                                                                    {chapter.title}
                                                                </Link>
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {chapter.wordCount.toLocaleString()} words • Last edited {formatRelativeTime(chapter.lastEdited)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <Badge
                                                            variant={chapter.status === 'Completed' ? 'default' : 'outline'}
                                                            className={cn(
                                                                chapter.status === 'Editing' && "border-yellow-500/50 text-yellow-600 bg-yellow-500/5 dark:text-yellow-400"
                                                            )}
                                                        >
                                                            {chapter.status}
                                                        </Badge>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            worldId={world.id}
                        />
                    </TabsContent>
                    <TabsContent value="world" className="m-0">
                        <WorldClient
                            initialCharacters={characters}
                            initialLocations={locations}
                            worldId={world.id}
                        />
                    </TabsContent>
                    <TabsContent value="timeline" className="m-0 p-8">
                        <div className="max-w-5xl mx-auto">
                            <CalendarWidget
                                chapters={story.chapters}
                                worldId={world.id}
                                initialCalendars={calendars}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="notes" className="m-0 p-8">
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

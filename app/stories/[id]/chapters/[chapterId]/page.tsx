import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Users, FileText, Clock, ChevronRight } from "lucide-react";
import { getChapterById, getStoryById } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/types";

export default async function ChapterHubPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
    const { id, chapterId } = await params;

    const story = await getStoryById(id);
    if (!story) {
        notFound();
    }

    const chapter = await getChapterById(chapterId);
    if (!chapter || chapter.storyId !== story.id) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header / Breadcrumb */}
            <div className="px-4 pt-6 pb-0 sm:px-8 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <Link href={`/stories/${story.id}`} className="inline-flex items-center text-sm text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {story.title}
                    </Link>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-muted px-2.5 py-1 rounded-md">
                                Chapter {chapter.order}
                            </span>
                            <Badge variant={chapter.status === 'Completed' ? 'default' : 'outline'}>
                                {chapter.status}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold font-serif text-foreground mt-2 tracking-tight">
                            {chapter.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2 font-medium">
                            <div className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4" />
                                <span>{chapter.wordCount.toLocaleString()} words</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>Last edited {formatRelativeTime(chapter.lastEdited)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Options */}
            <div className="px-4 pt-6 pb-6 sm:px-8 max-w-5xl mx-auto w-full space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Write & Edit Card */}
                    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 bg-card border-border p-5 flex flex-col gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold font-sans">Write & Edit</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Open the full-screen interactive editor to write your story, format text, and insert pictures.
                            </CardDescription>
                        </div>
                        <Link href={`/stories/${story.id}/editor/${chapter.id}`} className="block w-full mt-2">
                            <Button className="w-full justify-between active:scale-[0.98]">
                                Open Editor <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </Card>

                    {/* Cast & Setting Card */}
                    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 bg-card border-border p-5 flex flex-col gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold font-sans">Cast & Setting</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Tag characters, locations, factions, lore, objects, and other elements featured in this chapter.
                            </CardDescription>
                        </div>
                        <Link href={`/stories/${story.id}/chapters/${chapter.id}/cast`} className="block w-full mt-2">
                            <Button variant="outline" className="w-full justify-between active:scale-[0.98] group-hover:border-primary group-hover:text-primary transition-colors">
                                Manage Cast & Setting <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </Card>
                </div>

                {/* Featured Elements Section */}
                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        Featured in this Chapter
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                            {((chapter as any).characters?.length || 0) + ((chapter as any).locations?.length || 0)} total
                        </span>
                    </h2>

                    {(!((chapter as any).characters?.length) && !((chapter as any).locations?.length)) ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed text-center">
                            <Users className="h-8 w-8 text-muted-foreground opacity-40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No cast members or locations tagged yet.</p>
                            <p className="text-xs text-muted-foreground/85 mt-1">Tag them in the Cast & Setting menu to track character appearances.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Characters Sub-section */}
                            {((chapter as any).characters?.length || 0) > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        Characters ({((chapter as any).characters?.length || 0)})
                                    </h3>
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                        {(chapter as any).characters.map((char: any) => (
                                            <div key={char.id} className="flex items-center gap-2.5 p-2 rounded-lg border bg-card/50">
                                                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-muted border flex items-center justify-center">
                                                    {char.avatarUrl ? (
                                                        <img src={char.avatarUrl} alt={char.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-muted-foreground opacity-60">
                                                            {char.name[0]?.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold truncate leading-none text-foreground">{char.name}</p>
                                                    {char.role && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate">{char.role}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Locations/World Entries Sub-section */}
                            {((chapter as any).locations?.length || 0) > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                        Locations & World Entries ({((chapter as any).locations?.length || 0)})
                                    </h3>
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                        {(chapter as any).locations.map((loc: any) => (
                                            <div key={loc.id} className="flex items-center gap-2.5 p-2 rounded-lg border bg-card/50">
                                                <div className="h-8 w-8 rounded-md overflow-hidden shrink-0 bg-muted border flex items-center justify-center">
                                                    {loc.imageUrl ? (
                                                        <img src={loc.imageUrl} alt={loc.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-muted-foreground opacity-60">
                                                            {loc.name[0]?.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold truncate leading-none text-foreground">{loc.name}</p>
                                                    {loc.type && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate">{loc.type}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

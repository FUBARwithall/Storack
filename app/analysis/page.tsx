import Link from "next/link";
import {
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock,
    Database,
    Feather,
    FileText,
    Map,
    PenLine,
    Plus,
    ScrollText,
    Sparkles,
    Trophy,
    Users,
} from "lucide-react";
import { getOrCreateDefaultWorld, getStories } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type StatusName = "Draft" | "Editing" | "Completed";

const statusOrder: StatusName[] = ["Draft", "Editing", "Completed"];

function percent(value: number, total: number) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

function formatNumber(value: number) {
    return value.toLocaleString("en-US");
}

function getMonthKey(date: Date | string) {
    const parsed = new Date(date);
    return parsed.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export default async function AnalysisPage() {
    const [world, session] = await Promise.all([
        getOrCreateDefaultWorld(),
        getSession(),
    ]);

    const [stories, characterCount, locationCount, calendarCount, eventCount] = await Promise.all([
        getStories(world.id),
        prisma.character.count({ where: { worldId: world.id } }),
        prisma.location.count({ where: { worldId: world.id } }),
        prisma.calendar.count({ where: { worldId: world.id } }),
        prisma.timelineEvent.count({ where: { worldId: world.id } }),
    ]);

    const chapters = stories.flatMap((story) =>
        story.chapters.map((chapter) => ({
            ...chapter,
            storyTitle: story.title,
            storyId: story.id,
        }))
    );

    const totalWords = stories.reduce((sum, story) => sum + story.wordCount, 0);
    const totalChapters = chapters.length;
    const completedStories = stories.filter((story) => story.status === "Completed").length;
    const activeStories = stories.filter((story) => story.status !== "Completed").length;
    const averageWordsPerStory = stories.length > 0 ? Math.round(totalWords / stories.length) : 0;
    const averageWordsPerChapter = totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0;
    const completionRate = percent(completedStories, stories.length);
    const manuscriptDepth = percent(totalChapters, Math.max(stories.length * 8, 1));

    const statusCounts = statusOrder.map((status) => ({
        status,
        count: stories.filter((story) => story.status === status).length,
    }));

    const genreCounts = stories.reduce<Record<string, number>>((acc, story) => {
        const genre = story.genre || "Unspecified";
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
    }, {});

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5);

    const topStory = [...stories].sort((a, b) => b.wordCount - a.wordCount)[0] ?? null;
    const longestChapter = [...chapters].sort((a, b) => b.wordCount - a.wordCount)[0] ?? null;
    const recentChapters = [...chapters]
        .sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime())
        .slice(0, 5);

    const monthBuckets = chapters.reduce<Record<string, number>>((acc, chapter) => {
        const key = getMonthKey(chapter.lastEdited);
        acc[key] = (acc[key] || 0) + chapter.wordCount;
        return acc;
    }, {});

    const monthlyActivity = Object.entries(monthBuckets).slice(-6);
    const maxMonthlyWords = Math.max(...monthlyActivity.map(([, words]) => words), 1);

    return (
        <div className="min-h-full bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklch,var(--primary)_7%,var(--background))_48%,var(--background)_100%)]">
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                <header className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_45%)] md:block" />
                    <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_22rem] md:p-8">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                                <Sparkles className="h-3.5 w-3.5" />
                                Story Observatory
                            </div>
                            <div>
                                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
                                    {session?.user?.username || "Writer"}&apos;s creative ledger
                                </h1>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                                    A studio view of your manuscripts, worlds, and writing momentum.
                                    Track what is growing, what is finished, and where the next chapter wants attention.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/stories/new">
                                    <Button className="shadow-sm">
                                        <Plus className="mr-2 h-4 w-4" /> Start a New Draft
                                    </Button>
                                </Link>
                                {topStory && (
                                    <Link href={`/stories/${topStory.id}`}>
                                        <Button variant="outline">
                                            <Feather className="mr-2 h-4 w-4" /> Return to Top Draft
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background/80 p-5 shadow-sm backdrop-blur">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manuscript Pulse</p>
                                    <p className="mt-3 text-5xl font-bold font-serif text-primary">{completionRate}%</p>
                                </div>
                                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <BarChart3 className="h-7 w-7" />
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {completedStories} completed stories, {activeStories} still in motion.
                            </p>
                            <div className="mt-5 space-y-2">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>Draft depth</span>
                                    <span>{manuscriptDepth}%</span>
                                </div>
                                <Progress value={manuscriptDepth} className="h-3 bg-primary/10" />
                            </div>
                        </div>
                    </div>
                </header>

                <section className="rounded-xl border bg-card/80 px-5 py-4 shadow-sm">
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <StatRibbon title="Ink on the Page" value={formatNumber(totalWords)} detail={`${formatNumber(averageWordsPerStory)} avg/story`} icon={FileText} />
                        <StatRibbon title="Manuscripts" value={formatNumber(stories.length)} detail={`${activeStories} active projects`} icon={BookOpen} />
                        <StatRibbon title="Chapters Forged" value={formatNumber(totalChapters)} detail={`${formatNumber(averageWordsPerChapter)} avg/chapter`} icon={ScrollText} />
                        <StatRibbon title="World Lore" value={formatNumber(characterCount + locationCount + eventCount)} detail={`${characterCount} characters, ${locationCount} locations`} icon={Database} />
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="overflow-hidden rounded-xl border bg-card/95 shadow-sm">
                        <div className="grid min-h-[28rem] md:grid-cols-[15rem_1fr]">
                            <aside className="border-b bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_16%,var(--card)),var(--card))] p-6 md:border-b-0 md:border-r">
                                <div className="sticky top-6 space-y-6">
                                    <div>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <PenLine className="h-6 w-6" />
                                        </div>
                                        <h2 className="mt-4 text-3xl font-bold font-serif leading-tight">Story Arc</h2>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            How your projects move from first spark to finished manuscript.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-6xl font-bold font-serif text-primary">{completionRate}%</p>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Complete</p>
                                    </div>
                                </div>
                            </aside>
                            <div className="space-y-8 p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <Badge variant="outline" className="bg-background/70 text-sm">
                                        {completedStories} of {stories.length} complete
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{activeStories} projects still in motion</span>
                                </div>
                                <Progress value={completionRate} className="h-4 bg-primary/10" />
                                <div className="space-y-5">
                                    {statusCounts.map((item) => (
                                        <div key={item.status} className="grid gap-3 border-b pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[8rem_1fr_5rem] sm:items-center">
                                            <div>
                                                <p className="font-semibold">{item.status}</p>
                                                <p className="text-xs text-muted-foreground">{percent(item.count, stories.length)}% of library</p>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-primary/10">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${percent(item.count, stories.length)}%` }} />
                                            </div>
                                            <p className="text-3xl font-bold font-serif text-primary sm:text-right">{item.count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card/80 p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold font-serif">World Atlas</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">Lore scaffolding under your fiction.</p>
                            </div>
                            <Map className="h-6 w-6 text-primary" />
                        </div>
                        <div className="mt-8 space-y-6">
                            <WorldLine icon={Users} label="Cast Members" value={characterCount} />
                            <WorldLine icon={Map} label="Places Charted" value={locationCount} />
                            <WorldLine icon={CalendarDays} label="Calendars" value={calendarCount} />
                            <WorldLine icon={CheckCircle2} label="Timeline Beats" value={eventCount} />
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-card/95 shadow-sm">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="border-b p-6 lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-primary" />
                                <h2 className="text-3xl font-bold font-serif">Featured Manuscript</h2>
                            </div>
                            {topStory ? (
                                <div className="mt-8 space-y-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Largest Draft</p>
                                        <Link href={`/stories/${topStory.id}`} className="mt-2 block text-4xl font-bold font-serif leading-tight hover:text-primary">
                                            {topStory.title}
                                        </Link>
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {topStory.genre || "No genre"} - {topStory.chapters.length} chapters - {topStory.status}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-8 gap-y-4 border-y py-5">
                                        <InlineStat label="Words written" value={formatNumber(topStory.wordCount)} />
                                        {longestChapter && <InlineStat label="Longest chapter" value={`${formatNumber(longestChapter.wordCount)} words`} />}
                                    </div>
                                    {longestChapter && (
                                        <Link href={`/stories/${longestChapter.storyId}/editor/${longestChapter.id}`} className="group block">
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Longest Chapter</p>
                                            <p className="mt-1 text-lg font-semibold group-hover:text-primary">{longestChapter.title}</p>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <EmptyText>Create a story to see your featured manuscript.</EmptyText>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h2 className="text-3xl font-bold font-serif">Genre Shelf</h2>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">The shelves your imagination keeps returning to.</p>
                            <div className="mt-8 space-y-5">
                            {topGenres.length > 0 ? (
                                topGenres.map(([genre, count], index) => (
                                    <div key={genre} className="grid grid-cols-[2rem_1fr_auto] items-center gap-4">
                                        <span className="font-bold text-primary">{index + 1}</span>
                                        <div>
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="font-semibold">{genre}</span>
                                                <span className="text-muted-foreground">{count}</span>
                                            </div>
                                            <Progress value={percent(count, stories.length)} className="mt-2 h-2 bg-primary/10" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">stories</span>
                                    </div>
                                ))
                            ) : (
                                <EmptyText>No stories yet.</EmptyText>
                            )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border bg-card/90 p-6 shadow-sm">
                    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                        <div>
                            <div className="flex items-center gap-3">
                                <Feather className="h-5 w-5 text-primary" />
                                <h2 className="text-3xl font-bold font-serif">Writing Log</h2>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">The latest chapters touched across your library.</p>
                            <div className="mt-6 space-y-1">
                            {recentChapters.length > 0 ? (
                                recentChapters.map((chapter, index) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/stories/${chapter.storyId}/editor/${chapter.id}`}
                                        className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b py-4 last:border-b-0"
                                    >
                                        <span className="font-bold text-primary">{index + 1}</span>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold group-hover:text-primary">{chapter.title}</p>
                                            <p className="truncate text-sm text-muted-foreground">{chapter.storyTitle}</p>
                                        </div>
                                        <span className="shrink-0 text-sm font-bold text-muted-foreground">
                                            {formatNumber(chapter.wordCount)}
                                        </span>
                                    </Link>
                                ))
                            ) : (
                                <EmptyText>No chapter activity yet.</EmptyText>
                            )}
                            </div>
                        </div>

                        <div className="lg:border-l lg:pl-8">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <h2 className="text-3xl font-bold font-serif">Writing Rhythm</h2>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Chapter word totals grouped by last edit month.</p>
                            <div className="mt-8 flex h-72 items-end gap-3 border-b border-l px-3 pb-3">
                            {monthlyActivity.length > 0 ? (
                                monthlyActivity.map(([month, words]) => (
                                    <div key={month} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                                        <div className="flex h-56 w-full items-end">
                                            <div
                                                className="w-full rounded-t-md bg-[linear-gradient(180deg,var(--primary),color-mix(in_oklch,var(--primary)_45%,var(--background)))]"
                                                style={{ height: `${Math.max(percent(words, maxMonthlyWords), 8)}%` }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold">{month}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatNumber(words)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyText>Write chapters to build activity history.</EmptyText>
                            )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatRibbon({
    title,
    value,
    detail,
    icon: Icon,
}: {
    title: string;
    value: string;
    detail: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="flex items-center gap-4 border-b pb-5 last:border-b-0 last:pb-0 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5 sm:last:border-r-0 sm:last:pr-0 xl:border-r">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                <p className="mt-1 text-3xl font-bold font-serif">{value}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
        </div>
    );
}

function WorldLine({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-b pb-5 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-xl font-bold font-serif">{formatNumber(value)}</span>
        </div>
    );
}

function InlineStat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold font-serif">{value}</p>
        </div>
    );
}

function EmptyText({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed bg-background/60 p-8 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}

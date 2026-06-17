import { StoryCard } from "@/app/components/ui/StoryCard";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, Feather, ArrowRight, Zap, Check, Book, Users, Calendar } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrCreateDefaultWorld, getStories } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function Home() {
  const world = await getOrCreateDefaultWorld();
  const stories = await getStories(world.id);
  const session = await getSession();
  const username = session?.user?.username || "Writer";
  const renderTime = new Date();

  const [characterCount, locationCount, eventCount] = await Promise.all([
    prisma.character.count({ where: { worldId: world.id } }),
    prisma.location.count({ where: { worldId: world.id } }),
    prisma.timelineEvent.count({ where: { worldId: world.id } }),
  ]);

  const completionRate = Math.round(
    (((stories.length > 0 ? 1 : 0) +
      (characterCount > 0 ? 1 : 0) +
      (locationCount > 0 ? 1 : 0) +
      (eventCount > 0 ? 1 : 0)) /
      4) *
      100
  );

  const totalWords = stories.reduce((acc, story) => acc + story.wordCount, 0);
  const activeProjects = stories.filter(s => s.status !== 'Completed').length;
  const lastEdited = stories[0] ?? null;

  // Simple relative time helper (server-side)
  function timeAgo(date: Date | string, now: Date) {
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="p-8 space-y-5 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative pb-4 border-b">
        <div className="relative z-10 flex flex-col md:flex-row md:items-stretch justify-between gap-3 md:gap-6">

          {/* Left: greeting + stats */}
          <div className="space-y-2 md:space-y-3 flex-1">
            <h1 className="text-3xl font-bold font-serif text-foreground mt-1">
              Good morning, {username}.
            </h1>
            <p className="text-xs md:text-sm text-foreground/65 leading-relaxed font-body max-w-xl">
              Currently mapping <strong className="text-foreground font-semibold font-serif">{characterCount}</strong> character{characterCount === 1 ? "" : "s"}, <strong className="text-foreground font-semibold font-serif">{locationCount}</strong> location{locationCount === 1 ? "" : "s"}, and <strong className="text-foreground font-semibold font-serif">{eventCount}</strong> timeline event{eventCount === 1 ? "" : "s"} in <span className="text-primary font-semibold font-serif">{world.name}</span>.
            </p>
            <div className="flex flex-col gap-1 pt-0.5 md:pt-1 text-xs font-semibold text-foreground/70 font-body">
              <span className="flex items-center gap-1.5">Words Written: <strong className="text-foreground font-serif">{totalWords.toLocaleString()}</strong></span>
              <span className="flex items-center gap-1.5">Active Projects: <strong className="text-foreground font-serif">{activeProjects}</strong></span>
            </div>
          </div>

          {/* Right: last edited + quick actions */}
          <div className="flex flex-col gap-2 md:gap-2.5 md:min-w-[220px] md:max-w-[240px] md:border-l md:border-border md:pl-5 justify-center">
            {lastEdited ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-primary/50 uppercase">Last Edited</p>
                <Link
                  href={`/stories/${lastEdited.id}`}
                  className="group flex items-start gap-1.5 hover:text-primary transition-colors"
                >
                  <Feather className="h-3.5 w-3.5 mt-0.5 text-primary/50 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary leading-tight font-serif line-clamp-1">{lastEdited.title}</p>
                    <p className="text-xs text-foreground/45 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />{timeAgo(lastEdited.updatedAt, renderTime)}
                    </p>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold tracking-widest text-primary/50 uppercase">Get Started</p>
                <p className="text-xs text-foreground/45">No stories yet — create your first.</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {lastEdited && (
                <Link href={`/stories/${lastEdited.id}`}>
                  <Button size="sm" className="w-full justify-start gap-2 h-8 text-xs shadow-sm shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
                    <ArrowRight className="h-3.5 w-3.5" /> Continue Writing
                  </Button>
                </Link>
              )}
              <Link href="/stories/new">
                <Button size="sm" variant="outline" className="w-full justify-start gap-2 h-8 text-xs border-border hover:border-primary/40">
                  <Plus className="h-3.5 w-3.5" /> New Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground font-serif">Recent Projects</h2>
          <Link href="/stories" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Universe Progress Onboarding Checklist */}
            {stories.length < 3 && (
              <Link href="/world" className="h-full block">
                <Card className="group overflow-hidden hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 border-border bg-card flex flex-col h-full py-0 gap-0">
                  <div className="relative h-44 w-full bg-gradient-to-br from-primary/30 to-purple-600/10 overflow-hidden border-b border-border flex flex-col items-center justify-center">
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 text-foreground border border-border/40 text-xs px-2 py-0.5">
                        Setup
                      </Badge>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 96 96">
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-secondary/20"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 38}
                          strokeDashoffset={2 * Math.PI * 38 * (1 - completionRate / 100)}
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-bold font-serif text-foreground">{completionRate}%</span>
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="text-foreground border-border bg-background/80 backdrop-blur-sm text-xs px-2 py-0.5">
                        Universe Progress
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 pt-3 pb-3 flex-1 flex flex-col justify-start gap-2.5">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug font-serif">
                      Complete these steps to outline your world.
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2.5 text-xs">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center border shrink-0", stories.length > 0 ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/30")}>
                          {stories.length > 0 && <Check className="h-2 w-2 stroke-[3]" />}
                        </div>
                        <span className={cn("font-medium text-xs", stories.length > 0 ? "text-foreground/50 line-through" : "text-foreground/85")}>Create your first Story</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-xs">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center border shrink-0", characterCount > 0 ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/30")}>
                          {characterCount > 0 && <Check className="h-2 w-2 stroke-[3]" />}
                        </div>
                        <span className={cn("font-medium text-xs", characterCount > 0 ? "text-foreground/50 line-through" : "text-foreground/85")}>Add a Character</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-xs">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center border shrink-0", locationCount > 0 ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/30")}>
                          {locationCount > 0 && <Check className="h-2 w-2 stroke-[3]" />}
                        </div>
                        <span className={cn("font-medium text-xs", locationCount > 0 ? "text-foreground/50 line-through" : "text-foreground/85")}>Map a Location</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-xs">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center border shrink-0", eventCount > 0 ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/30")}>
                          {eventCount > 0 && <Check className="h-2 w-2 stroke-[3]" />}
                        </div>
                        <span className={cn("font-medium text-xs", eventCount > 0 ? "text-foreground/50 line-through" : "text-foreground/85")}>Create a Timeline Event</span>
                      </li>
                    </ul>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-col gap-2 items-stretch mt-auto">
                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground/80 font-bold tracking-tight">
                      <span className="flex items-center gap-1.5"><Book size={13} className="text-primary/70" /> {stories.length} {stories.length === 1 ? "story" : "stories"}</span>
                      <span className="flex items-center gap-1.5"><Users size={13} className="text-primary/70" /> {characterCount} char{characterCount === 1 ? "" : "s"}</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary/70" /> {eventCount} event{eventCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            )}

            {[...stories].reverse().map(story => (
              <StoryCard key={story.id} story={story} />
            ))}

            <Link href="/stories/new" className="h-full block">
              <Card className="group relative overflow-hidden bg-transparent border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center justify-center p-6 rounded-2xl min-h-[280px]">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 to-transparent pointer-events-none" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border group-hover:border-primary/50 bg-secondary/60 text-muted-foreground mb-3.5 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="relative text-base font-bold text-foreground group-hover:text-primary font-serif leading-tight">New Manuscript</h3>
                <p className="relative text-xs text-foreground/50 mt-1 text-center font-body max-w-[160px] leading-relaxed">
                  Build a new universe from scratch.
                </p>
                <div className="relative mt-3.5 flex items-center gap-1.5 text-[10px] font-semibold text-primary/40 group-hover:text-primary/70 transition-colors">
                  <Zap className="h-3 w-3" /> Start writing in seconds
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 bg-background/50">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No stories yet</h3>
            <p className="text-sm text-foreground/60 mt-1 max-w-xs text-center">Start your writing journey by creating your first story.</p>
            <div className="mt-8">
              <Link href="/stories/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create First Story
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

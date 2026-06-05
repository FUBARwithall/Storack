import { StoryCard } from "@/app/components/ui/StoryCard";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Clock, Target } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { getOrCreateDefaultWorld, getStories } from "@/lib/actions";

export default async function Home() {
  const world = await getOrCreateDefaultWorld();
  const stories = await getStories(world.id);

  const totalWords = stories.reduce((acc, story) => acc + story.wordCount, 0);
  const activeProjects = stories.filter(s => s.status !== 'Completed').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, get ready to write.</p>
        </div>
        <Link href="/stories/new">
          <Button size="lg" className="shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-5 w-5" /> New Story Project
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Words Written</p>
              <p className="text-2xl font-bold text-foreground">{totalWords.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold text-foreground">{activeProjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stories</p>
              <p className="text-2xl font-bold text-foreground">{stories.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Projects</h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}

            <Link href="/stories/new">
              <Card className="group flex flex-col items-center justify-center border-dashed bg-transparent p-6 hover:border-sidebar-primary hover:bg-sidebar-accent/5 transition-all h-full min-h-[300px] cursor-pointer">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-foreground group-hover:text-primary">Create New Story</h3>
                <p className="text-sm text-muted-foreground mt-1">Start a new adventure</p>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 bg-background/50">
            <div className="rounded-full bg-muted p-4 mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No stories yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">Start your writing journey by creating your first story.</p>
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

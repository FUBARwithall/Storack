import { StoryCard } from "@/app/components/ui/StoryCard";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getOrCreateDefaultWorld, getStories } from "@/lib/actions";

export default async function StoriesPage() {
    const world = await getOrCreateDefaultWorld();
    const stories = await getStories(world.id);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Stories</h1>
                    <p className="text-muted-foreground mt-1">Manage all your writing projects based on your preferences.</p>
                </div>
                <Link href="/stories/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Story
                    </Button>
                </Link>
            </header>

            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        type="text"
                        placeholder="Search stories..."
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="all-genres">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Genre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-genres">All Genres</SelectItem>
                            <SelectItem value="Fantasy">Fantasy</SelectItem>
                            <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                            <SelectItem value="Thriller">Thriller</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select defaultValue="all-statuses">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-statuses">All Statuses</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Editing">Editing</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="w-10 px-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {stories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map(story => (
                        <StoryCard key={story.id} story={story} />
                    ))}
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
        </div>
    );
}

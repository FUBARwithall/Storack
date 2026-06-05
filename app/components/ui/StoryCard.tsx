import Link from 'next/link';
import { Story, formatRelativeTime } from '@/lib/types';
import { Clock, Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge";

interface StoryCardProps {
    story: Story;
    className?: string;
}

export function StoryCard({ story, className }: StoryCardProps) {
    return (
        <Link href={`/stories/${story.id}`}>
            <Card className={cn("group overflow-hidden hover:shadow-md transition-all hover:-translate-y-1", className)}>
                <div className="relative h-48 w-full bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                    {story.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={story.coverImage} alt={story.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                            <Book size={64} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-black/40 text-white hover:bg-black/60 border-none px-2 py-0.5">
                            {story.status}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-5">
                    {story.genre && (
                        <div className="mb-2">
                            <Badge variant="outline" className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10">
                                {story.genre}
                            </Badge>
                        </div>
                    )}

                    <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {story.title}
                    </h3>

                    {story.synopsis && (
                        <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                            {story.synopsis}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="p-5 pt-0 flex flex-col gap-3 items-stretch">
                    <div className="flex items-center justify-between border-t pt-3 text-xs text-gray-400 dark:border-zinc-800">
                        <span className="flex items-center gap-1.5"><Book size={12} /> {story.wordCount.toLocaleString()} words</span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} /> {formatRelativeTime(story.lastEdited)}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

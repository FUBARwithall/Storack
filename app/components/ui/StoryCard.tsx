import Link from 'next/link';
import { Story } from '@/lib/types';
import { Clock, Book, PenLine } from 'lucide-react';
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

function formatDate(dateInput: string | Date) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

export function StoryCard({ story, className }: StoryCardProps) {
    return (
        <Link href={`/stories/${story.id}`} className="h-full block">
            <Card className={cn("group overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 border-border bg-card flex flex-col h-full py-0 gap-0", className)}>
                <div className="relative h-40 w-full bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden border-b border-border">
                    {story.coverImage ? (
                        <img src={story.coverImage} alt={story.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-white/20">
                            <Book size={48} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-black/50 text-white hover:bg-black/60 border-none text-[10px] px-1.5 py-0.5">
                            {story.status}
                        </Badge>
                    </div>
                    {/* Genre badge over the image near bottom-left */}
                    {story.genre && (
                        <div className="absolute bottom-2 left-2">
                            <Badge variant="outline" className="text-white border-white/20 bg-black/40 backdrop-blur-sm text-[10px] px-1.5 py-0.5">
                                {story.genre}
                            </Badge>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 pt-2.5 pb-2.5 flex-1">
                    <h3 className="mb-1 text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {story.title}
                    </h3>

                    {story.synopsis && (
                        <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400/80 leading-normal">
                            {story.synopsis}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex flex-col gap-2 items-stretch mt-auto">
                    <div className="flex items-center justify-between border-t pt-2.5 text-[11px] text-muted-foreground dark:border-zinc-800">
                        <span className="flex items-center gap-1"><Book size={10} /> {story.wordCount.toLocaleString()} words</span>
                        <span className="flex items-center gap-1"><PenLine size={10} /> {story.chapters.length} ch.</span>
                        <span className="flex items-center gap-1">
                            <Clock size={10} /> {formatDate(story.lastEdited)}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

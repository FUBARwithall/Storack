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
            <Card className={cn("group overflow-hidden hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 border-border bg-card flex flex-col h-full py-0 gap-0", className)}>
                <div className="relative h-36 w-full bg-gradient-to-br from-primary/30 to-purple-600/10 overflow-hidden border-b border-border">
                    {story.coverImage ? (
                        <img src={story.coverImage} alt={story.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/30">
                            <Book size={48} className="stroke-[1.5]" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 text-foreground border border-border/40 text-xs px-2 py-0.5">
                            {story.status}
                        </Badge>
                    </div>
                    {story.genre && (
                        <div className="absolute bottom-2 left-2">
                            <Badge variant="outline" className="text-foreground border-border bg-background/80 backdrop-blur-sm text-xs px-2 py-0.5">
                                {story.genre}
                            </Badge>
                        </div>
                    )}
                </div>

                <CardContent className="p-4 pt-3 pb-3 flex-1 flex flex-col justify-start">
                    <h3 className="mb-1 text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug font-serif">
                        {story.title}
                    </h3>

                    {story.synopsis && (
                        <p className="line-clamp-2 text-sm text-muted-foreground leading-normal font-body italic">
                            "{story.synopsis}"
                        </p>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex flex-col gap-2 items-stretch mt-auto">
                    <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground/80 font-bold tracking-tight">
                        <span className="flex items-center gap-1.5"><Book size={13} className="text-primary/70" /> {story.wordCount.toLocaleString()} words</span>
                        <span className="flex items-center gap-1.5"><PenLine size={13} className="text-primary/70" /> {story.chapters.length} ch.</span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary/70" /> {formatDate(story.lastEdited)}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}

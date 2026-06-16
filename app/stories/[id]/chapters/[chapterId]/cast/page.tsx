import { notFound } from "next/navigation";
import { getChapterById, getStoryById } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { CastClient } from "@/app/stories/[id]/chapters/[chapterId]/cast/CastClient";

export default async function ChapterCastPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
    const { id, chapterId } = await params;

    const story = await getStoryById(id);
    if (!story) {
        notFound();
    }

    const chapter = await getChapterById(chapterId);
    if (!chapter || chapter.storyId !== story.id) {
        notFound();
    }

    // Only fetch characters/locations linked to this story
    const availableCharacters = await prisma.character.findMany({
        where: { storyId: story.id },
        orderBy: { name: 'asc' }
    });

    const availableLocations = (await prisma.location.findMany({
        where: { storyId: story.id },
        orderBy: { name: 'asc' }
    })).map(loc => ({ ...loc, type: 'Location' }));

    return (
        <CastClient
            story={story}
            chapter={chapter}
            availableCharacters={availableCharacters}
            availableLocations={availableLocations}
        />
    );
}

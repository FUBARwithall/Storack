import { notFound } from "next/navigation";
import { getChapterById, getStoryById } from "@/lib/actions";
import { EditorClient } from "./EditorClient";

type EditorChapter = Parameters<typeof EditorClient>[0]["chapter"] & {
    storyId?: string | null;
    worldId?: string;
};

export default async function EditorPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
    const { id, chapterId } = await params;

    const story = await getStoryById(id);

    if (!story) {
        notFound();
    }

    const isNewChapter = chapterId === 'new';
    let chapter: EditorChapter | null;

    if (isNewChapter) {
        chapter = {
            id: 'new',
            title: 'Untitled Chapter',
            wordCount: 0,
            status: 'Draft',
            order: story.chapters.length + 1,
            content: "",
            storyId: story.id,
            worldId: story.worldId
        };
    } else {
        chapter = await getChapterById(chapterId);
    }

    if (!chapter || chapter.storyId !== story.id) {
        notFound();
    }

    return (
        <EditorClient
            story={{
                id: story.id,
                title: story.title,
                worldId: story.worldId,
                chapters: story.chapters
            }}
            chapter={chapter}
        />
    );
}


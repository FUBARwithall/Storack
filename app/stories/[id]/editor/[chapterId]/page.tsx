import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Save, Settings, MoreVertical, Bold, Italic, Underline, List, AlignLeft, Image as ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getChapterById, getStoryById, getOrCreateDefaultWorld } from "@/lib/actions";
import { EditorClient } from "./EditorClient";

export default async function EditorPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
    const { id, chapterId } = await params;

    const story = await getStoryById(id);
    const world = await getOrCreateDefaultWorld();

    if (!story) {
        notFound();
    }

    const isNewChapter = chapterId === 'new';
    let chapter;

    if (isNewChapter) {
        chapter = {
            id: 'new',
            title: 'Untitled Chapter',
            wordCount: 0,
            status: 'Draft',
            lastEdited: new Date(),
            order: story.chapters.length + 1,
            content: ""
        };
    } else {
        chapter = await getChapterById(chapterId);
    }

    if (!chapter) {
        notFound();
    }

    return (
        <EditorClient
            story={{
                id: story.id,
                title: story.title,
                worldId: world.id,
                chapters: story.chapters
            }}
            chapter={chapter as any}
        />
    );
}


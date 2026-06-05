export type StoryStatus = 'Draft' | 'Editing' | 'Completed';

export interface Chapter {
    id: string;
    title: string;
    wordCount: number;
    status: string;
    lastEdited: Date | string;
    order: number;
}

export interface Story {
    id: string;
    title: string;
    genre: string | null;
    synopsis: string | null;
    status: string;
    wordCount: number;
    lastEdited: Date | string;
    coverImage?: string | null;
    tags: string[];
    chapters: Chapter[];
}

export interface Character {
    id: string;
    name: string;
    role: 'Protagonist' | 'Antagonist' | 'Supporting' | 'Minor';
    archetype?: string;
    description: string;
    storyId: string;
    projectTitle: string;
    imageUrl?: string;
}

export interface WorldItem {
    id: string;
    name: string;
    type: 'Location' | 'Faction' | 'Object' | 'Lore' | 'Magic System';
    description: string;
    storyId: string;
    projectTitle: string;
    imageUrl?: string;
}

// Helper function to format dates
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
}


"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CalendarConfig, CustomDate } from "./calendar-engine";
import { getSession } from "./auth";
import fs from "node:fs/promises";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";


// --- World ---
export async function getOrCreateDefaultWorld(userId?: string) {
    let finalUserId = userId;

    if (!finalUserId) {
        const session = await getSession();
        finalUserId = session?.user?.id as string | undefined;
    }

    if (!finalUserId) throw new Error("No user found");

    const world = await prisma.world.findFirst({
        where: { userId: finalUserId },
    });

    if (world) return world;

    return await prisma.world.create({
        data: {
            name: "My World",
            description: "A world created for you.",
            userId: finalUserId,
        },
    });
}

// --- Calendars ---
export async function getCalendars(worldId: string) {
    const calendars = await prisma.calendar.findMany({
        where: { worldId },
        orderBy: { createdAt: "asc" },
    });

    return calendars.map((cal: { id: string; name: string; config: any; worldId: string; currentDate: any; createdAt: Date; updatedAt: Date }) => ({
        ...cal,
        // Ensure the JSON config matches our CalendarConfig interface
        // We merge the stored config with the id/name from the row
        ...(cal.config as any),
        id: cal.id,
        name: cal.name,
    })) as CalendarConfig[];
}

export async function createCalendar(worldId: string, config: CalendarConfig) {
    // Extract config fields to store in JSON
    const configData = {
        months: config.months,
        weekDays: config.weekDays,
        yearSuffix: config.yearSuffix,
        hasLeapYear: config.hasLeapYear,
        leapYearInterval: config.leapYearInterval,
        leapYearMonthIndex: config.leapYearMonthIndex,
        hoursInDay: config.hoursInDay || 24,
        minutesInHour: config.minutesInHour || 60,
        recurringEvents: config.recurringEvents || [],
    };

    const newCal = await prisma.calendar.create({
        data: {
            worldId,
            name: config.name,
            config: configData as any,
            currentDate: { year: 1, monthIndex: 0, day: 1 }, // Default start
        },
    });

    revalidatePath("/world");

    return {
        ...newCal,
        ...(newCal.config as any),
        id: newCal.id,
        name: newCal.name
    } as CalendarConfig;
}

export async function deleteCalendar(id: string) {
    await prisma.calendar.delete({ where: { id } });
    revalidatePath("/world");
}

// --- Events ---
export async function getEvents(calendarId: string) {
    const events = await prisma.timelineEvent.findMany({
        where: { calendarId },
        orderBy: { startDate: "asc" }, // Needs raw query or post-sort for JSON JSON? No, Prisma supports basic JSON filter but not deep sort easily. Let's fetch all and sort in client or here.
    });

    // Create a helper to sort if needed, but for now return raw
    return events.map((e: { id: string; title: string; description: string | null; startDate: any; endDate: any; duration: number; chapterId: string | null; worldId: string; calendarId: string; createdAt: Date; updatedAt: Date }) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        startDate: e.startDate as unknown as CustomDate,
        endDate: e.endDate as unknown as CustomDate,
        duration: e.duration,
        chapterId: e.chapterId || undefined
    }));
}

export async function createEvent(calendarId: string, worldId: string, event: { title: string, description?: string, startDate: CustomDate, endDate: CustomDate, duration: number, chapterId?: string }) {
    const newEvent = await prisma.timelineEvent.create({
        data: {
            calendarId,
            worldId,
            title: event.title,
            description: event.description,
            startDate: event.startDate as any,
            endDate: event.endDate as any,
            duration: event.duration,
            chapterId: event.chapterId === 'none' ? undefined : event.chapterId
        }
    });
    revalidatePath("/world");
    return newEvent;
}

// --- Stories ---
export async function getStories(worldId: string) {
    const stories = await prisma.story.findMany({
        where: { worldId },
        include: {
            chapters: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return stories.map(story => ({
        ...story,
        wordCount: story.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    }));
}

export async function getStoryById(id: string) {
    const story = await prisma.story.findUnique({
        where: { id },
        include: {
            chapters: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!story) return null;
    return {
        ...story,
        wordCount: story.chapters.reduce((sum, ch) => sum + ch.wordCount, 0)
    };
}

export async function getChapterById(id: string) {
    const chapter = await prisma.chapter.findUnique({
        where: { id },
    });
    return chapter;
}

export async function createStory(worldId: string, data: { title: string, genre?: string, synopsis?: string, tags?: string[], coverImage?: string }) {
    const story = await prisma.story.create({
        data: {
            worldId,
            title: data.title,
            genre: data.genre,
            synopsis: data.synopsis,
            tags: data.tags || [],
            coverImage: data.coverImage,
            status: 'Draft',
            wordCount: 0,
            lastEdited: new Date()
        }
    });

    revalidatePath("/");
    return story;
}

export async function updateStory(id: string, data: Partial<{ title: string, genre: string, synopsis: string, status: string, tags: string[], coverImage: string }>) {
    const story = await prisma.story.update({
        where: { id },
        data: {
            ...data,
            lastEdited: new Date()
        }
    });

    revalidatePath("/");
    revalidatePath(`/stories/${id}`);
    return story;
}

export async function deleteStory(id: string) {
    await prisma.story.delete({ where: { id } });
    revalidatePath("/");
}

// --- Chapters ---
export async function createChapter(storyId: string, worldId: string, data: { title: string, order: number }) {
    const chapter = await prisma.chapter.create({
        data: {
            storyId,
            worldId,
            title: data.title,
            order: data.order,
            status: 'Draft',
            wordCount: 0,
            lastEdited: new Date()
        }
    });

    revalidatePath(`/stories/${storyId}`);
    return chapter;
}

export async function updateChapter(id: string, data: Partial<{ title: string, content: string, status: string, wordCount: number }>) {
    const chapter = await prisma.chapter.update({
        where: { id },
        data: {
            ...data,
            lastEdited: new Date()
        }
    });

    const storyId = chapter.storyId;
    if (storyId) {
        const chapters = await prisma.chapter.findMany({
            where: { storyId }
        });
        const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

        await prisma.story.update({
            where: { id: storyId },
            data: {
                wordCount: totalWordCount,
                lastEdited: new Date()
            }
        });
    }

    revalidatePath("/");
    revalidatePath(`/stories/${storyId}`);
    return chapter;
}

export async function deleteChapter(id: string, storyId: string) {
    await prisma.chapter.delete({ where: { id } });

    const chapters = await prisma.chapter.findMany({
        where: { storyId }
    });
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    await prisma.story.update({
        where: { id: storyId },
        data: {
            wordCount: totalWordCount,
            lastEdited: new Date()
        }
    });

    revalidatePath(`/stories/${storyId}`);
    revalidatePath("/");
}
// --- Characters ---
export async function createCharacter(worldId: string, data: {
    name: string,
    role?: string,
    avatarUrl?: string,
    age?: string,
    gender?: string,
    species?: string,
    occupation?: string,
    personality?: string,
    backstory?: string
}) {
    const char = await prisma.character.create({
        data: {
            worldId,
            ...data
        }
    });
    revalidatePath("/characters");
    revalidatePath("/world");
    return char;
}

export async function updateCharacter(id: string, data: Partial<{
    name: string,
    role: string,
    avatarUrl: string,
    age: string,
    gender: string,
    species: string,
    occupation: string,
    personality: string,
    backstory: string
}>) {
    const char = await prisma.character.update({
        where: { id },
        data
    });
    revalidatePath("/characters");
    revalidatePath("/world");
    return char;
}

export async function deleteCharacter(id: string) {
    await prisma.character.delete({ where: { id } });
    revalidatePath("/characters");
    revalidatePath("/world");
}

// --- Locations ---
export async function createLocation(worldId: string, data: { name: string, type?: string, description?: string, mapUrl?: string, imageUrl?: string }) {
    const loc = await prisma.location.create({
        data: {
            worldId,
            name: data.name,
            type: data.type,
            description: data.description,
            mapUrl: data.mapUrl,
            imageUrl: data.imageUrl
        }
    });
    revalidatePath("/world");
    return loc;
}

export async function updateLocation(id: string, data: Partial<{ name: string, type: string, description: string, mapUrl: string, imageUrl: string }>) {
    const loc = await prisma.location.update({
        where: { id },
        data
    });
    revalidatePath("/world");
    return loc;
}

export async function deleteLocation(id: string) {
    await prisma.location.delete({ where: { id } });
    revalidatePath("/world");
}

export async function uploadStoryCover(id: string, formData: FormData) {
    const file = formData.get("coverImage") as File;
    if (!file) return { error: "No file uploaded" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `${id}-${Date.now()}${ext}`;

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    await prisma.story.update({
        where: { id },
        data: { coverImage: imageUrl }
    });

    revalidatePath("/");
    revalidatePath(`/stories/${id}`);

    return { success: true, imageUrl };
}

export async function uploadEditorImage(formData: FormData) {
    const file = formData.get("image") as File;
    if (!file) return { error: "No file uploaded" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `editor-${Date.now()}${ext}`;

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;
    return { success: true, imageUrl };
}


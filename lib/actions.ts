"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { CalendarConfig, CustomDate, DEFAULT_CALENDAR } from "./calendar-engine";
import { requireUserId } from "./auth";
import cloudinary from "@/lib/cloudinary";

async function requireOwnedWorld(worldId: string) {
    const userId = await requireUserId();
    const world = await prisma.world.findFirst({
        where: { id: worldId, userId },
    });

    if (!world) throw new Error("Not found");
    return world;
}

async function requireOwnedStory(storyId: string) {
    const userId = await requireUserId();
    const story = await prisma.story.findFirst({
        where: {
            id: storyId,
            world: { userId },
        },
    });

    if (!story) throw new Error("Not found");
    return story;
}

async function requireOwnedChapter(chapterId: string) {
    const userId = await requireUserId();
    const chapter = await prisma.chapter.findFirst({
        where: {
            id: chapterId,
            world: { userId },
        },
    });

    if (!chapter) throw new Error("Not found");
    return chapter;
}

async function requireOwnedCalendar(calendarId: string) {
    const userId = await requireUserId();
    const calendar = await prisma.calendar.findFirst({
        where: {
            id: calendarId,
            world: { userId },
        },
    });

    if (!calendar) throw new Error("Not found");
    return calendar;
}

async function requireOwnedCharacter(characterId: string) {
    const userId = await requireUserId();
    const character = await prisma.character.findFirst({
        where: {
            id: characterId,
            world: { userId },
        },
    });

    if (!character) throw new Error("Not found");
    return character;
}

async function requireOwnedLocation(locationId: string) {
    const userId = await requireUserId();
    const location = await prisma.location.findFirst({
        where: {
            id: locationId,
            world: { userId },
        },
    });

    if (!location) throw new Error("Not found");
    return location;
}


// --- World ---
export async function getOrCreateDefaultWorld() {
    const finalUserId = await requireUserId();

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
    await requireOwnedWorld(worldId);

    let calendars = await prisma.calendar.findMany({
        where: { worldId },
        orderBy: { createdAt: "asc" },
    });

    const gregorianCalendars = calendars.filter(cal => cal.name === DEFAULT_CALENDAR.name);
    if (gregorianCalendars.length > 1) {
        const toDelete = gregorianCalendars.slice(1);
        for (const cal of toDelete) {
            await prisma.calendar.delete({ where: { id: cal.id } });
        }
        calendars = await prisma.calendar.findMany({
            where: { worldId },
            orderBy: { createdAt: "asc" },
        });
    }

    const hasGregorian = calendars.some(cal => cal.name === DEFAULT_CALENDAR.name);
    if (!hasGregorian) {
        const configData = {
            months: DEFAULT_CALENDAR.months,
            weekDays: DEFAULT_CALENDAR.weekDays,
            yearSuffix: DEFAULT_CALENDAR.yearSuffix,
            hasLeapYear: DEFAULT_CALENDAR.hasLeapYear,
            leapYearInterval: DEFAULT_CALENDAR.leapYearInterval,
            leapYearMonthIndex: DEFAULT_CALENDAR.leapYearMonthIndex,
            hoursInDay: DEFAULT_CALENDAR.hoursInDay || 24,
            minutesInHour: DEFAULT_CALENDAR.minutesInHour || 60,
            recurringEvents: DEFAULT_CALENDAR.recurringEvents || [],
            isGregorian: DEFAULT_CALENDAR.isGregorian || false,
        };

        await prisma.calendar.create({
            data: {
                worldId,
                name: DEFAULT_CALENDAR.name,
                config: configData as unknown as Prisma.InputJsonValue,
                currentDate: { year: 1, monthIndex: 0, day: 1 },
            },
        });

        calendars = await prisma.calendar.findMany({
            where: { worldId },
            orderBy: { createdAt: "asc" },
        });
    }

    return calendars.map((cal) => ({
        ...cal,
        // Ensure the JSON config matches our CalendarConfig interface
        // We merge the stored config with the id/name from the row
        ...(cal.config as unknown as Omit<CalendarConfig, "id" | "name">),
        id: cal.id,
        name: cal.name,
    })) as CalendarConfig[];
}

export async function createCalendar(worldId: string, config: CalendarConfig) {
    await requireOwnedWorld(worldId);

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
        isGregorian: config.isGregorian || false,
    };

    const newCal = await prisma.calendar.create({
        data: {
            worldId,
            name: config.name,
            config: configData as unknown as Prisma.InputJsonValue,
            currentDate: { year: 1, monthIndex: 0, day: 1 }, // Default start
        },
    });

    revalidatePath("/world");

    return {
        ...newCal,
        ...(newCal.config as unknown as Omit<CalendarConfig, "id" | "name">),
        id: newCal.id,
        name: newCal.name
    } as CalendarConfig;
}

export async function deleteCalendar(id: string) {
    await requireOwnedCalendar(id);
    await prisma.calendar.delete({ where: { id } });
    revalidatePath("/world");
}

// --- Events ---
export async function getEvents(calendarId: string) {
    await requireOwnedCalendar(calendarId);

    const events = await prisma.timelineEvent.findMany({
        where: { calendarId },
        orderBy: { startDate: "asc" }, // Needs raw query or post-sort for JSON JSON? No, Prisma supports basic JSON filter but not deep sort easily. Let's fetch all and sort in client or here.
    });

    // Create a helper to sort if needed, but for now return raw
    return events.map((e) => ({
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
    const [calendar, world] = await Promise.all([
        requireOwnedCalendar(calendarId),
        requireOwnedWorld(worldId),
    ]);

    if (calendar.worldId !== world.id) throw new Error("Not found");

    if (event.chapterId && event.chapterId !== "none") {
        const chapter = await requireOwnedChapter(event.chapterId);
        if (chapter.worldId !== world.id) throw new Error("Not found");
    }

    const newEvent = await prisma.timelineEvent.create({
        data: {
            calendarId,
            worldId,
            title: event.title,
            description: event.description,
            startDate: event.startDate as unknown as Prisma.InputJsonValue,
            endDate: event.endDate as unknown as Prisma.InputJsonValue,
            duration: event.duration,
            chapterId: event.chapterId === 'none' ? undefined : event.chapterId
        }
    });
    revalidatePath("/world");
    return newEvent;
}

// --- Stories ---
export async function getStories(worldId: string) {
    await requireOwnedWorld(worldId);

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
    const userId = await requireUserId();
    const story = await prisma.story.findFirst({
        where: {
            id,
            world: { userId },
        },
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
    const userId = await requireUserId();
    const chapter = await prisma.chapter.findFirst({
        where: {
            id,
            world: { userId },
        },
    });
    return chapter;
}

export async function createStory(worldId: string, data: { title: string, genre?: string, synopsis?: string, tags?: string[], coverImage?: string }) {
    await requireOwnedWorld(worldId);

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
    await requireOwnedStory(id);

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
    await requireOwnedStory(id);
    await prisma.story.delete({ where: { id } });
    revalidatePath("/");
}

// --- Chapters ---
export async function createChapter(storyId: string, worldId: string, data: { title: string, order: number }) {
    const [story, world] = await Promise.all([
        requireOwnedStory(storyId),
        requireOwnedWorld(worldId),
    ]);

    if (story.worldId !== world.id) throw new Error("Not found");

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
    await requireOwnedChapter(id);

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
    const [chapter, story] = await Promise.all([
        requireOwnedChapter(id),
        requireOwnedStory(storyId),
    ]);

    if (chapter.storyId !== story.id) throw new Error("Not found");

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
    await requireOwnedWorld(worldId);

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
    await requireOwnedCharacter(id);

    const char = await prisma.character.update({
        where: { id },
        data
    });
    revalidatePath("/characters");
    revalidatePath("/world");
    return char;
}

export async function deleteCharacter(id: string) {
    await requireOwnedCharacter(id);
    await prisma.character.delete({ where: { id } });
    revalidatePath("/characters");
    revalidatePath("/world");
}

// --- Locations ---
export async function createLocation(worldId: string, data: { name: string, type?: string, description?: string, mapUrl?: string, imageUrl?: string }) {
    await requireOwnedWorld(worldId);

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
    await requireOwnedLocation(id);

    const loc = await prisma.location.update({
        where: { id },
        data
    });
    revalidatePath("/world");
    return loc;
}

export async function deleteLocation(id: string) {
    await requireOwnedLocation(id);
    await prisma.location.delete({ where: { id } });
    revalidatePath("/world");
}

export async function uploadStoryCover(id: string, formData: FormData) {
    await requireOwnedStory(id);

    const file = formData.get("coverImage") as File;
    if (!file) return { error: "No file uploaded" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
        folder: "storack/covers",
        public_id: `${id}-${Date.now()}`,
    });

    const imageUrl = result.secure_url;

    await prisma.story.update({
        where: { id },
        data: { coverImage: imageUrl }
    });

    revalidatePath("/");
    revalidatePath(`/stories/${id}`);

    return { success: true, imageUrl };
}

export async function uploadEditorImage(formData: FormData) {
    await requireUserId();

    const file = formData.get("image") as File;
    if (!file) return { error: "No file uploaded" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
        folder: "storack/editor",
    });

    return { success: true, imageUrl: result.secure_url };
}

export async function updateChapterDates(id: string, dates: CustomDate[]) {
    await requireOwnedChapter(id);

    const chapter = await prisma.chapter.update({
        where: { id },
        data: { date: dates as unknown as Prisma.InputJsonValue }
    });
    revalidatePath("/");
    const storyId = chapter.storyId;
    if (storyId) {
        revalidatePath(`/stories/${storyId}`);
    }
    return chapter;
}


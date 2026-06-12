"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";
import { CalendarConfig, CustomDate, DEFAULT_CALENDAR } from "./calendar-engine";
import { requireUserId } from "./auth";
import cloudinary from "@/lib/cloudinary";
import { PLANS, PlanKey } from "./quota";

export async function checkQuota(userId: string, fileSize: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, storageUsedBytes: true }
    });
    if (!user) throw new Error("User not found");

    const planKey = (user.plan as PlanKey) || "free";
    const limit = PLANS[planKey];

    if (fileSize > limit.maxFileBytes) {
        const limitMb = limit.maxFileBytes / (1024 * 1024);
        return {
            allowed: false,
            error: `File size exceeds the ${limitMb}MB limit for your plan.`,
        };
    }

    if (user.storageUsedBytes + fileSize > limit.maxBytes) {
        return {
            allowed: false,
            error: "Storage quota exceeded. Please delete some files or upgrade to Pro.",
        };
    }

    return { allowed: true, planLimit: limit };
}

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
            },
            notes: {
                include: {
                    uploadedFiles: true
                },
                orderBy: { createdAt: 'desc' }
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
        include: {
            characters: true,
            locations: true,
        }
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
async function handleImageUploadAndTracking(
    userId: string,
    base64String: string | undefined | null,
    oldUrl: string | undefined | null,
    folder: string,
    publicIdPrefix: string
): Promise<{ url?: string; sizeDelta: number }> {
    if (!base64String || !base64String.startsWith("data:")) {
        return { sizeDelta: 0 };
    }

    const match = base64String.match(/^data:([^;]+);base64,/);
    if (!match) {
        throw new Error("Invalid image format");
    }
    const mimeType = match[1];
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.");
    }

    const sizeInBytes = Math.round((base64String.length * 3) / 4);

    let oldFileSize = 0;
    let oldUploadedFileId = null;

    if (oldUrl) {
        const oldFileRecord = await prisma.uploadedFile.findUnique({
            where: { url: oldUrl }
        });
        if (oldFileRecord) {
            oldFileSize = oldFileRecord.size;
            oldUploadedFileId = oldFileRecord.id;
        }
    }

    const sizeDifference = sizeInBytes - oldFileSize;
    const quotaCheck = await checkQuota(userId, sizeDifference);
    if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.error);
    }

    const result = await cloudinary.uploader.upload(base64String, {
        folder,
        public_id: `${publicIdPrefix}-${Date.now()}`
    });

    const imageUrl = result.secure_url;
    const uploadedBytes = result.bytes;

    if (oldUploadedFileId) {
        await prisma.uploadedFile.delete({ where: { id: oldUploadedFileId } });
    }
    await prisma.uploadedFile.create({
        data: {
            url: imageUrl,
            size: uploadedBytes,
            userId
        }
    });

    await prisma.user.update({
        where: { id: userId },
        data: {
            storageUsedBytes: {
                increment: uploadedBytes - oldFileSize
            }
        }
    });

    if (oldUrl) {
        try {
            const parts = oldUrl.split("/storack/");
            if (parts.length > 1) {
                const pathWithExtension = "storack/" + parts[1];
                const publicId = pathWithExtension.split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (err) {
            console.error("Failed to delete old image from Cloudinary:", err);
        }
    }

    return { url: imageUrl, sizeDelta: uploadedBytes - oldFileSize };
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
    backstory?: string,
    storyId?: string | null
}) {
    await requireOwnedWorld(worldId);
    const userId = await requireUserId();

    let finalAvatarUrl = data.avatarUrl;
    if (data.avatarUrl && data.avatarUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.avatarUrl,
            null,
            "storack/avatars",
            `char-${worldId}`
        );
        finalAvatarUrl = upload.url;
    }

    const char = await prisma.character.create({
        data: {
            worldId,
            ...data,
            avatarUrl: finalAvatarUrl
        }
    });
    revalidatePath("/characters");
    revalidatePath("/world");
    if (data.storyId) {
        revalidatePath(`/stories/${data.storyId}`);
    }
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
    backstory: string,
    storyId: string | null
}>) {
    const char = await requireOwnedCharacter(id);
    const userId = await requireUserId();

    let finalAvatarUrl = data.avatarUrl;
    if (data.avatarUrl && data.avatarUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.avatarUrl,
            char.avatarUrl,
            "storack/avatars",
            `char-${id}`
        );
        finalAvatarUrl = upload.url;
    }

    const oldChar = await prisma.character.findUnique({ where: { id }, select: { storyId: true } });

    const updatedChar = await prisma.character.update({
        where: { id },
        data: {
            ...data,
            avatarUrl: finalAvatarUrl
        }
    });
    revalidatePath("/characters");
    revalidatePath("/world");
    if (oldChar?.storyId) {
        revalidatePath(`/stories/${oldChar.storyId}`);
    }
    if (updatedChar.storyId && updatedChar.storyId !== oldChar?.storyId) {
        revalidatePath(`/stories/${updatedChar.storyId}`);
    }
    return updatedChar;
}

export async function deleteCharacter(id: string) {
    const char = await requireOwnedCharacter(id);
    const userId = await requireUserId();

    if (char.avatarUrl) {
        const fileRecord = await prisma.uploadedFile.findUnique({
            where: { url: char.avatarUrl }
        });
        if (fileRecord) {
            try {
                const parts = char.avatarUrl.split("/storack/");
                if (parts.length > 1) {
                    const pathWithExtension = "storack/" + parts[1];
                    const publicId = pathWithExtension.split(".")[0];
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (err) {
                console.error(err);
            }
            await prisma.$transaction([
                prisma.uploadedFile.delete({ where: { id: fileRecord.id } }),
                prisma.user.update({
                    where: { id: userId },
                    data: { storageUsedBytes: { decrement: fileRecord.size } }
                })
            ]);
        }
    }

    await prisma.character.delete({ where: { id } });
    revalidatePath("/characters");
    revalidatePath("/world");
    if (char.storyId) {
        revalidatePath(`/stories/${char.storyId}`);
    }
}

// --- Locations ---
export async function createLocation(worldId: string, data: { name: string, type?: string, description?: string, mapUrl?: string, imageUrl?: string, storyId?: string | null }) {
    await requireOwnedWorld(worldId);
    const userId = await requireUserId();

    let finalImageUrl = data.imageUrl;
    if (data.imageUrl && data.imageUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.imageUrl,
            null,
            "storack/locations",
            `loc-img-${worldId}`
        );
        finalImageUrl = upload.url;
    }

    let finalMapUrl = data.mapUrl;
    if (data.mapUrl && data.mapUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.mapUrl,
            null,
            "storack/locations",
            `loc-map-${worldId}`
        );
        finalMapUrl = upload.url;
    }

    const loc = await prisma.location.create({
        data: {
            worldId,
            name: data.name,
            type: data.type,
            description: data.description,
            imageUrl: finalImageUrl,
            mapUrl: finalMapUrl,
            storyId: data.storyId
        }
    });
    revalidatePath("/world");
    if (data.storyId) {
        revalidatePath(`/stories/${data.storyId}`);
    }
    return loc;
}

export async function updateLocation(id: string, data: Partial<{ name: string, type: string, description: string, mapUrl: string, imageUrl: string, storyId: string | null }>) {
    const loc = await requireOwnedLocation(id);
    const userId = await requireUserId();

    let finalImageUrl = data.imageUrl;
    if (data.imageUrl && data.imageUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.imageUrl,
            loc.imageUrl,
            "storack/locations",
            `loc-img-${id}`
        );
        finalImageUrl = upload.url;
    }

    let finalMapUrl = data.mapUrl;
    if (data.mapUrl && data.mapUrl.startsWith("data:")) {
        const upload = await handleImageUploadAndTracking(
            userId,
            data.mapUrl,
            loc.mapUrl,
            "storack/locations",
            `loc-map-${id}`
        );
        finalMapUrl = upload.url;
    }

    const oldLoc = await prisma.location.findUnique({ where: { id }, select: { storyId: true } });

    const updatedLoc = await prisma.location.update({
        where: { id },
        data: {
            ...data,
            imageUrl: finalImageUrl,
            mapUrl: finalMapUrl
        }
    });
    revalidatePath("/world");
    if (oldLoc?.storyId) {
        revalidatePath(`/stories/${oldLoc.storyId}`);
    }
    if (updatedLoc.storyId && updatedLoc.storyId !== oldLoc?.storyId) {
        revalidatePath(`/stories/${updatedLoc.storyId}`);
    }
    return updatedLoc;
}

export async function deleteLocation(id: string) {
    const loc = await requireOwnedLocation(id);
    const userId = await requireUserId();

    const urlsToClean = [loc.imageUrl, loc.mapUrl].filter(Boolean) as string[];
    for (const url of urlsToClean) {
        const fileRecord = await prisma.uploadedFile.findUnique({
            where: { url }
        });
        if (fileRecord) {
            try {
                const parts = url.split("/storack/");
                if (parts.length > 1) {
                    const pathWithExtension = "storack/" + parts[1];
                    const publicId = pathWithExtension.split(".")[0];
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (err) {
                console.error(err);
            }
            await prisma.$transaction([
                prisma.uploadedFile.delete({ where: { id: fileRecord.id } }),
                prisma.user.update({
                    where: { id: userId },
                    data: { storageUsedBytes: { decrement: fileRecord.size } }
                })
            ]);
        }
    }

    await prisma.location.delete({ where: { id } });
    revalidatePath("/world");
    if (loc.storyId) {
        revalidatePath(`/stories/${loc.storyId}`);
    }
}

export async function uploadStoryCover(id: string, formData: FormData) {
    const story = await requireOwnedStory(id);
    const userId = await requireUserId();

    const file = formData.get("coverImage") as File;
    if (!file) return { error: "No file uploaded" };

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
        return { error: "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed." };
    }

    let oldFileSize = 0;
    let oldUploadedFileId = null;

    if (story.coverImage) {
        const oldFileRecord = await prisma.uploadedFile.findUnique({
            where: { url: story.coverImage }
        });
        if (oldFileRecord) {
            oldFileSize = oldFileRecord.size;
            oldUploadedFileId = oldFileRecord.id;
        }
    }

    const sizeDifference = file.size - oldFileSize;
    const quotaCheck = await checkQuota(userId, sizeDifference);
    if (!quotaCheck.allowed) {
        return { error: quotaCheck.error };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
        folder: "storack/covers",
        public_id: `${id}-${Date.now()}`,
    });

    const imageUrl = result.secure_url;
    const uploadedBytes = result.bytes;

    await prisma.$transaction(async (tx) => {
        if (oldUploadedFileId) {
            await tx.uploadedFile.delete({ where: { id: oldUploadedFileId } });
        }
        await tx.uploadedFile.create({
            data: {
                url: imageUrl,
                size: uploadedBytes,
                userId
            }
        });
        await tx.user.update({
            where: { id: userId },
            data: {
                storageUsedBytes: {
                    increment: uploadedBytes - oldFileSize
                }
            }
        });
        await tx.story.update({
            where: { id },
            data: { coverImage: imageUrl }
        });
    });

    revalidatePath("/");
    revalidatePath(`/stories/${id}`);

    return { success: true, imageUrl };
}

export async function uploadEditorImage(formData: FormData) {
    const userId = await requireUserId();

    const file = formData.get("image") as File;
    if (!file) return { error: "No file uploaded" };

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
        return { error: "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed." };
    }

    const quotaCheck = await checkQuota(userId, file.size);
    if (!quotaCheck.allowed) {
        return { error: quotaCheck.error };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
        folder: "storack/editor",
    });

    const imageUrl = result.secure_url;
    const uploadedBytes = result.bytes;

    await prisma.$transaction(async (tx) => {
        await tx.uploadedFile.create({
            data: {
                url: imageUrl,
                size: uploadedBytes,
                userId
            }
        });
        await tx.user.update({
            where: { id: userId },
            data: {
                storageUsedBytes: {
                    increment: uploadedBytes
                }
            }
        });
    });

    return { success: true, imageUrl: result.secure_url };
}

export async function deleteUploadedFile(url: string) {
    const userId = await requireUserId();

    const fileRecord = await prisma.uploadedFile.findFirst({
        where: { url, userId }
    });
    if (!fileRecord) throw new Error("File not found or not owned by you");

    try {
        const parts = url.split("/storack/");
        if (parts.length > 1) {
            const pathWithExtension = "storack/" + parts[1];
            const publicId = pathWithExtension.split(".")[0];
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (err) {
        console.error("Failed to delete image from Cloudinary:", err);
    }

    await prisma.$transaction(async (tx) => {
        await tx.uploadedFile.delete({
            where: { id: fileRecord.id }
        });
        await tx.user.update({
            where: { id: userId },
            data: {
                storageUsedBytes: {
                    decrement: fileRecord.size
                }
            }
        });

        await tx.story.updateMany({
            where: { coverImage: url, world: { userId } },
            data: { coverImage: null }
        });
        await tx.character.updateMany({
            where: { avatarUrl: url, world: { userId } },
            data: { avatarUrl: null }
        });
        await tx.location.updateMany({
            where: { imageUrl: url, world: { userId } },
            data: { imageUrl: null }
        });
        await tx.location.updateMany({
            where: { mapUrl: url, world: { userId } },
            data: { mapUrl: null }
        });
    });

    revalidatePath("/");
    revalidatePath("/settings");
    return { success: true };
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

export async function updateChapterWorldElements(chapterId: string, data: { characterIds: string[], locationIds: string[] }) {
    await requireOwnedChapter(chapterId);

    const chapter = await prisma.chapter.update({
        where: { id: chapterId },
        data: {
            characters: {
                set: data.characterIds.map(id => ({ id }))
            },
            locations: {
                set: data.locationIds.map(id => ({ id }))
            }
        },
        include: {
            characters: true,
            locations: true
        }
    });

    revalidatePath("/");
    if (chapter.storyId) {
        revalidatePath(`/stories/${chapter.storyId}`);
        revalidatePath(`/stories/${chapter.storyId}/chapters/${chapter.id}`);
        revalidatePath(`/stories/${chapter.storyId}/chapters/${chapter.id}/cast`);
    }
    return chapter;
}

// --- Scenes & Reordering ---


async function requireOwnedNote(noteId: string) {
    const userId = await requireUserId();
    const note = await prisma.note.findFirst({
        where: {
            id: noteId,
            story: {
                world: { userId }
            }
        }
    });
    if (!note) throw new Error("Not found");
    return note;
}

export async function reorderChapters(storyId: string, orderedIds: string[]) {
    await requireOwnedStory(storyId);
    
    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.chapter.update({
                where: { id },
                data: { order: index + 1 }
            })
        )
    );
    revalidatePath(`/stories/${storyId}`);
    revalidatePath("/");
}

export async function createNote(storyId: string, title: string, type: string) {
    await requireOwnedStory(storyId);
    const note = await prisma.note.create({
        data: {
            storyId,
            title,
            type,
            content: "",
            links: []
        },
        include: {
            uploadedFiles: true
        }
    });
    revalidatePath(`/stories/${storyId}`);
    return note;
}

export async function updateNote(id: string, data: Partial<{ title: string, content: string, links: string[], fileUrl: string | null, fileName: string | null, fileSize: number | null }>) {
    const note = await requireOwnedNote(id);
    const updated = await prisma.note.update({
        where: { id },
        data,
        include: {
            uploadedFiles: true
        }
    });
    revalidatePath(`/stories/${note.storyId}`);
    return updated;
}

export async function deleteNote(id: string) {
    const note = await requireOwnedNote(id);
    const userId = await requireUserId();
    
    // Find all files linked to this note
    const associatedFiles = await prisma.uploadedFile.findMany({
        where: { noteId: id }
    });
    
    // Also include any legacy single file if present
    if (note.fileUrl) {
        const fileRecord = await prisma.uploadedFile.findUnique({
            where: { url: note.fileUrl }
        });
        if (fileRecord && !associatedFiles.some(f => f.id === fileRecord.id)) {
            associatedFiles.push(fileRecord);
        }
    }
    
    if (associatedFiles.length > 0) {
        // Delete each from Cloudinary
        for (const fileRecord of associatedFiles) {
            try {
                const parts = fileRecord.url.split("/storack/");
                if (parts.length > 1) {
                    const pathWithExtension = "storack/" + parts[1];
                    const publicId = pathWithExtension.split(".")[0];
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (err) {
                console.error("Cloudinary delete failed:", err);
            }
        }
        
        // Sum total size to restore
        const totalSize = associatedFiles.reduce((sum, f) => sum + f.size, 0);
        
        // Delete file records and update quota
        await prisma.$transaction([
            prisma.uploadedFile.deleteMany({
                where: { id: { in: associatedFiles.map(f => f.id) } }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { storageUsedBytes: { decrement: totalSize } }
            })
        ]);
    }
    
    await prisma.note.delete({ where: { id } });
    revalidatePath(`/stories/${note.storyId}`);
}

export async function uploadResearchFile(storyId: string, noteId: string, formData: FormData) {
    try {
        const story = await requireOwnedStory(storyId);
        const userId = await requireUserId();

        const file = formData.get("file") as File;
        if (!file) return { error: "No file uploaded" };

        const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".bash", ".js", ".ts", ".html", ".htm", ".php", ".pl", ".py", ".rb", ".xml", ".msi", ".vbs"];
        const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (dangerousExtensions.includes(fileExt) || file.type === "text/html" || file.type === "image/svg+xml") {
            return { error: "This file type is not allowed for security reasons." };
        }

        const quotaCheck = await checkQuota(userId, file.size);
        if (!quotaCheck.allowed) {
            return { error: quotaCheck.error };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const result = await cloudinary.uploader.upload(base64, {
            folder: "storack/research",
            resource_type: "auto"
        });

        const fileUrl = result.secure_url;
        const uploadedBytes = result.bytes;

        const note = await prisma.$transaction(async (tx) => {
            await tx.uploadedFile.create({
                data: {
                    url: fileUrl,
                    size: uploadedBytes,
                    fileName: file.name,
                    userId,
                    noteId
                }
            });
            await tx.user.update({
                where: { id: userId },
                data: {
                    storageUsedBytes: {
                        increment: uploadedBytes
                    }
                }
            });
            return await tx.note.findUnique({
                where: { id: noteId },
                include: {
                    uploadedFiles: true
                }
            });
        });

        revalidatePath(`/stories/${storyId}`);
        return { success: true, note };
    } catch (error) {
        console.error("Error in uploadResearchFile:", error);
        return { error: error instanceof Error ? error.message : "Unknown error during file upload" };
    }
}

export async function deleteResearchFile(fileId: string) {
    try {
        const userId = await requireUserId();
        
        const fileRecord = await prisma.uploadedFile.findUnique({
            where: { id: fileId },
            include: { note: true }
        });
        if (!fileRecord) throw new Error("File not found");
        if (fileRecord.userId !== userId) throw new Error("Unauthorized");
        
        try {
            const parts = fileRecord.url.split("/storack/");
            if (parts.length > 1) {
                const pathWithExtension = "storack/" + parts[1];
                const publicId = pathWithExtension.split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (err) {
            console.error("Failed to delete image from Cloudinary:", err);
        }
        
        await prisma.$transaction([
            prisma.uploadedFile.delete({ where: { id: fileId } }),
            prisma.user.update({
                where: { id: userId },
                data: { storageUsedBytes: { decrement: fileRecord.size } }
            })
        ]);
        
        if (fileRecord.noteId && fileRecord.note) {
            revalidatePath(`/stories/${fileRecord.note.storyId}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error in deleteResearchFile:", error);
        return { error: error instanceof Error ? error.message : "Unknown error deleting file" };
    }
}

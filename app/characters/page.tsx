import { getOrCreateDefaultWorld } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { CharactersClient } from "@/app/characters/CharactersClient";

export default async function CharactersPage() {
    const world = await getOrCreateDefaultWorld();
    const characters = await prisma.character.findMany({
        where: { worldId: world.id },
        include: {
            story: true,
            birthplace: {
                select: {
                    id: true,
                    name: true
                }
            },
            relationships: {
                include: {
                    target: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            relatedTo: {
                include: {
                    character: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true
                        }
                    }
                }
            },
            appearances: {
                include: {
                    event: {
                        include: {
                            calendar: true
                        }
                    },
                    targetCharacter: {
                        select: { id: true, name: true, avatarUrl: true }
                    }
                }
            },
            snapshots: {
                include: {
                    event: {
                        include: {
                            calendar: true
                        }
                    },
                    chapter: true,
                    birthplace: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    const locations = await prisma.location.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    const calendars = await prisma.calendar.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    const stories = await prisma.story.findMany({
        where: { worldId: world.id },
        orderBy: { title: 'asc' }
    });

    const events = await prisma.timelineEvent.findMany({
        where: { worldId: world.id },
        include: {
            calendar: true
        },
        orderBy: { title: 'asc' }
    });

    const chapters = await prisma.chapter.findMany({
        where: { worldId: world.id },
        orderBy: { order: 'asc' }
    });

    return (
        <CharactersClient
            initialCharacters={characters as any}
            worldId={world.id}
            worldName={world.name}
            stories={stories}
            events={events as any}
            chapters={chapters}
            locations={locations}
            calendars={calendars}
        />
    );
}


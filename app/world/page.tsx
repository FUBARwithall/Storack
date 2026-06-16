import { getOrCreateDefaultWorld } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { WorldClient } from "@/app/world/WorldClient";

export default async function WorldPage() {
    const world = await getOrCreateDefaultWorld();

    // Fetch locations and characters from database
    const locations = (await prisma.location.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    })).map(loc => ({ ...loc, type: 'Location' }));

    const characters = await prisma.character.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const factions = await prisma.organization.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const lores = await prisma.lore.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const systems = await prisma.worldSystem.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const objects = await prisma.worldObject.findMany({
        where: { worldId: world.id },
        include: { story: true },
        orderBy: { name: 'asc' }
    });

    const stories = await prisma.story.findMany({
        where: { worldId: world.id },
        orderBy: { title: 'asc' }
    });

    const calendars = await prisma.calendar.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    return (
        <WorldClient
            initialLocations={locations}
            initialCharacters={characters}
            initialFactions={factions}
            initialLores={lores}
            initialSystems={systems}
            initialObjects={objects}
            worldId={world.id}
            stories={stories}
            calendars={calendars}
        />
    );
}

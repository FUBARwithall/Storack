import { getOrCreateDefaultWorld } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { WorldClient } from "@/app/world/WorldClient";

export default async function WorldPage() {
    const world = await getOrCreateDefaultWorld();

    // Fetch locations and characters from database
    const locations = await prisma.location.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    const characters = await prisma.character.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    return (
        <WorldClient
            initialLocations={locations}
            initialCharacters={characters}
            worldId={world.id}
        />
    );
}

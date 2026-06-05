import { getOrCreateDefaultWorld } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { CharactersClient } from "@/app/characters/CharactersClient";

export default async function CharactersPage() {
    const world = await getOrCreateDefaultWorld();
    const characters = await prisma.character.findMany({
        where: { worldId: world.id },
        orderBy: { name: 'asc' }
    });

    return <CharactersClient initialCharacters={characters} worldId={world.id} />;
}

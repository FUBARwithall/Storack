"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveWorld(worldId: string) {
    const cookieStore = await cookies();
    cookieStore.set("active_world_id", worldId, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    revalidatePath("/");
    revalidatePath("/world");
    revalidatePath("/stories");
    revalidatePath("/characters");
}

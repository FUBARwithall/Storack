"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { login } from "./auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function registerAction(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        return { error: "Username already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
        },
    });

    // Create a default world for the new user
    await prisma.world.create({
        data: {
            name: "My World",
            description: "Default world for " + username,
            userId: user.id,
        }
    });

    await login({ id: user.id, username: user.username });
    revalidatePath("/");
    redirect("/");
}

export async function loginAction(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return { error: "Invalid username or password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return { error: "Invalid username or password" };
    }

    await login({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });
    revalidatePath("/");
    redirect("/");
}

export async function logoutAction() {
    const { logout } = await import("./auth");
    await logout();
    redirect("/auth");
}

export async function getSessionAction() {
    const { getSession } = await import("./auth");
    return await getSession();
}


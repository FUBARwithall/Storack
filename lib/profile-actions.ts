"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession, updateSessionUser } from "./auth";
import { revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";

export async function updateProfileAction(formData: FormData) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Not authenticated" };
    }

    const userId = session.user.id;
    const username = formData.get("username") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const avatarFile = formData.get("avatar") as File | null;

    if (!username || username.trim() === "") {
        return { error: "Username cannot be empty" };
    }

    // Retrieve user from DB to verify password
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return { error: "User not found" };
    }

    const updateData: { username?: string; password?: string; avatarUrl?: string } = {};

    // 1. Username Update Check
    if (username !== user.username) {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            return { error: "Username already taken" };
        }
        updateData.username = username;
    }

    // 2. Password Update Check
    if (newPassword) {
        if (!currentPassword) {
            return { error: "Current password is required to change password" };
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return { error: "Incorrect current password" };
        }
        updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // 3. Avatar Upload Check
    if (avatarFile && avatarFile.size > 0) {
        try {
            const buffer = Buffer.from(await avatarFile.arrayBuffer());
            const base64 = `data:${avatarFile.type};base64,${buffer.toString("base64")}`;
            const uploadResult = await cloudinary.uploader.upload(base64, {
                folder: "storack/avatars",
                public_id: `user-${userId}-${Date.now()}`,
            });
            updateData.avatarUrl = uploadResult.secure_url;
        } catch (error) {
            console.error("Avatar upload failed:", error);
            return { error: "Failed to upload avatar image" };
        }
    }

    // Perform database update if there is any new data
    if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // Sync local cookie session
        const sessionUpdates: { username?: string; avatarUrl?: string } = {};
        if (updateData.username) sessionUpdates.username = updateData.username;
        if (updateData.avatarUrl) sessionUpdates.avatarUrl = updateData.avatarUrl;

        await updateSessionUser(sessionUpdates);
    }

    revalidatePath("/settings");
    revalidatePath("/");

    return { success: true };
}

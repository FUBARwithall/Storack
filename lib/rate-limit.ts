import { prisma } from "./db";
import { headers } from "next/headers";

// Start of Rate Limiter function
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ success: boolean }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);

    await prisma.rateLimit.deleteMany({
        where: { expiresAt: { lt: now } }
    });

    const record = await prisma.rateLimit.findUnique({
        where: { key }
    });

    if (!record) {
        await prisma.rateLimit.create({
            data: { key, count: 1, expiresAt }
        });
        return { success: true };
    }

    if (record.count >= limit) {
        return { success: false };
    }

    await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } }
    });

    return { success: true };
}
// End of Rate Limiter function

// Start of Client IP helper
export async function getClientIp(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    return headersList.get("x-real-ip") || "127.0.0.1";
}
// End of Client IP helper

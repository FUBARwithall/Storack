import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-signature") || "";
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "";

        if (!secret) {
            console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not set");
            return new Response("Webhook secret not set", { status: 500 });
        }

        const hmac = crypto.createHmac("sha256", secret);
        const digest = hmac.update(rawBody).digest("hex");

        // Verify webhook signature
        if (signature !== digest) {
            return new Response("Invalid signature", { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;
        const customData = payload.meta.custom_data;
        const userId = customData?.userId || customData?.user_id;

        if (!userId) {
            console.warn("No userId in webhook custom data", payload.meta);
            return new Response("No userId provided in metadata", { status: 400 });
        }

        const data = payload.data;
        const attributes = data.attributes;
        const status = attributes.status; // active, on_trial, cancelled, expired, unpaid, etc.
        const customerId = String(attributes.customer_id);
        const subscriptionId = String(data.id);
        
        const renewsAt = attributes.renews_at ? new Date(attributes.renews_at) : null;
        const endsAt = attributes.ends_at ? new Date(attributes.ends_at) : null;
        
        // Subscription is active if status is active or on_trial
        const isActive = status === "active" || status === "on_trial";
        const plan = isActive ? "pro" : "free";

        await prisma.user.update({
            where: { id: userId },
            data: {
                plan,
                lemonCustomerId: customerId,
                lemonSubscriptionId: subscriptionId,
                lemonPaidUntil: renewsAt || endsAt,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Lemon Squeezy webhook error:", error);
        return new Response("Internal server error", { status: 500 });
    }
}

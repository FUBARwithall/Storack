import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";

type SessionPayload = JWTPayload & {
    user?: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
    expires?: Date | string;
};

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set in environment variables");
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: JWTPayload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload as SessionPayload;
}

export async function login(user: { id: string; username: string; avatarUrl?: string | null }) {
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const session = await encrypt({ user, expires });

    (await cookies()).set("session", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
}

export async function logout() {
    (await cookies()).set("session", "", {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
}

export async function getSession() {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch {
        return null;
    }
}

export async function requireUserId() {
    const session = await getSession();
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    return userId;
}

export async function updateSessionUser(updates: { username?: string; avatarUrl?: string | null }) {
    const session = await getSession();
    if (!session || !session.user) return;

    session.user = {
        ...session.user,
        ...updates
    };

    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    session.expires = expires;
    const newSessionToken = await encrypt(session);
    
    (await cookies()).set("session", newSessionToken, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
}

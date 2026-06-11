"use client";

import { usePathname } from "next/navigation";
import { MobileNav, Sidebar } from "./Sidebar";

export default function LayoutWrapper({
    children,
    user,
    plan = "free"
}: {
    children: React.ReactNode;
    user?: { id: string; username: string; avatarUrl?: string | null } | null;
    plan?: string;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/auth";
    const isExportPage = pathname.endsWith("/export");

    if (isAuthPage || isExportPage) {
        return <main className="flex-1 w-full h-full overflow-y-auto bg-gray-100">{children}</main>;
    }

    return (
        <div className="flex h-full w-full">
            <Sidebar user={user} plan={plan} className="hidden md:flex border-r border-border" />
            <div className="flex min-w-0 flex-1 flex-col">
                <MobileNav user={user} plan={plan} />
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}


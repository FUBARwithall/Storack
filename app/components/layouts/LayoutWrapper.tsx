"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export default function LayoutWrapper({
    children,
    user
}: {
    children: React.ReactNode;
    user?: { id: string; username: string } | null;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/auth";

    if (isAuthPage) {
        return <main className="flex-1 w-full h-full">{children}</main>;
    }

    return (
        <div className="flex h-full w-full">
            <Sidebar user={user} className="hidden md:flex border-r border-border" />
            <main className="flex-1 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}


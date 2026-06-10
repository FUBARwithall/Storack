"use client";

import Link from 'next/link';
import {
    LayoutDashboard,
    BookOpen,
    Settings,
    PenTool,
    Database,
    Users,
    LogOut,
    User as UserIcon,
    ChevronsUpDown,
    Palette,
    Sun,
    Moon,
    Laptop
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const sidebarItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Stories', href: '/stories', icon: BookOpen },
    { name: 'Characters', href: '/characters', icon: Users },
    { name: 'Worldbuilding', href: '/world', icon: Database },
];

export function Sidebar({
    className,
    user
}: {
    className?: string;
    user?: { id: string; username: string; avatarUrl?: string | null } | null;
}) {

    const { setTheme } = useTheme();

    return (
        <div className={cn("flex h-screen w-64 flex-col border-r bg-sidebar backdrop-blur-sm dark:bg-zinc-950", className)}>
            <div className="flex h-14 items-center border-b px-6 font-semibold">
                <PenTool className="mr-2 h-5 w-5 text-primary" />
                <span className="text-lg font-bold tracking-tight">Storack</span>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="space-y-1">
                    {sidebarItems.map((item) => (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-auto border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-2 hover:bg-accent/50">
                            <Avatar className="h-8 w-8 rounded-lg border">
                                <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} alt={user?.username || "User"} />
                                <AvatarFallback className="rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full">{user?.username || 'Guest User'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                                    {user ? 'Pro Writer' : 'Free Tier'}
                                </span>
                            </div>

                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="w-full flex items-center cursor-pointer">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Palette className="mr-2 h-4 w-4" />
                                    <span>Appearance</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setTheme("light")}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")}>
                                        <Laptop className="mr-2 h-4 w-4" />
                                        <span>System</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={async () => {
                                const { logoutAction } = await import("@/lib/auth-actions");
                                await logoutAction();
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

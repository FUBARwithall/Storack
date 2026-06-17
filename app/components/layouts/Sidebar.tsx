"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    BookOpen,
    PenTool,
    Database,
    Users,
    LogOut,
    User as UserIcon,
    ChevronsUpDown,
    Menu,
    Palette,
    Sun,
    Moon,
    Laptop,
    Globe,
    Plus,
    ArrowRight,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { getWorlds, createWorld, getOrCreateDefaultWorld } from '@/lib/actions';
import { setActiveWorld } from '@/lib/world-actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
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
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const sidebarItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Stories', href: '/stories', icon: BookOpen },
    { name: 'Characters', href: '/characters', icon: Users },
    { name: 'Worldbuilding', href: '/world', icon: Database },
];

const accountItems = [
    { name: 'Profile', href: '/settings', icon: UserIcon },
    { name: 'Analysis', href: '/analysis', icon: BarChart3 },
];

export function Sidebar({
    className,
    user,
    plan = "free"
}: {
    className?: string;
    user?: { id: string; username: string; avatarUrl?: string | null } | null;
    plan?: string;
}) {

    const router = useRouter();
    const { setTheme } = useTheme();
    const pathname = usePathname();

    const [worlds, setWorlds] = useState<any[]>([]);
    const [activeWorld, setActiveWorldState] = useState<any>(null);
    const [isCreatingWorld, setIsCreatingWorld] = useState(false);
    const [newWorldName, setNewWorldName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function loadWorlds() {
            try {
                const [allWorlds, currWorld] = await Promise.all([
                    getWorlds(),
                    getOrCreateDefaultWorld()
                ]);
                setWorlds(allWorlds);
                setActiveWorldState(currWorld);
            } catch (err) {
                console.error("Failed to load worlds:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadWorlds();
    }, [user]);

    const handleSwitchWorld = async (worldId: string) => {
        try {
            await setActiveWorld(worldId);
            const target = worlds.find(w => w.id === worldId);
            if (target) {
                setActiveWorldState(target);
            }
            router.refresh();
        } catch (err) {
            console.error("Failed to switch world:", err);
        }
    };

    const handleCreateWorldSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorldName.trim()) return;
        try {
            const newWorld = await createWorld({ name: newWorldName });
            setWorlds(prev => [newWorld, ...prev]);
            setActiveWorldState(newWorld);
            setNewWorldName("");
            setIsCreatingWorld(false);
            router.refresh();
        } catch (err) {
            console.error("Failed to create world:", err);
        }
    };

    return (
        <div className={cn("flex h-screen w-64 flex-col border-r bg-sidebar backdrop-blur-sm", className)}>
            <div className="flex h-14 items-center border-b px-6 font-semibold">
                <PenTool className="mr-2 h-5 w-5 text-primary" />
                <span className="text-xl font-serif font-bold italic tracking-wide text-foreground">Storack</span>
            </div>

            {user && (
                <div className="px-4 py-3 border-b">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-between h-9 px-3 border-muted-foreground/20 hover:bg-accent/40 text-left">
                                <span className="flex items-center gap-2 truncate text-xs font-semibold">
                                    <Globe className="h-4 w-4 text-primary shrink-0" />
                                    <span className="truncate">{activeWorld ? activeWorld.name : "Loading world..."}</span>
                                </span>
                                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                            <DropdownMenuLabel className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Switch Universe</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup className="max-h-48 overflow-y-auto">
                                {worlds.map(w => (
                                    <DropdownMenuItem
                                        key={w.id}
                                        onSelect={() => handleSwitchWorld(w.id)}
                                        className={cn("cursor-pointer flex items-center justify-between text-xs", w.id === activeWorld?.id && "font-bold text-primary bg-primary/5")}
                                    >
                                        <span className="truncate">{w.name}</span>
                                        {w.id === activeWorld?.id && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsCreatingWorld(true)} className="cursor-pointer text-xs flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span>New Universe</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase select-none">Navigation</p>
                <ul className="space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 border-l-2",
                                        isActive 
                                            ? "bg-primary/10 text-primary border-primary font-semibold rounded-l-none pl-2.5" 
                                            : "text-foreground/65 border-transparent hover:bg-accent/40 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-opacity duration-200",
                                        isActive ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100"
                                    )} />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="mt-auto border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-2 hover:bg-accent/50">
                            <Avatar className="h-8 w-8 rounded-lg border">
                                <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} alt={user?.username || "User"} />
                                <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
                                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start gap-0.5 text-left flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate w-full">{user?.username || 'Guest User'}</span>
                                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wide">
                                    {user ? (plan === "pro" ? "Pro Writer" : "Free Writer") : "Free Tier"}
                                </span>
                            </div>

                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {plan !== "pro" && (
                                <DropdownMenuItem asChild className="bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary cursor-pointer font-bold mb-1">
                                    <Link href="/settings" className="w-full flex items-center">
                                        <Zap className="mr-2 h-4 w-4 fill-primary animate-pulse" />
                                        Upgrade to Pro
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="w-full flex items-center cursor-pointer">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/analysis" className="w-full flex items-center cursor-pointer">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Analysis
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

            {isCreatingWorld && (
                <Dialog open={isCreatingWorld} onOpenChange={setIsCreatingWorld}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateWorldSubmit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>Create New Universe</DialogTitle>
                                <DialogDescription>
                                    Start a new fictional setting with its own characters, stories, and lore.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2">
                                <Label htmlFor="new-world-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Universe Name</Label>
                                <Input
                                    id="new-world-name"
                                    placeholder="e.g. Cosmere"
                                    value={newWorldName}
                                    onChange={(e) => setNewWorldName(e.target.value)}
                                    required
                                    className="h-10 bg-card/50"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreatingWorld(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!newWorldName.trim()}
                                >
                                    Create Universe
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

export function MobileNav({
    user,
    plan = "free"
}: {
    user?: { id: string; username: string; avatarUrl?: string | null } | null;
    plan?: string;
}) {
    const router = useRouter();
    const { setTheme } = useTheme();
    const pathname = usePathname();

    const [worlds, setWorlds] = useState<any[]>([]);
    const [activeWorld, setActiveWorldState] = useState<any>(null);
    const [isCreatingWorld, setIsCreatingWorld] = useState(false);
    const [newWorldName, setNewWorldName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function loadWorlds() {
            try {
                const [allWorlds, currWorld] = await Promise.all([
                    getWorlds(),
                    getOrCreateDefaultWorld()
                ]);
                setWorlds(allWorlds);
                setActiveWorldState(currWorld);
            } catch (err) {
                console.error("Failed to load worlds:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadWorlds();
    }, [user]);

    const handleSwitchWorld = async (worldId: string) => {
        try {
            await setActiveWorld(worldId);
            const target = worlds.find(w => w.id === worldId);
            if (target) {
                setActiveWorldState(target);
            }
            router.refresh();
        } catch (err) {
            console.error("Failed to switch world:", err);
        }
    };

    const handleCreateWorldSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorldName.trim()) return;
        try {
            const newWorld = await createWorld({ name: newWorldName });
            setWorlds(prev => [newWorld, ...prev]);
            setActiveWorldState(newWorld);
            setNewWorldName("");
            setIsCreatingWorld(false);
            router.refresh();
        } catch (err) {
            console.error("Failed to create world:", err);
        }
    };

    return (
        <div className="flex h-14 shrink-0 items-center justify-between border-b bg-sidebar px-4 md:hidden">
            <Link href="/" className="flex items-center font-semibold transition-transform active:scale-[0.98]">
                <PenTool className="mr-2 h-5 w-5 text-primary" />
                <span className="text-xl font-serif font-bold italic tracking-wide text-foreground">Storack</span>
            </Link>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="active:scale-90 active:bg-primary/10">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-sm gap-0 p-0">
                    <SheetHeader className="border-b p-4 text-left">
                        <SheetTitle className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-lg border">
                                <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} alt={user?.username || "User"} />
                                <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
                                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                                <span className="block truncate text-base">{user?.username || 'Guest User'}</span>
                                <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    {plan === "pro" ? "Pro Writer" : "Free Writer"}
                                </span>
                            </span>
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-5">
                        {user && (
                            <div className="pt-0 pb-5 mb-4 border-b">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full justify-between h-9 px-3 border-muted-foreground/20 hover:bg-accent/40 text-left">
                                            <span className="flex items-center gap-2 truncate text-xs font-semibold">
                                                <Globe className="h-4 w-4 text-primary shrink-0" />
                                                <span className="truncate">{activeWorld ? activeWorld.name : "Loading world..."}</span>
                                            </span>
                                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-[80vw] max-w-xs" align="start">
                                        <DropdownMenuLabel className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Switch Universe</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuGroup className="max-h-48 overflow-y-auto">
                                            {worlds.map(w => (
                                                <DropdownMenuItem
                                                    key={w.id}
                                                    onSelect={() => handleSwitchWorld(w.id)}
                                                    className={cn("cursor-pointer flex items-center justify-between text-xs", w.id === activeWorld?.id && "font-bold text-primary bg-primary/5")}
                                                >
                                                    <span className="truncate">{w.name}</span>
                                                    {w.id === activeWorld?.id && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuGroup>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => setIsCreatingWorld(true)} className="cursor-pointer text-xs flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span>New Universe</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                        {plan !== "pro" && user && (
                            <SheetClose asChild>
                                <Link href="/settings" className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary mb-4 transition-all hover:bg-primary/15 active:scale-[0.98]">
                                    <span className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 fill-primary" />
                                        <span>Upgrade to Storack Pro</span>
                                    </span>
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </SheetClose>
                        )}
                        <MobileSectionLabel>Navigation</MobileSectionLabel>
                        <nav className="space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                return (
                                    <SheetClose asChild key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-all active:scale-[0.98] active:bg-primary/15",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="mr-3 h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    </SheetClose>
                                );
                            })}
                        </nav>

                        <div className="mt-6 border-t pt-5">
                            <MobileSectionLabel>Account</MobileSectionLabel>
                            <div className="space-y-1">
                                {accountItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                    return (
                                        <SheetClose asChild key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-all active:scale-[0.98] active:bg-primary/15",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
                                                )}
                                            >
                                                <item.icon className="mr-3 h-5 w-5" />
                                                {item.name}
                                            </Link>
                                        </SheetClose>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-5">
                            <MobileSectionLabel>Appearance</MobileSectionLabel>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" onClick={() => setTheme("light")} className="justify-center active:scale-[0.96] active:bg-primary/10">
                                    <Sun className="mr-2 h-4 w-4" /> Light
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setTheme("dark")} className="justify-center active:scale-[0.96] active:bg-primary/10">
                                    <Moon className="mr-2 h-4 w-4" /> Dark
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setTheme("system")} className="justify-center active:scale-[0.96] active:bg-primary/10">
                                    <Laptop className="mr-2 h-4 w-4" /> Auto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t p-4">
                        <Button
                            variant="ghost"
                            className="min-h-11 w-full justify-start text-destructive hover:text-destructive active:scale-[0.98] active:bg-destructive/10"
                            onClick={async () => {
                                const { logoutAction } = await import("@/lib/auth-actions");
                                await logoutAction();
                            }}
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Log out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {isCreatingWorld && (
                <Dialog open={isCreatingWorld} onOpenChange={setIsCreatingWorld}>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateWorldSubmit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>Create New Universe</DialogTitle>
                                <DialogDescription>
                                    Start a new fictional setting with its own characters, stories, and lore.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2">
                                <Label htmlFor="new-world-name-mobile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Universe Name</Label>
                                <Input
                                    id="new-world-name-mobile"
                                    placeholder="e.g. Cosmere"
                                    value={newWorldName}
                                    onChange={(e) => setNewWorldName(e.target.value)}
                                    required
                                    className="h-10 bg-card/50"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreatingWorld(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!newWorldName.trim()}
                                >
                                    Create Universe
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function MobileSectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {children}
        </p>
    );
}

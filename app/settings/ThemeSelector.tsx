"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="grid grid-cols-3 gap-4">
                <div className="h-[92px] rounded-lg border bg-card/50 animate-pulse" />
                <div className="h-[92px] rounded-lg border bg-card/50 animate-pulse" />
                <div className="h-[92px] rounded-lg border bg-card/50 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-4">
            <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                    theme === "light"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground"
                }`}
            >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                    theme === "system"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground"
                }`}
            >
                <Laptop className="h-6 w-6" />
                <span className="text-sm font-medium">System</span>
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted/50 ${
                    theme === "dark"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground"
                }`}
            >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
            </button>
        </div>
    );
}

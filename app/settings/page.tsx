import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Palette, Cloud, LogOut, Laptop, Moon, Sun } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";



export default async function SettingsPage() {
    const session = await getSession();
    const user = session?.user;

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
            </header>

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <User className="h-5 w-5" /> Profile
                    </h2>
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
                            {user?.username ? (
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                    alt={user.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                "G"
                            )}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-foreground">{user?.username || "Guest User"}</h3>
                            <p className="text-sm text-muted-foreground">{user ? `${user.username}@storack.app` : "Not signed in"}</p>
                            <div className="pt-2">
                                <Button variant="outline" size="sm">Edit Profile</Button>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Appearance Section */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <Palette className="h-5 w-5" /> Appearance
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-4 hover:bg-muted">
                            <Sun className="h-6 w-6 text-foreground" />
                            <span className="text-sm font-medium">Light</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-primary bg-primary/10 p-4">
                            <Laptop className="h-6 w-6 text-primary" />
                            <span className="text-sm font-medium text-primary">System</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-4 hover:bg-muted">
                            <Moon className="h-6 w-6 text-foreground" />
                            <span className="text-sm font-medium">Dark</span>
                        </button>
                    </div>
                </section>

                {/* Notifications */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notifications
                    </h2>
                    <div className="space-y-4">
                        {['Daily writing reminders', 'Weekly progress reports', 'New feature announcements'].map((item) => (
                            <div key={item} className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{item}</span>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary pointer-events-none">
                                    <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-background transition" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sync */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <Cloud className="h-5 w-5" /> Cloud & Sync
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-foreground">Local Storage Only</p>
                            <p className="text-xs text-muted-foreground">Your stories are stored on this device.</p>
                        </div>
                        <Button variant="outline" size="sm">Enable Cloud Sync</Button>
                    </div>
                </section>

                <section className="pt-4 border-t">
                    <form action={logoutAction}>
                        <Button type="submit" variant="destructive" className="w-full sm:w-auto">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </form>
                </section>


            </div>
        </div>
    );
}

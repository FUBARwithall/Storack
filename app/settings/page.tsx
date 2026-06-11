import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Palette, Cloud, LogOut, Laptop, Moon, Sun, HardDrive } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { ThemeSelector } from "./ThemeSelector";
import { ProfileForm } from "./ProfileForm";
import { prisma } from "@/lib/db";
import { BillingSection } from "./BillingSection";

export default async function SettingsPage() {
    const session = await getSession();
    const user = session?.user;

    let userDb = null;
    if (user?.id) {
        userDb = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                uploadedFiles: {
                    orderBy: { createdAt: "desc" }
                }
            }
        });
    }

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
                    {user ? (
                        <ProfileForm user={user} />
                    ) : (
                        <p className="text-muted-foreground text-sm">Not signed in.</p>
                    )}
                </section>

                {/* Plan & Storage Section */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <HardDrive className="h-5 w-5" /> Plan & Storage
                    </h2>
                    {user && userDb ? (
                        <BillingSection 
                            userId={user.id}
                            plan={userDb.plan}
                            storageUsedBytes={userDb.storageUsedBytes}
                            uploadedFiles={userDb.uploadedFiles.map(f => ({
                                id: f.id,
                                url: f.url,
                                size: f.size,
                                createdAt: f.createdAt.toISOString()
                            }))}
                            checkoutUrl={`https://storack.lemonsqueezy.com/checkout/buy/${process.env.LEMON_SQUEEZY_VARIANT_ID}?checkout[custom][userId]=${user.id}`}
                        />
                    ) : (
                        <p className="text-muted-foreground text-sm">Not signed in.</p>
                    )}
                </section>

                {/* Appearance Section */}
                <section className="rounded-xl border bg-card text-card-foreground p-6">
                    <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
                        <Palette className="h-5 w-5" /> Appearance
                    </h2>
                    <ThemeSelector />
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

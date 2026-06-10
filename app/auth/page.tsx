"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginAction, registerAction } from "@/lib/auth-actions";
import authBg from "@/public/auth-bg.png";

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<any>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await action(formData);

        if (result?.error) {
            toast.error(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative"
            style={{
                backgroundImage: `radial-gradient(circle at center, rgba(212, 142, 28, 0.09) 0%, transparent 65%), url(${authBg.src})`
            }}
        >
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-extrabold font-serif tracking-wide text-white leading-none">
                        Sto<span className="text-primary font-bold">rack</span>
                    </h1>
                    <p className="text-primary/70 font-medium text-sm tracking-wide">Capture your world, one word at a time.</p>
                </div>

                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden pt-2">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList variant="line" className="grid w-full grid-cols-2 rounded-none border-b border-white/10 p-0 bg-transparent">
                            <TabsTrigger
                                value="login"
                                className="data-[state=active]:!text-primary text-slate-400 after:bg-primary after:!-bottom-[3px] font-semibold transition-all duration-200"
                                style={{ border: 'none' }}
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="data-[state=active]:!text-primary text-slate-400 after:bg-primary after:!-bottom-[3px] font-semibold transition-all duration-200"
                                style={{ border: 'none' }}
                            >
                                Register
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-1">
                            <TabsContent value="login">
                                <form onSubmit={(e) => handleSubmit(e, loginAction)}>
                                    <CardHeader className="pb-2 text-center">
                                        <CardTitle className="text-white text-2xl font-serif">Welcome Back</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs mt-1">Enter your credentials to access your library.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 px-6 py-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="username"
                                                placeholder="Username"
                                                className="pl-10 bg-slate-900/40 border-white/15 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:ring-2 transition-all h-10 text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                className="pl-10 pr-10 bg-slate-900/40 border-white/15 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:ring-2 transition-all h-10 text-sm"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-slate-500 hover:text-slate-350 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Remember Me & Forgot Password Utilities */}
                                        <div className="flex items-center justify-between text-xs mt-1 px-0.5">
                                            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    name="rememberMe"
                                                    className="accent-primary h-3.5 w-3.5 rounded border-white/10 bg-black/20 focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span>Remember me</span>
                                            </label>
                                            <button
                                                type="button"
                                                className="text-primary hover:underline font-semibold"
                                                onClick={() => toast.info("Password reset functionality coming soon.")}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>

                                        {/* Premium tight Divider */}
                                        <div className="flex justify-center items-center gap-2 !mt-1.5 !mb-0 py-0">
                                            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                                            <span className="text-[10px] text-primary/40 leading-none">✦</span>
                                            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 shadow-lg shadow-primary/20 transition-all text-sm transform active:scale-95 duration-200"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>Sign In</>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </TabsContent>

                            <TabsContent value="register">
                                <form onSubmit={(e) => handleSubmit(e, registerAction)}>
                                    <CardHeader className="pb-2 text-center">
                                        <CardTitle className="text-white text-2xl font-serif">Create Account</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs mt-1">Start your creative journey today.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 px-6 py-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="username"
                                                placeholder="Username"
                                                className="pl-10 bg-slate-900/40 border-white/15 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:ring-2 transition-all h-10 text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Password"
                                                className="pl-10 pr-10 bg-slate-900/40 border-white/15 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/40 focus-visible:ring-2 transition-all h-10 text-sm"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-slate-500 hover:text-slate-355 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Premium tight Divider */}
                                        <div className="flex justify-center items-center gap-2 !mt-3 !mb-0 py-0">
                                            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/30" />
                                            <span className="text-[10px] text-primary/40 leading-none">✦</span>
                                            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/30" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 shadow-lg shadow-primary/20 transition-all text-sm transform active:scale-95 duration-200"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>Begin Adventure</>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>

                <div className="text-center pt-2">
                    <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                        The ultimate companion for every storyteller
                    </p>
                </div>
            </div>
        </div>
    );
}

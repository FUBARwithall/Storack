"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Lock, User, Sparkles, Wand2 } from "lucide-react";
import { loginAction, registerAction } from "@/lib/auth-actions";

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<any>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await action(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black p-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-1">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3 backdrop-blur-sm shadow-xl shadow-indigo-500/10">
                        <BookOpen className="h-7 w-7 text-indigo-400" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Stor<span className="text-indigo-400">ack</span>
                    </h1>
                    <p className="text-indigo-200/60 font-medium">Capture your world, one word at a time.</p>
                </div>

                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden mt-2">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-none bg-black/40 h-12 p-1">
                            <TabsTrigger
                                value="login"
                                className="rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="rounded-md data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-300"
                            >
                                Register
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-1">
                            {error && (
                                <div className="mt-4 mx-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <TabsContent value="login">
                                <form onSubmit={(e) => handleSubmit(e, loginAction)}>
                                    <CardHeader className="pt-6 px-6 pb-2">
                                        <CardTitle className="text-white text-xl">Welcome Back</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs">Enter your credentials to access your library.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    name="username"
                                                    placeholder="Username"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 transition-all h-10 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    placeholder="Password"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 transition-all h-10 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="px-6 pb-6 pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 shadow-lg shadow-indigo-600/20 transition-all text-sm"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>Sign In <Sparkles className="ml-2 h-4 w-4 opacity-70" /></>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </TabsContent>

                            <TabsContent value="register">
                                <form onSubmit={(e) => handleSubmit(e, registerAction)}>
                                    <CardHeader className="pt-6 px-6 pb-2">
                                        <CardTitle className="text-white text-xl">Create Account</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs text-balance">Start your creative journey today.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    name="username"
                                                    placeholder="Username"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 transition-all h-10 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    name="password"
                                                    type="password"
                                                    placeholder="Password"
                                                    className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 transition-all h-10 text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="px-6 pb-6 pt-2">
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 shadow-lg shadow-indigo-600/20 transition-all text-sm"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>Begin Adventure <Wand2 className="ml-2 h-4 w-4 opacity-70" /></>
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

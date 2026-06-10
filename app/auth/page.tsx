"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Lock, User, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { loginAction, registerAction } from "@/lib/auth-actions";
import authBg from "@/public/auth-bg.png";

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4 relative" style={{ backgroundImage: `url(${authBg.src})` }}>

            <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Sto<span className="text-indigo-400">rack</span>
                    </h1>
                    <p className="text-indigo-200/60 font-medium">Capture your world, one word at a time.</p>
                </div>

                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden pt-2">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList variant="line" className="grid w-full grid-cols-2 rounded-none border-b border-white/10 h-12 p-0 bg-transparent">
                            <TabsTrigger
                                value="login"
                                className="data-[state=active]:text-indigo-400 text-slate-400 after:bg-indigo-500 after:!-bottom-[3px] font-semibold transition-all duration-200"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="data-[state=active]:text-indigo-400 text-slate-400 after:bg-indigo-500 after:!-bottom-[3px] font-semibold transition-all duration-200"
                            >
                                Register
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-1">

                            <TabsContent value="login">
                                <form onSubmit={(e) => handleSubmit(e, loginAction)}>
                                    <CardHeader className="pt-4">
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
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 shadow-lg shadow-indigo-600/20 transition-all text-sm"
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
                                    <CardHeader className="pt-4">
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
                                    <CardFooter>
                                        <Button
                                            type="submit"
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-10 shadow-lg shadow-indigo-600/20 transition-all text-sm"
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

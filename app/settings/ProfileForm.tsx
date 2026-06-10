"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/lib/profile-actions";
import { Loader2, Camera, Edit2, Lock } from "lucide-react";

interface ProfileFormProps {
    user: {
        id: string;
        username: string;
        avatarUrl?: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [username, setUsername] = useState(user.username);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const [isLoading, setIsLoading] = useState(false);

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("username", username);
            if (currentPassword) formData.append("currentPassword", currentPassword);
            if (newPassword) formData.append("newPassword", newPassword);
            
            const file = fileInputRef.current?.files?.[0];
            if (file) {
                formData.append("avatar", file);
            }

            const result = await updateProfileAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setIsEditingUsername(false);
                setIsEditingPassword(false);
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = 
        username !== user.username || 
        (fileInputRef.current?.files && fileInputRef.current.files.length > 0) || 
        (currentPassword && newPassword);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center text-primary text-3xl font-bold overflow-hidden border">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt={username} className="h-full w-full object-cover" />
                        ) : (
                            username.substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
                
                <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg text-foreground">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">Click the circle to upload a custom avatar</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Username Section */}
                <div className="rounded-lg border p-4 bg-background/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-foreground">Username</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEditingUsername ? "Update your public username" : `@${username}`}
                            </p>
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setIsEditingUsername(!isEditingUsername);
                                if (isEditingUsername) setUsername(user.username); // reset if cancelled
                            }}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            {isEditingUsername ? "Cancel" : "Change"}
                        </Button>
                    </div>
                    {isEditingUsername && (
                        <div className="mt-4 pt-4 border-t">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="New username"
                            />
                        </div>
                    )}
                </div>

                {/* Password Section */}
                <div className="rounded-lg border p-4 bg-background/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-foreground">Security</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEditingPassword ? "Set a secure password" : "Change password"}
                            </p>
                        </div>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                setIsEditingPassword(!isEditingPassword);
                                if (isEditingPassword) {
                                    setCurrentPassword("");
                                    setNewPassword("");
                                }
                            }}
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            {isEditingPassword ? "Cancel" : "Update"}
                        </Button>
                    </div>
                    {isEditingPassword && (
                        <div className="mt-4 pt-4 border-t grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {(hasChanges || isEditingUsername || isEditingPassword) && (
                <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </form>
    );
}

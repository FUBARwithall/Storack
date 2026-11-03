"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PlanKey } from "@/lib/quota";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteUploadedFile, cleanupOrphanedFiles } from "@/lib/actions";
import { Cloud, HardDrive, Trash2, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface UploadedFileDto {
    id: string;
    url: string;
    size: number;
    createdAt: string; // ISO string
}

interface BillingSectionProps {
    userId: string;
    plan: string;
    storageUsedBytes: number;
    uploadedFiles: UploadedFileDto[];
    checkoutUrl: string;
}

export function BillingSection({
    plan,
    storageUsedBytes,
    uploadedFiles: initialFiles,
    checkoutUrl
}: BillingSectionProps) {
    const router = useRouter();
    const [files, setFiles] = useState<UploadedFileDto[]>(initialFiles);
    const [usedBytes, setUsedBytes] = useState(storageUsedBytes);
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
    const [isCleaning, setIsCleaning] = useState(false);

    const planKey = (plan as PlanKey) || "free";
    const currentLimit = PLANS[planKey];
    const percentage = Math.min((usedBytes / currentLimit.maxBytes) * 100, 100);

    const handleDelete = async (url: string) => {
        if (deletingUrl) return;
        setDeletingUrl(url);
        try {
            const res = await deleteUploadedFile(url);
            if (res.success) {
                const deletedFile = files.find(f => f.url === url);
                if (deletedFile) {
                    setUsedBytes(prev => Math.max(0, prev - deletedFile.size));
                }
                setFiles(prev => prev.filter(f => f.url !== url));
                toast.success("File deleted and storage reclaimed!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete file.");
        } finally {
            setDeletingUrl(null);
        }
    };

    const handleCleanOrphans = async () => {
        if (isCleaning) return;
        setIsCleaning(true);
        try {
            const res = await cleanupOrphanedFiles();
            if (res.count > 0) {
                setUsedBytes(prev => Math.max(0, prev - res.reclaimedBytes));
                toast.success(`Cleaned up ${res.count} unused file(s) and reclaimed ${formatBytes(res.reclaimedBytes)}!`);
                router.refresh();
            } else {
                toast.info("No unused media files found.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to clean up unused files.");
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Plan Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card border rounded-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground">Storage Plan</h3>
                        <Badge variant={planKey === "pro" ? "default" : "secondary"} className="h-5">
                            {planKey === "pro" ? "Pro Plan" : "Free Tier"}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {planKey === "pro" 
                            ? "You have full access to premium features and extended storage." 
                            : "Upgrade to Storack Pro to unlock larger uploads and 5GB of storage."}
                    </p>
                </div>
                {planKey === "free" ? (
                    <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md">
                        <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                            <Zap className="mr-2 h-4 w-4" /> Upgrade to Pro
                        </a>
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm">
                        <ShieldCheck className="h-5 w-5" /> Active Subscription
                    </div>
                )}
            </div>

            {/* Storage Usage Visualizer */}
            <div className="p-6 bg-card border rounded-xl space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-foreground font-medium">
                        <HardDrive className="h-4 w-4 text-primary" /> Storage Space
                    </span>
                    <span className="font-medium">
                        {formatBytes(usedBytes)} of {formatBytes(currentLimit.maxBytes)} used
                    </span>
                </div>
                
                <Progress value={percentage} className="h-2 w-full" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% full</span>
                    <span>Max file size: {formatBytes(currentLimit.maxFileBytes)}</span>
                </div>
            </div>

            {/* Media Manager / File Deletion */}
            <div className="p-6 bg-card border rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h4 className="font-medium text-foreground text-sm">Manage Uploaded Media</h4>
                        <p className="text-xs text-muted-foreground">
                            Covers, avatars, and media files stored in the cloud. Delete or purge unused files to free up space.
                        </p>
                    </div>
                    {files.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCleanOrphans}
                            disabled={isCleaning}
                            className="text-xs shrink-0 self-start sm:self-auto h-8 gap-1.5"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            {isCleaning ? "Cleaning..." : "Clean Unused Media"}
                        </Button>
                    )}
                </div>

                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-accent/10">
                        <Cloud className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <span className="text-sm text-muted-foreground">No uploaded files yet.</span>
                    </div>
                ) : (
                    <div className="overflow-hidden border rounded-lg">
                        <div className="max-h-[300px] overflow-y-auto divide-y">
                            {files.map((file) => {
                                const filename = file.url.split("/").pop() || "image.png";
                                return (
                                    <div key={file.id} className="flex justify-between items-center p-3 text-sm hover:bg-accent/20 transition-colors">
                                        <div className="min-w-0 flex-1 pr-4">
                                            <a 
                                                href={file.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="font-medium text-primary hover:underline block truncate text-xs"
                                            >
                                                {filename}
                                            </a>
                                            <span className="text-xs text-muted-foreground block mt-0.5" suppressHydrationWarning>
                                                Uploaded {new Date(file.createdAt).toLocaleDateString()} • {formatBytes(file.size)}
                                            </span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                            disabled={deletingUrl === file.url}
                                            onClick={() => handleDelete(file.url)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

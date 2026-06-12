import { notFound } from "next/navigation";
import { getStoryById, getChapterById } from "@/lib/actions";
import { requireUserId } from "@/lib/auth";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";
import { PrintControls } from "./PrintControls";
import type { Metadata } from "next";

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const story = await getStoryById(id);
    return {
        title: story ? `${story.title} - Manuscript` : "Manuscript Export",
    };
}



export default async function ExportPrintPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{
        chapterId?: string;
        font?: string;
        spacing?: string;
        cover?: string;
        breaks?: string;
    }>;
}) {
    const { id } = await params;
    const { chapterId, font = "serif", spacing = "double", cover = "true", breaks = "true" } = await searchParams;
    const userId = await requireUserId();

    const story = await getStoryById(id);
    if (!story) {
        notFound();
    }

    let chaptersToRender = [...story.chapters].sort((a, b) => a.order - b.order);

    if (chapterId) {
        const chapter = await getChapterById(chapterId);
        if (!chapter || chapter.storyId !== story.id) {
            notFound();
        }
        chaptersToRender = [chapter as any];
    }

    return (
        <div className="bg-white text-black min-h-screen p-8 sm:p-16">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        margin: 1.6cm;
                        @bottom-center {
                            content: counter(page);
                            font-size: 10pt;
                            font-family: inherit;
                            color: #4b5563;
                        }
                    }
                    @page :first {
                        @bottom-center {
                            content: "";
                        }
                    }
                    html, body, main {
                        overflow: visible !important;
                        height: auto !important;
                        position: static !important;
                        background: white;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white;
                        color: black;
                        font-size: 12pt;
                    }
                    .manuscript-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: none !important;
                        min-height: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .page-break {
                        page-break-after: always;
                        break-after: page;
                    }
                }
                body {
                    background-color: #f3f4f6;
                }
                .manuscript-container {
                    background: white;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    max-width: 8.5in;
                    min-height: 11in;
                    margin: 2rem auto;
                    padding: 1in;
                }
                .manuscript-body p {
                    text-indent: 0.5in;
                    margin-bottom: 0;
                    text-align: justify;
                }
                .manuscript-body p:first-of-type {
                    text-indent: 0;
                }
            `}} />

            {/* Float Print Controls for preview mode */}
            <PrintControls />

            {/* Manuscript Sheet */}
            <div className="manuscript-container">
                
                {/* Cover Page */}
                {cover === "true" && (
                    <div className="flex flex-col justify-between h-[9in] border-b pb-8 mb-8 page-break text-center font-serif">
                        <div className="text-right text-sm text-gray-500 uppercase tracking-widest no-print">
                            Manuscript Cover Page
                        </div>
                        <div className="my-auto space-y-4">
                            <h1 className="text-4xl font-bold tracking-tight uppercase">{story.title}</h1>
                            {story.genre && (
                                <p className="text-sm font-semibold tracking-wider text-gray-600 uppercase">{story.genre}</p>
                            )}
                            <div className="w-16 h-0.5 bg-black mx-auto my-6" />
                            {story.synopsis && (
                                <p className="text-sm italic max-w-md mx-auto text-gray-600 px-4">
                                    &ldquo;{story.synopsis}&rdquo;
                                </p>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                            Created on Storack Platform
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className={cn(
                    "manuscript-body leading-relaxed",
                    font === "serif" ? "font-serif" : "font-sans",
                    spacing === "double" ? "leading-loose space-y-4" : "leading-normal space-y-2"
                )}>
                    {chaptersToRender.map((ch, idx) => (
                        <div
                            key={ch.id}
                            className={cn(
                                idx < chaptersToRender.length - 1 && breaks === "true" && "page-break"
                            )}
                        >
                            {/* Chapter Header */}
                            <div className="pt-8 pb-4 mb-6 border-b text-center">
                                <h2 className="text-2xl font-bold uppercase tracking-wide">
                                    Chapter {ch.order}: {ch.title}
                                </h2>
                                <p className="text-[10px] text-gray-400 font-mono mt-1 no-print">
                                    {ch.wordCount} words
                                </p>
                            </div>

                            {/* Chapter HTML Content */}
                            <div
                                className="prose max-w-none text-justify whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ch.content || "") }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Auto trigger print in new window if page loaded */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // Wait for styles and media assets, then trigger print dialog
                window.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                });
            `}} />
        </div>
    );
}

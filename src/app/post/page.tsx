"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PostGeneratorForm } from "@/components/PostGeneratorForm";
import { PromptOptions } from "@/lib/prompts/promptTemplates"

export default function PostPage() {
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [post, setPost] = useState("");

    const handlePostPublish = async (text: string) => {
        setPublishing(true);

        const response = await fetch("/api/post/publish", {
            method: "POST",
            body: JSON.stringify({ text, publish: true }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        setPublishing(false);
        return await response.json();
    };

    const handlePostGeneration = async (data: PromptOptions) => {
        setGenerating(true);
        const response = await fetch("/api/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }).then(async res => {
            const post = await res.json()
            setGenerating(false);
            return post;
        }).catch(err => {
            console.error("Error:", err);
            return;
        }).finally(() => {
            setGenerating(false);
        });

        return response;
    };

    return (
        <main className="flex flex-col items-center p-24">
            <div className="max-w-7xl w-full space-y-8">
                <h1 className="text-4xl font-bold mb-8">News post generator</h1>

                <div className="flex gap-8">
                    <div className="flex-1">
                        <PostGeneratorForm
                            onSubmit={async (data) => {
                                const response = await handlePostGeneration(data);
                                setPost(response);
                            }}
                            isLoading={generating || publishing}
                        />
                    </div>
                    <div className="flex-1">
                        <div
                            className={`p-3 rounded-lg bg-gray-200 text-gray-800 ${!post && 'hidden'}`}
                        >
                            {post && post.toString()}
                        </div>
                    </div>
                </div>
                {post && (
                    <div className="mt-8 border-t pt-8">
                        <h2 className="text-2xl font-bold mb-4">Post to Facebook</h2>
                        <p className="mb-4">Click the button below to post the generated content to your Facebook page.</p>
                        <p className="mb-4 text-sm text-gray-600">Make sure you have set up your Facebook Page ID and Access Token in the environment variables.</p>
                        <Button
                            disabled={publishing}
                            onClick={() => handlePostPublish(post.toString())}
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        >
                            {publishing ? "Publishing..." : "Post to Facebook"}
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}

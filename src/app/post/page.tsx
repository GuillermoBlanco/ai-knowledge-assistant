"use client";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function PostPage() {
    const [loading, setLoading] = useState(false);
    const [post, setPost] = useState("");

    const handlePostMessage = async (text: string) => {
        setLoading(true);

        const response = await fetch("/api/post", {
            method: "POST",
            body: text,
        });
        setLoading(false);
        return await response.json();
    };

    useEffect(() => {
        setLoading(true);
        fetch("/api/post", {
            method: "GET",
        }).then(async res => {
            const post = await res.json()
            setPost(post);
            setLoading(false);
        });
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <div className="max-w-5xl w-full space-y-8">
                <h1 className="text-4xl font-bold mb-8">News post generator</h1>
                <div
                    className={`p-3 rounded-lg max-w-xs bg-gray-200 text-gray-800`}
                >
                    {post && post.toString()}
                </div>
                <Button disabled={!post || loading} onClick={() => post && handlePostMessage(post.toString())} className="ml-4">
                    Post to Facebook
                </Button>
            </div>
        </main>
    );
}

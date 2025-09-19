"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import DocumentUploader from "@/components/DocumentUploader";
import ChatConversation, { Message } from "@/components/ChatConversation";

export default function DashboardPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const storedSessionId = localStorage.getItem("sessionId");

        if (storedSessionId) {
            setSessionId(storedSessionId);
        } else {
            const newSessionId = uuidv4();
            localStorage.setItem("sessionId", newSessionId);
            setSessionId(newSessionId);
        }
    }, []);

    const handleSendMessage = async (text: string) => {
        const response = await fetch("/api/message", {
            method: "POST",
            body: text,
            headers: { sessionId: sessionId || "" },
        });

        if (!response.ok) {
            console.error("Failed to upload file");
            return;
        }

        return await response.json();
    };

    const handleFileUpload = async (file: File) => {
        if (!sessionId) {
            console.error("Session ID is missing.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("sessionId", sessionId);

        setMessages((prev: Message[]) => [
            ...prev,
            { sender: "system", text: `File processing ....`, isTemporary: true },
        ]);

        return await fetch("/api/upload", {
            method: "POST",
            body: formData,
        }).then(res => res.json()).then(result => {
            setMessages((prev: Message[]) => [
                ...prev.filter((message) => !message.isTemporary),
                ...((result.summaries as { summary: string, images: { url?: string, b64_json?: string }[] }[]).map((item) => ({
                    sender: "system" as Message['sender'], text: item.summary, images: item.images,
                }))),
            ]);
            return result;
        }).catch(err => {
            setMessages((prev: Message[]) => [
                ...prev.filter((message) => !message.isTemporary),
                { sender: "system", text: `File processing error: Try again \n\n ${err}`, isTemporary: true },
            ]);
            console.error("Error uploading file:", err);
        });
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-24">
            <div className="max-w-5xl w-full space-y-8">
                <h1 className="text-4xl font-bold mb-8">Document Analysis</h1>
                <DocumentUploader onUpload={handleFileUpload} />
                <ChatConversation messages={messages} setMessages={setMessages} sendMessage={handleSendMessage} />
            </div>
        </main>
    );
}

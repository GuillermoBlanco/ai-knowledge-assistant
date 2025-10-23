"use client";

import { useState } from "react";

import DocumentUploader from "@/components/DocumentUploader";
import ChatConversation, { Message } from "@/components/ChatConversation";

export default function DashboardPage() {
    const [messages, setMessages] = useState<Message[]>([]);


    const handleSendMessage = async (text: string, onChunk?: (chunk: string) => void) => {
        const response = await fetch("/api/message", {
            method: "POST",
            body: text,
        });

        if (!response.ok) {
            console.error("Failed to send message");
            throw new Error("Failed to send message");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (!reader) {
            throw new Error("No response body");
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            
            // Call the onChunk callback if provided for real-time updates
            if (onChunk) {
                onChunk(chunk);
            }
        }

        return fullResponse;
    };

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

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
        <main className="flex flex-col items-center p-24">
            <div className="flex flex-col max-w-5xl w-full space-y-8 max-h-[calc(100vh-16rem)]">
                <h1 className="text-4xl font-bold mb-8">Document Analysis</h1>
                <DocumentUploader onUpload={handleFileUpload} />
                <ChatConversation messages={messages} setMessages={setMessages} sendMessage={handleSendMessage} />
            </div>
        </main>
    );
}

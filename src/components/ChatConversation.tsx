"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

export interface Message {
    sender: "user" | "system";
    text: string;
    images?: { url?: string, b64_json?: string }[];
    isTemporary?: boolean;
}

interface ChatConversationProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    sendMessage: (text: string, onChunk?: (chunk: string) => void) => Promise<string>;
}

export default function ChatConversation({ messages, setMessages, sendMessage }: ChatConversationProps) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        setLoading(true);

        const userMessage: Message = { sender: "user", text: input };
        const streamingMessage: Message = {
            sender: "system",
            text: "",
            isTemporary: false,
        };
        setMessages((prev: Message[]) => [...prev, userMessage, streamingMessage]);
        setInput("");

        try {
            await sendMessage(input, (chunk: string) => {
                // Update the streaming message in real-time
                setMessages((prev: Message[]) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.sender === "system") {
                        lastMsg.text += chunk;
                    }
                    return updated;
                });
            });
        } catch {
            setMessages((prev: Message[]) => {
                const filtered = prev.slice(0, -1); // Remove the streaming message
                return [...filtered, { 
                    sender: "system", 
                    text: "Failed to get response. Please try again.", 
                    isTemporary: true 
                }];
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 border rounded-lg bg-white dark:bg-slate-950">
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`rounded-lg max-w-md ${message.sender === "user"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800 dark:bg-slate-800 dark:text-white"
                                }`}
                        >
                            <div className="p-3">
                                {message.text}
                            </div>
                            {message.images && message.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 px-3 pb-3">
                                    {message.images.map(({ url, b64_json }, idx) => (
                                        <Image
                                            key={idx}
                                            src={url || `data:image/png;base64,${b64_json}`}
                                            alt={`Generated ${idx}`}
                                            width={300}
                                            height={300}
                                            className="max-w-xs rounded-md border border-opacity-30 border-white"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-300 flex items-center gap-2 flex-shrink-0">
                <input
                    type="text"
                    disabled={loading}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg p-2"
                />
                <Button
                    disabled={loading || !input.trim()}
                    onClick={handleSendMessage}
                    className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 ${loading || !input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    Send
                </Button>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";

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
    sendMessage: (text: string) => Promise<string>;
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
        const loadingMessage: Message = {
            sender: "system",
            text: "Processing your input...",
            isTemporary: true,
        };
        setMessages((prev: Message[]) => [...prev, userMessage, loadingMessage]);
        setInput("");

        await sendMessage(input).then((result: string) => {
            const systemMessage: Message = { sender: "system", text: result };
            setMessages((prev: Message[]) => [...prev.filter((message) => !message.isTemporary), systemMessage]);
            setLoading(false);
        }).catch(() => {
            setMessages((prev: Message[]) => [...prev.filter((message) => !message.isTemporary), { sender: "system", text: "Failed to get response. Please try again.", isTemporary: true }]);
        }).finally(() => setLoading(false)
        );

    };

    return (
        <div className="flex flex-col flex-1 min-h-0 border rounded-lg bg-white dark:bg-slate-950">
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message, index) => {
                    const images = message.images ? message.images.map(({ url, b64_json }, idx) => (
                        url ? <img key={idx} src={url} alt={`Generated ${idx}`} className="mt-2 max-w-full rounded" /> :
                            <img key={idx} src={`data:image/png;base64,${b64_json}`} alt={`Generated ${idx}`} className="mt-2 max-w-full rounded" />
                    )) : null;

                    return (
                        <div
                            key={index}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`p-3 rounded-lg max-w-xs ${message.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-800"
                                    }`}
                            >
                                {message.text}
                            </div>
                            {images && <div className="ml-4">{images}</div>}
                        </div>
                    )
                })}
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

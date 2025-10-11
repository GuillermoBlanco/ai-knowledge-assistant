"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PromptOptions, Role, Style, Tone, Language, defaultOptions } from "@/lib/prompts/promptTemplates";

interface PostGeneratorFormProps {
    onSubmit: (data: PromptOptions) => void;
    isLoading: boolean;
}

const { role, tone, style, language, customInstructions } = defaultOptions;

export function PostGeneratorForm({ onSubmit, isLoading }: PostGeneratorFormProps) {
    const [urls, setUrls] = useState<string[]>([]);
    const [formData, setFormData] = useState<Omit<PromptOptions, 'urls'>>({
        role,
        tone,
        style,
        language,
        customInstructions,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validUrls = urls.filter(Boolean);
        onSubmit({
            ...formData,
            ...(validUrls.length > 0 ? { urls: validUrls } : {}),
        });
    };

    const addUrlField = () => setUrls([...urls, '']);
    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium">URLs (optional)</label>
                {urls.map((url, index) => (
                    <Input
                        key={index}
                        type="url"
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                        placeholder="Enter URL"
                        className="w-full mb-2"
                    />
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={addUrlField}
                    className="mt-2"
                >
                    Add URL
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Role</label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                        className="w-full border border-gray-300 rounded-lg p-2"
                    >
                        <option value="journalist">Journalist</option>
                        <option value="editor">Editor</option>
                        <option value="expert">Expert</option>
                        <option value="professor">Professor</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Tone</label>
                    <select
                        value={formData.tone}
                        onChange={(e) => setFormData({ ...formData, tone: e.target.value as Tone })}
                        className="w-full border border-gray-300 rounded-lg p-2"
                    >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                        <option value="friendly">Friendly</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Style</label>
                    <select
                        value={formData.style}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value as Style })}
                        className="w-full border border-gray-300 rounded-lg p-2"
                    >
                        <option value="detailed">Detailed</option>
                        <option value="concise">Concise</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Language</label>
                    <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
                        className="w-full border border-gray-300 rounded-lg p-2"
                    >
                        <option value="es">Spanish</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Custom Instructions</label>
                <Textarea
                    value={formData.customInstructions}
                    onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                    placeholder="Add any specific instructions for the post generation"
                    className="w-full"
                />
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className={`bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {isLoading ? "Generating..." : "Generate Post"}
            </Button>
        </form>
    );
}
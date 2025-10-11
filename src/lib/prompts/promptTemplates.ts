import { PromptTemplate } from "@langchain/core/prompts";
import { communityManagerPrompt, customCommunityManagerPrompt, taskPrompt } from "@/lib/prompts/assistantPrompt";

export const promptOptionValues = {
    role: ["journalist", "editor", "expert", "professor"] as const,
    tone: ["formal", "casual", "technical", "friendly"] as const,
    style: ["detailed", "concise"] as const,
    language: ["es", "en"] as const,
};

export type Role = typeof promptOptionValues.role[number];
export type Tone = typeof promptOptionValues.tone[number];
export type Style = typeof promptOptionValues.style[number];
export type Language = typeof promptOptionValues.language[number];


export interface PromptOptions {
    role?: Role;
    tone?: Tone;
    style?: Style;
    language?: Language;
    customInstructions?: string;
    urls?: string[];
}

export const defaultOptions: Required<PromptOptions> = {
    role: promptOptionValues.role[0],
    tone: promptOptionValues.tone[0],
    language: promptOptionValues.language[1],
    style: promptOptionValues.style[0],
    urls: [],
    customInstructions: ' ',
};

// Base templates for different tasks
export const promptTemplates = {
    browserSearch: new PromptTemplate({
        template: `Analize the pages content and generate summaries:\n{content}. ${taskPrompt}`,
        inputVariables: ["content", "language"],
    }),
    newsPost: new PromptTemplate({
        template: `${customCommunityManagerPrompt} ${taskPrompt}`,
        inputVariables: ["role", "tone", "style", "customInstructions", "language"],
    }),

    defaultNews: new PromptTemplate({
        template: `${communityManagerPrompt} ${taskPrompt}`,
        inputVariables: ["language"],
    }),
};

export function generatePrompt(options: PromptOptions = {}) {
    const mergedOptions = { ...defaultOptions, ...options };
    const template = options.urls?.length ? promptTemplates.newsPost : promptTemplates.defaultNews;

    if (!options.urls?.length) {
        return template.format(mergedOptions);
    }

    return template.format({
        role: mergedOptions.role,
        tone: mergedOptions.tone,
        style: mergedOptions.style,
        language: mergedOptions.language,
        customInstructions: mergedOptions.customInstructions,
    });
}
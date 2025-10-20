import https from "https";
import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { WebBrowser } from "langchain/tools/webbrowser";

import { generatePrompt, promptTemplates, PromptOptions } from "@/lib/prompts/promptTemplates";
import { sanitizeUrls, sanitizeInput } from "@/lib/utils/urlUtils";

const router = createRouter<NextApiRequest, NextApiResponse>();

const DEFAULT_SOURCES = process.env.DEFAULT_SOURCES ? process.env.DEFAULT_SOURCES.split(',') : ['www.google.es'];

const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: AI_MODEL,
    // temperature: 0.2, // Disabled temperature for deterministic outputs 
    ...isDevMode && { configuration: developmentConfiguration },
});


const embeddings = new OpenAIEmbeddings({
    ...isDevMode && { configuration: developmentConfiguration },
});

const browser = new WebBrowser({
    model: model, embeddings, axiosConfig: {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }
});

router.post(async (req, res) => {
    const { urls = DEFAULT_SOURCES, language, ...options }: PromptOptions = req.body;
    const validUrls = sanitizeUrls(Array.isArray(urls) ? urls : [urls]);

    const sanitizedOptions = {
        ...options,
        language,
        urls: validUrls,
        customInstructions: options.customInstructions ? sanitizeInput(options.customInstructions) : ' ',
    };


    const fetchPages = RunnableMap.from(
        Object.fromEntries(
            validUrls.map((url, i) => [`page_${i + 1}`, async () => browser.invoke(url)])
        )
    );

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            await generatePrompt(sanitizedOptions)
        ],
        ["human", "{task}"]
    ]);

    const summarize = async (pages: { [s: string]: unknown; } | ArrayLike<unknown>) => {
        const content = Object.entries(pages)
            .map(([k, v]) => `${k}:\n${v}`)
            .join("\n\n");

        const task = await promptTemplates.browserSummary.format({ content, language });
        const res = await model.invoke(await prompt.format({ ...sanitizedOptions, task }));
        return res.content;
    };

    const chain = RunnableSequence.from([
        fetchPages,
        summarize,
        new StringOutputParser(),
    ]);

    const response = await chain.invoke({});
    res.status(200).json(response);
});


const apiRoute = router.handler({
    onError: (error, req: NextApiRequest, res: NextApiResponse) => {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    },
    onNoMatch(req: NextApiRequest, res: NextApiResponse) {
        res.status(405).json({ error: "Method Not Allowed" });
    },
});


export const config = {
    api: {
        bodyParser: true, // Enable body parsing for JSON requests
    },
};

export default apiRoute;


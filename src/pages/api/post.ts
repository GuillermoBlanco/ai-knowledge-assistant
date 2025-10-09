import https from "https";

import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { WebBrowser } from "langchain/tools/webbrowser";

import { communityManagerPrompt, taskPrompt } from "@/lib/prompts/assistantPrompt";

const router = createRouter<NextApiRequest, NextApiResponse>();

const ACCESS_TOKEN = process.env.FACEBOOK_API_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

const URLS = [
    // "https://www.eldiario.es",
    // "https://www.huffingtonpost.es/news/burgos",
    "https://www.burgosconecta.es",
    "https://www.diariodeburgos.es",
    "https://www.elcorreodeburgos.com",
    // "https://www.noticiasburgos.com",
    "https://www.burgosnoticias.com",
];

const AI_MODEL = process.env.AI_MODEL_MINI || 'gpt-4o-mini';
const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: AI_MODEL,
    temperature: 0.2,
    ...isDevMode && { configuration: developmentConfiguration },
});

const embeddings = new OpenAIEmbeddings({
    ...isDevMode && { configuration: developmentConfiguration },
});

const browser = new WebBrowser({
    model, embeddings, axiosConfig: {
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    }
});

router.get(async (req, res) => {

    const fetchPages = RunnableMap.from(
        Object.fromEntries(
            URLS.map((url, i) => [`page_${i + 1}`, async () => browser.invoke(url)])
        )
    );

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            communityManagerPrompt,
        ],
        ["human", "{task}"]
    ]);

    const summarize = async (pages: { [s: string]: unknown; } | ArrayLike<unknown>) => {
        const fullSummary = Object.entries(pages)
            .map(([k, v]) => `${k}:\n${v}`)
            .join("\n\n");

        const task = await taskPrompt.format({ fullSummary });
        const res = await model.invoke(await prompt.format({ task }));
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

router.post(async (req, res) => {
    const text = req.body;
    let response;

    const formData = new FormData();
    formData.append('message', text);
    formData.append('formatting', 'MARKDOWN');
    try {
        response = await fetch(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed?access_token=${ACCESS_TOKEN}`, {
            method: "POST",
            body: formData,
        });
    } catch (error) {
        console.error("Error posting to Facebook:", error);
    }
    res.status(200).json(response?.body);
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


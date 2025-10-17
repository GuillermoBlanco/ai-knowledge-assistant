import { NextApiRequest, NextApiResponse } from "next";
import { parse } from 'cookie';
import { createRouter } from "next-connect";

import { addTextsToSession, getSessionRetriever } from "@/lib/vectorstore";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

const AI_MODEL = process.env.AI_MODEL_MINI || 'gpt-4o-mini';
const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };

const router = createRouter<NextApiRequest, NextApiResponse>();

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: AI_MODEL,
    // temperature: 0.2, // Disabled temperature for deterministic outputs
    ...isDevMode && { configuration: developmentConfiguration },
});

router.post(async (req, res) => {
    const cookieHeader = req.headers.cookie || '';
    const cookies = parse(cookieHeader);
    const sessionId = cookies.sid;

    const userMessage = req.body;

    if (!sessionId || !userMessage) {
        return res.status(400).json({ error: "Missing sessionId or message" });
    }

    const retriever = getSessionRetriever(sessionId, 4);
    if (!retriever) {
        return res.status(200).json(
            "No hay documentos para esta sesión. Sube un archivo para habilitar respuestas basadas en contexto."
        );
    }

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "Eres un asistente que responde exclusivamente en base al CONTEXTO proporcionado. Si la respuesta no está en el contexto, responde exactamente: 'No encontrado en el documento'.\n\nCONTEXTO:\n{context}"
        ],
        ["human", "{question}"]
    ]);

    const chain = RunnableSequence.from([
        {
            context: retriever.pipe(formatDocumentsAsString),
            question: new RunnablePassthrough(),
        },
        prompt,
        model,
        new StringOutputParser(),
    ]);

    const systemResponse = await chain.invoke(userMessage);

    await addTextsToSession(sessionId, [
        JSON.stringify({ role: "user", content: userMessage }),
        JSON.stringify({ role: "system", content: systemResponse })
    ])

    res.status(200).json(systemResponse);
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


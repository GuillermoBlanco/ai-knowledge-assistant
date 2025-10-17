import { NextApiRequest, NextApiResponse } from "next";
import { parse } from 'cookie';
import { createRouter } from "next-connect";
import formidable from "formidable";

import { ChatOpenAI, DallEAPIWrapper } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import { extractFileText, splitFileContent } from "@/lib/text";
import { addTextsToSession } from "@/lib/vectorstore";
import { imagePrompt } from "@/lib/prompts/promptTemplates";

interface NextApiRequestWithFiles extends NextApiRequest {
    fields?: { sessionId?: string | Array<string> | undefined; extractedText?: string };
    files?: { file?: Array<{ filepath?: string; mimetype?: string; originalFilename?: string }> };
}
type ImageSize = "1024x1024" | "256x256" | "512x512" | "1792x1024" | "1024x1792";

const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };
const AI_MODEL = process.env.AI_MODEL_MINI || "gpt-4.1-mini";
const AI_MODEL_IMAGE = process.env.AI_MODEL_IMAGE || "dall-e-2";
const AI_MODEL_IMAGE_RESOLUTION = (process.env.AI_MODEL_IMAGE_RESOLUTION as ImageSize) || "512x512";

const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: AI_MODEL,
    ...isDevMode && { configuration: developmentConfiguration },
    // temperature: 0.2 // Disabled temperature for deterministic outputs
});

const router = createRouter<NextApiRequestWithFiles, NextApiResponse>();

const formMiddleWare = (
    req: NextApiRequest | NextApiRequestWithFiles,
    res: NextApiResponse,
    next: (arg0: string | null) => void
) => {
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err: string, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
            console.error("Error parsing the files", err);
            next(err);
            return;
        }

        const extractedText = await extractFileText(files);

        (req as NextApiRequestWithFiles).fields = { ...fields, extractedText };
        (req as NextApiRequestWithFiles).files = files;

        next(null);
    });
};

const summarizeChunksMiddleWare = async (
    req: NextApiRequestWithFiles,
    res: NextApiResponse,
    next: (arg0: string | null) => void
) => {
    type ImageData = { url?: string; b64_json?: string };
    type ChunkResult = {
        chunk: number;
        summary: string | null;
        images?: ImageData[];
    };

    const extractedText = req.fields?.extractedText || "";
    const chunks = (await splitFileContent(extractedText)) || [];

    const summaryPrompt = ChatPromptTemplate.fromMessages([
        [
            "human",
            "Part {part} of the document:\n\n{chunk}\n\nMake a brief summary. So it could later be used for a complete document summary.",
        ],
    ]);

    async function processChunk(
        chunkText: string,
        i: number,
    ): Promise<ChunkResult> {
        const chunkNumber = i + 1;

        let responseMsg = null;
        let summary: string | null = null;

        try {
            const messages = await summaryPrompt.formatMessages({ part: chunkNumber, chunk: chunkText });
            responseMsg = await chatModel.invoke(messages);
            summary = typeof responseMsg?.content === "string" ? responseMsg.content : null;

            const cookieHeader = req.headers.cookie || '';
            const sid = parse(cookieHeader)?.sid;
            const sessionId = sid || "";

            if (sessionId) {
                await addTextsToSession(sessionId, [chunkText, summary || ""]);
            }
        } catch (err) {
            console.error(`Error processing chunk ${chunkNumber}:`, err);
        }

        return {
            chunk: chunkNumber,
            summary,
        };
    }

    const results = await Promise.allSettled(
        chunks.map((chunkText, i) =>
            processChunk(chunkText, i)
        )
    );

    const summaries: ChunkResult[] = new Array(chunks.length);
    let allSummaries = "";

    results.forEach((res, i) => {
        if (res.status === "fulfilled") {
            summaries[i] = res.value;
            allSummaries += res.value.summary || "";
        } else {
            console.error(`Chunk ${i + 1} failed unexpectedly:`, res.reason);
            summaries[i] = { chunk: i + 1, summary: null };
        }
    });

    // Generate images once with combined summaries
    let images: ImageData[] | undefined = undefined;
    if (!isDevMode && allSummaries) {
        try {
            const client = new DallEAPIWrapper({
                apiKey: process.env.OPENAI_API_KEY,
                model: AI_MODEL_IMAGE,
                n: 1,
                responseFormat: 'b64_json',
                size: AI_MODEL_IMAGE_RESOLUTION,
            });
            const prompt = await imagePrompt.format({ summary: allSummaries });
            const imageRes = await client.invoke(prompt);

            const image64 = imageRes?.data?.[0]?.b64_json || imageRes?.data?.[0]?.image_url || imageRes;
            if (typeof image64 === "string" && image64.length > 0) {
                images = [{ b64_json: image64, url: undefined }];
            }
        } catch (err) {
            console.error("Error generating image:", err);
        }
    }

    // Add summary result with images
    summaries.push({
        chunk: summaries.length + 1,
        summary: null,
        ...(images?.length ? { images } : {}),
    });

    res.json({ summaries });
    next(null);
};

router.post(formMiddleWare, summarizeChunksMiddleWare, (req: NextApiRequestWithFiles, res) => {
    const file = req.files?.file;

    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    if (Array.isArray(file) && file.length > 1) {
        return res.status(400).json({ error: "Multiple files uploaded. Please upload a single file." });
    } else if (Array.isArray(file)) {
        return res.status(200).json({ message: "File uploaded successfully", fileName: file[0].originalFilename });
    }
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
        bodyParser: false, // Disable Next.js body parsing to use formidable
    },
};

export default apiRoute;

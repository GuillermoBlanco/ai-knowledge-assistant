import { NextApiRequest, NextApiResponse } from "next";
import { parse } from 'cookie';
import { createRouter } from "next-connect";
import formidable from "formidable";
import { OpenAI } from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { extractFileText, splitFileContent } from "@/lib/text";
import { addTextsToSession } from "@/lib/vectorstore";

interface NextApiRequestWithFiles extends NextApiRequest {
    fields?: { sessionId?: string | Array<string> | undefined; extractedText?: string };
    files?: { file?: Array<{ filepath?: string; mimetype?: string; originalFilename?: string }> };
}

const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };
const AI_MODEL = process.env.AI_MODEL_MINI || "gpt-4.1-mini";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: AI_MODEL,
    ...isDevMode && { configuration: developmentConfiguration },
    temperature: 0.2
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
            "system",
            "Responde exclusivamente en base al documento cargado. Si no está en el documento, responde 'No encontrado en el documento'.",
        ],
        [
            "human",
            "Parte {part} del documento:\n\n{chunk}\n\nHaz un resumen en 5 viñetas utilizando emojis para resaltar lo importante.",
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
        } catch (err) {
            console.error(`Error processing chunk ${chunkNumber}:`, err);
            summary = null;
        }

        let images: ImageData[] | undefined = undefined;
        if (!isDevMode && summary) {
            try {
                const imageRes = await client.images.generate({
                    model: "dall-e-3",
                    prompt:
                        `Crea una imagen fotográfica representativa de gran detalle de cada una de las viñetas ` +
                        `para el siguiente resumen del documento, usando un estilo moderno y colores vibrantes: ${summary}`,
                    n: 1,
                    size: "1024x1024",
                });

                const image64 = imageRes?.data?.[0]?.b64_json;
                if (typeof image64 === "string" && image64.length > 0) {
                    images = [{ b64_json: image64, url: undefined }];
                } else {
                    console.warn(`No image generated for chunk ${chunkNumber}`);
                }
            } catch (err) {
                console.error(`Error generating image for chunk ${chunkNumber}:`, err);
            }
        }

        try {
            const cookieHeader = req.headers.cookie || '';
            const sid = parse(cookieHeader)?.sid;
            const sessionId = sid || "";

            if (sessionId) {
                await addTextsToSession(sessionId, [chunkText, summary || ""]);
            }
        } catch (err) {
            console.error(`Error saving to session for chunk ${chunkNumber}:`, err);
        }

        return {
            chunk: chunkNumber,
            summary,
            ...(images?.length ? { images } : {}),
        };
    }
    const results = await Promise.allSettled(
        chunks.map((chunkText, i) =>
            processChunk(chunkText, i)
        )
    );

    const summaries: ChunkResult[] = new Array(chunks.length);
    results.forEach((res, i) => {
        if (res.status === "fulfilled") {
            summaries[i] = res.value;
        } else {
            console.error(`Chunk ${i + 1} failed unexpectedly:`, res.reason);
            summaries[i] = { chunk: i + 1, summary: null }; // Marcamos el fallo sin romper nada
        }
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

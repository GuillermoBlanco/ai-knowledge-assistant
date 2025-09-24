import { NextApiRequest, NextApiResponse } from "next";
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

const AI_MODEL = process.env.AI_MODEL_MINI || "gpt-4.1-mini";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const chatModel = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY, model: AI_MODEL, temperature: 0.2 });

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

    const extractedText = req.fields?.extractedText || "";
    const chunks = (await splitFileContent(extractedText)) || [];

    const summaries: Array<{
        chunk: number;
        summary: string | null;
        images?: Array<{ url?: string; base64_json?: string }>;
    }> = [];

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

    await Promise.all(
        chunks.map(async (chunkText, i) => {
            try {
                const messages = await summaryPrompt.formatMessages({ part: i + 1, chunk: chunkText });
                console.log("Messages for chunk", i + 1, messages);
                const responseMsg = await chatModel.invoke(messages);

                const imagesResponse = await client.images
                    .generate({
                        // model: "gpt-image-1",
                        model: "dall-e-3",
                        prompt: `Crea una imagen fotográfica representativa de gran detalle de cada una de las viñetas para el siguiente resumen del documento, usando un estilo moderno y colores vibrantes: ${typeof responseMsg?.content === "string" ? responseMsg.content : ""
                            }`,
                        n: 1,
                        size: "1024x1024",
                    })
                    .then((imageRes) => {
                        const image64 = imageRes?.data && imageRes?.data[0]?.b64_json;
                        if (!image64) throw new Error("No image generated");
                        return { data: [{ b64_json: image64, url: undefined }] };
                    })
                    .catch((err) => {
                        console.error("Error generating image:", err);
                        return { data: [{ url: undefined, b64_json: undefined }] };
                    });

                const summary = typeof responseMsg?.content === "string" ? responseMsg.content : null;
                summaries.push({
                    chunk: i + 1,
                    summary,
                    ...(imagesResponse.data?.length
                        ? {
                            images: imagesResponse.data
                                .map((img: { url?: string; b64_json?: string }) => img)
                                .filter((img: { url?: string; b64_json?: string }) => typeof img.url === "string" || typeof img.b64_json === "string"),
                        }
                        : {}),
                });

                // Store chunk in LangChain MemoryVectorStore scoped by session
                const sessionIdRaw = req.fields?.sessionId;
                const sessionId = Array.isArray(sessionIdRaw) ? sessionIdRaw[0] : sessionIdRaw ?? "";
                if (sessionId) {
                    await addTextsToSession(sessionId, [chunkText]);
                }
            } catch (error) {
                console.error(`Error processing chunk ${i + 1}:`, error);
            }
        })
    );

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

import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { OpenAI } from "openai";

import formidable from 'formidable'

import { updateSessionContext } from "@/lib/session";
import { extractFileText, splitFileContent } from "@/lib/text";

interface NextApiRequestWithFiles extends NextApiRequest {
    fields?: { sessionId?: string | Array<string> | undefined, extractedText?: string };
    files?: { file?: Array<{ filepath?: string; mimetype?: string, originalFilename?: string }> };
};

const AI_MODEL = process.env.AI_MODEL_TURBO || 'gpt-3.5-turbo';
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const router = createRouter<NextApiRequestWithFiles, NextApiResponse>();

const formMiddleWare = (req: NextApiRequest | NextApiRequestWithFiles, res: NextApiResponse, next: (arg0: string | null) => void) => {
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err: string, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
            console.error('Error parsing the files', err);
            next(err);
            return;
        }

        const extractedText = await extractFileText(files);


        (req as NextApiRequestWithFiles).fields = { ...fields, extractedText };
        (req as NextApiRequestWithFiles).files = files;

        next(null);
    });
};

const summarizeChunksMiddleWare = async (req: NextApiRequestWithFiles, res: NextApiResponse, next: (arg0: string | null) => void) => {

    const systemPrompt: { role: "system" | "user", content: string } = {
        role: "system",
        content:
            "Eres un asistente que responde exclusivamente en base al documento cargado. Si no está en el documento, responde 'No encontrado en el documento'."
    };

    const extractedText = req.fields?.extractedText || '';

    const chunks = await splitFileContent(extractedText) || [];

    const summaries = [];
    for (let i = 0; i < chunks.length; i++) {

        const response = await client.chat.completions.create({
            model: AI_MODEL,
            messages: [
                systemPrompt,
                {
                    role: "user",
                    content: `Parte ${i + 1} del documento:\n\n${chunks[i]}\n\nHaz un resumen en 5 viñetas.`
                }
            ],
            temperature: 0.2
        }).catch(err => {
            console.error('Error generating summary:', err);
            return { choices: [{ message: { content: 'Error generating summary' } }] };
        });

        summaries.push({
            chunk: i + 1,
            summary: response.choices[0].message.content
        });

        const sessionIdRaw = req.fields?.sessionId;
        const sessionId = Array.isArray(sessionIdRaw)
            ? sessionIdRaw[0]
            : sessionIdRaw ?? '';
        if (sessionId) summaries.map(async ({ chunk, summary }) => {
            await updateSessionContext(sessionId, [
                ...((chunk === 1) ? [systemPrompt] : []),
                {
                    role: "user",
                    content: `Parte ${chunk} del documento:\n\n${chunks[chunk - 1]}\n\nHaz un resumen en 5 viñetas.`
                },
                { role: "system", content: summary || ' ' }
            ]);
        })
    }

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
        // Process the file (e.g., extract content from PDF, TXT, or DOCX)
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


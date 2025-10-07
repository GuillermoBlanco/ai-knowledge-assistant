import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { OpenAI } from "openai";

import formidable from 'formidable'

import { updateSessionContext } from "@/lib/session";
import { extractTextFromBuffer, splitFileContent } from "@/lib/text";
import { insertEmbedding } from '@/lib/embeddings';
import { Writable } from "stream";

interface NextApiRequestWithFiles extends NextApiRequest {
    fields?: { sessionId?: string | Array<string> | undefined, extractedText?: string };
    files?: { file?: Array<{ filepath?: string; mimetype?: string, originalFilename?: string }> };
    fileBuffer?: Buffer;
};

const AI_MODEL = process.env.AI_MODEL_TURBO || 'gpt-3.5-turbo';
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const router = createRouter<NextApiRequestWithFiles, NextApiResponse>();

const formMiddleWare = (req: NextApiRequest | NextApiRequestWithFiles, res: NextApiResponse, next: (arg0: string | null) => void) => {
    const form = formidable({
        keepExtensions: true,
        fileWriteStreamHandler: () => {
            const chunks: Buffer[] = [];
            return new Writable({
                write(chunk, encoding, callback) {
                    chunks.push(Buffer.from(chunk));
                    callback();
                },
                final(callback) {
                    (req as NextApiRequestWithFiles).fileBuffer = Buffer.concat(chunks);
                    callback();
                },
            });
        }
    });

    form.parse(req, async (err: string, fields: formidable.Fields, files: formidable.Files) => {
        if (err) {
            console.error('Error parsing the files', err);
            next(err);
            return;
        }

        const fileBuffer = (req as NextApiRequestWithFiles).fileBuffer;
        const extractedText = fileBuffer && await extractTextFromBuffer(fileBuffer);

        (req as NextApiRequestWithFiles).fields = { ...fields, extractedText };
        (req as NextApiRequestWithFiles).files = files;

        next(null);
    });
};

const generateAndStoreEmbeddings = async (text: string) => {
    try {
        const response = await client.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
        });

        const embedding = response.data[0].embedding;

        insertEmbedding(text, embedding, (err: string) => {
            if (err) {
                console.error('Error inserting embedding into database:', err);
            } else {
                console.log('Embedding successfully stored in database.');
            }
        });
    } catch (error) {
        console.error('Error generating embeddings:', error);
    }
};

const summarizeChunksMiddleWare = async (req: NextApiRequestWithFiles, res: NextApiResponse, next: (arg0: string | null) => void) => {

    const systemPrompt: { role: "system" | "user", content: string } = {
        role: "system",
        content:
            "Eres un asistente que responde exclusivamente en base al documento cargado. Si no está en el documento, responde 'No encontrado en el documento'."
    };

    const extractedText = req.fields?.extractedText || '';

    const chunks = await splitFileContent(extractedText) || [];

    const summaries: Array<{ chunk: number, summary: string | null, images?: Array<{ url?: string, base64_json?: string }> }> = [];
    await Promise.all(
        chunks.map(async (chunkText, i) => {
            try {
                const response = await client.chat.completions.create({
                    model: AI_MODEL,
                    messages: [
                        systemPrompt,
                        {
                            role: "user",
                            content: `Parte ${i + 1} del documento:\n\n${chunkText}\n\nHaz un resumen en 5 viñetas utilizando emojis para resaltar importante.`
                        }
                    ],
                    temperature: 0.2
                }).catch(err => {
                    console.error('Error generating summary:', err);
                    return { choices: [{ message: { content: 'Error generating summary' } }] };
                });

                const imagesResponse = await client.images.generate({
                    model: "gpt-image-1",
                    prompt: `Crea una imagen fotográfica representativa de gran detalle de cada una de las viñetas para el siguiente resumen del documento, usando un estilo moderno y colores vibrantes: ${response.choices[0].message.content}`,
                    n: 1,
                    size: "1024x1024",
                }).then((imageRes) => {
                    const image64 = imageRes?.data && imageRes?.data[0]?.b64_json;
                    if (!image64) throw new Error('No image generated');
                    return { data: [{ b64_json: image64, url: undefined }] };
                }).catch(err => {
                    console.error('Error generating image:', err);
                    return { data: [{ url: undefined, b64_json: undefined }] };
                });


                const summary = response.choices[0].message.content;
                summaries.push({
                    chunk: i + 1,
                    summary,
                    ...(imagesResponse.data?.length
                        ? {
                            images: imagesResponse.data.map(img => img).filter(
                                (img: { url?: string, b64_json?: string }) =>
                                    typeof img.url === 'string' || typeof img.b64_json === 'string'
                            )
                        }
                        : {})
                });

                // Store embeddings for the chunk
                await generateAndStoreEmbeddings(chunkText);

                const sessionIdRaw = req.fields?.sessionId;
                const sessionId = Array.isArray(sessionIdRaw)
                    ? sessionIdRaw[0]
                    : sessionIdRaw ?? '';
                if (sessionId) {
                    await updateSessionContext(sessionId, [
                        ...((i === 0) ? [systemPrompt] : []),
                        {
                            role: "user",
                            content: `Parte ${i + 1} del documento:\n\n${chunkText}\n\nHaz un resumen en 5 viñetas.`
                        },
                        { role: "system", content: summary || ' ' }
                    ]);
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
        externalResolver: true,
        bodyParser: false, // Disable Next.js body parsing to use formidable
    },
};

export default apiRoute;


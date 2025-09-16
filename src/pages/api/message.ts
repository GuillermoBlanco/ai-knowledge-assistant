import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

import { OpenAI } from "openai";
import { getSessionContext, updateSessionContext } from "@/lib/session";

const router = createRouter<NextApiRequest, NextApiResponse>();

const AI_MODEL = process.env.AI_MODEL_MINI || 'gpt-4o-mini';
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


router.post(async (req, res) => {
    const sessionId = req.headers.sessionid as string;
    const userMessage = req.body;

    if (!sessionId || !userMessage) {
        return res.status(400).json({ error: "Missing sessionId or message" });
    }

    const sessionContext = await getSessionContext(sessionId);

    const response = await client.chat.completions.create({
        model: AI_MODEL,
        messages: [
            ...sessionContext,
            {
                role: "user",
                content: userMessage,
            }
        ],
        temperature: 0.2
    });

    const systemResponse = response.choices[0].message.content || 'No response';

    await updateSessionContext(sessionId, [
        { role: "user", content: userMessage },
        { role: "system", content: systemResponse }
    ]);

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


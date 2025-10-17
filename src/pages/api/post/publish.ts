import { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

const ACCESS_TOKEN = process.env.FACEBOOK_API_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

router.post(async (req, res) => {
    const { text, publish = false }: { text: string, publish?: boolean } = req.body;

    try {
        if (text && publish) {
            const formData = new FormData();
            formData.append('message', text);
            formData.append('formatting', 'MARKDOWN');

            const response = await fetch(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed?access_token=${ACCESS_TOKEN}`, {
                method: "POST",
                body: formData,
            });

            return res.status(200).json(await response.json());
        }
        return res.status(400).json({ message: "No action taken. Provide 'text' and set 'publish' to true to post." });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error processing request" });
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
        bodyParser: true, // Enable body parsing for JSON requests
    },
};

export default apiRoute;


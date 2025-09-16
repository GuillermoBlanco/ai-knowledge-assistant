interface Message {
    role: "user" | "system";
    content: string;
}

interface Session {
    sessionId: string;
    messages: Message[];
}

const sessionStore: Record<string, Session> = {};

export async function getSessionContext(sessionId: string): Promise<Message[]> {
    const session = sessionStore[sessionId];
    return session ? session.messages : [];
}

export async function updateSessionContext(sessionId: string, newMessages: Message[]): Promise<void> {
    if (!sessionStore[sessionId]) {
        sessionStore[sessionId] = { sessionId, messages: [] };
    }

    sessionStore[sessionId].messages.push(...newMessages);
}

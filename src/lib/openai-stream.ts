import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";

const AI_MODEL = process.env.AI_MODEL_MINI || 'gpt-4o-mini';
const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };

/**
 * Creates a streaming response from the LangChain chain
 * @param retriever - The vector store retriever for context
 * @param userMessage - The user's message
 * @param sessionId - The session ID for storing chat history
 * @returns ReadableStream for SSE
 */
export async function createLangChainStream(
    retriever: VectorStoreRetriever,
    userMessage: string
): Promise<ReadableStream> {
    const model = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: AI_MODEL,
        streaming: true,
        ...isDevMode && { configuration: developmentConfiguration },
    });

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

    const encoder = new TextEncoder();

    // Create a readable stream
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const streamResponse = await chain.stream(userMessage);
                
                for await (const chunk of streamResponse) {
                    // Encode and enqueue each chunk
                    controller.enqueue(encoder.encode(chunk));
                }
                
                controller.close();
            } catch (error) {
                console.error('Streaming error:', error);
                controller.error(error);
            }
        },
    });

    return stream;
}

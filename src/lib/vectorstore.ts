import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const stores = new Map<string, MemoryVectorStore>();

function getOrCreateStore(sessionId: string): MemoryVectorStore {
  let store = stores.get(sessionId);
  if (!store) {
    const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });
    store = new MemoryVectorStore(embeddings);
    stores.set(sessionId, store);
  }
  return store;
}

export async function addTextsToSession(sessionId: string, texts: string[]) {
  const store = getOrCreateStore(sessionId);
  const docs = texts.map((t, i) => new Document({ pageContent: t, metadata: { chunk: i + 1 } }));
  await store.addDocuments(docs);
}

export function getSessionRetriever(sessionId: string, k = 4) {
  const store = stores.get(sessionId);
  if (!store) return null;
  return store.asRetriever(k);
}

export function clearSessionStore(sessionId: string) {
  stores.delete(sessionId);
}


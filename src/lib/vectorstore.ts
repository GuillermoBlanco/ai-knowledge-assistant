import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

const isDevMode = process.env.NODE_ENV !== "production";
const developmentConfiguration = { baseURL: process.env.MODEL_SERVER };

const stores = new Map<string, MemoryVectorStore>();
const storeTimestamps = new Map<string, number>();

function getOrCreateStore(sessionId: string): MemoryVectorStore {
  let store = stores.get(sessionId);
  if (!store) {
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.AI_MODEL_EMBEDDING,
      ...isDevMode && { configuration: developmentConfiguration },
    });
    store = new MemoryVectorStore(embeddings);
    stores.set(sessionId, store);
  }
  storeTimestamps.set(sessionId, Date.now());
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
  storeTimestamps.set(sessionId, Date.now());
  return store.asRetriever(k);
}

export function clearSessionStore(sessionId: string) {
  stores.delete(sessionId);
  storeTimestamps.delete(sessionId);
}

export function cleanupOldStores(maxAgeMs = 3600000) { // 1 hour
  const now = Date.now();
  for (const [sessionId, timestamp] of storeTimestamps.entries()) {
    if (now - timestamp > maxAgeMs) {
      stores.delete(sessionId);
      storeTimestamps.delete(sessionId);
    }
  }
}

// Automatic cleanup every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupOldStores();
  }, 900000); // 15 minutes
}


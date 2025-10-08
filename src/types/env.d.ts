declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
        CLERK_SECRET_KEY: string;
        OPENAI_API_KEY: string;
        AI_MODEL: string;
        AI_MODEL_TURBO: string;
        AI_MODEL_MINI: string;
        MODEL_SERVER: string;
        EMBEDDING_MODEL: string;
    }
}

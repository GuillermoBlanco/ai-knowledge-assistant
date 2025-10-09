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
        LANGSMITH_TRACING: boolean;
        LANGSMITH_API_KEY: string;
        FACEBOOK_API_TOKEN: string;
        FACEBOOK_PAGE_ID: string;
    }
}

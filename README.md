# AI Knowledge Assistant

AI Knowledge Assistant is a modern web application built with **Next.js**, **Tailwind CSS**, **shadcn/ui**, and **LangChain**. It enables users to upload documents (PDF, TXT, DOCX) and interact with them using AI-powered tools (OpenAI GPT-4o and others). The app provides summarization, explanation, and Q&A about uploaded documents, with a focus on context-aware, reliable answers.

---

## Features

- **Authentication**
  - User authentication and session management are handled via Clerk.
  - Protected routes (such as `/dashboard` and `/post`) require users to be signed in.
  - Middleware ensures only authenticated users can access sensitive features and pages.
- **Document Upload**: Upload PDF, TXT, or DOCX files for analysis via the dashboard.
- **AI-Powered Analysis**: Uses OpenAI (via LangChain) for:
  - Summarization
  - Explanation of complex concepts
  - Q&A about document content
- **News Post Generation**
  - Generate news posts automatically from the `/post` page.
  - The system fetches and summarizes content from a set of predefined local news URLs using AI (OpenAI + LangChain).
  - The generated post is displayed to the user and can be published directly to a configured Facebook page.
  - All actions are protected by authentication; only signed-in users can generate and publish posts.
- **LangChain Pipeline**:
  - Chat model: `ChatOpenAI` with LCEL chain (prompt → model → parser)
  - In-session vector store: `OpenAIEmbeddings` + `MemoryVectorStore` (see `src/lib/vectorstore.ts`)
  - Enforced behavior: If answer not found in context, responds with “No encontrado en el documento”
- **Prompt Engineering**:
  - Role-based responses (e.g., professor, expert)
  - Hallucination control: Only answers from context
- **Session Management**: Maintains context across chat interactions using per-session retriever
- **Responsive UI**: Built with Tailwind CSS and shadcn/ui for a modern experience

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **OpenAI API Key** ([Get one here](https://platform.openai.com/signup/))
- **Clerk account** for authentication ([Sign up here](https://clerk.com/))
- (Optional) **Facebook API Token** and **Facebook Page ID** if you want to enable news post publishing to Facebook

---

### Installation

1. **Clone the repository**
  ```bash
  git clone https://github.com/GuillermoBlanco/ai-knowledge-assistant.git
  cd ai-knowledge-assistant
  ```

2. **Install dependencies**
  ```bash
  npm install
  # or
  yarn install
  ```

3. **Set up environment variables**
  - Create a `.env.local` file in the root directory:
    ```env
    // Clerk (authentication)
    CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
    CLERK_SECRET_KEY=your_clerk_secret_key

    // OpenAI
    OPENAI_API_KEY=your-openai-api-key
    // Optional: override default models
    AI_MODEL=gpt-4o
    AI_MODEL_TURBO=gpt-4-turbo
    AI_MODEL_MINI=gpt-4o-mini

    // Facebook (for news post publishing, optional)
    FACEBOOK_API_TOKEN=your_facebook_api_token
    FACEBOOK_PAGE_ID=your_facebook_page_id

    // (Optional) Model server for development
    MODEL_SERVER=your_model_server_url
    ```
  Refer to the OpenAI, Clerk and Facebook documentation for details on obtaining these credentials.

4. **Run the development server**
  ```bash
  npm run dev
  # or
  yarn dev
  ```

5. **Access the app**
  - Open [http://localhost:3000](http://localhost:3000) in your browser

---

## Project Structure

```plaintext
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── dashboard/              # Document analysis dashboard
│   │   ├── page.tsx            # Main dashboard page
│   │   ├── loading.tsx         # Dashboard loading state
│   │   ├── error.tsx           # Dashboard error handling
│   ├── post/                   # Post generation page
│   │   ├── page.tsx            # Main post page
│   │   ├── loading.tsx         # Post loading state
│   │   ├── error.tsx           # Post error handling
│   ├── sign-in/                # Sign in pages
│   ├── sign-up/                # Sign up pages
├── components/
│   ├── ChatConversation.tsx    # Chat interface
│   ├── DocumentUploader.tsx    # Document upload UI
│   ├── ui/button.tsx           # Reusable button
│   ├── header.tsx              # Header
│   ├── theme-provider.tsx      # Theme provider
├── lib/
│   ├── text.ts                 # Text processing utilities
│   ├── utils.ts                # General utilities
│   ├── vectorstore.ts          # In-memory vector store (LangChain)
│   ├── prompts/                # Sign up pages
│   │   ├── assistantPrompt.ts  # The prompts used for the models
├── pages/api/
│   ├── message.ts              # Chat API (retrieval QA)
│   ├── upload.ts               # File upload API
│   ├── post.ts                 # Post API (generation and publish)
├── types/
│   ├── env.d.ts                # Environment variable types
├── middleware.ts
```

---

## Usage

1. **Upload a document**
  - Go to the **Dashboard**
  - Use the **DocumentUploader** to upload PDF, TXT, or DOCX files

2. **Interact with the document**
  - Use the chat interface to ask questions, request summaries, or explanations
  - Answers are based strictly on the document context

3. **Generate News Posts**
   - Go to the `/post` page.
   - The system automatically fetches and summarizes content from predefined local news URLs using AI.
   - Review the generated post and, if configured, publish it directly to your Facebook page.
   - Only authenticated users can access and use the post generation feature.
---

## Environment Configuration

- All sensitive keys (e.g., `OPENAI_API_KEY`) must be set in `.env.local` (never commit this file)
- Supported models can be configured via environment variables (example):
  - `AI_MODEL` (default: `gpt-4o`)
  - `AI_MODEL_TURBO` (default: `gpt-4-turbo`)
  - `AI_MODEL_MINI` (default: `gpt-4o-mini`)
- For deployment, set these variables in your cloud provider (e.g., Vercel dashboard)

---

## Deployment

Recommended: **Vercel** (Next.js optimized)

1. Push your code to GitHub
2. Import your repo in [Vercel](https://vercel.com/)
3. Set environment variables in Vercel dashboard
4. Deploy

---

## Development Procedure for Local LLMs

To enable local Large Language Models (LLMs) for development and testing, follow these steps:

1. **Set Up a Local Model Server**
   - Deploy or run an LLM server locally (e.g., using Ollama, LM Studio, or similar tools).
   - Ensure the server exposes an API endpoint compatible with your application.

2. **Configure Environment Variables**
   - In your `.env.local` file, set the model server URL:
     ```
     MODEL_SERVER=http://localhost:11434
     AI_MODEL_MINI=your_local_model_name
     ```
   - Update other relevant variables as needed.

3. **Update Application Configuration**
   - The app will automatically use the local model server when `MODEL_SERVER` is set and `NODE_ENV` is not `"production"`.
   - Ensure your API routes and LangChain configuration point to the local server for LLM requests.

4. **Run the Application**
   - Start your local LLM server.
   - Run the Next.js app in development mode:
     ```
     npm run dev
     ```
   - The app will route LLM requests to your local server.

5. **Testing and Iteration**
   - Upload documents and interact with the chat or post generation features.
   - Monitor and debug LLM responses locally for faster iteration.

---

## Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch:
  ```bash
  git checkout -b feature/your-feature
  ```
3. Commit your changes:
  ```bash
  git commit -m "Describe your change"
  ```
4. Push and open a pull request

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Author

Developed by [GuillermoBlanco](https://github.com/GuillermoBlanco)
Contact: [guillermo.blanco.martinez@gmail.com](mailto:guillermo.blanco.martinez@gmail.com)

---

## Acknowledgments

- **Next.js**: Framework
- **Clerk**: Authentication and user management
- **OpenAI**: GPT API
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **LangChain**: Context management

---

## LangChain Architecture

### Ingestion (upload API)
- Extract text from PDF/TXT/DOCX
- Split into chunks (`CharacterTextSplitter`)
- Embed and index chunks per session (`OpenAIEmbeddings` + `MemoryVectorStore` in `src/lib/vectorstore.ts`)
- Summarize each chunk with `ChatOpenAI` and constrained prompt

### Retrieval QA (message API)
- Build retriever from session store (top-k relevant docs)
- LCEL chain: `{ context: retriever | formatDocumentsAsString, question } → ChatPromptTemplate → ChatOpenAI → StringOutputParser`
- Strict: answers only from context or “No encontrado en el documento”

### News Post Generation (post API)
- Fetch and aggregate content from a set of predefined local news URLs using `WebBrowser` for web scraping and extraction.
- Format aggregated content with `ChatPromptTemplate` for post generation.
- Generate the news post using `ChatOpenAI`.
- Parse and return the generated post with `StringOutputParser`.

---

## References & Best Practices

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [LangChain JS docs](https://js.langchain.com/docs/expression_language)
- [LangChain RAG](https://js.langchain.com/docs/how_to#retrieval-augmented-generation)
- [OpenAI API models](https://platform.openai.com/docs/models)
- [Prompting Guide: RAG](https://www.promptingguide.ai/techniques/rag)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

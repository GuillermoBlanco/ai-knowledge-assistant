# AI Knowledge Assistant

AI Knowledge Assistant is a web application built with **Next.js**, **Tailwind CSS**, **shadcn/ui**, and **LangChain**. It allows users to upload documents (PDF, TXT, or DOCX) and interact with them using AI-powered tools like **OpenAI's GPT-4o**. The application provides features such as summarization, explanation, and Q&A about the uploaded documents.

---

## **Features**
- **Document Upload**: Upload PDF, TXT, or DOCX files for analysis.
- **AI-Powered Analysis**: Uses OpenAI via LangChain to:
  - Summarize documents.
  - Explain complex concepts.
  - Answer questions about the document.
- **Modern LangChain Pipeline**:
  - Chat model: `ChatOpenAI` with LCEL chain (prompt → model → parser).
  - In-session vector store with `OpenAIEmbeddings` + `MemoryVectorStore`.
  - Clear behavior: “If not in the context, say 'No encontrado en el documento'”.
- **Advanced Prompt Engineering**:
  - Role-based responses (e.g., professor, expert).
  - Control hallucinations (e.g., "If the answer is not found, respond with 'Not found in the document'").
- **Session Management**: Maintain context across interactions using LangChain and a per-session retriever.
- **Responsive Design**: Modern and user-friendly interface built with Tailwind CSS and shadcn/ui.

---

## **Getting Started**

### **Prerequisites**
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **OpenAI API Key**: Sign up at [OpenAI](https://platform.openai.com/signup/) to get your API key.

---

### **Installation**

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/GuillermoBlanco/ai-knowledge-assistant.git
   cd ai-knowledge-assistant
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
    OPENAI_API_KEY=your-openai-api-key
    
    AI_MODEL=gpt-4-1106-preview
    AI_MODEL_TURBO=gpt-4-turbo
    AI_MODEL_MINI=gpt-4o-mini
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## **Project Structure**

```plaintext
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── dashboard/          # Dashboard for document analysis
│   │   ├── page.tsx        # Main dashboard page
│   │   ├── loading.tsx     # Loading state for dashboard
│   │   ├── error.tsx       # Error handling for dashboard
│   ├── sign-in/            # Sign-in page
│   ├── sign-up/            # Sign-up page
├── components/
│   ├── ChatConversation.tsx # Chat interface for user interaction
│   ├── DocumentUploader.tsx # Component for uploading documents
│   ├── ui/button.tsx        # Reusable button component
│   ├── header.tsx           # Header component
│   ├── theme-provider.tsx   # Theme provider for Tailwind
├── lib/
│   ├── session.ts           # Session management utilities
│   ├── text.ts              # Text processing utilities
│   ├── utils.ts             # General utility functions
├── pages/api/
│   ├── message.ts           # API for handling chat queries
│   ├── upload.ts            # API for handling file uploads
├── types/
│   ├── env.d.ts             # Type definitions for environment variables
```

---

## **Usage**

### **1. Upload a Document**
- Navigate to the **Dashboard**.
- Upload a PDF, TXT, or DOCX file using the **Document Uploader**.

### **2. Interact with the Document**
- Use the chat interface to:
  - Ask questions about the document.
  - Request a summary or explanation.

---

## **Deployment**

To deploy the application, use **Vercel** (recommended) or any other platform that supports Next.js.

### **Deploy with Vercel**
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Set the environment variables in the Vercel dashboard.
4. Deploy the application.

---

## **Contributing**

Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## **License**

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## **Author**

This project was developed by **[GuillermoBlanco](https://github.com/GuillermoBlanco)**.  
For inquiries, contact: [guillermo.blanco.martinez@gmail.com](mailto:guillermo.blanco.martinez@gmail.com).

---

## **Acknowledgments**
- **Next.js**: For the framework.
- **OpenAI**: For the GPT API.
- **Tailwind CSS**: For styling.
- **shadcn/ui**: For UI components.
- **LangChain**: For context management.

---

## LangChain Architecture

- Ingestion (upload API)
  - Extract text from PDF/TXT/DOCX, split into chunks (`CharacterTextSplitter`).
  - Embed and index chunks per session using `OpenAIEmbeddings` and `MemoryVectorStore` (`src/lib/vectorstore.ts`).
  - Summarize each chunk with `ChatOpenAI` using a constrained prompt.

- Retrieval QA (message API)
  - Build a retriever from the session store with top-k relevant docs.
  - LCEL chain: `{ context: retriever | formatDocumentsAsString, question } → ChatPromptTemplate → ChatOpenAI → StringOutputParser`.
  - Enforces: answer only from provided context or say “No encontrado en el documento”.

---

## Sources and Best Practices

- LangChain JS docs (LCEL, chains, retrievers)
  - https://js.langchain.com/docs/expression_language
  - https://js.langchain.com/docs/how_to#retrieval-augmented-generation
  - https://js.langchain.com/docs/integrations/chat/openai
  - https://js.langchain.com/docs/integrations/text_embedding/openai
- RAG guidance
  - https://www.promptingguide.ai/techniques/rag
- OpenAI API models
  - https://platform.openai.com/docs/models

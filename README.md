# AI Knowledge Assistant

AI Knowledge Assistant is a web application built with **Next.js**, **Tailwind CSS**, **shadcn/ui**, and **LangChain**. It allows users to upload documents (PDF, TXT, or DOCX) and interact with them using AI-powered tools like **OpenAI's GPT-4**. The application provides features such as summarization, explanation, and Q&A about the uploaded documents.

---

## **Features**
- **Document Upload**: Upload PDF, TXT, or DOCX files for analysis.
- **AI-Powered Analysis**: Use OpenAI to:
  - Summarize documents.
  - Explain complex concepts.
  - Answer questions about the document.
- **Advanced Prompt Engineering**:
  - Role-based responses (e.g., professor, expert).
  - Control hallucinations (e.g., "If the answer is not found, respond with 'Not found in the document'").
- **Session Management**: Maintain context across interactions using LangChain.
- **Authentication**: Secure user authentication with Clerk.
- **Responsive Design**: Modern and user-friendly interface built with Tailwind CSS and shadcn/ui.

---

## **Getting Started**

### **Prerequisites**
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **OpenAI API Key**: Sign up at [OpenAI](https://platform.openai.com/signup/) to get your API key.
- **Clerk API Keys**: Sign up at [Clerk](https://clerk.dev/) to configure authentication.

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
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-api-key
    CLERK_SECRET_KEY=your-clerk-api-secret
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    
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
│   ├── layout.tsx          # Root layout with ClerkProvider
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
│   ├── clerk-provider.tsx   # Clerk authentication provider
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

### **1. Authentication**
- Sign up or log in using Clerk authentication.
> ⚠️ **Development Notice:**  
> Route protection is currently **not activated** on any route for development purposes. Please ensure to enable authentication checks before deploying to production.  
> You can review or modify the middleware responsible for route protection in [`src/middleware.ts`](src/middleware.ts).

### **2. Upload a Document**
- Navigate to the **Dashboard**.
- Upload a PDF, TXT, or DOCX file using the **Document Uploader**.

### **3. Interact with the Document**
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
- **Clerk**: For authentication.
- **Tailwind CSS**: For styling.
- **shadcn/ui**: For UI components.
- **LangChain**: For context management.

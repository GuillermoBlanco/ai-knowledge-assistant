import fs from "fs";

import mammoth from "mammoth";
import pdf from "pdf-parse";

import { CharacterTextSplitter } from "langchain/text_splitter";

interface UploadedFile {
    filepath: string;
    mimetype: string;
}

interface UploadedFiles {
    file?: UploadedFile[];
}

export const extractFileText = async (files: UploadedFiles): Promise<string> => {
    let extractedText: string = "";

    // 1. Access file
    const file: UploadedFile[] = files?.file || []; // the field name in the formData is 'file'
    const filePath: string = file[0].filepath; // should be an array from formidable
    const mimetype: string = file[0].mimetype;

    if (!file || file.length === 0) {
        console.error('Error parsing the files');
        throw (new Error('No file uploaded'));
    }

    // 2. Extract text
    if (mimetype?.includes('pdf')) {
        // Use pdf-parse
        const dataBuffer: Buffer = fs.readFileSync(filePath);
        await pdf(dataBuffer).then((data: { text: string; }) => {
            extractedText = data.text;
        });
    } else if (mimetype?.includes('text/plain') || mimetype?.includes('json')) {
        // Use fs to read text or json file
        extractedText = fs.readFileSync(filePath, 'utf-8');
    } else if (mimetype?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        // Use mammoth on documents
        extractedText = await mammoth.extractRawText({ path: filePath }).then((result: { value: string }) => result.value);
    }


    // Delete the temporary file
    fs.unlinkSync(filePath);

    return extractedText;
};

export const splitFileContent = async (fileContent: string) => {
    const splitter = new CharacterTextSplitter({
        chunkSize: 1000, // Number of characters per chunk
        chunkOverlap: 200,    // Overlap between chunks for better context
    });

    const chunks = await splitter.splitText(fileContent);
    return chunks; // Array of text chunks
};


/**
 * Extracts text from a file buffer based on its MIME type.
 * Supports PDF, TXT, and DOCX formats.
 */
export async function extractTextFromBuffer(
    buffer: Buffer,
    mimetype?: string
): Promise<string> {
    if (!buffer) return "";

    // Try to detect mimetype if not provided (basic fallback)
    if (!mimetype) {
        // Simple magic number check for PDF
        if (buffer.slice(0, 4).toString() === "%PDF") {
            mimetype = "application/pdf";
        } else if (buffer.slice(0, 2).toString() === "PK") {
            mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
            mimetype = "text/plain";
        }
    }

    if (mimetype.includes("pdf")) {
        const data = await pdf(buffer);
        return data.text;
    } else if (
        mimetype.includes("msword") ||
        mimetype.includes("officedocument")
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } else if (mimetype.includes("text") || mimetype === "text/plain") {
        return buffer.toString("utf8");
    }

    // Default fallback
    return buffer.toString("utf8");
}
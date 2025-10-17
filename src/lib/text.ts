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
    try {
        fs.unlinkSync(filePath);
    } catch (err) {
        console.warn('Failed to delete temp file:', err);
    }

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

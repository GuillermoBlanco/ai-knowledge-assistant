"use client";

import { useState } from "react";

export default function DocumentUploader({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);

        const allowedTypes = ["application/pdf", "application/json", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

        if (!allowedTypes.includes(file.type)) {
            setError("Unsupported file type. Please upload a PDF, TXT, or DOCX file.");
            return;
        }

        setError(null);
        onUpload(file).then(() => setLoading(false)).catch(() => {
            setError("File upload failed. Please try again.");
            setLoading(false);
        });
    };

    return (
        <div className="border border-dashed border-gray-300 p-4 rounded-lg text-center">
            <input
                type="file"
                accept=".pdf,.txt,.docx,.json"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="file-upload"
            />
            <label
                htmlFor="file-upload"
                className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer "}`}
            >
                Upload Document
            </label>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
}

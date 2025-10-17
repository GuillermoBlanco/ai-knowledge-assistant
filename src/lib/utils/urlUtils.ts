export function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname.toString() !== '';
        // return ALLOWED_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain));
    } catch {
        return false;
    }
}

export function sanitizeUrls(urls: string[]): string[] {
    return urls
        .filter(Boolean)
        .filter(isValidUrl)
        .slice(0, 5); // Limit to 5 URLs max
}

export function sanitizeInput(input: string): string {
    // Basic input sanitization
    return input
        .trim()
        .slice(0, 500) // Limit length
        .replace(/[<>]/g, ''); // Remove potential HTML
}
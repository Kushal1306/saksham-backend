export function extractUrl(text) {
    const textUntilBracket = text.split('[')[0].trim();  
    const urlPattern = /https?:\/\/[^\s)]+/;
    const urlMatch = text.match(urlPattern);
    
    return urlMatch ? [urlMatch[0], textUntilBracket] :[null, text];
}

export function parseResponse(response) {
    const [url, textUntilBracket] = extractUrl(response);
    if (url) {
        return {
            type: "video",
            title: textUntilBracket,
            url: url
        };
    } else {
        return {
            type: "text",
            text: response
        };
    }
}
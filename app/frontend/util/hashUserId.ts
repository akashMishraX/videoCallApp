export function encodeUserId(userId: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId); // Convert string to Uint8Array
    return btoa(String.fromCharCode(...data)); // Convert to Base64 string
}

export function decodeUserId(encodedUserId: string) {
    const decodedString = atob(encodedUserId); // Decode Base64 to string
    const decoder = new TextDecoder();
    const data = new Uint8Array(decodedString.length);
    for (let i = 0; i < decodedString.length; i++) {
        data[i] = decodedString.charCodeAt(i);
    }
    return decoder.decode(data); // Decode the string back to original text
}

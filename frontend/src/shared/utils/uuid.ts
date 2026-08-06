/**
 * UUID Generator Utility
 * Generates RFC4122 v4 UUIDs for unique identifiers
 */

/**
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * Generate a short ID (8 characters)
 * Useful for human-readable IDs
 */
export const generateShortId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

/**
 * Get current timestamp in milliseconds
 */
export const getCurrentTimestamp = (): number => {
    return Date.now();
};

/**
 * Convert timestamp to ISO string
 */
export const timestampToISO = (timestamp: number): string => {
    return new Date(timestamp).toISOString();
};

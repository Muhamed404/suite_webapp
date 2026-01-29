/**
 * Extracts a user-friendly error message from an API error object.
 * 
 * @param error - The error object caught from the try/catch block.
 * @param t - (Optional) The translation function from useTranslations.
 * @param options - (Optional) Custom keys and fallback messages.
 * @returns A string containing the error message.
 */
export const getApiErrorMessage = (
    error: any,
    t?: (key: string, values?: any) => string,
    options?: {
        defaultKey?: string;
        defaultValue?: string;
        networkKey?: string;
        networkValue?: string;
    }
): string => {
    // 1. Server-side custom message (e.g., from backend validation)
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    // 2. Network error (request made but no response received)
    // This often happens with CORS issues or server downtime.
    if (error?.request && !error?.response) {
        const networkKey = options?.networkKey || "common.errors.networkError";
        const networkValue =
            options?.networkValue ||
            "Network error: Unable to connect to the server. Please try again later.";

        return t ? t(networkKey, { defaultValue: networkValue }) : networkValue;
    }

    // 3. Fallback / Unknown error
    const defaultKey = options?.defaultKey || "common.errors.unknown";
    const defaultValue =
        options?.defaultValue || "An unexpected error occurred. Please try again.";

    return t ? t(defaultKey, { defaultValue }) : defaultValue;
};

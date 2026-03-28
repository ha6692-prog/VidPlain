// API utility file - centralized API configuration
// Uses process.env.NEXT_PUBLIC_API_URL set in .env

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper for API calls
 * @param endpoint - API endpoint path (e.g., '/api/auth/register/')
 * @param options - fetch options (method, body, headers, etc.)
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    return response;
}

/**
 * POST request helper
 */
export async function post(endpoint: string, data: any) {
    return apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * GET request helper
 */
export async function get(endpoint: string) {
    return apiCall(endpoint, {
        method: 'GET',
    });
}

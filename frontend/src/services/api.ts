/**
 * Cliente API base con soporte para cookies y CSRF
 */

const API_BASE_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Nombre de la cookie CSRF (debe coincidir con el backend)
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Obtiene el token CSRF de las cookies del navegador
 */
function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === CSRF_COOKIE_NAME) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

/**
 * Tipos de errores de la API
 */
export class ApiError extends Error {
    status: number;
    detail: string;
    errorType?: string;
    suggestion?: string;
    position?: number;


    constructor(status: number, detail: string, errorType?: string, suggestion?: string, position?: number) {
        super(detail);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
        this.errorType = errorType;
        this.suggestion = suggestion;
        this.position = position;
    }
}

/**
 * Opciones para las peticiones
 */
interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    requiresCsrf?: boolean; // Por defecto true para métodos mutables
}

/**
 * Cliente HTTP base para la API
 */
async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        method = "GET",
        body,
        headers = {},
        requiresCsrf,
    } = options;

    // Determinar si necesita CSRF (por defecto para métodos mutables)
    const needsCsrf =
        requiresCsrf ?? ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    // Construir headers
    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
    };

    // Agregar token CSRF para operaciones mutables
    if (needsCsrf) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            requestHeaders[CSRF_HEADER_NAME] = csrfToken;
        }
    }

    // Construir la petición
    const config: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: "include", // Importante: incluir cookies en las peticiones
    };

    // Agregar body si existe
    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Manejar errores HTTP
        if (!response.ok) {
            let errorDetail = "Error desconocido";
            let errorType: string | undefined;
            let suggestion: string | undefined;
            let position: number | undefined;

            try {
                const errorData = await response.json();

                // Manejar errores estructurados del validador SQL
                if (typeof errorData.detail === "object" && errorData.detail !== null) {
                    errorDetail = errorData.detail.message || "Error desconocido";
                    errorType = errorData.detail.error_type;
                    suggestion = errorData.detail.suggestion;
                    position = errorData.detail.position;
                } else {
                    errorDetail = errorData.detail || errorDetail;
                }
            } catch {
                errorDetail = response.statusText;
            }

            throw new ApiError(response.status, errorDetail, errorType, suggestion, position);
        }

        // Parsear respuesta
        const data = await response.json();
        return data as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        // Error de red u otro
        throw new ApiError(0, "Error de conexión con el servidor");
    }
}

/**
 * Métodos HTTP convenientes
 */
export const api = {
    get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(endpoint, {...options, method: "GET"}),

    post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(endpoint, {...options, method: "POST", body}),

    put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(endpoint, {...options, method: "PUT", body}),

    patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(endpoint, {...options, method: "PATCH", body}),

    delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
        request<T>(endpoint, {...options, method: "DELETE"}),
};

export default api;


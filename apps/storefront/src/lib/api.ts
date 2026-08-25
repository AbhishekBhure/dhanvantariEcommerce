const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options?.headers);
    if (!headers.has("Content-Type") && options?.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // send HTTP-only cookies
    });

    const data = (await response.json()) as T & { success?: boolean; message?: string };

    if (!response.ok) {
      throw new ApiError(
        (data as { message?: string }).message ?? "Request failed",
        response.status,
        data as Record<string, unknown>
      );
    }

    return data;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { method: "GET", ...options });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { method: "DELETE", ...options });
  }
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient(API_URL);
export default api;

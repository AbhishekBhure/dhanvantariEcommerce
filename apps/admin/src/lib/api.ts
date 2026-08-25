const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ApiError"; }
}

export async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) throw new ApiError(response.status, data.message ?? "Request failed");
  return data;
}

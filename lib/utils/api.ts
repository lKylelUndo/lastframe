/**
 * Typed fetch wrapper for client-side API calls.
 * Returns parsed JSON or throws on non-OK responses.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Upload a file via multipart/form-data (for submissions).
 */
export async function apiUpload<T>(
  url: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? (body as { error: string }).error
        : `Upload failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

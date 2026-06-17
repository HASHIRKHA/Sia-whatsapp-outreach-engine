/** Base fetch helper — routes through /api/* Next.js proxy */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const method = options?.method?.toUpperCase() ?? 'GET';
  const needsBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const body = options?.body ?? (needsBody ? '{}' : undefined);

  const res = await fetch(`/api${path}`, {
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
    ...(body !== undefined && { body }),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

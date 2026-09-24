/**
 * Set EXPO_PUBLIC_API_URL (e.g. https://prophesee-api.example.com) to run blind trials
 * against the server in `server/`. Without it the app seals targets on the device,
 * which is fine for practice but not a true blind test.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const isServerMode = API_URL.length > 0;

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Server error ${res.status}${text ? `: ${text}` : ''}`);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
};

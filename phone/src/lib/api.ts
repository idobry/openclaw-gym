import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  requireAuth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T | null> {
  const { body, requireAuth = false, ...fetchOptions } = options;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (requireAuth) throw new Error("Authentication required");
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Actor": "user",
    Authorization: `Bearer ${session.access_token}`,
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }

  const json = await response.json();
  return json.data as T;
}

const DEFAULT_URL = "http://localhost:3100";

type EngineConfig = {
  baseUrl: string;
  apiKey: string;
};

function getEngineConfig(): EngineConfig {
  const baseUrl = (process.env.CONNECTOR_ENGINE_URL ?? DEFAULT_URL).replace(/\/$/, "");
  const apiKey = process.env.CONNECTOR_ENGINE_API_KEY;
  if (!apiKey) {
    throw new Error("CONNECTOR_ENGINE_API_KEY is not set");
  }
  return { baseUrl, apiKey };
}

async function engineFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = getEngineConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.error ?? data.message ?? `Connector engine error (${res.status})`);
  }
  return data;
}

export async function testConnectorConnection(input: {
  type: string;
  authType: string;
  baseUrl?: string | null;
  credentials: Record<string, string>;
  config?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; message?: string }> {
  return engineFetch("/internal/connectors/test", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function testConnectorById(id: string): Promise<{ ok: boolean; message?: string }> {
  return engineFetch(`/internal/connectors/${encodeURIComponent(id)}/test`, {
    method: "POST",
  });
}

export async function syncConnectorById(id: string): Promise<{
  ok: boolean;
  status?: string;
  lastSyncedAt?: Date | string | null;
  lastError?: string | null;
}> {
  return engineFetch(`/internal/connectors/${encodeURIComponent(id)}/sync`, {
    method: "POST",
  });
}

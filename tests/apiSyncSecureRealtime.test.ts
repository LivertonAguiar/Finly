import assert from 'node:assert/strict';

const originalWindow = (globalThis as any).window;
const originalLocalStorage = (globalThis as any).localStorage;
const originalFetch = globalThis.fetch;

const storage = new Map<string, string>([['finly_auth_token', 'secret-access-token']]);
const localStorageMock = {
  get length() { return storage.size; },
  key(index: number) { return [...storage.keys()][index] ?? null; },
  getItem(key: string) { return storage.get(key) ?? null; },
  setItem(key: string, value: string) { storage.set(key, value); },
  removeItem(key: string) { storage.delete(key); },
};

let realtimeRequest: { url: string; init?: RequestInit } | null = null;
const receivedEvents: any[] = [];

try {
  (globalThis as any).window = {};
  (globalThis as any).localStorage = localStorageMock;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (!url.includes('/api/sync/events')) throw new Error(`fetch inesperado: ${url}`);
    realtimeRequest = { url, init };
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"type":"STORE_UPDATED","timestamp":"2026-09-30T00:00:00Z"}\n\n'));
        controller.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }) as typeof fetch;

  const { apiSync } = await import('../src/utils/apiSync');
  apiSync.setUserId('11111111-1111-4111-8111-111111111111');
  const unsubscribe = apiSync.subscribeRealtimeEvents((event) => receivedEvents.push(event));
  await new Promise((resolve) => setTimeout(resolve, 80));
  unsubscribe();

  assert.ok(realtimeRequest, 'a sincronização deve abrir o stream autenticado via fetch');
  assert.doesNotMatch(realtimeRequest.url, /[?&]token=/u, 'tokens nunca devem aparecer na URL do SSE');
  assert.equal(
    new Headers(realtimeRequest.init?.headers).get('Authorization'),
    'Bearer secret-access-token',
    'o stream deve autenticar pelo cabeçalho Authorization',
  );
  assert.equal(receivedEvents.length, 1, 'eventos completos do stream devem chegar aos assinantes');
  assert.equal(receivedEvents[0].type, 'STORE_UPDATED');

  console.log('OK: stream de sincronização usa Authorization e não expõe token na URL.');
} finally {
  (globalThis as any).window = originalWindow;
  (globalThis as any).localStorage = originalLocalStorage;
  globalThis.fetch = originalFetch;
}

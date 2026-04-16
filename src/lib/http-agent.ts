import { Agent, setGlobalDispatcher } from 'undici';

let installed = false;

export function ensureKeepAliveAgent(): void {
  if (installed) return;
  installed = true;
  setGlobalDispatcher(
    new Agent({
      keepAliveTimeout: 30_000,
      keepAliveMaxTimeout: 60_000,
      connections: 64,
      pipelining: 1,
    }),
  );
}

ensureKeepAliveAgent();

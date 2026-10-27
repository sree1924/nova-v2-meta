import {assertDispatchAllowed} from './execution-policy.mjs';

// No dotenv, SDK or top-level network activity. Every request checks authority first.
export function createMetaClient({projectRoot, config, go = false, mode = 'dry_run', transport = globalThis.fetch}) {
  return {
    async complete(request, {signal} = {}) {
      assertDispatchAllowed({projectRoot, config, go, mode});
      if (request.model !== config.producer.model || /contributor/i.test(request.model || '')) throw new Error('Request model differs from bound standard model.');
      if (!Number.isSafeInteger(request.max_completion_tokens) || request.max_completion_tokens <= 0 || request.max_completion_tokens > config.limits.max_completion_tokens) throw new Error('Bound token cap is required.');
      if (!request.response_format?.json_schema?.strict) throw new Error('Strict adapter request required.');
      const key = process.env.MODEL_API_KEY;
      if (!key) throw new Error('MODEL_API_KEY is absent.');
      // No automatic retries: a timeout may still consume money at the provider.
      const started = performance.now();
      let response, rawText;
      try {
        response = await transport('https://api.meta.ai/v1/chat/completions', {
          method: 'POST', signal, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + key}, body: JSON.stringify(request)
        });
        rawText = await response.text();
      } catch {
        const error = new Error('Provider result unknown; do not release the reservation or automatically retry.');
        error.code = 'UNKNOWN_PROVIDER_RESULT'; throw error;
      }
      let body;
      try { body = JSON.parse(rawText); } catch { body = null; }
      return {http_status: response.status, ok: response.ok, raw_text: rawText, body, elapsed_ms: Math.round(performance.now() - started), retries: 0};
    }
  };
}

import {assertDispatchAllowed} from './execution-policy.mjs';

// No dotenv, SDK or top-level network activity. Every request checks authority first.
export function createMetaClient({projectRoot,config,go=false,mode='dry_run',stageId,roleId,sectionIds=[],approvalRef,nowUtc,maxUsd,runDir,transport=globalThis.fetch,keyEnvName='MODEL_API_KEY',clock=()=>new Date().toISOString(),timeoutMs=60_000}={}) {
  if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60_000)throw new Error('Provider timeout must be bounded at 1..60000 milliseconds');
  const pinnedConfig=structuredClone(config);
  const bound={projectRoot,config:pinnedConfig,go,mode,stageId,roleId,sectionIds:structuredClone(sectionIds),approvalRef:structuredClone(approvalRef),nowUtc,maxUsd,runDir};
  return {
    async complete(request, {signal,...scope} = {}) {
      if(Object.keys(scope).some(key=>!['stageId','roleId','sectionIds','approvalRef','maxUsd'].includes(key)))throw new Error('Completion options cannot override bound dispatch authority');
      for(const key of ['stageId','roleId','sectionIds','approvalRef','maxUsd'])if(scope[key]!==undefined&&JSON.stringify(scope[key])!==JSON.stringify(bound[key]))throw new Error('Completion scope differs from the bound stage approval: '+key);
      let policy=assertDispatchAllowed({...bound,nowUtc:clock()});
      if (request.model !== pinnedConfig.producer.model || /contributor/i.test(request.model || '')) throw new Error('Request model differs from bound standard model.');
      if (!Number.isSafeInteger(request.max_completion_tokens) || request.max_completion_tokens <= 0 || request.max_completion_tokens > pinnedConfig.limits.max_completion_tokens) throw new Error('Bound token cap is required.');
      if (request.response_format?.type!=='json_schema'||request.response_format?.json_schema?.strict!==true||!request.response_format.json_schema.schema||typeof request.response_format.json_schema.schema!=='object') throw new Error('Strict adapter request required.');
      const key = process.env[keyEnvName];
      if (!key) throw new Error('MODEL_API_KEY is absent.');
      // No automatic retries: a timeout may still consume money at the provider.
      const started = performance.now();
      let response, rawText;
      // Preparation time is evidence, not a frozen authority clock. Recheck at the send boundary.
      const sendTime=clock();policy=assertDispatchAllowed({...bound,nowUtc:sendTime});
      const remaining=[timeoutMs,Date.parse(pinnedConfig.limits.run_deadline_utc)-Date.parse(sendTime),...(policy.approval.expires_at?[Date.parse(policy.approval.expires_at)-Date.parse(sendTime)]:[])];
      const timeoutSignal=AbortSignal.timeout(Math.max(1,Math.floor(Math.min(...remaining))));
      const dispatchSignal=signal?AbortSignal.any([signal,timeoutSignal]):timeoutSignal;
      try {
        response = await transport('https://api.meta.ai/v1/chat/completions', {
          method: 'POST', signal:dispatchSignal, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + key}, body: JSON.stringify(request)
        });
        rawText = await response.text();
      } catch {
        const error = new Error('Provider result unknown; do not release the reservation or automatically retry.');
        error.code = 'UNKNOWN_PROVIDER_RESULT'; throw error;
      }
      let body;
      try { body = JSON.parse(rawText); } catch { body = null; }
      return {http_status: response.status, ok: response.ok, raw_text: rawText, body, elapsed_ms: Math.round(performance.now() - started), retries: 0,approval_ref:policy.approval_ref,approved_max_usd:policy.requested_max_usd};
    }
  };
}

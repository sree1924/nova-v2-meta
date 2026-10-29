import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../tools/belt/atomic-file.mjs';
import {createMetaClient} from '../../tools/belt/meta-client.mjs';
import {applyFileTransportPreflight,museFileTransport as compatibilityConstructor} from '../../tools/belt/dispatch.mjs';
import {authoringPaths,museFileTransport,isMuseFileTransport} from '../../tools/belt/muse-file-transport.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const missingKey='SYNTHETIC_ABSENT_NATIVE_FILE_TRANSPORT_KEY';
function fixture(t){
  assert.equal(process.env[missingKey],undefined,'fixture key must be absent');
  const parent=path.join(ROOT,'tests/.tmp');fs.mkdirSync(parent,{recursive:true});
  const projectRoot=fs.mkdtempSync(path.join(parent,'native-file-transport-')),runDir=path.join(projectRoot,'runs','synthetic-transport');
  fs.mkdirSync(path.join(runDir,'approvals'),{recursive:true});
  const nowUtc='2026-10-28T12:00:00Z',sectionIds=['sec-synthetic'],stageId='02.dossier_sections';
  const config={run_id:'synthetic-transport',execution_enabled:true,producer:{provider:'meta',model:'muse-spark-1.3'},scope:{jurisdiction:'US-SYN',jurisdiction_selected_by:'synthetic fixture'},
    limits:{spend_mode:'live',max_total_usd:2,max_call_usd:1,per_provider_usd_caps:{meta:2},per_role_usd_caps:{'02':2},max_completion_tokens:50,run_deadline_utc:'2026-11-01T00:00:00Z'}};
  const approval={schema_version:'nova-stage-approval.v0.4.0',run_id:config.run_id,stage_id:stageId,section_ids:sectionIds,founder_words:'SYNTHETIC TEST ONLY: authorize native file transport fixture; no network.',recorded_by:'synthetic-fixture',recorded_at:'2026-10-28T00:00:00Z',usd_ceiling:1,content_calls_authorized:true};
  const approvalFile=path.join(runDir,'approvals/GO-'+stageId+'-synthetic.json');fs.writeFileSync(approvalFile,JSON.stringify(approval));
  const approvalRef={path:approvalFile,sha256:sha256(fs.readFileSync(approvalFile))},key='synthetic-native-file';
  const files=authoringPaths(runDir,key);fs.mkdirSync(path.dirname(files.outbox),{recursive:true});
  const outbox={key,packet_sha256:'a'.repeat(64),authored_by:'synthetic native subscription fixture',artifact:{synthetic:'fixture response'}};fs.writeFileSync(files.outbox,JSON.stringify(outbox));
  const transport=museFileTransport({runDir,key});
  const options={projectRoot,config,runDir,go:true,mode:'live',stageId,sectionIds,approvalRef,nowUtc,maxUsd:1,keyEnvName:missingKey,clock:()=>nowUtc,transport};
  const request={model:config.producer.model,max_completion_tokens:50,response_format:{type:'json_schema',json_schema:{strict:true,schema:{type:'object'}}},messages:[{role:'user',content:'SYNTHETIC file transport fixture only'}]};
  t.after(()=>{if(path.dirname(path.resolve(projectRoot))!==path.resolve(parent)||!path.basename(projectRoot).startsWith('native-file-transport-'))throw Error('Unsafe synthetic cleanup');fs.rmSync(projectRoot,{recursive:true,force:true});});
  return{options,request,files,transport,runDir,key};
}

test('dispatch preserves its constructor re-export and only authentic transports receive the file exemption',t=>{
  const f=fixture(t);assert.equal(compatibilityConstructor,museFileTransport);assert.equal(isMuseFileTransport(f.transport),true);
  const spoof=async()=>{throw Error('A spoof must never be called.');};spoof.isMuseFileTransport=true;spoof.billing={model_api_called:false};
  assert.equal(isMuseFileTransport(spoof),false);
  const prepared=()=>({preflight:{status:'HOLD',blockers:['request_byte_limit','call_cap_below_conservative_request_estimate','model_api_key_env_absent','source_pin_invalid']}});
  const native=applyFileTransportPreflight(prepared(),f.transport);assert.equal(native.preflight.status,'HOLD');assert.deepEqual(native.preflight.blockers,['source_pin_invalid']);
  assert.deepEqual(native.preflight.waived_for_file_transport,['request_byte_limit','call_cap_below_conservative_request_estimate','model_api_key_env_absent']);
  assert.equal(applyFileTransportPreflight(prepared(),spoof).preflight.blockers.length,4);
  const noOtherBlockers={preflight:{status:'HOLD',blockers:['model_api_key_env_absent']}};
  assert.equal(applyFileTransportPreflight(noOtherBlockers,f.transport).preflight.status,'PASS');
});
test('native file client works without an API key and retains exact zero-cost provenance/outbox bytes',async t=>{
  const f=fixture(t),before=fs.readFileSync(f.files.outbox);
  const result=await createMetaClient(f.options).complete(f.request);
  assert.equal(result.http_status,200);assert.deepEqual(result.body.usage,{prompt_tokens:0,completion_tokens:0,total_tokens:0});
  assert.equal(result.body.billing.model_api_called,false);assert.equal(result.body.billing.credit_usd,0);assert.equal(result.body.billing.packet_sha256,'a'.repeat(64));assert.equal(result.body.billing.outbox_sha256,sha256(before));
  assert.deepEqual(fs.readFileSync(f.files.outbox),before);assert.equal(process.env[missingKey],undefined);
});
test('arbitrary custom or wrapped transports still require a key and never dispatch while keyless',async t=>{
  const f=fixture(t);let calls=0;
  for(const transport of [async()=>{calls++;throw Error('must not dispatch');},async(...args)=>{calls++;return f.transport(...args);}]){
    await assert.rejects(createMetaClient({...f.options,transport}).complete(f.request),/MODEL_API_KEY is absent/);
  }
  assert.equal(calls,0);
});
for(const [name,change] of [
  ['missing GO',{go:false}],['disabled execution',{configChange:c=>{c.execution_enabled=false;}}],
  ['missing role cap',{configChange:c=>{c.limits.per_role_usd_caps['02']=0;}}],
  ['stale approval',{approvalRef:{path:'absent',sha256:'0'.repeat(64)}}],
  ['over-cap reservation',{maxUsd:2}],
])test(`native key exemption preserves ${name} blocking`,async t=>{
  const f=fixture(t),config=structuredClone(f.options.config);change.configChange?.(config);
  const {configChange,...updates}=change;
  await assert.rejects(createMetaClient({...f.options,...updates,config}).complete(f.request),/CONTENT_DISPATCH_BLOCKED/);
  assert.equal(process.env[missingKey],undefined);
});

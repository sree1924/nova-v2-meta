// The constructor and unforgeable transport brand share one module. Callers may
// create this native file transport; arbitrary transports cannot claim its key exemption.
import fs from 'node:fs';
import path from 'node:path';
import {sha256} from './atomic-file.mjs';

const nativeTransports=new WeakSet();
export const isMuseFileTransport=transport=>nativeTransports.has(transport);
export function authoringPaths(runDir,key){const base=path.join(runDir,'sources','private','muse-authoring');return{base,inbox:path.join(base,'inbox',key+'.json'),outbox:path.join(base,'outbox',key+'.json'),done:path.join(base,'done'),next:path.join(base,'inbox','NEXT.json')};}
// A malformed/missing outbox is a local HOLD, never an uncertain network request.
export function readAuthoringOutbox(runDir,key){
  const paths=authoringPaths(runDir,key);
  if(!fs.existsSync(paths.outbox))return{ok:false,reason:'outbox_absent',path:paths.outbox};
  let out;try{out=JSON.parse(fs.readFileSync(paths.outbox,'utf8'));}catch(e){return{ok:false,reason:'outbox_invalid_json:'+String(e.message).slice(0,80),path:paths.outbox};}
  if(out?.key!==key)return{ok:false,reason:'outbox_key_mismatch:'+String(out?.key),path:paths.outbox};
  if(!out.artifact||typeof out.artifact!=='object'||Array.isArray(out.artifact))return{ok:false,reason:'outbox_no_artifact_object',path:paths.outbox};
  return{ok:true,outbox:out,path:paths.outbox};
}
export function museFileTransport({runDir,key}){
  const transport=async function transport(_url,init){
    const zero={prompt_tokens:0,completion_tokens:0,total_tokens:0};
    const got=readAuthoringOutbox(runDir,key);
    if(!got.ok){const text=JSON.stringify({error:{message:got.reason,type:'muse_outbox_unusable'},usage:zero,model:null});return{status:422,ok:false,headers:{get:()=>null},text:async()=>text};}
    const raw=fs.readFileSync(got.path),req=JSON.parse(init.body);
    const body={id:'musecode-'+sha256(raw).slice(0,24),object:'chat.completion',created:Math.floor(Date.now()/1000),model:req.model,
      choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(got.outbox.artifact)}}],usage:zero,
      billing:{mode:'muse_code_subscription',authored_by:got.outbox.authored_by??'muse-code (subscription)',packet_sha256:got.outbox.packet_sha256??null,outbox_sha256:sha256(raw),model_api_called:false,credit_usd:0}};
    const text=JSON.stringify(body);
    return{status:200,ok:true,headers:{get:()=>null},text:async()=>text};
  };
  nativeTransports.add(transport);
  return transport;
}

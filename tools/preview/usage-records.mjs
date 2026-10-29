import fs from 'node:fs';
import assert from 'node:assert/strict';

const count=(value,name)=>{if(value!==null&&value!==undefined)assert(Number.isSafeInteger(value)&&value>=0,`Invalid ${name}`);};
export function validateUsageRecord(record){
 assert(record&&typeof record==='object'&&!Array.isArray(record),'Usage record required');
 for(const key of ['tokens','cached_input_tokens','cumulative_total','cumulative_cached','tool_uses','duration_ms'])count(record[key],key);
 if(record.cached_input_tokens!=null&&record.tokens!=null)assert(record.cached_input_tokens<=record.tokens,'Cached tokens are included in total');
 if(record.cumulative_cached!=null&&record.cumulative_total!=null)assert(record.cumulative_cached<=record.cumulative_total,'Cached cumulative exceeds total');
 if(record.worker==='sol'){
  for(const key of ['record_id','model','session_id','usage_source','sampled_at'])assert(typeof record[key]==='string'&&record[key].trim(),`Sol record requires ${key}`);
  assert.equal(record.platform,'ChatGPT Pro subscription','Exact actual Sol platform required');
 }
 return record;
}
export function readUsageRecords(file){
 if(!fs.existsSync(file))return [];
 return fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim()).map((line,index)=>{
  try{return JSON.parse(line);}catch{throw Error(`Invalid canonical usage JSON at line ${index+1}`);}
 });
}
const identity=record=>Object.fromEntries(Object.entries(record).filter(([key])=>key!=='recorded_at').sort(([a],[b])=>a.localeCompare(b)));
export function appendUsageRecord(file,record,{now=new Date().toISOString()}={}){
 validateUsageRecord(record);
 const matches=record.record_id?readUsageRecords(file).filter(row=>row.record_id===record.record_id):[];
 assert(matches.length<=1,'Duplicate canonical usage record_id requires explicit reconciliation');
 if(matches.length){assert.deepEqual(identity(matches[0]),identity(record),'Conflicting usage record_id');return {status:'REUSED',record:matches[0]};}
 const stored={...record,recorded_at:now};fs.appendFileSync(file,JSON.stringify(stored)+'\n');return {status:'RECORDED',record:stored};
}
export function summarizeUsageRecords(records,{prefix='',worker=null,platform=null,requiredRecordIds=[]}={}){
 const selected=records.filter(r=>String(r.record_id??'').startsWith(prefix)&&(!worker||r.worker===worker)&&(!platform||r.platform===platform));
 const ids=new Set();let total=0,cached=0,unknownTotal=0,unknownCached=0;
 for(const r of selected){validateUsageRecord(r);assert(r.record_id,'Indexed usage requires a canonical record_id');assert(!ids.has(r.record_id),'Duplicate canonical record_id');ids.add(r.record_id);if(r.tokens==null)unknownTotal++;else total+=r.tokens;if(r.cached_input_tokens==null)unknownCached++;else cached+=r.cached_input_tokens;}
 for(const id of requiredRecordIds)assert(ids.has(id),`Required canonical usage record missing: ${id}`);
 return {record_ids:[...ids],record_count:selected.length,total_tokens:unknownTotal?null:total,cached_input_tokens:unknownCached?null:cached,known_total_tokens:total,known_cached_input_tokens:cached,unknown_total_records:unknownTotal,unknown_cached_records:unknownCached,cached_included_in_total:true};
}
export function projectUsageRecord(r){
 return {worker:r.worker||'claude',model:r.model||'claude-opus-5-5',platform:r.platform||'Anthropic subscription (Claude Code subagent)',state:r.state??null,task:r.task,started_at:r.started_at??null,ended_at:r.recorded_at,
  total_tokens:r.tokens??null,cached_tokens:r.cached_input_tokens??null,tool_uses:r.tool_uses??null,duration_ms:r.duration_ms??null,usd:0,source:r.usage_source??'Agent tool usage report',
  ...(r.record_id?{record_id:r.record_id}:{}),...(r.session_id?{session_id:r.session_id}:{}),...(r.phase?{phase:r.phase}:{}),...(r.sampled_at?{sampled_at:r.sampled_at}:{})};
}
export function reportedTokenTotal(row){
 if(row.total_tokens!=null){count(row.total_tokens,'total_tokens');return row.total_tokens;}
 if(row.input_tokens==null&&row.output_tokens==null)return null;
 for(const k of ['input_tokens','output_tokens'])count(row[k],k);
 return (row.input_tokens??0)+(row.output_tokens??0);
}

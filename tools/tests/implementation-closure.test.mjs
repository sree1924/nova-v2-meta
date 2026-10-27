import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {inspectImplementationClosure} from '../inspect-implementation-closure.mjs';

const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function fixture(t){
  const outer=fs.mkdtempSync(path.join(os.tmpdir(),'nova-closure-fixture-')),project=path.join(outer,'project');
  t.after(()=>{const base=path.resolve(os.tmpdir());assert.ok(path.dirname(outer)===base&&path.basename(outer).startsWith('nova-closure-fixture-'));fs.rmSync(outer,{recursive:true,force:true});});
  const write=(p,text)=>{const target=path.join(project,p);assert.ok(!path.relative(project,target).startsWith('..'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);};
  fs.mkdirSync(path.join(outer,'schemas'),{recursive:true});fs.writeFileSync(path.join(outer,'schemas','parent.json'),'{}');
  const stages={};for(let i=0;i<10;i++){const id='fixture'+i;stages[id]={prompt_path:'prompts/'+id+'.md',adapter_schema:'schemas-strict/'+id+'.schema.json',mapping:'schemas-strict/'+id+'.mapping.json',checks_module:'tools/belt/checks/'+id+'.mjs',parent_schema:{path:'schemas/parent.json',sha256:hash('{}')}};write(stages[id].adapter_schema,'{}');write(stages[id].mapping,'{}');write(stages[id].checks_module,"import {value} from '../lib/shared.mjs'; export function run(){return value;}");}
  write('schemas-strict/stage-map.json',JSON.stringify({stages}));write('tools/belt/lib/shared.mjs','export const value=[];');write('tools/belt/post-validate.mjs','export async function validateArtifact(){}');write('tools/belt/strict-lint.mjs','export const fixture=true;');write('package.json','{}');write('package-lock.json','{}');
  return{project,write};
}
test('complete synthetic files without an owner receipt remain unsealed',t=>{const f=fixture(t),r=inspectImplementationClosure({projectRoot:f.project});assert.equal(r.closure_complete,true);assert.equal(r.receipt_status,'AWAITING_SEALED_OWNER_RECEIPT');});
test('changing a check module invalidates its old closure pin',t=>{const f=fixture(t),first=inspectImplementationClosure({projectRoot:f.project});f.write('tools/belt/checks/fixture0.mjs','export function run(){return [];}');const r=inspectImplementationClosure({projectRoot:f.project,receiptFiles:first.observed_files});assert.equal(r.receipt_status,'CLOSURE_HASH_MISMATCH');assert.ok(r.changed_dependencies.includes('tools/belt/checks/fixture0.mjs'));});
test('a newly imported local dependency cannot hide outside a previous receipt',t=>{const f=fixture(t),first=inspectImplementationClosure({projectRoot:f.project});f.write('tools/belt/lib/new.mjs','export const added=true;');f.write('tools/belt/checks/fixture0.mjs',"import '../lib/new.mjs'; export function run(){return [];}");const r=inspectImplementationClosure({projectRoot:f.project,receiptFiles:first.observed_files});assert.ok(r.unlisted_dependencies.includes('tools/belt/lib/new.mjs'));assert.equal(r.receipt_status,'CLOSURE_HASH_MISMATCH');});
test('an explicitly pinned extra fixture is verified without pretending it executed',t=>{const f=fixture(t),first=inspectImplementationClosure({projectRoot:f.project});f.write('tools/belt/fixtures/positive.json','{}');const pins=[...first.observed_files,{path:'tools/belt/fixtures/positive.json',sha256:hash('{}')}];const r=inspectImplementationClosure({projectRoot:f.project,receiptFiles:pins});assert.equal(r.receipt_status,'LISTED_HASHES_MATCH_ONLY');assert.match(r.validation_claim,/No implementation or fixture was executed/);});

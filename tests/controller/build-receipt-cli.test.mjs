import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('receipt CLI requires truthful explicit identity/output and refuses existing owner evidence before writes',t=>{
  const tempRoot=path.join(ROOT,'tests/.tmp');fs.mkdirSync(tempRoot,{recursive:true});
  const root=fs.mkdtempSync(path.join(tempRoot,'nova-receipt-cli-'));
  t.after(()=>{const target=path.resolve(root);if(path.dirname(target)!==path.resolve(tempRoot)||!path.basename(target).startsWith('nova-receipt-cli-'))throw Error('Unsafe cleanup path');fs.rmSync(target,{recursive:true,force:true});});
  const out=path.join(root,'receipt.json'),evidence=path.join(root,'evidence');
  const args=['--out',out,'--evidence-dir',evidence,'--fixtures',path.join(root,'fixtures.json'),'--tests',path.join(root,'tests.json'),
    '--actor-id','sol-fixture-operator','--session-id','synthetic-session','--model','gpt-6.1-sol','--provider-family','openai'];
  const run=argv=>spawnSync(process.execPath,[path.join(ROOT,'tools/belt/build-receipt.mjs'),...argv],{cwd:ROOT,encoding:'utf8'});
  // Remove by option name so argument ordering remains explicit and independent of the fixture above.
  const modelIndex=args.indexOf('--model'),withoutModel=args.filter((_,i)=>i!==modelIndex&&i!==modelIndex+1);
  const missing=run(withoutModel);assert.equal(missing.status,2);assert.match(missing.stderr,/Required explicit --model/);
  assert.deepEqual(fs.readdirSync(root),[]);
  const contradictory=[...args];contradictory[contradictory.indexOf('--provider-family')+1]='anthropic';
  assert.equal(run(contradictory).status,2);assert.deepEqual(fs.readdirSync(root),[]);
  fs.writeFileSync(out,'FOREIGN OWNER RECEIPT\n');
  const old=run(args);assert.equal(old.status,2);assert.match(old.stderr,/existing owner evidence is immutable/);
  assert.equal(fs.readFileSync(out,'utf8'),'FOREIGN OWNER RECEIPT\n');assert.equal(fs.existsSync(evidence),false);
  fs.unlinkSync(out);fs.mkdirSync(evidence);fs.writeFileSync(path.join(evidence,'owner.txt'),'OLD EVIDENCE');
  const prior=run(args);assert.equal(prior.status,2);assert.equal(fs.existsSync(out),false);assert.equal(fs.readFileSync(path.join(evidence,'owner.txt'),'utf8'),'OLD EVIDENCE');
});

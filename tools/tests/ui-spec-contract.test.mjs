import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateJsonSchema} from '../qualify-04.mjs';

// Synthetic values exist only in memory. These are schema-oracle tests, not a UiSpec,
// browser implementation, independent semantic review or accepted validation receipt.
const schema=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../contracts/ui-spec.schema.json',import.meta.url)),'utf8'));
function fixtureValue(node,index=0){
  if(node.$ref)return fixtureValue(schema.$defs[node.$ref.split('/').pop()],index);
  if('const'in node)return node.const;
  if(node.enum)return node.enum[index%node.enum.length];
  if(node.anyOf)return fixtureValue(node.anyOf[0],index);
  const type=Array.isArray(node.type)?node.type[0]:node.type;
  if(type==='object')return Object.fromEntries(Object.entries(node.properties||{}).map(([key,value])=>[key,fixtureValue(value,index)]));
  if(type==='array')return Array.from({length:node.minItems||0},(_,i)=>fixtureValue(node.items,i));
  if(type==='boolean')return true;
  if(type==='integer')return node.minimum||1;
  if(type==='string')return node.pattern?'a'.repeat(64):'synthetic fixture';
  return null;
}
function specFixture(){
  const spec=fixtureValue(schema);
  for(const screen of spec.screens){screen.audience=screen.id==='trace'?'reviewer':'learner';screen.learner_navigation=screen.id!=='trace';}
  return spec;
}
test('synthetic draft covers required UiSpec structure without claiming acceptance',()=>{
  const spec=specFixture();
  assert.deepEqual(validateJsonSchema(schema,spec),[]);
  assert.equal(spec.status,'draft');
  assert.equal(spec.validation_plan.receipt_storage,'separate_hash_bound_UIAcceptanceBundle');
});
test('Trace cannot join learner navigation or use a learner audience',()=>{
  const spec=specFixture();
  const trace=spec.screens.find(s=>s.id==='trace');
  trace.learner_navigation=true;
  assert.ok(validateJsonSchema(schema,spec).length>0);
  trace.learner_navigation=false;trace.audience='learner';
  assert.ok(validateJsonSchema(schema,spec).length>0);
});
test('validation plan cannot omit or duplicate one of its two phases',()=>{
  const spec=specFixture();
  spec.validation_plan.phases=['validate_1','validate_1'];
  assert.ok(validateJsonSchema(schema,spec).length>0);
  spec.validation_plan.phases=['validate_1'];
  assert.ok(validateJsonSchema(schema,spec).length>0);
});

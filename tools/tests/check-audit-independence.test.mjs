import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAuditIndependence,providerFamily} from '../check-audit-independence.mjs';

const auditor=(bot_id,provider_family)=>({bot_id,provider_family,actor_id:bot_id+'-actor',session_id:bot_id+'-session',model:'fixture-model',qualification_status:'qualified'});
test('Claude editor disqualifies a different Claude auditing session',()=>{
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'claude-builder',session_id:'build-session',provider_family:'anthropic',contribution_kind:'card_repair'}],auditors:[auditor('audit-claude','anthropic'),auditor('audit-google','google')]});
  assert.equal(result.evaluations[0].eligible,false);
  assert.ok(result.evaluations[0].reasons.includes('provider_family_contributed_to_candidate_or_prompt'));
  assert.equal(result.eligible_provider_family_count,1);assert.equal(result.status,'BLOCKED');
});
test('GPT-authored prompt disqualifies OpenAI even when candidate generator is Meta',()=>{
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'generator',provider_family:'meta'},{actor_id:'prompt-author',provider_family:'openai',contribution_kind:'authoring_prompt'}],auditors:[auditor('openai-review','openai'),auditor('anthropic-review','anthropic')]});
  assert.equal(result.evaluations[0].eligible,false);assert.equal(result.status,'BLOCKED');
});
test('same actor is ineligible despite changed provider label',()=>{
  const a=auditor('review','google');a.actor_id='editor';
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'editor',provider_family:'human'}],auditors:[a]});
  assert.ok(result.evaluations[0].reasons.includes('actor_contributed_to_candidate_or_prompt'));
});
test('unknown lineage and two sessions in one family do not establish two independent families',()=>{
  assert.equal(evaluateAuditIndependence({lineageComplete:false,auditors:[auditor('one','google'),auditor('two','anthropic')]}).status,'BLOCKED');
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'gen',provider_family:'meta'}],auditors:[auditor('one','google'),auditor('two','google')]});
  assert.equal(result.eligible_provider_family_count,1);assert.equal(result.status,'BLOCKED');
});
test('two qualified independent families can pass the policy fixture',()=>{
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'gen',provider_family:'meta'}],auditors:[auditor('one','google'),auditor('two','anthropic')]});
  assert.equal(result.status,'PASS');assert.equal(result.eligible_provider_family_count,2);
});
test('unknown family/model/qualification never passes',()=>{
  assert.equal(providerFamily('Anthropic / Claude'),'anthropic');
  const a=auditor('unqualified','google');a.qualification_status='not_qualified';
  const result=evaluateAuditIndependence({lineageComplete:true,actors:[{actor_id:'gen',provider_family:'meta'}],auditors:[a]});
  assert.equal(result.evaluations[0].eligible,false);
});
test('human issuer and script remain valid provenance but cannot count as model auditors',()=>{
  const actors=['human','issuer','script'].map(provider_family=>({actor_id:provider_family+'-contributor',provider_family}));
  const result=evaluateAuditIndependence({lineageComplete:true,actors,auditors:['human','issuer','script'].map(f=>auditor(f+'-review',f))});
  assert.equal(result.lineage_complete,true);assert.equal(result.eligible_provider_family_count,0);assert.equal(result.status,'BLOCKED');
  assert.ok(result.evaluations.every(e=>e.reasons.includes('auditor_family_is_not_a_configured_model_provider')));
  assert.equal(evaluateAuditIndependence({lineageComplete:true,actors,auditors:[auditor('real-one','google'),auditor('real-two','anthropic')]}).status,'PASS');
});

// Read-only ledger tail for the operator/runner: latest attempts + spend. Never writes.
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite', { readOnly: true });
const n = Number(process.argv[2] ?? 6);
const rows = db.prepare(`select t.stage_id, t.lineage_id, json_extract(t.identity_json,'$.config.dossier_parts') parts,
  json_extract(t.identity_json,'$.config.retry_nonce') nonce, t.status task, a.status attempt, a.created_at
  from tasks t left join attempts a on a.task_id=t.task_id where a.attempt_id is not null order by a.created_at desc limit ?`).all(n);
for (const r of rows.reverse()) console.log(`${r.created_at}  ${r.stage_id}  ${r.lineage_id.split(':').pop()}  parts=${r.parts ?? '[]'} nonce=${r.nonce ?? 0}  task=${r.task} attempt=${r.attempt}`);
const spent = db.prepare(`select coalesce(sum(case when state='reported' then actual_microusd when state in ('reserved','unknown_provider_result') then reserved_microusd else 0 end),0)/1e6 m from reservations`).get().m;
const accepted = db.prepare(`select stage_id, count(*) c from tasks where status='accepted' group by stage_id`).all();
console.log(`spent $${spent.toFixed(3)}  accepted: ${accepted.map(a => `${a.stage_id}×${a.c}`).join(', ') || 'none'}`);
db.close();

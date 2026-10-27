import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const inputPath = join(directory, 'projects.json');
const schemaPath = join(directory, 'project-tracker.schema.json');
const outputPath = join(directory, 'TRACKER.md');

// This small validator covers the schema vocabulary used by this tracker. It
// does not claim to implement arbitrary JSON Schema or replace factory gates.
function validate(value, schema, root, path = '$') {
  if (schema.$ref) {
    if (!schema.$ref.startsWith('#/')) throw new Error(`${path}: unsupported external schema reference`);
    const target = schema.$ref.slice(2).split('/').reduce((node, part) => node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')], root);
    if (!target) throw new Error(`${path}: unresolved schema reference ${schema.$ref}`);
    validate(value, target, root, path);
  }
  if (schema.const !== undefined && value !== schema.const) throw new Error(`${path}: expected ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path}: invalid value ${JSON.stringify(value)}`);
  const types = schema.type ? [].concat(schema.type) : [];
  const matches = type => type === 'null' ? value === null
    : type === 'array' ? Array.isArray(value)
      : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
        : type === 'integer' ? Number.isInteger(value)
          : typeof value === type;
  if (types.length && !types.some(matches)) throw new Error(`${path}: expected ${types.join(' or ')}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) throw new Error(`${path}: string is too short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error(`${path}: string does not match required pattern`);
    if (schema.format === 'date-time') {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new Error(`${path}: expected an ISO date-time with offset`);
      }
    }
    if (schema.format === 'uri') validateUrl(value, path);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path}: expected finite number`);
    if (schema.minimum !== undefined && value < schema.minimum) throw new Error(`${path}: value is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) throw new Error(`${path}: value is above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) throw new Error(`${path}: not enough items`);
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) throw new Error(`${path}: duplicate array items`);
    if (schema.items) value.forEach((item, index) => validate(item, schema.items, root, `${path}[${index}]`));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key}: required property missing`);
    }
    for (const [key, entry] of Object.entries(value)) {
      if (schema.properties?.[key]) validate(entry, schema.properties[key], root, `${path}.${key}`);
      else if (schema.additionalProperties === false) throw new Error(`${path}.${key}: unexpected property`);
    }
  }
}

function validateUrl(value, path) {
  if (/[\s<>"\\]/.test(value)) throw new Error(`${path}: URL contains unsafe or ambiguous characters`);
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${path}: invalid URL`); }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error(`${path}: expected HTTPS URL without embedded credentials`);
  }
}

function plain(value) {
  return String(value).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_\[\]{}()#!|]/g, '\\$&');
}

function link(label, url) {
  validateUrl(url, 'rendered source');
  return `[${plain(label)}](<${url}>)`;
}

const evidenceLabels = {
  participant_report: 'Participant report',
  public_artifacts_inspected: 'Public artifacts inspected',
  demo_observed: 'Demo observed',
  independently_reproduced: 'Independently reproduced',
};
const priorityOrder = { high: 0, medium: 1, background: 2 };
const sourceLabels = { discord: 'Discord post', repository: 'Repository', demo: 'Demo', official: 'Official source' };

function bulletLines(values, emptyText) {
  return values.length ? values.map(value => `- ${plain(value)}`).join('\n') : `- ${emptyText}`;
}

function render(data) {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: data.event.timezone, year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  const when = value => format.format(new Date(value));
  const projects = [...data.projects].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en'));
  const counts = Object.fromEntries(Object.keys(priorityOrder).map(key => [key, projects.filter(project => project.priority === key).length]));
  const evidenceCounts = Object.entries(evidenceLabels).map(([level, label]) => `${label.toLowerCase()}: ${projects.filter(project => project.evidence_level === level).length}`).join('; ');
  const lines = [
    '# Meta hackathon project tracker', '',
    plain(data.summary), '',
    `Updated ${plain(when(data.updated_at))}. Submission deadline: ${plain(when(data.event.submission_deadline))}.`, '',
    `Tracking **${projects.length} projects**: ${counts.high} high priority, ${counts.medium} medium priority, ${counts.background} background.`, '',
    `Evidence: ${plain(evidenceCounts)}.`, '',
    'Watch priority is an editorial choice about where to spend attention. It is not a verified sophistication score, competition ranking, or estimate of winning probability. Tracks remain unknown unless a source identifies them.', '',
    '## Monitoring', '',
    `Check every ${data.monitor.cadence_hours} hours through ${plain(when(data.monitor.through))}. Status: **${plain(data.monitor.status)}**.`, '',
    'Notify only for meaningful new projects, implementation or demo evidence, material changes to watched projects, official rule changes, or access failures that require action. Routine unchanged checks stay quiet.', '',
    '## Evidence levels', '',
    '- **Participant report:** a builder describes an approach or result; linked code and demos have not been independently inspected.',
    '- **Public artifacts inspected:** code, documentation, or other public project artifacts were read; this does not establish that the software works.',
    '- **Demo observed:** a live interface or recorded demonstration was viewed. A screenshot or a builder saying a demo exists is not enough. This does not establish independent reproduction.',
    '- **Independently reproduced:** the relevant functionality was executed and its result checked; the record must state the tested scope.', '',
    '## Watch list', '',
    '| Priority | Project | Track | Evidence | Why watch | Next check |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const project of projects) {
    const source = project.sources.find(entry => entry.type === 'discord') ?? project.sources[0];
    const name = source ? link(project.name, source.url) : plain(project.name);
    lines.push(`| ${plain(project.priority)} | ${name} | ${plain(project.track)} | ${evidenceLabels[project.evidence_level]} | ${plain(project.why_watch)} | ${plain(project.next_check)} |`);
  }
  lines.push('', '## Channel coverage', '', '| Channel | Checked | Scope | Notes |', '| --- | --- | --- | --- |');
  for (const coverage of data.coverage) {
    lines.push(`| ${link(coverage.channel, coverage.url)} | ${plain(when(coverage.checked_at))} | ${plain(coverage.scope)} | ${plain(coverage.notes)} |`);
  }
  lines.push('', '## Project details');
  for (const project of projects) {
    lines.push('', `### ${plain(project.name)}`, '',
      `**Watch priority:** ${plain(project.priority)}. **Track:** ${plain(project.track)}. **Evidence:** ${evidenceLabels[project.evidence_level]}.`, '',
      `**Builder names:** ${project.builders.length ? project.builders.map(plain).join(', ') : 'Not established'}. **Track basis:** ${plain(project.track_basis)}`, '',
      `**Themes:** ${project.theme.length ? project.theme.map(plain).join(', ') : 'Not established'}. **Last observed:** ${plain(when(project.last_seen_at))}.`, '',
      `**Technical approach:** ${plain(project.technical_approach)}`, '',
      `**Meta use described:** ${project.meta_use.length ? project.meta_use.map(plain).join('; ') : 'Not established'}.`, '',
      `**Reported status:** ${plain(project.reported_status)}`, '',
      '**Verified observations**', '', bulletLines(project.verified_observations, 'No independent implementation observations recorded.'), '',
      '**Claims still to check**', '', bulletLines(project.unverified_claims, 'No additional claims recorded.'), '',
      `**Relevance to Nova:** ${plain(project.nova_relevance)}`, '',
      `**Next check:** ${plain(project.next_check)}`, '',
      '**Sources**', '');
    for (const source of project.sources) {
      lines.push(`- ${link(sourceLabels[source.type], source.url)} — ${plain(source.note)} Observed ${plain(when(source.observed_at))}.`);
    }
  }
  lines.push('', '## Change log', '');
  if (!data.changes.length) lines.push('No changes recorded.');
  for (const entry of data.changes) {
    const name = data.projects.find(project => project.id === entry.project_id)?.name ?? entry.project_id ?? 'Tracker';
    lines.push(`- ${plain(when(entry.at))} — **${plain(name)}:** ${plain(entry.change)}`);
  }
  lines.push('', 'This is private research for the Nova hackathon entry. No messages, reactions, outreach, repository execution, or publication are authorized by this tracker.', '');
  return lines.join('\n');
}

try {
  const [input, schema] = await Promise.all([readFile(inputPath, 'utf8'), readFile(schemaPath, 'utf8')]);
  const data = JSON.parse(input.replace(/^\uFEFF/, ''));
  const contract = JSON.parse(schema.replace(/^\uFEFF/, ''));
  validate(data, contract, contract);
  const ids = new Set();
  for (const project of data.projects) {
    if (ids.has(project.id)) throw new Error(`Duplicate project id: ${project.id}`);
    ids.add(project.id);
    project.sources.forEach((source, index) => validateUrl(source.url, `${project.id}.sources[${index}].url`));
  }
  for (const change of data.changes) {
    if (change.project_id !== null && !ids.has(change.project_id)) throw new Error(`Change refers to unknown project: ${change.project_id}`);
  }
  for (const coverage of data.coverage) validateUrl(coverage.url, `${coverage.channel}.url`);
  const output = render(data);
  if (process.argv.includes('--check')) {
    console.log(`VALID: ${data.projects.length} projects; ${data.coverage.length} channels; ${data.changes.length} changes.`);
  } else {
    await writeFile(outputPath, output, 'utf8');
    console.log(`Wrote ${outputPath} (${data.projects.length} projects; ${data.coverage.length} channels).`);
  }
} catch (error) {
  console.error(`Tracker not written: ${error.message}`);
  process.exitCode = 1;
}

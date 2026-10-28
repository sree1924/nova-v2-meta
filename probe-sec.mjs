import fs from 'node:fs';
const inbox = process.argv[2];
const p = JSON.parse(fs.readFileSync(inbox, 'utf8'));
const b = JSON.parse(p.request.messages[2].content);
console.log('KEY ' + p.key);
console.log('LINEAGE ' + JSON.stringify(b.lineage_to_copy));
console.log('ASSIGNED ' + JSON.stringify(b.assigned_dossier_parts) + ' SECTIONS ' + JSON.stringify(b.section_ids));
for (const s of b.selected_source_pages) {
  console.log('===== pdf_page ' + s.pdf_page + ' printed ' + s.printed_page + ' =====');
  console.log(s.text ?? s.page_text ?? s.content);
}

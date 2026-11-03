# BUG-007 — repaint.html Keep/Reject clicks were dropped by the :4330 server (payload shape mismatch)

Status: FIXED 2026-11-01 · Severity: P1 (founder review work lost server-side) · Lane: Fable (`tools/audit/image-check-serve.mjs`, `image-repaint-page.mjs`)
Found: 2026-11-01 ~22:10Z — founder said "Done, apply"; `GET /decisions` returned `{}`; pane localStorage null (he reviewed in his own browser).

What
`image-repaint-page.mjs` POSTs `{decisions: {id: KEEP|REJECT}}`; the server was written for held.html's flat `{id: verdict}` and
filtered entries by `/^[a-z0-9-]+$/` + verdict in {KEEP,REJECT}. The single key `decisions` failed the filter, so every save wrote
`{"decisions": {}}`. Clicks survived only in the clicking browser's `localStorage['repaint-decisions']`. Also: the page's
on-load POST could overwrite the file with its own (possibly empty) map, because the server replaced instead of merging.

Fix
Server accepts both shapes (`parsed.decisions ?? parsed`) and merges with the on-disk map before writing. Recovery: reload
repaint.html in the browser where the clicks were made; the page merges localStorage and re-posts.

Closed: 2026-11-01, server fix in file; recovery verified when `GET /decisions` shows the 35 keys.

# Cloud-session pins

factory-workers-pins.zip — byte-exact copies of the four parent-factory role contracts the belt verifies by hash
(contracts/bot-contract-bindings.json pins them at ../factory/workers/ relative to the lane root):

| file | bytes | sha256 (prefix) |
|---|---|---|
| factory/workers/03-knowledge-architect.md | 6841 | 8c66430a |
| factory/workers/04-flashcard-engineer.md | 11430 | ce0ce218 |
| factory/workers/05-voice-coach.md | 15349 | 714aad6d |
| factory/workers/06-exam-author.md | 12677 | 689fcac8 |

Cloud recipe: from the clone root run `mkdir -p ../factory/workers && unzip -o coordination/cloud/factory-workers-pins.zip -d ../factory/workers`
then verify with `sha256sum ../factory/workers/*.md`. Zipped (not committed as text) so Windows/Linux line-ending normalization
cannot change the bytes. These are private factory contracts; the lane repo is private.

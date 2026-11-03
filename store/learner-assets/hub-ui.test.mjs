import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { patchHubHtml, CLOZE_RULE_STEM_RE, parseClozeRuleStem, buildLessonSegmentLabels } from './hub-ui.mjs';

// Exercise the generated learner functions against a small course rather than snapshotting markup.
const authoringFunctions = `
function vChapter(sectionId) { return 'old chapter'; }
function sectionOfUnit(unitId) { return 'chapter-a'; }
function vModule(moduleId) { return 'old module'; }
function vLesson(unitId) { return 'old lesson'; }
`;
const generatedRuntime = new vm.Script(patchHubHtml(authoringFunctions));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function course({ progress = {}, results = {}, missing = [], hasVideo = false } = {}) {
  const absent = new Set(missing);
  const saved = { progress: structuredClone(progress), results: structuredClone(results), preferences: { keep: 'unchanged' } };
  const before = JSON.stringify(saved);
  let writes = 0;
  const chapter = { id: 'chapter-a', n: 1, title: 'Licensing basics' };
  const modules = [
    { module_id: 'module-a', unit_id: 'unit-a', section_id: chapter.id, title: 'Resident & transfer rules' },
    { module_id: 'module-b', unit_id: 'unit-b', section_id: chapter.id, title: 'Applicant documents' },
  ];
  const env = {
    esc: escapeHtml,
    P: () => '#/id/',
    ST: { code: 'ID', name: 'Idaho' },
    stateSupportsVideo: () => hasVideo,
    sectionMeta: id => id === chapter.id ? chapter : null,
    modulesReal: id => !id || id === chapter.id ? modules : [],
    sessionUnit: id => absent.has('lesson') && id === 'unit-a' ? null : { slides: [{}, {}, {}] },
    deckForUnit: id => absent.has('cards') && id === 'unit-a' ? [] : [{ card_id: id + '-card1' }, { card_id: id + '-card2' }],
    moduleQuizForUnit: id => absent.has('quiz') && id === 'unit-a' ? null : { quiz_id: id === 'unit-a' ? 'quiz-a' : 'quiz-b', item_ids: ['question-1'] },
    store: { read: () => saved, write: () => { writes++; } },
    vMissing: () => '<h1>Activity unavailable</h1>',
  };
  const context = vm.createContext(env);
  generatedRuntime.runInContext(context);
  return {
    module() {
      const result = vm.runInContext('vModule("module-a")', context);
      assert.equal(writes, 0, 'rendering must not write progress');
      assert.equal(JSON.stringify(saved), before, 'rendering must not mutate saved data');
      return result;
    },
    chapter() {
      const result = vm.runInContext('vChapter("chapter-a")', context);
      assert.equal(writes, 0, 'rendering must not write progress');
      assert.equal(JSON.stringify(saved), before, 'rendering must not mutate saved data');
      return result;
    },
  };
}

function nextStep(html) {
  const match = html.match(/<section class="card plp-hub-next-card">([\s\S]*?)<\/section>/);
  assert.ok(match, 'a next-action panel should be present');
  return match[1];
}

function activity(html, title) {
  const rows = [...html.matchAll(/<article class="card plp-module-step-card[^\"]*">([\s\S]*?)<\/article>/g)].map(match => match[1]);
  const row = rows.find(body => body.includes(' · ' + title + '</h2>'));
  assert.ok(row, title + ' activity should remain visible');
  return row;
}

test('fresh learner is directed to the lesson reading and retains all activity links', () => {
  const html = course().module();
  const next = nextStep(html);
  assert.match(next, /UP NEXT/);
  assert.match(next, /href="#\/id\/read\/unit-a"/);
  assert.match(next, /Start page-flip reading/);
  assert.match(activity(html, 'Lesson Reading'), /Not started/);
  assert.match(activity(html, 'Flashcards'), /Not opened/);
  assert.match(activity(html, 'Quiz'), /Not attempted/);
  for (const label of ['Open reading', 'Drill flashcards', 'Take module quiz']) assert.equal(html.split(label).length - 1, 1);
});

test('a completed lesson directs the learner to flashcards', () => {
  const html = course({ progress: { 'unit-a': { lesson: true } } }).module();
  assert.match(nextStep(html), /href="#\/id\/cards\/unit-a"/);
  assert.match(nextStep(html), /Continue with flashcards/);
  assert.match(activity(html, 'Lesson Reading'), />✓ Complete</);
  assert.match(activity(html, 'Flashcards'), />Not opened</);
});

test('lesson completion and opened cards direct the learner to the quiz', () => {
  const html = course({ progress: { 'unit-a': { lesson: true, cards: true } } }).module();
  assert.match(nextStep(html), /href="#\/id\/quiz\/unit-a"/);
  assert.match(nextStep(html), /Take module quiz/);
  assert.match(activity(html, 'Flashcards'), />✓ Opened</);
  assert.doesNotMatch(activity(html, 'Flashcards'), />✓ Complete</);
  assert.match(activity(html, 'Quiz'), />Not attempted</);
});

test('the matching submitted quiz produces a review action even when its score is zero', () => {
  const html = course({
    progress: { 'unit-a': { lesson: true, cards: true } },
    results: { attempt: { formId: 'quiz:quiz-a', correctCount: 0, answers: [{ correct: false }] } },
  }).module();
  const next = nextStep(html);
  assert.match(next, /KEEP IT FRESH/);
  assert.match(next, /Revisit reading pages/);
  assert.match(next, /href="#\/id\/read\/unit-a"/);
  assert.doesNotMatch(next, /UP NEXT|Start page-flip reading/);
  assert.match(activity(html, 'Quiz'), />✓ Attempted</);
  assert.doesNotMatch(html, /mastered|quiz passed/i);
});

test('other modules and practice forms do not count as this module quiz', () => {
  const html = course({
    progress: { 'unit-a': { lesson: true, cards: true } },
    results: { other: { formId: 'quiz:quiz-b' }, chapterForm: { formId: 'form:quiz-a' }, synthetic: { formId: 'squiz:quiz-a' } },
  }).module();
  assert.match(nextStep(html), /Take module quiz/);
  assert.doesNotMatch(nextStep(html), /KEEP IT FRESH/);
  assert.match(activity(html, 'Quiz'), />Not attempted</);
});

test('an unavailable quiz stays visible as coming soon and cannot be falsely completed', () => {
  const html = course({
    progress: { 'unit-a': { lesson: true, cards: true, quiz: true } },
    results: { stale: { formId: 'quiz:quiz-a' } },
    missing: ['quiz'],
  }).module();
  const quiz = activity(html, 'Quiz');
  assert.match(quiz, />Coming soon</);
  assert.doesNotMatch(quiz, /href=|>✓ Attempted<|>✓ Complete</);
  assert.doesNotMatch(html, /mastered|all activities complete/i);
  assert.match(nextStep(html), /All steps visited/);
});

test('chapter progress counts lesson-completion flags only, exposes 1-click drills, and points to next lesson', () => {
  const html = course({
    hasVideo: true,
    progress: { 'unit-a': { lesson: true }, 'unit-b': { cards: true, quiz: true } },
    results: { attempt: { formId: 'quiz:quiz-b', correctCount: 1 } },
  }).chapter();
  assert.match(html, /role="progressbar" aria-label="Lessons completed" aria-valuemin="0" aria-valuemax="2" aria-valuenow="1"/);
  assert.match(html, /<p class="progress-caption">lessons completed</);
  const next = html.match(/<div class="chapter-next">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(next);
  assert.match(next, /Applicant documents/);
  assert.match(next, /href="#\/id\/module\/module-b"/);
  assert.match(html, /href="#\/id\/lesson\/unit-a"/);
  assert.match(html, /href="#\/id\/read\/unit-a"/);
  assert.match(html, /href="#\/id\/cards\/unit-a"/);
  assert.match(html, /href="#\/id\/quiz\/unit-a"/);
  assert.match(html, /Resident &amp; transfer rules/);
  assert.doesNotMatch(html, /modules completed|mastered/i);
});

test('mechanical continuation and split suffixes become clean numbered part titles while preserving aria-label', () => {
  const ctx = vm.createContext({
    esc: escapeHtml,
    P: () => '#/nd/',
    ST: { code: 'ND', name: 'North Dakota' },
    stateSupportsVideo: () => true,
    sectionMeta: () => ({ id: 'sec06', n: 6, title: 'Speed, Passing and Parking' }),
    modulesReal: () => [
      { module_id: 'sec06-m01', unit_id: 'sec06-u01', section_id: 'sec06', title: 'Speed passing and parking — A' },
      { module_id: 'sec06-m02', unit_id: 'sec06-u02', section_id: 'sec06', title: 'Speed passing and parking continuation a — B' },
    ],
    sessionUnit: () => ({ slides: [{}] }),
    deckForUnit: () => [{ card_id: 'c1', back: 'Roundabout traffic moves counterclockwise around the central island.' }],
    moduleQuizForUnit: () => ({ quiz_id: 'q1', item_ids: ['i1'] }),
    store: { read: () => ({ progress: {}, results: {} }), write: () => {} },
    vMissing: () => 'missing',
  });
  generatedRuntime.runInContext(ctx);
  const chHtml = vm.runInContext('vChapter("sec06")', ctx);
  assert.match(chHtml, /Speed passing and parking · Part 1/);
  assert.match(chHtml, /Speed passing and parking · Part 2/);
  assert.match(chHtml, /aria-label="Open module hub: Speed passing and parking continuation a — B"/);
  assert.match(chHtml, /Roundabout traffic moves counterclockwise/);
});

test('cloze cited-handbook-rule stem regex handles straight quotes, curly quotes, and non-matching stems without mutating input', () => {
  const straight = 'Which wording completes the cited handbook rule: "The handbook requires a social security number on permit, blank and identification-card applications."?';
  const curly = 'Which wording completes the cited handbook rule: “Testing requires identification proving legal presence,\npresent name and birth date, together with evidence of a North Dakota residential blank.”?';
  const plain = 'What must a first-time applicant obtain before beginning to drive in Pennsylvania?';

  assert.ok(CLOZE_RULE_STEM_RE.test(straight));
  assert.deepEqual(parseClozeRuleStem(straight), {
    isCloze: true,
    body: 'The handbook requires a social security number on permit, blank and identification-card applications.',
  });

  assert.ok(CLOZE_RULE_STEM_RE.test(curly));
  assert.deepEqual(parseClozeRuleStem(curly), {
    isCloze: true,
    body: 'Testing requires identification proving legal presence,\npresent name and birth date, together with evidence of a North Dakota residential blank.',
  });

  assert.equal(CLOZE_RULE_STEM_RE.test(plain), false);
  assert.deepEqual(parseClozeRuleStem(plain), {
    isCloze: false,
    body: plain,
  });
});

test('video segment labels replace template slide titles with teaching copy and suffix consecutive duplicates', () => {
  const realTitles = buildLessonSegmentLabels({
    slides: [
      { title: { text: 'Keeping your vehicle legal' }, lines: [{ text: 'Register before driving.' }] },
      { title: { text: 'One sticker, one database' }, lines: [{ text: 'Inspection precedes renewal.' }] },
    ],
  }, [{ kind: 'concept' }, { kind: 'rule' }]);
  assert.deepEqual(realTitles, ['Keeping your vehicle legal', 'One sticker, one database']);

  const templated = buildLessonSegmentLabels({
    slides: [
      { title: { text: 'Start with the rule' }, lines: [{ text: 'and birth date, together with' }], narration: { text: 'Begin by keeping each rule with its own condition. Testing requires identification proving legal presence, present name and birth date.' } },
      { title: { text: 'Conditions guide the action' }, lines: [{ text: 'Drivers must yield to pedestrians in any marked crosswalk.' }] },
      { title: { text: 'Conditions guide the action' }, lines: [{ text: 'Drivers must yield to pedestrians in any marked crosswalk.' }] },
    ],
  }, [{ kind: 'concept' }, { kind: 'rule' }, { kind: 'rule' }]);
  assert.equal(templated[0], 'Testing requires identification proving legal presence…');
  assert.equal(templated[1], 'Drivers must yield to pedestrians in any marked crosswalk');
  assert.equal(templated[2], 'Drivers must yield to pedestrians in any marked crosswalk · 2');
});

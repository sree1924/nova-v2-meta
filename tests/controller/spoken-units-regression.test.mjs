import test from 'node:test';
import assert from 'node:assert/strict';
import {spokenize} from '../../tools/belt/compile.mjs';

for(const [name,source,expected] of [
 ['written speed unit','Each further five mph above that threshold.','Each further five miles per hour above that threshold.'],
 ['hyphenated speed','The 55-mph limit applies.','The fifty-five miles per hour limit applies.'],
 ['unit range','The 30–55-mph range applies.','The thirty to fifty-five miles per hour range applies.'],
 ['slash speed unit','At 5 mi/h, slow down.','At five miles per hour, slow down.'],
 ['decimal qualification','At .08 BAC, the 25-mph example still depends on dry roads.','At point zero eight BAC, the twenty-five miles per hour example still depends on dry roads.'],
 ['ordinary preposition','In 5 minutes, stay in lane; signed in 1787 in Philadelphia.','In five minutes, stay in lane; signed in one thousand seven hundred eighty-seven in Philadelphia.'],
]) test(name,()=>{assert.equal(spokenize(source),expected);assert.equal(spokenize(expected),expected);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {spokenize} from '../../tools/belt/compile.mjs';

for(const [label,expected] of [
 ['STOP/SLOW','STOP slash SLOW'],
 ['stop/yield','stop slash yield'],
 ['day/night','day slash night'],
 ['forward/backward','forward slash backward'],
])test('literal traffic label '+label,()=>{const source='Read the '+label+' label exactly.',spoken='Read the '+expected+' label exactly.';assert.equal(spokenize(source),spoken);assert.equal(spokenize(spoken),spoken);});

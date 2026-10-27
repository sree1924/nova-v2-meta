import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {acquireExecutorLock,readExecutorLock} from '../../tools/belt/executor-lock.mjs';

// Every lock in these tests is isolated under an OS temporary directory, never a run folder.
function temporary(){return fs.mkdtempSync(path.join(os.tmpdir(),'nova-synthetic-lock-'));}
function cleanup(directory){assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(directory,{recursive:true,force:true});}
test('exclusive lock is durable and a second executor cannot steal it',()=>{const directory=temporary();try{const held=acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'first'});assert.equal(readExecutorLock(directory).executor_id,'first');assert.equal(held.assertHeld(),true);assert.throws(()=>acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'second'}),/EXECUTOR_LOCK_HELD/);held.release();assert.throws(()=>held.assertHeld(),/RELEASED/);}finally{cleanup(directory);}});
test('old timestamp is never enough to steal a lock',()=>{const directory=temporary();try{const held=acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'first',clock:()=> '2000-01-01T00:00:00Z'});assert.throws(()=>acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'second'}),/explicit reconciliation/);held.release();}finally{cleanup(directory);}});
test('changing the on-disk ownership token fences the old handle',()=>{const directory=temporary();try{const held=acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'first'});const bytes=fs.readFileSync(held.lockPath,'utf8').replace(held.lockId,'different-token');fs.writeFileSync(held.lockPath,bytes);assert.throws(()=>held.assertHeld(),/FENCED/);assert.throws(()=>held.release(),/FENCED/);}finally{cleanup(directory);}});
test('explicit release permits a fresh ownership token',()=>{const directory=temporary();try{const first=acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'first'});first.release();const second=acquireExecutorLock({runDir:directory,runId:'SYNTHETIC',executorId:'second'});assert.notEqual(first.lockId,second.lockId);second.release();}finally{cleanup(directory);}});

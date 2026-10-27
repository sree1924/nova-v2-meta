import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// Only this exclusive file is written before the SQLite ownership claim. No age/PID heuristic
// removes another executor's lock. Interrupted locks require explicit operator reconciliation.
export function readExecutorLock(runDir){
  const lockPath=path.join(path.resolve(runDir),'EXECUTOR.lock.md');
  const text=fs.readFileSync(lockPath,'utf8');
  const match=text.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  if(!match)throw new Error('Executor lock is not a recognized immutable lock record');
  return{lockPath,...JSON.parse(match[1])};
}

export function acquireExecutorLock({runDir,runId,executorId,clock=()=>new Date().toISOString()}={}){
  if(typeof runDir!=='string'||!runDir||typeof runId!=='string'||!runId||typeof executorId!=='string'||!executorId)throw new Error('runDir, runId and executorId are required');
  const directory=path.resolve(runDir);
  fs.mkdirSync(directory,{recursive:true});
  const lockPath=path.join(directory,'EXECUTOR.lock.md');
  const record={schema_version:'executor-lock.v0.4.0',run_id:runId,executor_id:executorId,lock_id:crypto.randomUUID(),pid:process.pid,hostname:os.hostname(),acquired_at:clock()};
  let descriptor;
  try{
    descriptor=fs.openSync(lockPath,'wx',0o600);
    fs.writeFileSync(descriptor,'# Exclusive pilot executor\n\n```json\n'+JSON.stringify(record,null,2)+'\n```\n');
    fs.fsyncSync(descriptor);
  }catch(error){
    if(error.code==='EEXIST')throw new Error('EXECUTOR_LOCK_HELD: existing lock requires explicit reconciliation; age alone grants no authority');
    throw error;
  }finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
  let released=false;
  const handle={runDir:directory,lockPath,runId,executorId,lockId:record.lock_id,pid:record.pid,
    assertHeld(){
      if(released)throw new Error('EXECUTOR_LOCK_RELEASED');
      const current=readExecutorLock(directory);
      if(current.lock_id!==record.lock_id||current.run_id!==runId||current.executor_id!==executorId||current.pid!==process.pid||current.hostname!==os.hostname())throw new Error('EXECUTOR_LOCK_FENCED: ownership record changed');
      return true;
    },
    release(){
      handle.assertHeld();
      fs.unlinkSync(lockPath);released=true;return{status:'released',lockId:record.lock_id};
    }
  };
  return Object.freeze(handle);
}

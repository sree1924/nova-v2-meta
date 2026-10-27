import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const slash=value=>value.replaceAll('\\','/');
const within=(base,target)=>{const rel=path.relative(base,target);return!rel.startsWith('..')&&!path.isAbsolute(rel);};

// Metadata/provenance only: no imports of owner code, fixture execution or post-validation.
// receiptFiles is a normalized path/hash list, not an assumed owner-receipt protocol.
export function inspectImplementationClosure({projectRoot,receiptFiles=null}={}){
  const root=path.resolve(projectRoot),repo=path.dirname(root);
  const observed=new Map(),missing=new Set(),errors=[],dynamicImports=[],packages=new Set(),parentPins=[];
  const queue=[];
  const add=(relative,reason)=>{
    if(typeof relative!=='string'||!relative){errors.push('Missing dependency path: '+reason);return;}
    const target=path.resolve(root,relative);
    if(!within(root,target)){errors.push('Dependency escapes project: '+relative);return;}
    const rel=slash(path.relative(root,target));
    if(observed.has(rel)){observed.get(rel).reasons.push(reason);return;}
    if(!fs.existsSync(target)||!fs.statSync(target).isFile()){missing.add(rel);return;}
    const bytes=fs.readFileSync(target);
    observed.set(rel,{path:rel,sha256:digest(bytes),bytes:bytes.length,reasons:[reason]});
    if(/\.[cm]?js$/.test(target))queue.push({target,text:bytes.toString('utf8')});
  };
  for(const file of ['schemas-strict/stage-map.json','tools/belt/post-validate.mjs','tools/belt/strict-lint.mjs','package.json','package-lock.json'])add(file,'implementation entrypoint/lock');
  let stages={};
  const mapPath=path.join(root,'schemas-strict','stage-map.json');
  if(fs.existsSync(mapPath)){
    try{
      const map=JSON.parse(fs.readFileSync(mapPath,'utf8'));stages=map.stages||{};
      if(Object.keys(stages).length!==10)errors.push('Expected ten explicit stage-map entries');
      for(const [id,stage]of Object.entries(stages)){
        for(const field of ['adapter_schema','mapping','checks_module'])add(stage[field],id+'.'+field);
        if(typeof stage.prompt_path!=='string')errors.push('Missing prompt path: '+id);
        const parent=stage.parent_schema;
        if(!parent?.path||!/^[a-f0-9]{64}$/.test(parent.sha256||'')){errors.push('Missing parent schema pin: '+id);continue;}
        const target=path.resolve(repo,parent.path);
        if(!within(repo,target)){errors.push('Parent pin escapes repository: '+id);continue;}
        const present=fs.existsSync(target)&&fs.statSync(target).isFile();
        const actual=present?digest(fs.readFileSync(target)):null;
        parentPins.push({stage_id:id,path:parent.path,expected_sha256:parent.sha256,observed_sha256:actual,status:actual===parent.sha256?'MATCH':'MISSING_OR_CHANGED'});
        if(actual!==parent.sha256)errors.push('Parent schema pin missing/changed: '+id);
        if(stage.local_owned_schema?.path){
          add(stage.local_owned_schema.path,id+'.local_owned_schema');
          const ref=observed.get(slash(stage.local_owned_schema.path));
          if(ref&&ref.sha256!==stage.local_owned_schema.sha256)errors.push('Local owned schema pin changed: '+id);
        }
      }
      for(const [name,p]of Object.entries(map.shared_context_artifacts||{}))add(p,'stage-map shared context '+name);
    }catch(error){errors.push('Cannot inspect stage map: '+error.message);}
  }
  // A sealed owner list may legitimately include tests/fixtures beyond discovered code.
  // Verify those files too, while discovery still detects dependencies omitted from that list.
  if(Array.isArray(receiptFiles))for(const ref of receiptFiles)if(ref?.path)add(ref.path,'explicit normalized owner closure pin');
  for(let i=0;i<queue.length;i++){
    const {target,text}=queue[i];
    // Captures static ESM imports/re-exports and literal dynamic imports/require calls.
    const literals=[...text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
    for(const specifier of literals){
      if(specifier.startsWith('node:'))continue;
      if(specifier.startsWith('.'))add(slash(path.relative(root,path.resolve(path.dirname(target),specifier))),'local import from '+slash(path.relative(root,target)));
      else packages.add(specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0]);
    }
    for(const match of text.matchAll(/\bimport\s*\(\s*([^'"\s][^)]*)\)/g)){
      const expression=match[1].trim();
      // This known dispatch edge is enumerated by each stage-map checks_module above.
      const mappedDispatcher=slash(path.relative(root,target))==='tools/belt/post-validate.mjs'&&expression==='pathToFileURL(modAbs';
      if(!mappedDispatcher)dynamicImports.push({path:slash(path.relative(root,target)),expression,resolution:'unresolved_dynamic_local_dependency'});
    }
  }
  const entries=[...observed.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const unlisted=[],changed=[],sealedMissing=[];
  let sealStatus='AWAITING_SEALED_OWNER_RECEIPT';
  if(Array.isArray(receiptFiles)){
    const pins=new Map();
    for(const ref of receiptFiles){if(!ref?.path||!/^[a-f0-9]{64}$/.test(ref.sha256||'')){errors.push('Malformed normalized closure pin');continue;}if(pins.has(ref.path))errors.push('Duplicate closure pin: '+ref.path);pins.set(ref.path,ref.sha256);}
    for(const entry of entries){if(!pins.has(entry.path))unlisted.push(entry.path);else if(pins.get(entry.path)!==entry.sha256)changed.push(entry.path);}
    for(const p of pins.keys())if(!observed.has(p))sealedMissing.push(p);
    sealStatus=unlisted.length||changed.length||sealedMissing.length?'CLOSURE_HASH_MISMATCH':'LISTED_HASHES_MATCH_ONLY';
  }
  return{purpose:'read_only_implementation_dependency_provenance',stage_count:Object.keys(stages).length,observed_files:entries,missing_files:[...missing].sort(),parent_schema_pins:parentPins,bare_package_imports:[...packages].sort(),unresolved_dynamic_imports:dynamicImports,validation_errors:errors,receipt_status:sealStatus,unlisted_dependencies:unlisted,changed_dependencies:changed,sealed_but_unresolved:sealedMissing,closure_complete:missing.size===0&&errors.length===0&&dynamicImports.length===0,validation_claim:'No implementation or fixture was executed; matching hashes never constitute artifact validation.'};
}

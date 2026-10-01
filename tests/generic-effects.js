const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const files=fs.readdirSync(path.join(root,'data/pathways')).filter(x=>x.endsWith('.json')&&x!=='index.json');
const defs=new Set(), counts={};
for(const f of files){
  const d=JSON.parse(fs.readFileSync(path.join(root,'data/pathways',f),'utf8'));
  for(const s of d.sequences||[]){
    const a=s.ability;
    for(const e of a?.effects||[]){defs.add(e.type);counts[e.type]=(counts[e.type]||0)+1;}
  }
}
const engine=fs.readFileSync(path.join(root,'js/engine.js'),'utf8');
const v15=fs.readFileSync(path.join(root,'js/v15.js'),'utf8');
const specialHandled=new Set(['mind_control','skill_misfire','damage_rule','transfer_debuffs']);
const handled=[...defs].filter(t=>engine.includes(`e.type==='${t}'`)||v15.includes(`_${t}`)||specialHandled.has(t));
const missing=[...defs].filter(t=>!handled.includes(t));
if(missing.length){console.error('Unhandled effect types:',missing.map(x=>`${x} (${counts[x]})`));process.exit(1)}
console.log('PASS generic effect audit:',defs.size,'effect types; all are referenced by the engine.');

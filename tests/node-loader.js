// Structural regression tests for the manifest-driven pathway data layer.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),dir=path.join(root,'data','pathways');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8'));
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json')&&x!=='index.json').map(x=>x.slice(0,-5)).sort();
const order=[...manifest.order];
assert.strictEqual(order.length,22,'index.json must list 22 pathways');
assert.strictEqual(new Set(order).size,22,'index.json must not contain duplicate pathway keys');
assert.deepStrictEqual(files,[...order].sort(),'pathway files on disk and manifest order must match exactly');
for(const key of order){
  const file=JSON.parse(fs.readFileSync(path.join(dir,`${key}.json`),'utf8'));
  assert.strictEqual(file.key,key,`${key}.json key must match filename`);
  assert.strictEqual(file.schema,'pathway.v1',`${key}.json schema`);
  assert.deepStrictEqual(file.sequences.map(x=>x.sequence).sort((a,b)=>b-a),[9,8,7,6,5,4,3,2,1,0],`${key}.json sequences`);
}
assert.strictEqual(Object.keys(manifest.counters).length,22,'counters must contain all 22 keys');
for(const key of order)assert(order.includes(manifest.counters[key]),`counter target for ${key} must be another listed pathway`);
const g=require('../js/node-loader.js');
assert.strictEqual(g.PATH_KEYS.length,22,'runtime PATH_KEYS');
assert.strictEqual(Object.keys(g.PATHS).length,22,'runtime PATHS');
assert.strictEqual(Object.keys(g.PATH_COUNTERS).length,22,'runtime PATH_COUNTERS');
assert.strictEqual(Object.keys(g.PATH_METERS).length,22,'runtime PATH_METERS');
assert(g.PATH_KEYS.every(k=>g.PATHS[k].sequences.length===10),'runtime pathways must expose 9..0');
console.log('PASS pathway manifest/file parity');
console.log('PASS node loader assembled 22 pathways from manifest');

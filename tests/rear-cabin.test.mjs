import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCabinSeats,buildCabinTrim} from '../src/cabin-trim.ts';
import {carpetY} from '../src/floor-profile.ts';
import {rearZ,sideSkinX} from '../src/profile.ts';
import {createCarMaterials} from '../src/materials.ts';

const root=new T.Group(),materials=createCarMaterials();
buildCabinTrim(root,materials);buildCabinSeats(root,materials);root.updateMatrixWorld(true);
const meshes=[];
root.traverse(o=>{if(o.isMesh)meshes.push(o);});
const find=name=>meshes.filter(o=>o.name===name);
const required=name=>{
  const objects=find(name);assert.ok(objects.length,`missing ${name}`);return objects;
};
const bounds=o=>new T.Box3().setFromObject(o,true);
const vertices=function*(o){
  const p=o.geometry.getAttribute('position');
  for(let i=0;i<p.count;i++)yield new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
};
const ray=(p,d,objects)=>new T.Raycaster(new T.Vector3(...p),new T.Vector3(...d)).intersectObjects(objects)[0];

test('front and rear woven inserts remain visible with outward-facing normals',()=>{
  for(const side of [-1,1]){
    const x=side*.35;
    for(const [p,d,shell,insert,axis] of [
      [[x,.80,-.245],[0,-1,0],'seat-cushion','seat-cushion-insert','y'],
      [[x,.80,-.25],[0,0,-1],'seat-back','seat-back-insert','z'],
      [[x,.78,-1.00],[0,-1,0],'rear-seat-cushion','rear-cushion-insert','y'],
      [[x,.85,-.93],[0,0,-1],'rear-seat-back','rear-back-insert','z'],
    ]){
      const shellHit=ray(p,d,required(shell)),hit=ray(p,d,[...required(insert),...required(shell)]);
      assert.ok(shellHit&&hit,`no cloth surface at ${p}`);
      assert.equal(hit.object.name,insert,`the shell obscures ${insert}`);
      assert.ok(hit.face.normal[axis]>.8,`${insert} faces into the seat`);
      assert.ok(shellHit.distance-hit.distance<.009,`${insert} floats above the foam`);
    }
  }
});

test('rear upholstery and trim stay inside the side skin and outside the structural wheelhouse',()=>{
  const names=['rear-seat-cushion','rear-seat-back','rear-quarter-card','rear-wheel-tub-cover','rear-shelf-support','hatch-inner-trim'];
  for(const name of names)for(const mesh of required(name))for(const p of vertices(mesh)){
    const wheelRoof=.29+Math.sqrt(Math.max(0,.337**2-(p.z+1.185)**2));
    assert.ok(Math.abs(p.x)<sideSkinX(p.z,p.y)-.004,`${name} crosses the side skin at ${p.toArray()}`);
    if(p.y<=1)assert.ok(p.z>rearZ(p.x,p.y)+.004,`${name} crosses the hatch skin`);
    if(Math.abs(p.z+1.185)<.337&&p.y>.29&&p.y<wheelRoof-.001){
      assert.ok(Math.abs(p.x)<.590,`${name} enters the wheel tub at ${p.toArray()}`);
    }
  }
});

test('rear quarter cloth faces the cabin and leaves a recessed molded pocket open',()=>{
  const objects=['rear-quarter-card','rear-quarter-cloth-insert','rear-quarter-pocket','rear-quarter-pocket-wall'].flatMap(required);
  for(const side of [-1,1]){
    const insert=ray([0,.880,-1.015],[side,0,0],objects);
    assert.equal(insert?.object.name,'rear-quarter-cloth-insert');
    assert.ok(insert.face.normal.x*side<-.75,'cloth faces into the side card');
    const pocket=ray([0,.797,-.901],[side,0,0],objects);
    assert.equal(pocket?.object.name,'rear-quarter-pocket','plastic card or cloth fills the pocket opening');
    const card=ray([0,.797,-.901],[side,0,0],required('rear-quarter-card'));
    assert.equal(card,undefined,'quarter shell crosses the pocket opening');
  }
});

test('rear belts are ribbons between their actual pillar guides and floor anchors',()=>{
  const belts=required('rear-belt-webbing'),guides=required('rear-belt-guide'),anchors=required('rear-belt-anchor');
  assert.equal(belts.length,2);assert.equal(guides.length,2);assert.equal(anchors.length,2);
  for(const belt of belts){
    const span=bounds(belt),side=Math.sign(span.getCenter(new T.Vector3()).x);
    assert.ok(span.getSize(new T.Vector3()).y>.60,'the sash should reach from shoulder height to the floor');
    const guide=bounds(guides.find(o=>Math.sign(bounds(o).getCenter(new T.Vector3()).x)===side));
    const anchor=bounds(anchors.find(o=>Math.sign(bounds(o).getCenter(new T.Vector3()).x)===side));
    for(const contact of [guide,anchor])assert.ok([...vertices(belt)].some(p=>contact.containsPoint(p)),'webbing stops short of its mount');
    const position=belt.geometry.getAttribute('position');
    const width=new T.Vector3().fromBufferAttribute(position,0).distanceTo(new T.Vector3().fromBufferAttribute(position,1));
    assert.ok(width>.030&&width<.053,'sash should have the width of flat seat-belt webbing');
  }
});

test('handbrake grip connects to a floor-mounted lever and leaves the automatic cup wells open',()=>{
  const [returnTrim]=required('handbrake-console-return'),[pivot]=required('handbrake-pivot');
  const [lever]=required('handbrake-lever'),[grip]=required('handbrake-grip'),[button]=required('handbrake-release');
  assert.ok(bounds(pivot).intersectsBox(bounds(lever)),'lever misses the pivot');
  assert.ok(bounds(lever).intersectsBox(bounds(grip)),'grip is detached from the lever');
  assert.ok(bounds(grip).intersectsBox(bounds(button)),'release button floats off the grip');
  const floorContact=[...vertices(returnTrim)].some(p=>Math.abs(p.y-carpetY(p.x,p.z))<.004);
  assert.ok(floorContact,'rear console stops above the carpet');
  for(const cup of required('cup-bottom')){
    const c=cup.getWorldPosition(new T.Vector3());
    assert.equal(ray([c.x,1,c.z],[0,-1,0],meshes)?.object,cup,'the console or lever blocks a cup opening');
  }
  for(const brake of [lever,grip,button])for(const cushion of required('seat-cushion')){
    assert.ok(!bounds(brake).intersectsBox(bounds(cushion)),'handbrake intersects a front seat');
  }
});

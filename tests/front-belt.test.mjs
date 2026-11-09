import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCabinSeats,buildCabinTrim} from '../src/cabin-trim.ts';
import {createCarMaterials} from '../src/materials.ts';
import {doorWindow,quarterWindow,sideSkinX} from '../src/profile.ts';
import {carpetY} from '../src/floor-profile.ts';
import {sampleBounce,applyBounce} from '../src/motion.ts';

const root=new T.Group(),m=createCarMaterials();
buildCabinSeats(root,m);buildCabinTrim(root,m);root.updateMatrixWorld(true);
const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
const find=name=>meshes.filter(o=>o.name===name);
const box=o=>new T.Box3().setFromObject(o,true);
const vertices=o=>Array.from({length:o.geometry.getAttribute('position').count},(_,i)=>new T.Vector3()
  .fromBufferAttribute(o.geometry.getAttribute('position'),i).applyMatrix4(o.matrixWorld));
const sideOf=o=>Math.sign(box(o).getCenter(new T.Vector3()).x);
const polygonContains=(p,polygon)=>{
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
};

test('stowed front belts clear both seats and door trim throughout compression and rebound',()=>{
  const belts=[...find('seat-belt'),...find('front-belt-return')];assert.ok(belts.length>=2);
  // front-seat is a group; inspect its real upholstered child meshes.
  const cushions=[...find('seat-cushion'),...find('seat-back')];assert.equal(cushions.length,4);
  const cards=find('door-card');
  for(const phase of [0,.32,.62]){
    applyBounce(root,sampleBounce(phase,1));root.updateMatrixWorld(true);
    const seatBounds=cushions.map(box);
    for(const belt of belts)for(const p of vertices(belt)){
      for(const bounds of seatBounds)assert.ok(bounds.distanceToPoint(p)>.006*root.scale.y,
        `belt enters front upholstery at ${p.toArray()} (phase ${phase})`);
      const hit=new T.Raycaster(new T.Vector3(0,p.y,p.z),new T.Vector3(Math.sign(p.x),0,0)).intersectObjects(cards)[0];
      if(hit)assert.ok(hit.distance-Math.abs(p.x)>.004*root.scale.x,`belt disappears into door trim at ${p.toArray()}`);
    }
  }
  root.scale.setScalar(1);root.updateMatrixWorld(true);
});

test('flat front webbing connects to solid pillar guides, retractors and floor anchors',()=>{
  root.scale.setScalar(1);root.updateMatrixWorld(true);
  for(const name of ['seat-belt','front-belt-return','front-belt-guide','front-belt-pillar-mount','front-belt-floor-anchor','front-belt-retractor'])assert.equal(find(name).length,2,`missing mirrored ${name}`);
  const glass=[doorWindow(),quarterWindow()].map(s=>s.getPoints(80));
  for(const belt of find('seat-belt')){
    const side=sideOf(belt),same=name=>find(name).find(o=>sideOf(o)===side);
    const p=belt.geometry.getAttribute('position');
    const width=new T.Vector3().fromBufferAttribute(p,0).distanceTo(new T.Vector3().fromBufferAttribute(p,1));
    assert.ok(width>.038&&width<.052,'front belt must be flat webbing, not a cord');
    for(const name of ['front-belt-guide','front-belt-floor-anchor'])assert.ok(box(belt).intersectsBox(box(same(name))),`webbing misses ${name}`);
    assert.ok(box(same('front-belt-return')).intersectsBox(box(same('front-belt-retractor'))),'return misses retractor');
    assert.ok(box(same('front-belt-guide')).intersectsBox(box(same('front-belt-pillar-mount'))),'guide floats off pillar mounting');
    for(const v of vertices(same('front-belt-pillar-mount'))){
      assert.ok(glass.every(poly=>!polygonContains(new T.Vector2(v.z,v.y),poly)),'mount lies on window glass');
      assert.ok(Math.abs(v.x)<=sideSkinX(v.z,v.y)+.001,'mount crosses the exterior skin');
    }
    assert.ok(vertices(same('front-belt-floor-anchor')).some(v=>Math.abs(v.y-carpetY(v.x,v.z))<.005),'anchor floats above floor');
  }
});

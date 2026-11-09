import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildEngine} from '../src/engine.ts';
import {createCarMaterials} from '../src/materials.ts';

const engine=buildEngine(new T.Group(),createCarMaterials());
engine.updateMatrixWorld(true);
const part=name=>{
  const object=engine.getObjectByName(name);
  assert.ok(object,`${name} is missing`);
  return object;
};
const bounds=object=>new T.Box3().setFromObject(object);
const down=new T.Vector3(0,-1,0);

test('the engine cover has a crown and a lower contoured front skirt',()=>{
  const cover=part('vvt-i-cover');
  const height=(x,z)=>new T.Raycaster(new T.Vector3(x,1.05,z),down).intersectObject(cover)[0]?.point.y;
  const crown=height(-.15,1.222),skirt=height(-.15,1.340);
  assert.ok(crown>.84 && skirt>.77 && crown-skirt>.025,'cover has no crown-to-skirt step');
  const front=[];
  for(let x=-.36;x<=.08;x+=.01){
    const hit=new T.Raycaster(new T.Vector3(x,.800,1.50),new T.Vector3(0,0,-1)).intersectObject(cover)[0];
    if(hit)front.push(hit.point.z);
  }
  assert.ok(front.length>=35 && Math.max(...front)-Math.min(...front)>.019,'cover front edge has no moulded relief');
});

test('intake and cooling hoses terminate on nipples attached to their components',()=>{
  for(const [hose,start,startBody,end,endBody] of [
    ['intake-hose','airbox-outlet','air-cleaner','throttle-inlet','throttle-body'],
    ['radiator-upper-hose','radiator-upper-nipple','radiator-header','head-water-outlet','cylinder-head'],
    ['radiator-lower-hose','radiator-lower-nipple','radiator-tank-lower','water-pump-inlet','timing-cover'],
    ['radiator-overflow-line','radiator-overflow-port','radiator-neck','coolant-reservoir-return','coolant-filler-neck'],
    ['booster-vacuum-hose','booster-vacuum-port','brake-booster','plenum-vacuum-port','intake-plenum'],
    ['crankcase-breather-hose','cam-cover-breather','vvt-i-cover','intake-breather-port','intake-hose'],
    ['pcv-hose','pcv-valve','cylinder-head','plenum-pcv-port','intake-plenum'],
  ]){
    const route=part(hose);
    const curve=route.geometry.parameters.path;
    for(const [u,port,body] of [[0,start,startBody],[1,end,endBody]]){
      const nipple=part(port),socket=bounds(nipple);
      const endpoint=curve.getPointAt(u).applyMatrix4(route.matrixWorld);
      for(const side of [-1,1]){
        const direction=new T.Vector3(1,1,1).normalize().multiplyScalar(side);
        const origin=endpoint.clone().addScaledVector(direction,-.100);
        const hit=new T.Raycaster(origin,direction).intersectObject(nipple)[0];
        assert.ok(hit?.distance<.100,`${hose} stops short of ${port}`);
      }
      assert.ok(socket.intersectsBox(bounds(part(body))),`${port} floats off ${body}`);
    }
  }
});

test('the intake elbow bellows follow the curved duct axis',()=>{
  const hose=part('intake-hose'),path=hose.geometry.parameters.path;
  const rings=engine.children.filter(child=>child.name==='intake-hose-bellows');
  assert.ok(rings.length>=4);
  for(const ring of rings){
    let closest=0,distance=Infinity;
    for(let i=0;i<=200;i++){
      const u=i/200,gap=path.getPointAt(u).distanceTo(ring.position);
      if(gap<distance){closest=u;distance=gap;}
    }
    const ringAxis=new T.Vector3(0,0,1).applyQuaternion(ring.quaternion);
    assert.ok(distance<.003&&Math.abs(ringAxis.dot(path.getTangentAt(closest)))>.99,'bellows sits off the rubber duct');
  }
});

test('four curved intake runners meet both the cylinder head and the plenum',()=>{
  const manifold=part('intake-manifold'),runners=manifold.children.filter(child=>child.name==='intake-runner');
  assert.equal(runners.length,4);
  const head=bounds(part('cylinder-head')),plenum=bounds(part('intake-plenum'));
  for(const runner of runners){
    const path=runner.geometry.parameters.path;
    const start=path.getPointAt(0),turn=path.getPointAt(.48),end=path.getPointAt(1);
    assert.ok(head.containsPoint(start),'runner starts clear of the head');
    assert.ok(plenum.containsPoint(end),'runner misses the plenum');
    assert.ok(turn.z>Math.max(start.z,end.z)+.030,'runner has no visible forward sweep');
  }
});

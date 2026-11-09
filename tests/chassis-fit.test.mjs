import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildChassis} from '../src/chassis.ts';
import {buildFootwell} from '../src/footwell.ts';
import {createCarMaterials} from '../src/materials.ts';
import {buildWheels} from '../src/details.ts';
import {frontPanelPoint,sideSkinX} from '../src/profile.ts';
import {sampleBounce,applyBounce} from '../src/motion.ts';

const car={root:new T.Group()},materials=createCarMaterials();
buildChassis(car.root,materials);buildFootwell(car.root,materials);car.root.updateMatrixWorld(true);
const all=[];car.root.traverse(o=>{if(o.isMesh)all.push(o);});
const bounds=o=>new T.Box3().setFromObject(o);

test('the underbody closes the front, passenger and rear floor instead of ending mid-car',()=>{
  for(const x of [-.35,0,.35])for(const z of [-1.60,-1.40,-.60,0,.60,1.42,1.58]){
    const hit=new T.Raycaster(new T.Vector3(x,.05,z),new T.Vector3(0,1,0)).intersectObjects(all,true)[0];
    assert.ok(hit&&hit.point.y<.50,`underbody is missing at ${x}, ${z}: ${hit?.point.y}`);
  }
});

test('automatic pedals hang from brackets and present inclined rubber faces to the driver',()=>{
  const brake=car.root.getObjectByName('brake-pedal-pad'),gas=car.root.getObjectByName('accelerator-pedal-pad');
  assert.ok(brake&&gas,'two mounted pedal assemblies are missing');
  assert.ok(bounds(brake).getSize(new T.Vector3()).x>bounds(gas).getSize(new T.Vector3()).x*1.7);
  for(const pad of [brake,gas]){
    const b=bounds(pad),center=b.getCenter(new T.Vector3());
    assert.ok(b.min.y>.35&&center.x<-.20&&center.z>.40,'pedal lies flat on the floor or outside the driving footwell');
    const facing=new T.Vector3(0,0,-1).transformDirection(pad.matrixWorld);
    assert.ok(facing.z<-.8&&facing.y>.2,'pedal face must lean toward the driver');
    const arm=pad.parent.getObjectByName('pedal-arm');assert.ok(arm&&bounds(arm).max.y>.61,'pedal has no upper mounting arm');
  }
});

test('a transverse 1NZ-FE and transaxle fit above the front axle behind the body skin',()=>{
  const engine=car.root.getObjectByName('engine-1nz-fe');assert.ok(engine,'front engine bay is empty');
  const block=engine.getObjectByName('engine-block'),box=bounds(block),size=box.getSize(new T.Vector3());
  assert.ok(size.x>size.z*1.35&&box.min.y>.34&&box.max.y<.80,'engine block is not transverse above the front axle');
  assert.ok(engine.getObjectByName('transaxle')&&engine.getObjectByName('intake-manifold'),'powertrain is missing the gearbox or intake');
  engine.traverse(o=>{
    if(!o.isMesh)return;const p=o.geometry.getAttribute('position');
    for(let i=0;i<p.count;i+=7){
      const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
      assert.ok(v.y>.20&&v.z>.86&&v.z<1.69,`${o.name}: outside engine compartment`);
      if(v.y>.234&&v.y<1.007&&Math.abs(v.x)<.585+.120*T.MathUtils.smoothstep(v.y,.36,.44))
        assert.ok(v.z>.916,`${o.name}: intersects the structural firewall`);
      assert.ok(Math.abs(v.x)<sideSkinX(v.z,v.y)-.025,`${o.name}: crosses side skin`);
      if(v.y>.70)assert.ok(v.z<frontPanelPoint(v.x,v.y).z-.026,`${o.name}: crosses bonnet`);
    }
  });
});

test('all four hubs reach the preserved wheel backing at the axle centre',()=>{
  const wheels=new T.Group();buildWheels(wheels,materials);wheels.updateMatrixWorld(true);
  for(const side of [-1,1])for(const z of [-1.185,1.185]){
    const contact=new T.Raycaster(new T.Vector3(0,.29,z),new T.Vector3(side,0,0)).intersectObject(wheels,true).find(h=>h.object.isMesh);
    assert.ok(contact,'wheel centre has no backing');
    const hubs=all.filter(o=>o.name===(z>0?'front-wheel-hub':'rear-wheel-hub')&&Math.sign(bounds(o).getCenter(new T.Vector3()).x)===side);
    assert.equal(hubs.length,1);const hub=bounds(hubs[0]);
    assert.ok(Math.max(Math.abs(hub.min.x),Math.abs(hub.max.x))>=Math.abs(contact.point.x),'hub does not reach wheel backing');
  }
});

test('front towers and both engine bushes have solid supports down to the chassis',()=>{
  for(const side of [-1,1]){
    const tower=all.find(o=>o.name==='strut-tower'&&Math.sign(o.position.x)===side);
    const support=all.find(o=>o.name==='tower-support-web'&&Math.sign(o.position.x)===side);
    assert.ok(support,'strut tower floats above the wheel tub');
    assert.ok(bounds(support).intersectsBox(bounds(tower)),'tower misses its support');
    const arch=all.filter(o=>o.name==='wheelhouse-roof'&&bounds(o).min.z>0&&Math.sign(bounds(o).getCenter(new T.Vector3()).x)===side);
    assert.ok(arch.some(o=>bounds(o).intersectsBox(bounds(support))),'tower support misses the wheelhouse');
    const bush=all.find(o=>o.name==='engine-mount-bush'&&Math.sign(o.position.x)===side);
    const bracket=all.find(o=>o.name==='engine-mount-support'&&Math.sign(o.position.x)===side);
    assert.ok(bracket&&bounds(bracket).intersectsBox(bounds(bush)),'engine bush has no structural support');
    const rail=all.find(o=>o.name==='subframe-side-rail'&&Math.sign(o.position.x)===side);
    assert.ok(bounds(bracket).intersectsBox(bounds(rail)),'engine support does not connect to the subframe');
  }
});

test('the complete running gear has suspension at both axles and stays above the tire contact plane',()=>{
  const chassis=car.root.getObjectByName('chassis');assert.ok(chassis,'complete chassis is missing');
  for(const name of ['front-suspension','rear-suspension','fuel-tank','exhaust-system'])assert.ok(chassis.getObjectByName(name),`${name} is missing`);
  for(const [name,z] of [['front-suspension',1.185],['rear-suspension',-1.185]]){
    const b=bounds(chassis.getObjectByName(name));assert.ok(b.min.x<-.65&&b.max.x>.65&&b.min.z<z&&b.max.z>z,'suspension does not reach both wheel hubs');
  }
  try{for(const phase of [0,.32,.62,1]){
    applyBounce(car.root,sampleBounce(phase,1));car.root.updateMatrixWorld(true);
    // The disc bottoms are lower than the floor pan but remain well above
    // the tire contact plane even at maximum compression.
    assert.ok(bounds(chassis).min.y>.06,'running gear loses ground clearance during squash');
  }}finally{applyBounce(car.root,sampleBounce(0,1));car.root.updateMatrixWorld(true);}
  chassis.traverse(o=>{if(o.isMesh)for(const attr of ['position','normal'])assert.ok(o.geometry.getAttribute(attr).array.every(Number.isFinite),`${o.name}: non-finite ${attr}`);});
});

test('new running gear and wheel tubs do not occupy the existing tire rubber',()=>{
  applyBounce(car.root,sampleBounce(0,1));car.root.updateMatrixWorld(true);
  const collisions=[];
  car.root.getObjectByName('chassis').traverse(o=>{
    if(!o.isMesh)return;const p=o.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);
      const side=v.x<0?-1:1,dx=(v.x-side*.718)/(.067*1.33);if(Math.abs(dx)>1)continue;
      for(const z of [-1.185,1.185]){
        const radial=(Math.hypot(v.y-.29,v.z-z)-.223)/.067;
        if(dx*dx+radial*radial<.98){collisions.push(o.name);break;}
      }
      if(collisions.at(-1)===o.name)break;
    }
  });
  assert.deepEqual([...new Set(collisions)],[],'mechanical parts intrude into tire rubber');
});

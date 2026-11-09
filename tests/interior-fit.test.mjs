import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildInterior} from '../src/interior.ts';
import {createCarMaterials} from '../src/materials.ts';
import {dashPoint} from '../src/dashboard.ts';
import {frontPanelPoint,frontCowl} from '../src/profile.ts';

const root=new T.Group();buildInterior(root,createCarMaterials());root.updateMatrixWorld(true);
const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});
const named=name=>{const a=[];root.traverse(o=>{if(o.name===name)a.push(o);});return a;};
const ray=(x,y,objects)=>new T.Raycaster(new T.Vector3(x,y,-.15),new T.Vector3(0,0,1)).intersectObjects(objects,true)[0];

test('the dashboard has a continuous wrapping crown instead of a straight box face',()=>{
  const shell=root.getObjectByName('dashboard-top');assert.ok(shell);
  const mid=ray(.30,.85,[shell]),edge=ray(.60,.85,[shell]);assert.ok(mid&&edge);
  assert.ok(edge.point.z-mid.point.z>.018,'dashboard does not wrap away toward the doors');
  const samples=[.85,.875,.90,.925,.95].map(y=>ray(.42,y,[shell]));
  assert.ok(samples.every(Boolean),'continuous dashboard shoulder has a gap');
  for(let i=1;i<samples.length;i++){
    const turn=T.MathUtils.radToDeg(samples[i].face.normal.angleTo(samples[i-1].face.normal));
    assert.ok(turn>.15&&turn<20,'dashboard shoulder is flat or has an abrupt normal turn');
  }
});

test('the digital meter is visibly recessed behind the oval hood',()=>{
  const display=root.getObjectByName('digital-meter-display'),hood=root.getObjectByName('meter-hood');
  const center=new T.Box3().setFromObject(display).getCenter(new T.Vector3());
  const leading=new T.Box3().setFromObject(hood).min.z;
  assert.ok(center.z-leading>.020,'meter looks like a rectangle stuck onto the dashboard');
  assert.equal(ray(center.x,center.y,all)?.object.name,'digital-meter-display','dashboard/hood hides the actual meter screen');
});

test('four air vents have real open wells rather than discs on top of the dash',()=>{
  const wells=named('vent-well');assert.equal(wells.length,4,'air vents need recessed ducts');
  for(const well of wells){
    const p=well.geometry.getAttribute('position');
    let min=Infinity,max=-Infinity;
    for(let i=0;i<p.count;i++){min=Math.min(min,p.getZ(i));max=Math.max(max,p.getZ(i));}
    assert.ok(max-min>.020,'vent duct has no visible depth');
  }
});

test('door cards and seat cushions are sculpted rather than rectangular slabs',()=>{
  for(const card of named('door-card')){
    const size=new T.Box3().setFromObject(card).getSize(new T.Vector3());
    assert.ok(size.x>.055,'door card still has a flat slab profile');
  }
  for(const seat of named('front-seat')){
    const cushion=seat.getObjectByName('seat-cushion'),base=seat.getWorldPosition(new T.Vector3());
    const down=x=>new T.Raycaster(new T.Vector3(base.x+x,.8,-.24),new T.Vector3(0,-1,0)).intersectObject(cushion)[0];
    const center=down(0),edge=down(.175);assert.ok(center&&edge);
    assert.ok(edge.point.y-center.point.y>.008,'seat has no integrated raised side bolsters');
  }
});

test('all rebuilt interior meshes remain finite and inside the cabin envelope',()=>{
  for(const mesh of all)for(const name of ['position','normal']){
    assert.ok(mesh.geometry.getAttribute(name).array.every(Number.isFinite),`${mesh.name}: invalid ${name}`);
  }
  const b=new T.Box3().setFromObject(root);
  assert.ok(b.min.x>-.80&&b.max.x<.80&&b.min.y>.20&&b.max.y<1.47);
  assert.ok(b.min.z>-1.65&&b.max.z<1.03);
});

test('dashboard shoulder normals face the cabin and door cloth stays above the plastic skin',()=>{
  const shell=root.getObjectByName('dashboard-top'),p=shell.geometry.getAttribute('position'),n=shell.geometry.getAttribute('normal');
  let sampled=0;
  for(let i=0;i<p.count;i++)if(p.getX(i)>.28&&p.getX(i)<.50&&p.getY(i)>.82&&p.getY(i)<.94&&p.getZ(i)<.60){
    assert.ok(n.getZ(i)<-.35,'dashboard surface normals point into the plastic');sampled++;
  }
  assert.ok(sampled>10);
  for(const side of [-1,1]){
    const hit=new T.Raycaster(new T.Vector3(0,.824,-.25),new T.Vector3(side,0,0)).intersectObjects(all,true)[0];
    assert.equal(hit?.object.name,'door-cloth-insert','door shell covers the cloth insert');
    const uv=hit.object.geometry.getAttribute('uv');assert.ok(uv&&uv.array.every(Number.isFinite),'cloth needs usable texture coordinates');
  }
});

test('the oval hood and center fascia leave every vent aperture exposed',()=>{
  const dash=root.getObjectByName('dashboard'),eye=new T.Vector3(.035,1.235,-.50);
  for(const well of named('vent-well')){
    const p=well.geometry.getAttribute('position');
    const x=(p.getX(0)+p.getX(40))/2,y=(p.getY(0)+p.getY(40))/2;
    let low=0,high=.30;
    for(let i=0;i<40;i++){const mid=(low+high)/2;if(dashPoint(x,mid).y<y)low=mid;else high=mid;}
    const t=(low+high)/2;
    for(const dx of [-.02,0,.02])for(const dt of [-.02,0,.02]){
      const target=dashPoint(x+dx,t+dt,-.012),direction=target.clone().sub(eye).normalize();
      const hit=new T.Raycaster(eye,direction).intersectObject(dash,true)[0];
      assert.ok(hit&&hit.object.parent===well.parent,`vent at ${x} is covered by ${hit?.object.name}`);
    }
  }
});

test('gear markings and the open automatic gate remain above their pedestal',()=>{
  const down=(x,z,y=1.2)=>new T.Raycaster(new T.Vector3(x,y,z),new T.Vector3(0,-1,0)).intersectObjects(all,true)[0];
  for(const [x,z] of [[0,.070],[0,.095],[-.014,.160],[-.010,.195]]){
    // Inspect the opening below the raised selector knob, which legitimately
    // overlaps part of the slot when viewed straight down.
    assert.equal(down(x,z,.47)?.object.name,'gear-slot','pedestal fills the gear-gate opening');
  }
  for(const z of [.06,.08,.10,.12,.15,.18,.20]){
    assert.equal(down(.038,z)?.object.name,'gear-positions','pedestal covers part of PRND markings');
  }
});

test('the dashboard closes the cowl gap across the width up to the bonnet interior',()=>{
  const down=(x,z)=>new T.Raycaster(new T.Vector3(x,1.25,z),new T.Vector3(0,-1,0)).intersectObjects(all,true)[0];
  for(const x of [-.70,-.45,0,.45,.70])for(const z of [.875,.900,.925]){
    const hit=down(x,z);
    assert.ok(hit&&hit.point.y>.99&&hit.point.y<1.025,`open or sagging cowl deck at ${x}, ${z}`);
    assert.ok(hit.face.normal.y>.65,'cowl deck must have an upward, smooth facing');
  }
  // Probe just inside the real bonnet's thickness, independently of the dash
  // surface, including both outer corners of the windshield base.
  for(const x of [-.760,-.60,-.30,0,.30,.60,.760]){
    const cowl=frontPanelPoint(x,frontCowl.y-.004),hit=down(x,cowl.z-.012);
    assert.ok(hit&&Math.abs(hit.point.y-cowl.y)<.002,`dashboard stops short of the bonnet at ${x}`);
  }
});

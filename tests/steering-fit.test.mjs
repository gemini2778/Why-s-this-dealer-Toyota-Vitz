import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildInterior} from '../src/interior.ts';
import {createCarMaterials} from '../src/materials.ts';

const root=new T.Group();
buildInterior(root,createCarMaterials());root.updateMatrixWorld(true);
const wheel=root.getObjectByName('steering-wheel');
const wheelMeshes=[];wheel.traverse(o=>{if(o.isMesh)wheelMeshes.push(o);});
const cast=(x,y,objects=wheelMeshes)=>{
  const origin=wheel.localToWorld(new T.Vector3(x,y,-.30));
  const direction=new T.Vector3(0,0,1).transformDirection(wheel.matrixWorld);
  return new T.Raycaster(origin,direction).intersectObjects(objects,false)[0];
};

test('the steering wheel leans toward the dash and is perpendicular to its column',()=>{
  const column=root.getObjectByName('steering-column');
  const path=column.geometry.parameters.path;
  const near=column.localToWorld(path.getPoint(0)),far=column.localToWorld(path.getPoint(1));
  const axis=far.sub(near).normalize();
  const normal=new T.Vector3(0,0,1).transformDirection(wheel.matrixWorld);
  assert.ok(axis.dot(normal)>.999,'wheel plane and steering-column axis disagree');
  const top=wheel.localToWorld(new T.Vector3(0,.166,0));
  const bottom=wheel.localToWorld(new T.Vector3(0,-.166,0));
  assert.ok(top.z-bottom.z>.08,'wheel top must lean forward away from the driver');
  assert.ok(top.z-bottom.z<.19,'wheel must not become a horizontal table');
});

test('the three spokes have broad flattened faces and a substantial lower airbag lobe',()=>{
  for(const x of [-.115,.115]){
    const hits=[-.008,.005,.018].map(y=>cast(x,y));
    assert.ok(hits.every(hit=>hit?.object.name==='steering-spoke'),'horizontal spokes need broad moulded faces');
    const depths=hits.map(hit=>wheel.worldToLocal(hit.point.clone()).z);
    assert.ok(Math.max(...depths)-Math.min(...depths)<.008,'spoke face still has a round rod profile');
  }
  assert.equal(cast(0,-.13)?.object.name,'steering-spoke','lower spoke must join the lower rim');
  assert.equal(cast(0,-.075)?.object.name,'airbag','airbag pad should extend into a rounded lower lobe');
  assert.equal(cast(0,.105),undefined,'top wheel opening must remain open');
});

test('the Toyota badge has three complete ovals exposed on the airbag face',()=>{
  const rings=wheelMeshes.filter(o=>o.name.startsWith('steering-emblem-'));
  assert.equal(rings.length,3,'Toyota emblem is missing one of its three ovals');
  for(const ring of rings){
    const path=ring.geometry.parameters.path;
    assert.ok(path.getPoint(0).distanceTo(path.getPoint(1))<1e-5,'emblem oval must be closed');
    for(let i=0;i<48;i++){
      const p=wheel.worldToLocal(ring.localToWorld(path.getPoint(i/48)));
      const hit=cast(p.x,p.y);
      assert.ok(hit?.object.name.startsWith('steering-emblem-'),'part of the badge is buried in the airbag or backing');
    }
  }
});

test('the airbag moulding is a closed smooth shell with outward driver-facing normals',()=>{
  const geometry=wheel.getObjectByName('airbag').geometry;
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),edges=new Map();
  assert.ok(p.array.every(Number.isFinite)&&n.array.every(Number.isFinite));
  let frontSamples=0;
  for(let i=0;i<p.count;i++)if(p.getZ(i)<-.0429){
    assert.ok(n.getZ(i)<-.99,'driver-facing surface has inverted normals');frontSamples++;
  }
  assert.ok(frontSamples>12,'front surface is insufficiently rounded');
  const indices=geometry.index.array;
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
    const a=indices[i+j],b=indices[i+(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;
    edges.set(key,(edges.get(key)??0)+1);
  }
  assert.ok([...edges.values()].every(count=>count===2),'moulding has an open edge or overlapping faces');
});

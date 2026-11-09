import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {roofPoint,roofEdgeY,sideSkinX} from '../src/profile.ts';
import {frontEdge,frontWidth,rearEdge,rearWidth} from '../src/profile.ts';
import {createVitz} from '../src/car.ts';

// A geometric corner can look smooth along the rail while still producing a
// long hard crease across it. Check tangency across the actual two surfaces.
test('the roof shoulder joins the side with a continuous tangent',()=>{
  for(const z of [-1.1,-.7,-.3,0]){
    const h=roofEdgeY(z),e=1e-5;
    const up=new T.Vector3(sideSkinX(z,h)-sideSkinX(z,h-e),e,0).normalize();
    const inward=roofPoint(1-e,z).sub(roofPoint(1,z)).normalize();
    const turn=T.MathUtils.radToDeg(up.angleTo(inward));
    assert.ok(turn<1,`hard roof shoulder at z=${z}: ${turn.toFixed(2)} degrees`);
    assert.ok(roofPoint(1,z).distanceTo(new T.Vector3(sideSkinX(z,h),h,z))<1e-7);
  }
});

// A clear outer lens alone can hide a hole in the opaque lamp housing. Cast
// through the wraparound seam and require a sealed backing at the body corner.
test('both wraparound lamp corners have opaque backing across the seam',()=>{
  const car=createVitz();car.root.updateMatrixWorld(true);
  const meshes=[];
  car.root.getObjectByName('flush-lights').traverse(o=>{
    if(o.isMesh&&!o.material.transparent)meshes.push(o);
  });
  for(const [name,ys,edge,width,sign] of [
    ['front',[.69,.75,.81],frontEdge,frontWidth,1],
    ['rear',[.81,.88,.95],rearEdge,rearWidth,-1],
  ])for(const side of [-1,1])for(const y of ys){
    const corner=new T.Vector3(side*width(y),y,edge(y));
    const outward=new T.Vector3(side,0,sign).normalize();
    const ray=new T.Raycaster(corner.clone().addScaledVector(outward,.08),outward.clone().negate(),0,.12);
    const hit=ray.intersectObjects(meshes,false)[0];
    assert.ok(hit&&hit.distance<.0815,`${name} lamp open at y=${y}, side=${side}: ${hit?.distance}`);
  }
});

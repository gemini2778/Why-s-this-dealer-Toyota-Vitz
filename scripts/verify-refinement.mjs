import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createVitz} from '../src/car.ts';
import * as profile from '../src/profile.ts';
import {sampleBounce,applyBounce} from '../src/motion.ts';

function contains(poly,p){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if(((a.y>p.y)!==(b.y>p.y))&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

const car=createVitz(),root=car.root,meshes=[];
root.traverse(o=>{if(o.isMesh)meshes.push(o);});
let vertices=0,triangles=0;
for(const mesh of meshes){
  for(const name of ['position','normal']){
    const a=mesh.geometry.getAttribute(name);
    assert.ok(a&&a.array.every(Number.isFinite),`${mesh.name}: invalid ${name}`);
  }
  const n=mesh.geometry.getAttribute('position').count;
  vertices+=n;triangles+=(mesh.geometry.index?.count??n)/3;
}

const holeChecks=[];
const side=profile.sideOutline().getPoints(64);
for(const name of ['doorWindow','quarterWindow','doorHandleOpening','headlightWing','tailLightWing']){
  const points=profile[name]().getPoints(64),outside=points.filter(p=>!contains(side,p));
  holeChecks.push({name,samples:points.length,outside:outside.length});
  assert.equal(outside.length,0,`${name}: opening leaves the body silhouette`);
}
for(const name of ['frontFaceOutline','rearFaceOutline']){
  const shape=profile[name](),boundary=shape.getPoints(64);
  for(const [i,hole] of shape.holes.entries()){
    const points=hole.getPoints(64),outside=points.filter(p=>!contains(boundary,p));
    holeChecks.push({name:`${name}-hole-${i}`,samples:points.length,outside:outside.length});
    assert.equal(outside.length,0,`${name}: lamp or grille leaves the cap`);
  }
}

// Test the actual cap normals along the roof rail. Skinny triangulation used
// to cause alternating highlights, including jumps larger than 60 degrees.
const shell=root.getObjectByName('body-side-1'),p=shell.geometry.getAttribute('position'),n=shell.geometry.getAttribute('normal');
const strip=[];
for(let i=0;i<p.count;i++){
  const z=p.getZ(i),y=p.getY(i);
  if(z>-.70&&z<-.15&&Math.abs(y-profile.roofEdgeY(z))<2e-5&&
     Math.abs(p.getX(i)-profile.sideSkinX(z,y))<2e-6&&n.getX(i)<-.2){
    strip.push({z,normal:new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i))});
  }
}
strip.sort((a,b)=>a.z-b.z);
let maxNormalStepDegrees=0;
for(let i=1;i<strip.length;i++)maxNormalStepDegrees=Math.max(maxNormalStepDegrees,THREE.MathUtils.radToDeg(strip[i].normal.angleTo(strip[i-1].normal)));
assert.ok(strip.length>12,'roof rail did not have enough samples');
assert.ok(maxNormalStepDegrees<1,`roof rail normal jump: ${maxNormalStepDegrees} degrees`);

const tires=meshes.filter(o=>o.name.startsWith('tire-'));
assert.equal(tires.length,4);
let maxTireGroundErrorMeters=0;
for(let i=0;i<=240;i++){
  applyBounce(root,sampleBounce(i/240,1));root.updateMatrixWorld(true);
  for(const tire of tires)maxTireGroundErrorMeters=Math.max(maxTireGroundErrorMeters,Math.abs(new THREE.Box3().setFromObject(tire).min.y));
}
assert.ok(maxTireGroundErrorMeters<1e-5);
applyBounce(root,sampleBounce(0,1));

const report={meshes:meshes.length,vertices,triangles,holeChecks,roofRail:{samples:strip.length,maxNormalStepDegrees},sampledPhases:241,maxTireGroundErrorMeters};
fs.writeFileSync(new URL('../checks/refinement-geometry.json',import.meta.url),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));

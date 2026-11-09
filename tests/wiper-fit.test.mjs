import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTrim} from '../src/details.ts';
import {createCarMaterials} from '../src/materials.ts';
import {rearWindowPoint} from '../src/profile.ts';

const root=new T.Group();buildTrim(root,createCarMaterials());root.updateMatrixWorld(true);
test('rear wiper parks low with a separate flat blade and hatch-mounted pivot',()=>{
  const blade=root.getObjectByName('rear-wiper-blade'),pivot=root.getObjectByName('rear-wiper-pivot');
  assert.ok(blade&&pivot,'rear wiper needs a blade and pivot rather than one bent tube');
  const bounds=new T.Box3().setFromObject(blade),center=new T.Vector3();
  pivot.getWorldPosition(center);
  assert.ok(center.y>=.965&&center.y<=1.005,'pivot must sit at the lower window/hatch edge');
  assert.ok(bounds.min.x>0&&bounds.max.x<.55,'blade must park to the left when seen from behind');
  assert.ok(bounds.max.x-bounds.min.x>.40&&bounds.max.x-bounds.min.x<.50);
  assert.ok(bounds.max.y-bounds.min.y<.015,'parked blade should be nearly horizontal');
  assert.ok(bounds.max.y<1.09,'blade should rest close to the bottom of the window');
});

test('rear wiping edge follows the actual curved glass without floating or sinking',()=>{
  const edge=root.getObjectByName('rear-wiper-rubber');assert.ok(edge,'separate contact rubber is required');
  const positions=edge.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
    const v=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(edge.matrixWorld);
    let r=v.x/.76,t=(v.y-1)/.55;
    for(let j=0;j<12;j++){const p=rearWindowPoint(r,t);r+=(v.x-p.x)/.75;t+=(v.y-p.y)/.55;}
    const glass=rearWindowPoint(r,t),gap=glass.z-v.z;
    assert.ok(gap>=.0005&&gap<=.006,`rubber/glass clearance is ${gap} m`);
  }
});

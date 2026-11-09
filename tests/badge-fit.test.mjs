import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTrim} from '../src/details.ts';
import {createCarMaterials} from '../src/materials.ts';
import {frontZ,rearZ} from '../src/profile.ts';

const root=new T.Group(),trim=buildTrim(root,createCarMaterials());
root.updateMatrixWorld(true);
const badges=trim.children.filter(o=>o.isGroup&&o.children.length===3&&o.children.every(c=>c.geometry?.type==='TorusGeometry'));
assert.equal(badges.length,2);
for(const rear of [false,true])test(`${rear?'rear':'front'} Toyota emblem stays just above the curved panel`,()=>{
  const badge=badges.find(o=>(new T.Box3().setFromObject(o).getCenter(new T.Vector3()).y>.85)===rear);
  const panel=rear?rearZ:frontZ,e=1e-5,p=new T.Vector3();
  for(const ring of badge.children){
    const a=ring.geometry.getAttribute('position');
    for(let i=0;i<a.count;i++){
      p.fromBufferAttribute(a,i).applyMatrix4(ring.matrixWorld);
      const dx=(panel(p.x+e,p.y)-panel(p.x-e,p.y))/(2*e),dy=(panel(p.x,p.y+e)-panel(p.x,p.y-e))/(2*e);
      const clearance=(rear?-1:1)*(p.z-panel(p.x,p.y))/Math.sqrt(1+dx*dx+dy*dy);
      assert.ok(clearance>.0001&&clearance<.005,`emblem intersects or stands off the panel: ${clearance.toFixed(5)} m`);
    }
  }
});

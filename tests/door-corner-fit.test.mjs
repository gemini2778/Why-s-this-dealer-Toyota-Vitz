import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTrim} from '../src/details.ts';
import {createCarMaterials} from '../src/materials.ts';
import {doorWindow,sideSkinX} from '../src/profile.ts';

const root=new T.Group();buildTrim(root,createCarMaterials());root.updateMatrixWorld(true);
const all=[];root.traverse(object=>all.push(object));
const window=doorWindow(),points=window.getPoints(32);
const center=points.reduce((sum,p)=>sum.add(p),new T.Vector2()).divideScalar(points.length);

test('both mirror sails fill the leading window corner up to its rubber surround',()=>{
  const mounts=all.filter(object=>object.name==='mirror-mount');assert.equal(mounts.length,2);
  for(const mount of mounts){
    mount.geometry.computeBoundingBox();const side=Math.sign(mount.geometry.boundingBox.getCenter(new T.Vector3()).x);
    // Probe just inside the surround, where the old translated triangle left
    // a visible sliver of glass between its edge and the revised A-pillar.
    for(const t of [.03,.08,.14,.20,.26,.30]){
      const p=window.curves[0].getPoint(t).lerp(center,.018);
      const hit=new T.Raycaster(new T.Vector3(side*1.2,p.y,p.x),new T.Vector3(-side,0,0)).intersectObject(mount)[0];
      assert.ok(hit,`mirror sail leaves an uncovered window-edge gap on side ${side}, t=${t}`);
      const clearance=Math.abs(hit.point.x)-sideSkinX(p.x,p.y);
      assert.ok(clearance>0&&clearance<.012,'sail must sit directly against the window surround');
    }
  }
});

test('both front doors have continuous seams enclosing the A-pillar and window frame',()=>{
  const seams=all.filter(object=>{
    const path=object.geometry?.parameters?.path;if(!path)return false;
    const box=new T.Box3().setFromPoints(path.getPoints(256));
    return box.max.z>.7&&box.min.z<-.4&&box.max.y>1.4;
  });
  assert.equal(seams.length,2);
  for(const seam of seams){
    const curve=seam.geometry.parameters.path,samples=curve.getPoints(1800),side=Math.sign(samples[0].x);
    assert.ok(curve.closed,'front door seam stops below the A-pillar instead of continuing around its frame');
    assert.ok(samples[0].distanceTo(samples.at(-1))<1e-7,'door seam has disconnected ends');
    for(const t of [0,.15,.4,.7,1]){
      const p=window.curves[0].getPoint(t),tangent=window.curves[0].getTangent(t);
      const frame=p.clone().add(new T.Vector2(tangent.y,-tangent.x).multiplyScalar(.022));
      const target=new T.Vector3(side*(sideSkinX(frame.x,frame.y)+.0012),frame.y,frame.x);
      const gap=Math.min(...samples.map(point=>point.distanceTo(target)));
      assert.ok(gap<.004,`door seam is detached from the window frame by ${gap} m`);
    }
    for(const p of samples){
      const clearance=Math.abs(p.x)-sideSkinX(p.z,p.y);
      assert.ok(Math.abs(clearance)<.0025,'door seam floats off the painted panel');
    }
  }
});

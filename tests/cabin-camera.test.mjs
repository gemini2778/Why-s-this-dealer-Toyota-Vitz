import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as stageViews from '../src/scene.ts';
import {buildCabinSeats} from '../src/cabin-trim.ts';
import {createCarMaterials} from '../src/materials.ts';
import {sampleBounce} from '../src/motion.ts';

test('the rear cabin camera frames the actual bench in neutral and compressed poses on desktop and mobile',()=>{
  assert.equal(typeof stageViews.getViewPose,'function','rear cabin camera has no shared fitted preset');
  const seats=new T.Group();buildCabinSeats(seats,createCarMaterials());seats.updateMatrixWorld(true);
  const bench=seats.getObjectByName('rear-bench');assert.ok(bench);
  for(const aspect of [625/642,375/456])for(const phase of [0,.32]){
    const view=stageViews.getViewPose('rearInterior',aspect),pose=sampleBounce(phase,1);
    const scale=new T.Vector3(pose.width,pose.height,pose.length);
    const camera=new T.PerspectiveCamera(view.fov,aspect,.015,70);
    camera.position.copy(view.position).multiply(scale);camera.lookAt(view.target.clone().multiply(scale));camera.updateMatrixWorld(true);
    let points=0;
    bench.traverse(o=>{
      if(!o.isMesh)return;const p=o.geometry.getAttribute('position');
      for(let i=0;i<p.count;i+=13){
        const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiply(scale).project(camera);
        assert.ok(Number.isFinite(v.x)&&Math.abs(v.x)<1.03&&Math.abs(v.y)<1.03&&v.z>-1&&v.z<1,`${o.name} outside rear view: ${v.toArray()}`);points++;
      }
    });
    assert.ok(points>100);
  }
});

test('all cabin presets use cabin controls and preserve the original exterior preset',()=>{
  assert.equal(typeof stageViews.isCabinView,'function','both cabin modes need the same control and deformation rules');
  for(const name of ['interior','rearInterior','cabinDetail'])assert.ok(stageViews.isCabinView(name));
  for(const name of ['front','rear','side','chassis','engine'])assert.equal(stageViews.isCabinView(name),false);
  const front=stageViews.getViewPose('front',1.5);
  assert.deepEqual(front.position.toArray(),[4.5,2.05,5.65]);
  assert.deepEqual(front.target.toArray(),[0,.74,0]);assert.equal(front.fov,34);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {frontCowl,frontEdge,frontWidth,frontPanelPoint,sidePanelPoint,windPoint,roofPoint} from '../src/profile.ts';

const normal=(map,u,v)=>{
  const e=1e-5;
  return map(u+e,v).sub(map(u-e,v)).cross(map(u,v+e).sub(map(u,v-e))).normalize();
};
const turn=(a,b)=>T.MathUtils.radToDeg(Math.acos(Math.min(1,Math.abs(a.dot(b)))));

test('the upper bonnet corner runs into the cowl without a pinched highlight',()=>{
  for(const offset of [0,.008,.020,.035]){
    let previous=normal(sidePanelPoint,frontEdge(.970)-offset,.970);
    for(let y=.971;y<=frontCowl.y+1e-7;y+=.001){
      const current=normal(sidePanelPoint,frontEdge(y)-offset,y);
      assert.ok(turn(previous,current)<6,`cowl normal jumps ${turn(previous,current).toFixed(2)} degrees near y=${y}`);
      previous=current;
    }
  }
  for(const r of [-1,-.96,-.90,0,.90,.96,1]){
    const bonnet=frontPanelPoint(r*frontWidth(frontCowl.y),frontCowl.y);
    assert.ok(bonnet.distanceTo(windPoint(r,0))<1e-6,'rounded cowl leaves a glass/body gap');
  }
  // The approved dashboard deck meets this constant-height bonnet section.
  for(const x of [-.760,-.60,0,.60,.760])assert.ok(Math.abs(frontPanelPoint(x,1.016).y-1.016)<1e-7);
});

test('the windscreen header follows the roof tangent across its whole width',()=>{
  for(const r of [-1,-.96,-.90,-.6,0,.6,.9,.96,1]){
    assert.ok(windPoint(r,1).distanceTo(roofPoint(r,.17))<1e-6,'header separates from roof');
    const angle=turn(normal(windPoint,r,1),normal(roofPoint,r,.17));
    assert.ok(angle<.5,`windshield-to-roof highlight turns ${angle.toFixed(3)} degrees at r=${r}`);
  }
  // Preserve the small-car roof envelope while relaxing just its leading edge.
  assert.ok(roofPoint(0,.17).y>1.460&&roofPoint(0,.17).y<1.474);
});

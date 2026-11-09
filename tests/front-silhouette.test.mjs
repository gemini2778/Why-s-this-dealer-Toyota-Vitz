import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {aPillar,frontEdge,frontWidth,frontZ,frontPanelPoint,windPoint} from '../src/profile.ts';

test('XP10 bonnet rises into a forward cowl instead of a low flat shelf',()=>{
  const cowl=aPillar.getPoint(0);
  assert.ok(cowl.x>=.88&&cowl.x<=1.00,'windscreen foot sits too far behind the front axle');
  assert.ok(cowl.y>=1.00&&cowl.y<=1.06,'windscreen foot sits too low');
  let low=.82,high=cowl.y;
  for(let i=0;i<32;i++){const mid=(low+high)/2;if(frontEdge(mid)>1.50)low=mid;else high=mid;}
  const rise=cowl.y-(low+high)/2;
  assert.ok(rise>.14&&rise<.22,`bonnet rise is ${rise} m; reference has a visibly sloping nose`);
});

test('bonnet and A-pillar silhouette meet with a continuous tangent',()=>{
  const cowl=aPillar.getPoint(0),e=1e-6;
  assert.ok(Math.abs(frontEdge(cowl.y)-cowl.x)<1e-8);
  const bonnet=new T.Vector2(frontEdge(cowl.y)-frontEdge(cowl.y-e),e).normalize();
  const pillar=aPillar.getTangent(0),angle=T.MathUtils.radToDeg(Math.acos(T.MathUtils.clamp(bonnet.dot(new T.Vector2(pillar.x,pillar.y)),-1,1)));
  assert.ok(angle<.5,`bonnet/A-pillar direction jumps ${angle} degrees`);
});

test('the complete bonnet-to-windscreen seam closes and keeps its slope across the width',()=>{
  const y=aPillar.v0.y,e=1e-6;
  const cap=(r,h)=>frontPanelPoint(r*frontWidth(h),h);
  for(const r of [-1,-.6,0,.6,1]){
    assert.ok(cap(r,y).distanceTo(windPoint(r,0))<1e-7,`cowl gap at r=${r}`);
    const a=cap(r,y).sub(cap(r,y-e)).normalize(),b=windPoint(r,e).sub(windPoint(r,0)).normalize();
    assert.ok(T.MathUtils.radToDeg(a.angleTo(b))<.5,`cowl tangent discontinuity at r=${r}`);
  }
});

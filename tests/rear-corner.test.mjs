import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as p from '../src/profile.ts';

const rear=(r,y)=>p.rearPanelPoint?.(r*p.rearWidth(y),y)??new T.Vector3(r*p.rearWidth(y),y,p.rearZ(r*p.rearWidth(y),y));
function normal(fn,u,v){
  const e=1e-5;
  return fn(u+e,v).sub(fn(u-e,v)).cross(fn(u,v+e).sub(fn(u,v-e))).normalize();
}
const angle=(a,b)=>T.MathUtils.radToDeg(Math.acos(Math.min(1,Math.abs(a.dot(b)))));

test('rear frame ends flow into roof and hatch on both sides without a pinched join',()=>{
  for(const side of [-1,1])for(const r of [.90,.96,.99]){
    const rr=side*r;
    for(const [label,t,fn,v] of [['roof',1,p.roofPoint,-1.25],['hatch',0,rear,1]]){
      const a=p.rearWindowPoint(rr,t),b=fn(rr,v);
      assert.ok(a.distanceTo(b)<1e-5,`${label}: open seam at r=${rr}`);
      const turn=angle(normal(p.rearWindowPoint,rr,t),normal(fn,rr,v));
      assert.ok(turn<3,`${label}: ${turn.toFixed(2)} degree crease at r=${rr}`);
    }
  }
});

test('rear corner highlights do not flip over the short fillet runouts',()=>{
  for(const side of [-1,1])for(const r of [.94,.98,1])for(const [a,b] of [[.005,.20],[.80,.995]]){
    let previous=normal(p.rearWindowPoint,side*r,a);
    for(let t=a+.005;t<=b;t+=.005){
      const current=normal(p.rearWindowPoint,side*r,t),turn=angle(previous,current);
      assert.ok(turn<6,`normal turns ${turn.toFixed(2)} degrees in ~2 mm at r=${side*r}, t=${t.toFixed(3)}`);
      previous=current;
    }
  }
});

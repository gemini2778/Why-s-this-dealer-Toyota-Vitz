import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as p from '../src/profile.ts';

// The fallbacks describe the original, unrounded panel mappings, so reverting
// either new mapper still exercises the geometry and catches the sharp joint.
const side=(z,y)=>p.sidePanelPoint?.(z,y)??new T.Vector3(p.sideSkinX(z,y),y,z);
const front=(x,y)=>p.frontPanelPoint?.(x,y)??new T.Vector3(x,y,p.frontZ(x,y));
function normal(fn,u,v){
  const e=1e-5,a=fn(u+e,v).sub(fn(u-e,v)),b=fn(u,v+e).sub(fn(u,v-e));
  return a.cross(b).normalize();
}
function turn(a,b){return T.MathUtils.radToDeg(Math.acos(Math.min(1,Math.abs(a.dot(b)))));}

test('bonnet and fender meet through a real rounded surface with matching tangents',()=>{
  for(const y of [.870,.890,.910,.925]){
    const z=p.frontEdge(y),x=p.frontWidth(y),a=side(z,y),b=front(x,y);
    assert.ok(a.distanceTo(b)<1e-6,'bonnet/fender fillet leaves a gap');
    assert.ok(a.distanceTo(new T.Vector3(x,y,z))>.003,'the sharp metal corner was not physically rounded');
    const angle=turn(normal(side,z,y),normal(front,x,y));
    assert.ok(angle<1,`bonnet/fender normals turn ${angle.toFixed(2)} degrees at the joint`);
  }
});

test('rear window frame and C-pillar have a closed, tangent rounded joint',()=>{
  for(const t of [.15,.35,.60,.82]){
    const edge=p.cPillar.getPoint(t),a=side(edge.x,edge.y),b=p.rearWindowPoint(1,t);
    assert.ok(a.distanceTo(b)<1e-6,'rear window/C-pillar fillet leaves a gap');
    assert.ok(a.distanceTo(new T.Vector3(p.sideSkinX(edge.x,edge.y),edge.y,edge.x))>.003,'the C-pillar corner was not physically rounded');
    const angle=turn(normal(side,edge.x,edge.y),normal(p.rearWindowPoint,1,t));
    assert.ok(angle<1,`rear window/C-pillar normals turn ${angle.toFixed(2)} degrees at the joint`);
  }
});

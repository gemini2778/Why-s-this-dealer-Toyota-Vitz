import test from 'node:test';
import assert from 'node:assert/strict';
import {createVitz} from '../src/car.ts';
import {doorWindow,aPillar} from '../src/profile.ts';

const car=createVitz(),window=doorWindow().getPoints(96);
function inside(x,y){
  let result=false;
  for(let i=0,j=window.length-1;i<window.length;j=i++){
    const a=window[i],b=window[j];
    if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)result=!result;
  }
  return result;
}

test('both mirror bases and housings attach inside the front lower side-window corner',()=>{
  const mounts=[],mirrors=[];
  car.root.traverse(o=>{if(o.name==='mirror-mount')mounts.push(o);if(o.name==='side-mirror')mirrors.push(o);});
  assert.equal(mounts.length,2);assert.equal(mirrors.length,2);
  for(const mount of mounts){
    const p=mount.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++)assert.ok(inside(p.getZ(i),p.getY(i)),'mirror base crosses the A-pillar outside the door glass');
  }
  for(const mirror of mirrors){
    assert.ok(inside(mirror.position.z,mirror.position.y),'mirror housing sits ahead of the side window');
    const setback=aPillar.v0.x-mirror.position.z;
    assert.ok(setback>.18&&setback<.40,'mirror must remain just behind the revised A-pillar foot');
    assert.ok(mirror.position.y>1.02&&mirror.position.y<1.12,'mirror must remain near the window sill');
  }
});

test('stretched bonnet and windscreen frame triangles remain small in model space',()=>{
  for(const name of ['bonnet-and-front-cap','windscreen-paint-frame','rear-window-paint-frame']){
    const g=car.root.getObjectByName(name).geometry,p=g.getAttribute('position'),index=g.index;
    let longest=0;
    for(let i=0;i<index.count;i+=3)for(let j=0;j<3;j++){
      const a=index.getX(i+j),b=index.getX(i+(j+1)%3);
      if(name==='bonnet-and-front-cap'&&Math.min(p.getY(a),p.getY(b))<.80)continue;
      longest=Math.max(longest,Math.hypot(p.getX(a)-p.getX(b),p.getY(a)-p.getY(b),p.getZ(a)-p.getZ(b)));
    }
    assert.ok(longest<.035,`${name} has a stretched ${longest.toFixed(3)} m edge that can cause visible facets`);
  }
});

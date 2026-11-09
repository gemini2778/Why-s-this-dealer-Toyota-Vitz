import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildBody} from '../src/body.ts';
import {buildTrim} from '../src/details.ts';
import {createCarMaterials} from '../src/materials.ts';
import {sideSkinX} from '../src/profile.ts';

const root=new T.Group(),materials=createCarMaterials();
buildBody(root,materials);buildTrim(root,materials);root.updateMatrixWorld(true);
const named=name=>{const result=[];root.traverse(o=>{if(o.name===name)result.push(o);});return result;};
const ray=(side,z,y,objects)=>new T.Raycaster(new T.Vector3(side*1.25,y,z),new T.Vector3(-side,0,0)).intersectObjects(objects,false)[0];
const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});

test('both door finger pockets are actual recesses below the painted door surface',()=>{
  for(const side of [-1,1])for(const z of [-.335,-.310,-.285]){
    const hit=ray(side,z,.808,meshes);assert.ok(hit,'door pocket must remain closed behind the opening');
    assert.equal(hit.object.name,'door-handle-pocket','the door panel or a raised insert still covers the finger recess');
    const depth=Math.abs(hit.point.x)-sideSkinX(z,.808);
    assert.ok(depth<-.004&&depth>-.023,`finger cup depth is ${depth} m instead of a shallow recess`);
  }
});

test('door handles have shallow paddle faces and separate fixed lock bosses',()=>{
  const handles=named('door-handle'),locks=named('door-key-cylinder');
  assert.equal(handles.length,2);assert.equal(locks.length,2);
  for(const handle of handles){
    const box=new T.Box3().setFromObject(handle),side=Math.sign(box.getCenter(new T.Vector3()).x),depths=[];
    for(const z of [-.350,-.310,-.270]){
      const hit=ray(side,z,.844,[handle]);assert.ok(hit,'thin handle face is missing');
      const depth=Math.abs(hit.point.x)-sideSkinX(z,.844);depths.push(depth);
      assert.ok(depth>.003&&depth<.013,`handle protrudes ${depth} m like a thick oval knob`);
    }
    assert.ok(Math.max(...depths)-Math.min(...depths)<.0035,'handle face is too bulbous');
    const lock=locks.find(o=>Math.sign(new T.Box3().setFromObject(o).getCenter(new T.Vector3()).x)===side);
    assert.ok(new T.Box3().setFromObject(lock).max.z<box.min.z-.002,'lock belongs beside the paddle, not on its moving face');
  }
});

test('side indicator lenses are elongated low-profile covers enclosing the amber bulbs',()=>{
  const lenses=named('fender-indicator-lens'),bulbs=named('fender-indicator');assert.equal(lenses.length,2);
  for(const lens of lenses){
    const box=new T.Box3().setFromObject(lens),size=box.getSize(new T.Vector3()),side=Math.sign(box.getCenter(new T.Vector3()).x);
    assert.ok(size.z/size.y>2.65&&size.z/size.y<3.8,'indicator is too round instead of a slim oval');
    const positions=lens.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(lens.matrixWorld);
      const height=Math.abs(p.x)-sideSkinX(p.z,p.y);
      assert.ok(height>=-.0001&&height<.006,'indicator lens floats or protrudes too far from the fender');
    }
    const bulb=bulbs.find(o=>Math.sign(new T.Box3().setFromObject(o).getCenter(new T.Vector3()).x)===side);
    assert.ok(bulb,'indicator needs its amber core');
    const center=new T.Box3().setFromObject(bulb).getCenter(new T.Vector3()),cover=ray(side,center.z,center.y,[lens]);
    const amber=ray(side,center.z,center.y,[bulb]);
    assert.ok(cover&&amber&&Math.abs(cover.point.x)>Math.abs(amber.point.x),'amber core must sit inside the clear cover');
  }
});

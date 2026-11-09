import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTrim} from '../src/details.ts';
import {createCarMaterials} from '../src/materials.ts';

const root=new T.Group();buildTrim(root,createCarMaterials());root.updateMatrixWorld(true);
const named=name=>{const list=[];root.traverse(o=>{if(o.name===name)list.push(o);});return list;};

test('mirror housing has a domed front rather than a flat box face',()=>{
  for(const shell of named('side-mirror')){
    const probe=new T.Mesh(shell.geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));probe.updateMatrixWorld();
    const front=(x,y)=>new T.Raycaster(new T.Vector3(x,y,.3),new T.Vector3(0,0,-1)).intersectObject(probe)[0]?.point.z;
    const center=front(0,0),shoulder=front(.055,.025);
    assert.ok(Number.isFinite(center)&&Number.isFinite(shoulder));
    assert.ok(center-shoulder>.010,'mirror has a broad flat front instead of a rounded dome');
  }
});

test('mirror glass is recessed and its perimeter meets the surrounding gasket',()=>{
  const glasses=named('mirror-glass'),gaskets=named('mirror-glass-gasket');
  assert.equal(glasses.length,2);assert.equal(gaskets.length,2,'glass needs a fitted perimeter seal');
  for(let k=0;k<2;k++){
    const glass=glasses[k],gasket=gaskets[k],p=glass.geometry.getAttribute('position'),gp=gasket.geometry.getAttribute('position');
    const edges=new Map(),ix=glass.geometry.index;
    for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){const a=ix.getX(i+j),b=ix.getX(i+(j+1)%3),key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1);}
    const boundary=new Set([...edges].filter(([,count])=>count===1).flatMap(([key])=>key.split(':').map(Number)));
    assert.ok(boundary.size>40);
    for(const i of boundary){
      const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(glass.matrixWorld);let gap=Infinity;
      for(let j=0;j<gp.count;j++)gap=Math.min(gap,v.distanceTo(new T.Vector3().fromBufferAttribute(gp,j).applyMatrix4(gasket.matrixWorld)));
      assert.ok(gap<1e-6,`glass perimeter is detached by ${gap} metres`);
    }
    const bezel=named('mirror-bezel')[k];bezel.geometry.computeBoundingBox();glass.geometry.computeBoundingBox();
    assert.ok(glass.geometry.boundingBox.min.z-bezel.geometry.boundingBox.min.z>.001,'glass protrudes past the protective lip');
    assert.ok(glass.position.distanceTo(bezel.position)<1e-8&&glass.quaternion.angleTo(bezel.quaternion)<1e-8,'glass and bezel are misaligned');
  }
});

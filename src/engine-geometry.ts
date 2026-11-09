import * as T from 'three';
import {mesh,outline,v} from './geometry.ts';
import type {Point} from './geometry.ts';
import {rod} from './mechanical-geometry.ts';

type Footprint = readonly (readonly [number,number])[];
type Level = readonly [height:number,width:number,depth:number];

// Bevelled horizontal sections follow the casting or moulding footprint.
// A zero-width end closes the mesh at one vertex instead of a degenerate ring.
export function formedPart(parent:T.Object3D, center:readonly [number,number], shape:Footprint, levels:readonly Level[], material:T.Material, name:string, relief:(x:number,z:number)=>number=()=>0){
  const polygon:Point[]=shape.map(([x,z])=>[x,0,z]);
  const area=shape.reduce((sum,[x,z],i)=>{
    const [nextX,nextZ]=shape[(i+1)%shape.length];
    return sum+x*nextZ-z*nextX;
  },0);
  const contour=outline(area>0 ? polygon.reverse() : polygon,.22);
  const positions:number[]=[],indices:number[]=[],rows:number[][]=[];
  for(const [height,width,depth] of levels){
    const row:number[]=[];
    for(const point of width ? contour : [new T.Vector3()]){
      const x=center[0]+point.x*width,z=center[1]+point.z*depth;
      row.push(positions.length/3);
      positions.push(x,height+relief(x,z),z);
    }
    rows.push(row);
  }
  for(let r=1;r<rows.length;r++){
    const lower=rows[r-1],upper=rows[r];
    for(let i=0;i<contour.length;i++){
      const j=(i+1)%contour.length;
      if(lower.length===1)indices.push(lower[0],upper[j],upper[i]);
      else if(upper.length===1)indices.push(lower[i],lower[j],upper[0]);
      else indices.push(lower[i],lower[j],upper[i],lower[j],upper[j],upper[i]);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(parent,geometry,material,name);
}

export function socket(parent:T.Object3D,name:string,base:Point,tip:Point,radius:number,material:T.Material){
  const end=v(tip).addScaledVector(v(tip).sub(v(base)).normalize(),.005);
  rod(parent,base,end.toArray(),radius,material,name,radius*.95);
  return tip;
}

export function connectedHose(parent:T.Object3D,name:string,points:Point[],radius:number,rubber:T.Material,clamp:T.Material,bellows:readonly number[]=[]){
  const path=new T.CatmullRomCurve3(points.map(v),false,'centripetal');
  const geometry=new T.TubeGeometry(path,Math.max(32,points.length*12),radius,16,false);
  const hose=mesh(parent,geometry,rubber,name);
  const length=path.getLength();
  for(const distance of [.006,length-.006]){
    const u=distance/length;
    const a=path.getPointAt(u-.004/length),b=path.getPointAt(u+.004/length);
    rod(parent,a.toArray(),b.toArray(),radius+.002,clamp,`${name}-clamp`);
  }
  for(const u of bellows){
    const ring=mesh(parent,new T.TorusGeometry(radius,.0035,8,24),rubber,`${name}-bellows`);
    ring.position.copy(path.getPointAt(u));
    ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),path.getTangentAt(u));
  }
  return hose;
}

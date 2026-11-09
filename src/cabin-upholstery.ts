import * as T from 'three';
import {mesh} from './geometry.ts';

export const spow=(x:number,n:number)=>Math.sign(x)*Math.abs(x)**n;
export function softForm(parent:T.Object3D,material:T.Material,name:string,warp:(p:T.Vector3)=>T.Vector3,segments=48,rings=32){
  const geometry=new T.SphereGeometry(1,segments,rings),p=geometry.getAttribute('position'),v=new T.Vector3();
  for(let i=0;i<p.count;i++){warp(v.fromBufferAttribute(p,i)).toArray(p.array,i*3);}
  geometry.computeVertexNormals();
  // Average the seam and poles of the UV sphere without welding its UVs.
  const n=geometry.getAttribute('normal'),a=new T.Vector3(),b=new T.Vector3();
  for(let j=1;j<rings;j++){
    const first=j*(segments+1),last=first+segments;
    a.fromBufferAttribute(n,first).add(b.fromBufferAttribute(n,last)).normalize();
    n.setXYZ(first,a.x,a.y,a.z);n.setXYZ(last,a.x,a.y,a.z);
  }
  for(const j of [0,rings]){
    a.set(0,0,0);const first=j*(segments+1);
    for(let i=0;i<=segments;i++)a.add(b.fromBufferAttribute(n,first+i));
    a.normalize();for(let i=0;i<=segments;i++)n.setXYZ(first+i,a.x,a.y,a.z);
  }
  return mesh(parent,geometry,material,name);
}

export function roundedRect(w:number,h:number,r:number,cx=0,cy=0){
  const s=new T.Shape(),x=cx-w/2,y=cy-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);
  s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();return s;
}

export function line(parent:T.Object3D,points:T.Vector3[],radius:number,material:T.Material,name:string,closed=false){
  const path=new T.CatmullRomCurve3(points,closed,'centripetal');
  const thread=mesh(parent,new T.TubeGeometry(path,Math.max(36,points.length*2),radius,6,closed),material,name);
  // Sub-millimetre stitching is shaded locally; its duplicate shadow edge
  // would alias against the upholstery beneath it at the scene's map scale.
  if(radius<.002)thread.castShadow=false;
  return thread;
}

export function clothUV(object:T.Mesh,plane:'xy'|'xz'|'zy',width:number,height:number){
  const p=object.geometry.getAttribute('position'),uv:number[]=[];
  for(let i=0;i<p.count;i++){
    const u=plane==='zy'?p.getZ(i):p.getX(i),v=plane==='xz'?p.getZ(i):p.getY(i);
    uv.push(u/width+.5,v/height+.5);
  }
  object.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return object;
}

export function flipFaces(object:T.Mesh){
  const i=object.geometry.index!,n=object.geometry.getAttribute('normal');
  for(let j=0;j<i.count;j+=3){const b=i.getX(j+1);i.setX(j+1,i.getX(j+2));i.setX(j+2,b);}
  for(let j=0;j<n.count;j++)n.setXYZ(j,-n.getX(j),-n.getY(j),-n.getZ(j));
  return object;
}

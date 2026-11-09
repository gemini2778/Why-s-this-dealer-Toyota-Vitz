import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {mesh,tube} from './geometry.ts';
import type {Point} from './geometry.ts';

type Mapper=(x:number,y:number,depth:number)=>T.Vector3;

// Split a shared edge for every incident triangle. Selective non-indexed
// tessellation leaves T-junctions which open into cracks after a curved warp.
function conformingSubdivision(source:T.BufferGeometry,edgeLimit:((x:number,y:number)=>number)|undefined,map:Mapper){
  // Keep the extrusion's cap/return smoothing islands. Merging their normals
  // creates alternating highlights along the very thin window and roof edges.
  source.deleteAttribute('uv');
  const joined=mergeVertices(source,1e-6),vertices=Array.from(joined.getAttribute('position').array);
  const normals=Array.from(joined.getAttribute('normal').array);
  let faces=Array.from(joined.index!.array);
  for(let pass=0;pass<8;pass++){
    const mids=new Map<string,number>();
    const warped=new Map<number,T.Vector3>();
    const world=(i:number)=>{
      let p=warped.get(i);
      if(!p){p=map(vertices[i*3],vertices[i*3+1],vertices[i*3+2]);warped.set(i,p);}
      return p;
    };
    const key=(a:number,b:number)=>a<b?`${a}:${b}`:`${b}:${a}`;
    for(let i=0;i<faces.length;i+=3)for(let e=0;e<3;e++){
      const a=faces[i+e],b=faces[i+(e+1)%3],k=key(a,b);if(mids.has(k))continue;
      let d=(vertices[a*3]-vertices[b*3])**2+(vertices[a*3+1]-vertices[b*3+1])**2+(vertices[a*3+2]-vertices[b*3+2])**2;
      const limit=edgeLimit?.((vertices[a*3]+vertices[b*3])/2,(vertices[a*3+1]+vertices[b*3+1])/2)??.075;
      // UV/shape edges can stretch dramatically when mapped around the cowl
      // or pillars. Refined regions must also meet the limit in real metres.
      if(limit<.075)d=Math.max(d,world(a).distanceToSquared(world(b)));
      if(d>limit**2){
        mids.set(k,vertices.length/3);
        for(let j=0;j<3;j++){vertices.push((vertices[a*3+j]+vertices[b*3+j])/2);normals.push((normals[a*3+j]+normals[b*3+j])/2);}
      }
    }
    if(!mids.size)break;
    const next:number[]=[];
    for(let i=0;i<faces.length;i+=3){
      const a=faces[i],b=faces[i+1],c=faces[i+2],ab=mids.get(key(a,b)),bc=mids.get(key(b,c)),ca=mids.get(key(c,a));
      const mask=(ab!==undefined?1:0)|(bc!==undefined?2:0)|(ca!==undefined?4:0);
      switch(mask){
        case 0:next.push(a,b,c);break;
        case 1:next.push(a,ab!,c,ab!,b,c);break;
        case 2:next.push(a,b,bc!,a,bc!,c);break;
        case 4:next.push(a,b,ca!,b,c,ca!);break;
        case 3:next.push(b,bc!,ab!,a,ab!,c,ab!,bc!,c);break;
        case 5:next.push(a,ab!,ca!,ab!,b,c,ab!,c,ca!);break;
        case 6:next.push(c,ca!,bc!,a,b,ca!,b,bc!,ca!);break;
        case 7:next.push(a,ab!,ca!,ab!,b,bc!,ca!,bc!,c,ab!,bc!,ca!);break;
      }
    }
    faces=next;
  }
  joined.dispose();
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(faces);return geometry;
}

export function mappedShape(parent:T.Object3D,shape:T.Shape,material:T.Material,map:Mapper,name:string,thickness=0,edgeLimit?:(x:number,y:number)=>number) {
  const source=thickness?new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1,curveSegments:24}):new T.ShapeGeometry(shape,24);
  const subdivided=conformingSubdivision(source,edgeLimit,map);source.dispose();
  const pos=subdivided.getAttribute('position'),normals=subdivided.getAttribute('normal'),eps=1e-4;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),d=pos.getZ(i),nx=normals.getX(i),ny=normals.getY(i),nz=normals.getZ(i);
    const dx=map(x+eps,y,d).sub(map(x-eps,y,d)),dy=map(x,y+eps,d).sub(map(x,y-eps,d));
    const n=new T.Vector3().crossVectors(dx,dy).multiplyScalar(nz);
    if(nx!==0||ny!==0){
      const dd=map(x,y,d+eps).sub(map(x,y,d-eps));
      n.add(new T.Vector3().crossVectors(dy,dd).multiplyScalar(nx));
      n.add(new T.Vector3().crossVectors(dd,dx).multiplyScalar(ny));
    }
    // The mapper's cofactor transforms normals without amplifying skinny
    // Earcut triangles. It also preserves orientation on mirrored sides.
    n.normalize();const p=map(x,y,d);pos.setXYZ(i,p.x,p.y,p.z);normals.setXYZ(i,n.x,n.y,n.z);
  }
  const result=mesh(parent,subdivided,material,name);result.receiveShadow=false;return result;
}

export function scaledContour(shape:T.Shape,factor:number) {
  const points=shape.getPoints(32),center=points.reduce((s,p)=>s.add(p),new T.Vector2()).divideScalar(points.length);
  return points.map(p=>p.clone().sub(center).multiplyScalar(factor).add(center));
}

export function ringShape(outer:T.Shape,inner:T.Vector2[]){
  const ring=new T.Shape(outer.getPoints(32));ring.holes.push(new T.Path(inner));return ring;
}

export function shapeRim(parent:T.Object3D,shape:T.Shape,map:(x:number,y:number)=>T.Vector3,material:T.Material,radius=.003) {
  const points=shape.getPoints(20).map(p=>map(p.x,p.y).toArray() as Point);
  return tube(parent,points,radius,material,true);
}

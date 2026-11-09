import * as T from 'three';
import {mesh} from './geometry.ts';
import type {Point} from './geometry.ts';

export function rod(parent:T.Object3D,a:Point,b:Point,radius:number,material:T.Material,name:string,otherRadius=radius){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),direction=end.clone().sub(start);
  const object=mesh(parent,new T.CylinderGeometry(otherRadius,radius,direction.length(),20),material,name);
  object.position.copy(start).lerp(end,.5);object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return object;
}
export function pipe(parent:T.Object3D,points:Point[],radius:number,material:T.Material,name:string){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
  return mesh(parent,new T.TubeGeometry(path,Math.max(32,points.length*12),radius,12,false),material,name);
}
export function spring(parent:T.Object3D,a:Point,b:Point,radius:number,wire:number,material:T.Material,name:string){
  const start=new T.Vector3(...a),axis=new T.Vector3(...b).sub(start),normal=axis.clone().normalize();
  const u=new T.Vector3(1,0,0).addScaledVector(normal,-normal.x).normalize(),v=new T.Vector3().crossVectors(normal,u),points=[];
  for(let i=0;i<=128;i++){
    const t=i/128,angle=t*Math.PI*12;
    points.push(start.clone().addScaledVector(axis,t).addScaledVector(u,radius*Math.cos(angle)).addScaledVector(v,radius*Math.sin(angle)));
  }
  return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points),192,wire,8,false),material,name);
}
export function bolt(parent:T.Object3D,position:Point,material:T.Material,radius=.009){
  const object=mesh(parent,new T.CylinderGeometry(radius,radius,.009,6),material,'fastener');object.position.set(...position);return object;
}

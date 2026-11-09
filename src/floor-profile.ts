import * as T from 'three';
import {profile} from './profile.ts';

export const floorHalfWidth=(z:number)=>profile([[-1.68,.63],[-1.52,.62],[-1.39,.582],[-1.18,.582],[-.94,.60],[-.81,.714],[.60,.714],[.88,.704]],z);
export function structuralFloorY(x:number,z:number){
  const rear=.13*T.MathUtils.smoothstep(-z,.58,.90);
  const spareWell=.105*Math.exp(-((x/.32)**4)-(((z+1.48)/.19)**4));
  const tunnel=.030*Math.exp(-((x/.14)**4))*(1-T.MathUtils.smoothstep(Math.abs(z+.1),.55,.85));
  const toe=.420*T.MathUtils.smoothstep(z,.60,.88);
  return .291+rear-spareWell+tunnel+toe;
}
export const carpetY=(x:number,z:number)=>structuralFloorY(x,z)+.024;
export function floorOutline(rear=-1.68,front=.88,inset=0){
  const points:T.Vector2[]=[];
  for(let i=0;i<=100;i++){const z=rear+(front-rear)*i/100;points.push(new T.Vector2(floorHalfWidth(z)-inset,z));}
  for(let i=100;i>=0;i--){const z=rear+(front-rear)*i/100;points.push(new T.Vector2(-floorHalfWidth(z)+inset,z));}
  return new T.Shape(points);
}

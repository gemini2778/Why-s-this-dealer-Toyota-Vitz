import * as T from 'three';
import {box,surface} from './geometry.ts';
import type {Point} from './geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {roundedRect} from './cabin-upholstery.ts';
import {sideSkinX} from './profile.ts';
import {carpetY} from './floor-profile.ts';
import type {CarMaterials} from './materials.ts';

/** Unoccupied front seats: the belt retracts beside the B pillar, not across the cushion. */
export function buildFrontSeatBelt(parent:T.Object3D,m:CarMaterials,side:number){
  const group=new T.Group();group.name=`front-seatbelt-${side}`;parent.add(group);
  const webbing=m.fabric.clone();webbing.color.set('#29323a');webbing.roughness=.98;webbing.sheen=.06;
  const plastic=m.dark.clone();plastic.roughness=.88;
  const z=-.466,guideY=1.246,guideX=sideSkinX(z,guideY)-.043;

  // This pad is fitted to the solid strip between the two side-window openings.
  const mount=roundedRect(.080,.075,.012,z,1.263);
  mappedShape(group,mount,plastic,(q,y,d)=>new T.Vector3(side*(sideSkinX(q,y)-.006-d),y,q),
    'front-belt-pillar-mount',.036,()=>.008);
  const guide=roundedRect(.066,.028,.010,z,guideY),slot=roundedRect(.048,.010,.004,z,guideY);
  guide.holes.push(new T.Path(slot.getPoints(20)));
  mappedShape(group,guide,m.trim,(q,y,d)=>new T.Vector3(side*(guideX+d),y,q),'front-belt-guide',.012,()=>.005);

  const anchorX=.656,anchorZ=-.455,floor=carpetY(anchorX,anchorZ);
  box(group,[.048,.028,.070],[side*anchorX,floor+.014,anchorZ],plastic,.009,'front-belt-floor-anchor');
  box(group,[.020,.006,.025],[side*anchorX,floor+.029,anchorZ],m.silver,.004,'front-belt-anchor-bolt');
  const reelFloor=carpetY(.705,-.548);
  box(group,[.042,.072,.067],[side*.705,reelFloor+.036,-.548],plastic,.011,'front-belt-retractor');

  const top:Point=[side*guideX,1.239,z];
  const points:Point[]=[top,[side*(guideX+.009),1.13,-.469],[side*.669,.905,-.485],
    [side*.668,.665,-.494],[side*.662,.476,-.478],[side*anchorX,floor+.023,anchorZ]];
  const sash=ribbon(group,points,.043,webbing,'seat-belt',side);
  ribbon(group,[[side*.699,reelFloor+.050,-.548],[side*.688,.650,-.540],[side*.690,.930,-.529],
    [side*(guideX+.014),1.215,z],[side*(guideX+.014),1.245,z],
    [side*(guideX+.006),1.249,z],top],.043,webbing,'front-belt-return',side);

  // The sliding tongue is parked on the outboard sash; the inboard buckle stays empty.
  const tonguePoint=sash.getPoint(.50);
  box(group,[.009,.036,.054],[tonguePoint.x-side*.004,tonguePoint.y,tonguePoint.z],m.silver,.005,'front-belt-tongue');
  box(group,[.014,.018,.052],[tonguePoint.x-side*.006,tonguePoint.y-.014,tonguePoint.z],plastic,.005,'front-belt-tongue-grip');
}

function ribbon(parent:T.Object3D,points:Point[],width:number,material:T.Material,name:string,side:number){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
  surface(parent,(u,v)=>{
    const tangent=curve.getTangent(v),across=new T.Vector3(0,0,1);
    across.addScaledVector(tangent,-across.dot(tangent)).normalize();
    return curve.getPoint(v).addScaledVector(across,(u-.5)*width*side);
  },material,1,72,name);
  return curve;
}

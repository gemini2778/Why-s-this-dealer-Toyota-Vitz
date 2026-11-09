import * as T from 'three';
import {box,mesh} from './geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {floorOutline,carpetY} from './floor-profile.ts';
import {pipe,rod,bolt} from './mechanical-geometry.ts';
import type {CarMaterials} from './materials.ts';

export function buildFootwell(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='footwell';parent.add(group);
  const carpet=m.dash.clone();carpet.color.set('#515b60');carpet.roughness=1;
  mappedShape(group,floorOutline(-1.62,.88,.014),carpet,(x,z,d)=>new T.Vector3(x,carpetY(x,z)-d,z),'cabin-floor',.014,()=>.055);
  box(group,[1.39,.28,.018],[0,.872,.882],carpet,.008,'cabin-firewall');
  for(const side of [-1,1]){
    box(group,[.399,.009,.45],[side*.365,.321,.175],m.rubber,.022,'floor-mat');
    for(let i=0;i<8;i++)box(group,[.34,.002,.006],[side*.365,.326,-.005+i*.043],m.seam,.001,'mat-rib');
    for(const offset of [-.12,.12])box(group,[.032,.066,.40],[side*.365+offset,.353,-.268],m.dark,.006,'seat-mounting-rail');
  }
  box(group,[1.08,.042,.28],[0,.451,-.99],m.dark,.012,'rear-seat-riser');
  const steel=m.dark.clone();steel.color.set('#353e43');steel.metalness=.52;steel.roughness=.60;
  for(const [name,x,y,z,w,h] of [['brake',-.335,.449,.487,.115,.063],['accelerator',-.495,.420,.515,.047,.110]] as const){
    const pedal=new T.Group();pedal.name=`${name}-pedal`;group.add(pedal);
    box(pedal,[.047,.045,.044],[x,.671,.800],steel,.008,'pedal-bracket');
    rod(pedal,[x-.031,.675,.798],[x+.031,.675,.798],.011,m.silver,'pedal-pivot');
    pipe(pedal,[[x,.673,.785],[x,.609,.741],[x,.535,.633],[x,y+.008,z+.013]],.010,steel,'pedal-arm');
    const pad=box(pedal,[w,h,.021],[x,y,z],m.rubber,.009,`${name}-pedal-pad`);pad.rotation.x=.38;
    box(pad,[w*.88,h*.88,.012],[0,0,.012],steel,.006,'pedal-backing');
    const rows=name==='brake'?4:6;
    for(let i=0;i<rows;i++)box(pad,[w*.82,.003,.0025],[0,-h*.34+i*h*.68/(rows-1),-.0115],m.seam,.001,'pedal-grip-rib');
    bolt(pedal,[x,.696,.800],m.silver,.007);
  }
  const rest=box(group,[.068,.123,.018],[-.198,.388,.504],m.rubber,.009,'footrest');rest.rotation.x=.58;
  // A small floor grommet closes the automatic selector linkage passage.
  const grommet=mesh(group,new T.TorusGeometry(.025,.004,8,32),m.rubber,'selector-floor-grommet');grommet.rotation.x=Math.PI/2;grommet.position.set(0,carpetY(0,.13)+.003,.13);
  return group;
}

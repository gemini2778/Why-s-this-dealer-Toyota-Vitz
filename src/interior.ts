import * as T from 'three';
import {box,mesh,tube} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {buildSteering} from './steering.ts';
import {buildDashboard} from './dashboard.ts';
import {buildCabinTrim,buildCabinSeats} from './cabin-trim.ts';
import {buildFootwell} from './footwell.ts';

export function buildInterior(parent:T.Object3D,m:CarMaterials){
  const inside=new T.Group();inside.name='interior';parent.add(inside);
  buildFootwell(inside,m);
  buildDashboard(inside,m);buildCabinTrim(inside,m);buildCabinSeats(inside,m);
  buildSteering(inside,m);
  box(inside,[.19,.061,.024],[0,1.326,.318],m.rubber,.018,'rearview-mirror');
  box(inside,[.17,.043,.004],[0,1.326,.302],m.chrome,.013);
  tube(inside,[[0,1.352,.323],[0,1.438,.180]],.008,m.dark);
  for(const x of [-.36,.36]){
    const visor=mesh(inside,new T.CapsuleGeometry(.047,.235,8,32),m.trim,'sun-visor');
    visor.rotation.z=Math.PI/2;visor.scale.z=.16;visor.position.set(x,1.422,.185);visor.rotation.x=Math.PI/2;
  }
  return inside;
}

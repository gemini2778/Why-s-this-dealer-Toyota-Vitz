import {Group} from 'three';
import {createCarMaterials} from './materials.ts';
import type {CarTextures} from './materials.ts';
import {buildExterior} from './exterior.ts';
import {buildInterior} from './interior.ts';
import {buildChassis} from './chassis.ts';

export function createVitz(textures:CarTextures={}) {
  const root=new Group();root.name='vitz-xp10';
  const materials=createCarMaterials(textures);
  const exterior=buildExterior(root,materials),chassis=buildChassis(root,materials);
  const interior=buildInterior(root,materials);
  const covered=[...exterior.children.filter(o=>o.name!=='rolling-gear'),interior];
  const visibility=new Map(covered.map(o=>[o,o.visible]));
  const setMechanicalView=(enabled:boolean)=>covered.forEach(o=>{o.visible=enabled?false:visibility.get(o)!;});
  return {root,materials,interior,chassis,setMechanicalView,bodyMaterials:[materials.paint],glassMaterials:[materials.glass]};
}

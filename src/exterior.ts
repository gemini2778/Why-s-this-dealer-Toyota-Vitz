import {Group} from 'three';
import type {Object3D} from 'three';
import type {CarMaterials} from './materials.ts';
import {buildBody} from './body.ts';
import {buildLights} from './lamps.ts';
import {buildWheels,buildTrim} from './details.ts';

export function buildExterior(parent:Object3D,materials:CarMaterials){
  const exterior=new Group();exterior.name='exterior';parent.add(exterior);
  const wheels=new Group();wheels.name='rolling-gear';exterior.add(wheels);buildWheels(wheels,materials);
  buildBody(exterior,materials);
  buildLights(exterior,materials);
  buildTrim(exterior,materials);
  exterior.traverse(object=>{if('receiveShadow' in object)object.receiveShadow=false;});
  return exterior;
}

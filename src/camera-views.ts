import {MathUtils,Vector3} from 'three';

export type ViewName='front'|'rear'|'side'|'interior'|'chassis'|'engine'|'rearInterior'|'cabinDetail';
type ViewPreset={position:[number,number,number];target:[number,number,number];fov:number};
const views:Record<ViewName,ViewPreset>={
  front:{position:[4.5,2.05,5.65],target:[0,.74,0],fov:34},
  rear:{position:[-4.6,2.05,-5.6],target:[0,.75,-.1],fov:34},
  side:{position:[9.8,1.13,0],target:[0,.75,0],fov:24},
  interior:{position:[.035,1.235,-.50],target:[.02,.83,.60],fov:76},
  chassis:{position:[3.6,-3.0,4.7],target:[0,.29,0],fov:32},
  engine:{position:[1.60,1.80,2.80],target:[0,.57,1.18],fov:36},
  rearInterior:{position:[.03,1.29,-.37],target:[-.04,.73,-1.11],fov:85},
  cabinDetail:{position:[.045,1.32,.15],target:[-.015,.47,-.36],fov:75},
};

export const isCabinView=(name:ViewName)=>name==='interior'||name==='rearInterior'||name==='cabinDetail';
export const viewFit=(name:ViewName,aspect:number)=>isCabinView(name)?1:Math.max(1,1.28/aspect);

/** The same fit is used by transitions, resizing and geometry framing checks. */
export function getViewPose(name:ViewName,aspect:number){
  const view=views[name],target=new Vector3(...view.target);
  const position=new Vector3(...view.position).sub(target).multiplyScalar(viewFit(name,aspect)).add(target);
  const fov=isCabinView(name)?Math.min(110,MathUtils.radToDeg(2*Math.atan(Math.tan(MathUtils.degToRad(view.fov)/2)*Math.max(1,1.18/aspect)))):view.fov;
  return {position,target,fov};
}

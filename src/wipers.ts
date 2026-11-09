import * as T from 'three';
import {ellipsoid,box} from './geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {rearWindowPoint,rearZ,windPoint,frontZ,frontCowl} from './profile.ts';
import type {CarMaterials} from './materials.ts';

// Locate the curved glazing at a physical x/y position. The lower motor
// spindle sits on the hatch, while the rubber rests on the window itself.
function glassPoint(x:number,y:number,rear:boolean,depth:number){
  const map=rear?rearWindowPoint:windPoint,base=rear?1:frontCowl.y;
  if(y<base)return new T.Vector3(x,y,rear?rearZ(x,y)-depth:frontZ(x,y)+depth);
  let r=x/.76,t=(y-base)/.52;
  for(let i=0;i<10;i++){
    const p=map(r,t);r+=(x-p.x)/.75;t+=(y-p.y)/.55;
  }
  const p=map(r,t);p.z+=(rear?-1:1)*depth;return p;
}

function strip(x0:number,y0:number,x1:number,y1:number,width:number){
  const axis=new T.Vector2(x1-x0,y1-y0).normalize(),n=new T.Vector2(-axis.y,axis.x).multiplyScalar(width/2);
  return new T.Shape([
    new T.Vector2(x0+n.x,y0+n.y),new T.Vector2(x1+n.x,y1+n.y),
    new T.Vector2(x1-n.x,y1-n.y),new T.Vector2(x0-n.x,y0-n.y),
  ]);
}

export function buildWipers(parent:T.Object3D,m:CarMaterials){
  const armMaterial=m.rubber.clone();armMaterial.color.set('#232729');armMaterial.roughness=.50;
  function part(shape:T.Shape,name:string,rear:boolean,depth:number,thickness:number,material:T.Material=armMaterial){
    return mappedShape(parent,shape,material,(x,y,d)=>glassPoint(x,y,rear,depth+d),name,thickness,()=>.018);
  }
  function blade(x0:number,y0:number,x1:number,y1:number,rear:boolean,prefix:string){
    part(strip(x0,y0,x1,y1,.003),`${prefix}-rubber`,rear,.0013,.002,m.rubber);
    part(strip(x0,y0,x1,y1,.008),`${prefix}-blade`,rear,.004,.004);
    // Thin pressed backbone and retaining claws, separate from the wiping edge.
    part(strip(x0+.012,y0,x1-.012,y1,.004),`${prefix}-backbone`,rear,.008,.004);
    for(const t of [.16,.38,.62,.84]){
      const x=T.MathUtils.lerp(x0,x1,t),y=T.MathUtils.lerp(y0,y1,t);
      part(strip(x-.004,y,x+.004,y,.011),`${prefix}-clip`,rear,.004,.006);
    }
  }
  blade(.035,1.066,.485,1.061,true,'rear-wiper');
  const arm=new T.Shape();arm.moveTo(-.109,.984);
  arm.quadraticCurveTo(-.106,1.001,-.091,1.021);arm.lineTo(-.052,1.064);
  arm.quadraticCurveTo(-.038,1.080,-.015,1.080);arm.lineTo(.180,1.072);
  arm.quadraticCurveTo(.190,1.070,.190,1.063);arm.lineTo(.179,1.059);arm.lineTo(-.013,1.063);
  arm.quadraticCurveTo(-.025,1.063,-.033,1.052);arm.lineTo(-.081,.984);arm.closePath();
  part(arm,'rear-wiper-arm',true,.012,.007);
  const pivot=glassPoint(-.094,.989,true,.012);
  ellipsoid(parent,pivot.toArray(),[.019,.020,.011],armMaterial,'rear-wiper-pivot');
  part(strip(.163,1.064,.192,1.064,.017),'rear-wiper-joint',true,.009,.013);

  // Paired parked front blades, with actual arms extending from cowl spindles.
  const lift=frontCowl.y-.935;
  for(const [x0,by0,x1,by1,px,bpy,ax,bay] of [
    [-.63,.977,.015,.992,-.48,.949,-.235,.986],
    [.075,.972,.625,.985,.58,.947,.355,.978],
  ]){
    const y0=by0+lift,y1=by1+lift,py=bpy+lift,ay=bay+lift;
    blade(x0,y0,x1,y1,false,'front-wiper');
    part(strip(px,py,ax,ay,.012),'front-wiper-arm',false,.012,.005);
    ellipsoid(parent,glassPoint(px,py,false,.012).toArray(),[.014,.010,.010],armMaterial,'front-wiper-pivot');
    const joint=box(parent,[.032,.013,.012],glassPoint(ax,ay,false,.016).toArray(),armMaterial,.004,'front-wiper-joint');
    joint.rotation.x=-.65;
  }
}

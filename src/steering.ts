import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {box,mesh,tube} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {mappedShape} from './shape-mesh.ts';

// Steering-wheel coordinates: -Z faces the driver, +Z follows the shaft.
// The original XP10 wheel has a thin round rim, broad horizontal spokes and
// a large three-lobed airbag pad, rather than cylindrical spokes and a box.
function mouldedPart(parent:T.Object3D,shape:T.Shape,material:T.Material,name:string,
  front:number,depth:number,round:number,dish:(x:number,y:number)=>number=()=>0){
  const source=new T.ExtrudeGeometry(shape,{
    depth,steps:1,bevelEnabled:true,bevelThickness:round,bevelSize:round,
    bevelSegments:12,curveSegments:24,
  });
  source.deleteAttribute('normal');source.deleteAttribute('uv');
  const geometry=mergeVertices(source,1e-6);source.dispose();
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)positions.setZ(i,
    positions.getZ(i)+front+round+dish(positions.getX(i),positions.getY(i)));
  geometry.computeVertexNormals();
  return mesh(parent,geometry,material,name);
}

function oval(parent:T.Object3D,rx:number,ry:number,cy:number,z:(x:number,y:number)=>number,
  radius:number,material:T.Material,name:string){
  const points=Array.from({length:96},(_,i)=>{
    const a=i*Math.PI*2/96,x=rx*Math.cos(a),y=cy+ry*Math.sin(a);
    return new T.Vector3(x,y,z(x,y));
  });
  const path=new T.CatmullRomCurve3(points,true,'centripetal');
  const ring=mesh(parent,new T.TubeGeometry(path,192,radius,10,true),material,name);
  ring.receiveShadow=false;
  return ring;
}

function airbagPad(parent:T.Object3D,shape:T.Shape,material:T.Material){
  const center=new T.Vector2(0,-.018),edge=shape.getSpacedPoints(192).slice(0,-1)
    .map(p=>p.sub(center).multiplyScalar(1.12));
  if(T.ShapeUtils.isClockWise(edge))edge.reverse();
  const positions:number[]=[],indices:number[]=[],n=edge.length,rings=48;
  // A continuous inflated moulding rolls from the gently crowned driver face
  // into its rear shell. An extruded outline left a raised rear lip at the top.
  for(let j=0;j<=rings;j++){
    const a=j/rings*Math.PI,r=Math.sqrt(Math.max(0,Math.sin(a))),z=-.018-.025*Math.cos(a);
    for(let i=0;i<n;i++)positions.push(center.x+edge[i].x*r,center.y+edge[i].y*r,z);
  }
  for(let j=0;j<rings;j++)for(let i=0;i<n;i++){
    const a=j*n+i,b=j*n+(i+1)%n;
    if(j!==0)indices.push(a,b,a+n);
    if(j!==rings-1)indices.push(b,b+n,a+n);
  }
  const source=new T.BufferGeometry();source.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  source.setIndex(indices);const geometry=mergeVertices(source,1e-6);source.dispose();
  geometry.computeVertexNormals();mesh(parent,geometry,material,'airbag');
  // Intersect the actual sampled outline to locate its radial fraction. Use
  // the same moulding equation for the badge seat and all three chrome loops.
  return (x:number,y:number)=>{
    const p=new T.Vector2(x,y).sub(center),distance=p.length();
    if(distance<1e-8)return -.043;
    const direction=p.clone().divideScalar(distance);let boundary=Infinity;
    for(let i=0;i<n;i++){
      const a=edge[i],e=edge[(i+1)%n].clone().sub(a),cross=direction.cross(e);
      if(Math.abs(cross)<1e-10)continue;
      const t=a.cross(e)/cross,s=a.cross(direction)/cross;
      if(t>0&&s>=-1e-8&&s<=1+1e-8)boundary=Math.min(boundary,t);
    }
    const r=Math.min(distance/boundary,1);
    return -.018-.025*Math.sqrt(Math.max(0,1-r**4));
  };
}

export function buildSteering(parent:T.Object3D,m:CarMaterials){
  const wheel=new T.Group();wheel.name='steering-wheel';
  wheel.position.set(-.366,.916,.108);parent.add(wheel);
  const dashAnchor=new T.Vector3(-.366,.798,.420);
  const shaft=dashAnchor.sub(wheel.position);
  // The top rim leans toward the windshield. Derive the whole assembly's
  // inclination from its actual dashboard attachment, so it cannot kink.
  wheel.rotation.x=Math.atan2(-shaft.y,shaft.z);

  const rubber=m.dash.clone();rubber.color.set('#535e64');rubber.roughness=.84;
  const spokeMaterial=rubber.clone();spokeMaterial.color.set('#747d82');
  const padMaterial=rubber.clone();padMaterial.color.set('#59636a');
  const recessMaterial=rubber.clone();recessMaterial.color.set('#465056');
  const rim=mesh(wheel,new T.TorusGeometry(.166,.0135,24,128),rubber,'steering-rim');
  rim.scale.y=1.015;

  for(const side of [-1,1]){
    const spoke=new T.Shape();
    spoke.moveTo(.048,.029);spoke.bezierCurveTo(.092,.022,.130,.022,.156,.017);
    spoke.quadraticCurveTo(.164,.004,.157,-.015);
    spoke.bezierCurveTo(.120,-.016,.085,-.014,.050,-.010);spoke.closePath();
    const part=mouldedPart(wheel,spoke,spokeMaterial,'steering-spoke',-.010,.015,.004,
      x=>-.010*Math.max(0,(.16-x)/.112));
    if(side<0)part.scale.x=-1;
  }
  const lower=new T.Shape();
  lower.moveTo(-.028,-.065);lower.quadraticCurveTo(0,-.075,.028,-.065);
  lower.bezierCurveTo(.025,-.107,.021,-.140,.020,-.163);
  lower.quadraticCurveTo(0,-.171,-.020,-.163);
  lower.bezierCurveTo(-.021,-.140,-.025,-.107,-.028,-.065);lower.closePath();
  mouldedPart(wheel,lower,spokeMaterial,'steering-spoke',-.010,.016,.004,
    (_x,y)=>-.010*Math.max(0,(.166+y)/.101));

  const pad=new T.Shape();pad.moveTo(0,.052);
  pad.bezierCurveTo(.026,.052,.045,.040,.052,.031);
  pad.bezierCurveTo(.066,.023,.077,.021,.077,.008);
  pad.bezierCurveTo(.077,-.011,.049,-.020,.042,-.050);
  pad.bezierCurveTo(.038,-.071,.035,-.085,.020,-.088);
  pad.quadraticCurveTo(0,-.092,-.020,-.088);
  pad.bezierCurveTo(-.035,-.085,-.038,-.071,-.042,-.050);
  pad.bezierCurveTo(-.049,-.020,-.077,-.011,-.077,.008);
  pad.bezierCurveTo(-.077,.021,-.066,.023,-.052,.031);
  pad.bezierCurveTo(-.045,.040,-.026,.052,0,.052);pad.closePath();
  const padSurface=airbagPad(wheel,pad,padMaterial);

  // A shallow inset medallion and three complete, surface-following Toyota
  // ovals. All three loops sit proud of the backing, including the upper one.
  const badgeFace=new T.Shape();badgeFace.absellipse(0,.018,.033,.027,0,Math.PI*2,false,0);
  const badgeSurface=(x:number,y:number)=>padSurface(x,y)-.0008;
  mappedShape(wheel,badgeFace,recessMaterial,(x,y,d)=>new T.Vector3(x,y,badgeSurface(x,y)-d),
    'steering-badge-seat',.0003,()=>.003);
  oval(wheel,.033,.027,.018,badgeSurface,.0006,padMaterial,'steering-badge-border');
  for(const [name,rx,ry,cy] of [
    ['outer',.024,.016,.018],['vertical',.008,.0155,.018],['horizontal',.0208,.0062,.0254],
  ] as const)oval(wheel,rx,ry,cy,(x,y)=>badgeSurface(x,y)-.0012,.00085,m.chrome,`steering-emblem-${name}`);

  const columnPath=new T.LineCurve3(new T.Vector3(0,0,.022),new T.Vector3(0,0,shaft.length()));
  mesh(wheel,new T.TubeGeometry(columnPath,1,.018,24,false),m.dark,'steering-column');
  const collar=mesh(wheel,new T.CylinderGeometry(.043,.047,.043,48),rubber,'steering-hub-rear');
  collar.rotation.x=Math.PI/2;collar.position.z=.038;
  box(wheel,[.100,.071,.260],[0,-.009,.171],rubber,.028,'steering-column-shroud');
  for(const side of [-1,1]){
    tube(wheel,[[side*.040,-.010,.118],[side*.104,-.005,.111],[side*.165,.006,.096]],.007,m.dark,false,'steering-stalk');
    const tip=box(wheel,[.039,.017,.022],[side*.166,.006,.096],m.dark,.007,'steering-stalk-tip');
    tip.rotation.y=side*.10;
  }
  return wheel;
}

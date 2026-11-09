import * as T from 'three';
import {box,ellipsoid,mesh,surface,tube} from './geometry.ts';
import type {Point} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {frontZ,rearZ,frontCowl,frontDetailY,frontDoorOutline,sideSkinX,roofPoint,windPoint,rearWindowPoint} from './profile.ts';
import {mappedShape,shapeRim} from './shape-mesh.ts';
import {buildMirrors} from './mirrors.ts';
import {buildWipers} from './wipers.ts';
import {buildDoorHandles,buildFenderIndicators} from './side-details.ts';

export function badge(parent:T.Object3D,pos:Point,m:CarMaterials,rear=false,scale=1){
  const group=new T.Group();parent.add(group);group.position.set(...pos);if(rear)group.rotation.y=Math.PI;group.scale.setScalar(scale);
  for(const [sx,sy,cy] of [[1.3,.84,0],[.48,.82,0],[1,.40,.018]]){
    const ellipse=mesh(group,new T.TorusGeometry(.035,.0032,6,36),m.chrome);ellipse.scale.set(sx,sy,1);ellipse.position.y=cy;
  }
}

function bodyBadge(parent:T.Object3D,y:number,m:CarMaterials,rear=false,scale=1){
  const group=new T.Group();group.name=rear?'rear-body-badge':'front-body-badge';parent.add(group);
  const panel=rear?rearZ:frontZ,sign=rear?-1:1,e=1e-5;
  const slope=(panel(0,y+e)-panel(0,y-e))/(2*e),up=1/Math.hypot(1,slope);
  for(const [sx,sy,cy] of [[1.3,.84,0],[.48,.82,0],[1,.40,.018]]){
    const geometry=new T.TorusGeometry(.035,.0018,8,64),p=geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const x=sign*p.getX(i)*sx*scale,yy=y+(p.getY(i)*sy+cy)*scale*up,depth=.0027+p.getZ(i)*scale;
      const dx=(panel(x+e,yy)-panel(x-e,yy))/(2*e),dy=(panel(x,yy+e)-panel(x,yy-e))/(2*e);
      const normal=new T.Vector3(-sign*dx,-sign*dy,sign).normalize();
      const point=new T.Vector3(x,yy,panel(x,yy)).addScaledVector(normal,depth);
      p.setXYZ(i,point.x,point.y,point.z);
    }
    geometry.computeVertexNormals();
    const ring=mesh(group,geometry,m.chrome);ring.receiveShadow=false;
  }
}

export function buildWheels(parent:T.Object3D,m:CarMaterials){
  for(const side of [-1,1])for(const z of [-1.185,1.185]){
    const group=new T.Group();group.position.set(side*.718,.29,z);parent.add(group);
    const tire=new T.TorusGeometry(.223,.067,16,64);tire.scale(1,1,1.33);tire.rotateY(Math.PI/2);
    mesh(group,tire,m.rubber,`tire-${side}-${z}`);
    for(const offset of [-.044,0,.044]){const line=mesh(group,new T.TorusGeometry(.287,.0015,4,64),m.seam);line.rotation.y=Math.PI/2;line.position.x=offset;}
    const tread:number[]=[];
    for(let i=0;i<64;i++){const a=2*Math.PI*(i+.5)/64;for(const x of [-.047,.047])tread.push(x,Math.cos(a)*.289,Math.sin(a)*.289);}
    const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute(tread,3));
    group.add(new T.LineSegments(tg,new T.LineBasicMaterial({color:'#252a2b',transparent:true,opacity:.7})));
    const hub=new T.Group();hub.position.x=side*.083;hub.rotation.y=side*Math.PI/2;group.add(hub);
    const backing=mesh(hub,new T.CylinderGeometry(.183,.183,.018,48),m.dark);backing.rotation.x=Math.PI/2;
    const cover=new T.Shape();cover.absarc(0,0,.177,0,Math.PI*2,false);
    const ventShapes:T.Shape[]=[];
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      const vent=new T.Shape();vent.moveTo(-.015,.095);
      vent.bezierCurveTo(-.031,.110,-.033,.143,-.019,.154);
      vent.quadraticCurveTo(0,.167,.024,.150);vent.quadraticCurveTo(.033,.130,.015,.101);
      vent.quadraticCurveTo(0,.086,-.015,.095);vent.closePath();
      const outline=vent.getPoints(20).map(p=>new T.Vector2(p.x*Math.cos(a)+p.y*Math.sin(a),-p.x*Math.sin(a)+p.y*Math.cos(a)));
      const shape=new T.Shape(outline);ventShapes.push(shape);cover.holes.push(new T.Path(outline));
    }
    const cap=(x:number,y:number,d=0)=>{
      const r=Math.hypot(x,y),a=Math.atan2(x,y);
      const crown=.010+.025*Math.sqrt(Math.max(.02,1-(r/.184)**2));
      // The five moulded petals rise between the vent openings, fading into
      // both the centre cap and rim without separate blocks or fasteners.
      const petal=-.009*Math.cos(5*a)*Math.sin(Math.PI*Math.min(r/.177,1))**2;
      return new T.Vector3(x,y,crown+petal+d);
    };
    mappedShape(hub,cover,m.silver,cap,'wheel-cover',.003,()=>.012);
    for(const vent of ventShapes)shapeRim(hub,vent,(x,y)=>cap(x,y,.002),m.silver,.0013);
    const lip=mesh(hub,new T.TorusGeometry(.179,.004,8,64),m.silver);lip.position.z=.019;
    ellipsoid(hub,[.044,-.154,.028],[.004,.006,.009],m.rubber,'wheel-valve');
    ellipsoid(hub,[0,0,.036],[.030,.030,.004],m.silver);badge(hub,[0,0,.041],m,false,.43);
  }
}

function sidePath(parent:T.Object3D,path:T.Path,side:number,m:T.Material,radius=.0018,offset=.008,closed=false,name=''){
  // Resample the complete closed door contour before mapping to the skin;
  // a LineCurve's endpoints alone cut across the curved pillar in 3D.
  const points=closed?path.getSpacedPoints(640):path.getPoints(32);
  if(closed&&points[0].equals(points[points.length-1]))points.pop();
  return tube(parent,points.map(p=>[side*(sideSkinX(p.x,p.y)+offset),p.y,p.x] as Point),radius,m,closed,name);
}
function facePath(parent:T.Object3D,path:T.Path,m:T.Material,rear=false,radius=.002){
  tube(parent,path.getPoints(20).map(p=>{const y=rear?p.y:frontDetailY(p.y);return [p.x,y,rear?rearZ(p.x,y)-.002:frontZ(p.x,y)+.002] as Point;}),radius,m);
}

export function buildTrim(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='body-trim';parent.add(group);
  for(const side of [-1,1]){
    const door=sidePath(group,frontDoorOutline(),side,m.seam,.0017,.0012,true,`front-door-seam-${side}`);
    door.castShadow=false;
    const crease=new T.Path();crease.moveTo(-.828,.326);crease.quadraticCurveTo(-.20,.293,.826,.333);sidePath(group,crease,side,m.silver,.0028);
  }
  buildDoorHandles(group,m);buildFenderIndicators(group,m);
  buildMirrors(group,m);
  const fuel=new T.Shape();fuel.absellipse(-1.209,.839,.067,.066,0,Math.PI*2,false,0);
  shapeRim(group,fuel,(z,y)=>new T.Vector3(sideSkinX(z,y)+.002,y,z),m.seam,.0015);

  for(const side of [-1,1]){
    const hood=new T.Path();hood.moveTo(side*.716,frontCowl.y+.075);hood.bezierCurveTo(side*.667,1.040,side*.603,.986,side*.549,.928);facePath(group,hood,m.seam,false,.0015);
    const seam=new T.Path();seam.moveTo(side*.757,.477);seam.quadraticCurveTo(side*.611,.473,side*.366,.477);facePath(group,seam,m.seam,false,.0016);
  }
  const recess=new T.Path();recess.moveTo(-.362,.691);recess.bezierCurveTo(-.344,.611,-.339,.517,-.286,.492);
  recess.quadraticCurveTo(0,.481,.286,.492);recess.bezierCurveTo(.339,.517,.344,.611,.362,.691);facePath(group,recess,m.silver,false,.003);
  const tow=new T.Shape();tow.absellipse(.548,frontDetailY(.566),.040,.040,0,Math.PI*2,false,0);shapeRim(group,tow,(x,y)=>new T.Vector3(x,y,frontZ(x,y)+.001),m.seam,.0014);
  bodyBadge(group,frontDetailY(.817),m,false,1.03);
  for(const x of [-.43,.43]){
    const y=frontCowl.y-.020,nozzle=ellipsoid(group,[x,y+.001,frontZ(x,y)+.003],[.009,.004,.011],m.rubber,'washer-nozzle');
    nozzle.rotation.x=-.15;
  }

  surface(group,(u,t)=>{
    const p=windPoint(2*u-1,.035*t);p.z+=.001;return p;
  },m.rubber,48,4,'windscreen-cowl');
  buildWipers(group,m);
  const antennaBase=roofPoint(0,.035);antennaBase.y+=.004;
  ellipsoid(group,antennaBase.toArray() as Point,[.022,.014,.037],m.rubber);
  tube(group,[antennaBase.toArray() as Point,[0,1.690,-.254]],.0034,m.rubber,false,'antenna');

  const hatch=new T.Path();hatch.moveTo(-.448,.989);hatch.lineTo(-.452,.732);hatch.quadraticCurveTo(-.446,.655,-.350,.648);
  hatch.quadraticCurveTo(0,.642,.350,.648);hatch.quadraticCurveTo(.446,.655,.452,.732);hatch.lineTo(.448,.989);facePath(group,hatch,m.seam,true,.0017);
  const rearSeam=new T.Path();rearSeam.moveTo(-.733,.573);rearSeam.quadraticCurveTo(0,.572,.733,.573);facePath(group,rearSeam,m.seam,true,.0016);
  bodyBadge(group,.955,m,true,.96);
  ellipsoid(group,[0,.782,rearZ(0,.782)-.005],[.011,.017,.005],m.rubber,'hatch-lock');
  ellipsoid(group,[0,.787,rearZ(0,.787)-.010],[.006,.006,.002],m.chrome,'hatch-key-cylinder');
  box(group,[.0018,.006,.0015],[0,.787,rearZ(0,.787)-.012],m.rubber,.0005,'hatch-key-slot');
  box(group,[.428,.120,.018],[0,.425,rearZ(0,.425)-.010],m.plate,.012,'rear-plate');
  for(let j=0;j<6;j++){
    const pts:Point[]=[];for(let i=0;i<=24;i++){const p=rearWindowPoint(-.87+1.74*i/24,.17+j*.105);p.z+=.002;pts.push(p.toArray() as Point);}
    tube(group,pts,.0005,m.amber);
  }
  const brake=rearWindowPoint(0,.86);brake.z+=.012;
  box(group,[.205,.020,.020],brake.toArray() as Point,m.red,.004,'third-brake-light');
  return group;
}

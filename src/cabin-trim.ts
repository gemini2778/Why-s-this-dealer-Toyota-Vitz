import * as T from 'three';
import {box,mesh,tube,surface} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {mappedShape} from './shape-mesh.ts';
import {rod} from './mechanical-geometry.ts';
import {clothUV,flipFaces,line,roundedRect,softForm,spow} from './cabin-upholstery.ts';
import {buildRearCabin} from './rear-cabin.ts';
import {buildHandbrake} from './handbrake.ts';
import {buildFrontSeatBelt} from './front-seatbelts.ts';

const doorInset=(z:number,y:number)=>.010+.038*Math.exp(-(((y-.747)/.115)**2))+.040*Math.exp(-(((z-.055)/.40)**2)-((y-.670)/.18)**2);
const doorPoint=(side:number,z:number,y:number,d=0)=>new T.Vector3(side*(.755-doorInset(z,y)-d),y,z);

export function buildCabinTrim(parent:T.Object3D,m:CarMaterials){
  const shellMaterial=m.dash.clone();shellMaterial.color.set('#626d75');shellMaterial.roughness=.90;
  const handleMaterial=m.trim.clone();handleMaterial.color.set('#899196');handleMaterial.roughness=.76;
  for(const side of [-1,1]){
    const group=new T.Group();group.name=`door-trim-${side}`;parent.add(group);
    const shape=new T.Shape();shape.moveTo(.66,.925);shape.bezierCurveTo(.20,.948,-.43,.950,-.70,.925);
    shape.quadraticCurveTo(-.785,.912,-.792,.817);shape.lineTo(-.792,.407);
    shape.quadraticCurveTo(-.785,.330,-.704,.329);shape.lineTo(.560,.329);
    shape.quadraticCurveTo(.682,.350,.685,.465);shape.lineTo(.695,.857);shape.quadraticCurveTo(.697,.907,.66,.925);shape.closePath();
    const grab=new T.Shape();grab.absellipse(.390,.824,.095,.040,0,Math.PI*2,false,-.16);
    const pocket=roundedRect(.72,.105,.043,-.125,.457);
    shape.holes.push(new T.Path(grab.getPoints(40)),new T.Path(pocket.getPoints(32)));
    mappedShape(group,shape,shellMaterial,(z,y,d)=>doorPoint(side,z,y,-d),'door-card',.006,()=>.020);
    const insert=new T.Shape();insert.moveTo(.229,.846);insert.bezierCurveTo(-.04,.895,-.42,.906,-.664,.874);
    insert.quadraticCurveTo(-.707,.865,-.688,.805);insert.bezierCurveTo(-.566,.744,-.202,.716,.157,.753);
    insert.quadraticCurveTo(.253,.770,.229,.846);insert.closePath();
    clothUV(mappedShape(group,insert,m.insert,(z,y,d)=>doorPoint(side,z,y,.0016-d),'door-cloth-insert',.001,()=>.018),'zy',.95,.25).castShadow=false;
    line(group,insert.getSpacedPoints(150).slice(0,-1).map(p=>doorPoint(side,p.x,p.y,.002)),.0012,m.seam,'door-insert-piping',true);
    for(const [opening,name,depth] of [[grab,'inside-handle-recess',.020],[pocket,'door-pocket',.035]] as const){
      const boundary=opening.getSpacedPoints(120).slice(0,-1);
      const center=boundary.reduce((s,p)=>s.add(p),new T.Vector2()).divideScalar(boundary.length);
      const path=new T.SplineCurve([...boundary,boundary[0]]);
      surface(group,(u,v)=>{
        const p=path.getPoint(u).lerp(center,.10*v);return doorPoint(side,p.x,p.y,-depth*v);
      },m.dark,120,12,`${name}-wall`);
      mappedShape(group,opening,m.dark,(z,y)=>doorPoint(side,z,y,-depth),name,0,()=>.014);
      line(group,boundary.map(p=>doorPoint(side,p.x,p.y,.0015)),.0028,shellMaterial,`${name}-lip`,true);
    }
    line(group,[doorPoint(side,.325,.835,-.002),doorPoint(side,.379,.842,-.001),doorPoint(side,.448,.835,-.002)],.008,handleMaterial,'inside-door-handle');
    const arm=new T.Shape();arm.moveTo(.360,.731);arm.bezierCurveTo(.188,.750,-.080,.711,-.246,.676);
    arm.quadraticCurveTo(-.283,.657,-.222,.632);arm.bezierCurveTo(-.04,.626,.191,.659,.345,.683);
    arm.quadraticCurveTo(.399,.699,.360,.731);arm.closePath();
    mappedShape(group,arm,handleMaterial,(z,y,d)=>doorPoint(side,z,y,.020-d),'armrest',.025,()=>.012);
    line(group,arm.getSpacedPoints(100).slice(0,-1).map(p=>doorPoint(side,p.x,p.y,.021)),.004,handleMaterial,'armrest-soft-edge',true);
    for(let i=0;i<(side<0?4:1);i++){
      const z=.255-i*.056,y=.718-i*.008,p=doorPoint(side,z,y,.030);
      const key=box(group,[.009,.022,.040],p.toArray() as [number,number,number],m.dark,.005,'window-switch');key.rotation.x=.12;
    }
    const speaker=new T.Group();speaker.position.copy(doorPoint(side,.494,.454,.002));speaker.rotation.y=-side*Math.PI/2;group.add(speaker);
    mesh(speaker,new T.CircleGeometry(.067,64),m.dark,'door-speaker');
    mesh(speaker,new T.TorusGeometry(.069,.0025,10,64),shellMaterial,'speaker-surround');
    const lines:number[]=[];for(let i=-9;i<=9;i++){
      const y=i*.0065,span=Math.sqrt(Math.max(0,.062**2-y*y));lines.push(-span,y,.001,span,y,.001);
    }
    const grid=new T.BufferGeometry();grid.setAttribute('position',new T.Float32BufferAttribute(lines,3));
    speaker.add(new T.LineSegments(grid,new T.LineBasicMaterial({color:'#616b70'})));
  }

  const floor=new T.Group();floor.name='floor-console';parent.add(floor);
  const plan=roundedRect(.230,.690,.100,0,-.030);
  const floorY=(x:number,z:number)=>.359+.029*(z+.03)/.345+.041*Math.sqrt(Math.max(0,1-(x/.14)**4));
  const cupZ=[-.115,-.254];
  for(const z of cupZ){const opening=new T.Path();opening.absarc(0,z,.037,0,Math.PI*2,false);plan.holes.push(opening);}
  mappedShape(floor,plan,shellMaterial,(x,z,d)=>new T.Vector3(x,floorY(x,z)-d,z),'floor-console-skin',.049,()=>.015);
  line(floor,plan.getSpacedPoints(180).slice(0,-1).map(p=>new T.Vector3(p.x,floorY(p.x,p.y)-.002,p.y)),.004,shellMaterial,'floor-console-edge',true);
  for(const z of cupZ){
    const y=floorY(0,z),well=mesh(floor,new T.CylinderGeometry(.037,.034,.032,48,1,true),m.dark,'cup-well');well.position.set(0,y-.016,z);
    const base=mesh(floor,new T.CircleGeometry(.034,48),m.dark,'cup-bottom');base.rotation.x=-Math.PI/2;base.position.set(0,y-.032,z);
    const rim=mesh(floor,new T.TorusGeometry(.038,.002,8,64),handleMaterial,'cup-lip');rim.rotation.x=Math.PI/2;rim.position.set(0,y+.001,z);
  }
  const gate=new T.Shape();gate.absellipse(0,.128,.076,.117,0,Math.PI*2,false,0);
  const slot=new T.Shape();slot.moveTo(-.016,.217);slot.lineTo(.010,.217);slot.lineTo(.010,.172);slot.lineTo(-.003,.172);
  slot.lineTo(-.003,.132);slot.lineTo(.010,.132);slot.lineTo(.010,.052);slot.lineTo(-.012,.052);slot.lineTo(-.012,.142);
  slot.lineTo(-.022,.142);slot.lineTo(-.022,.184);slot.lineTo(-.016,.184);slot.closePath();
  gate.holes.push(new T.Path(slot.getPoints(8)));
  const gateY=(x:number,z:number)=>.431+.10*(z-.128)+.006*Math.sqrt(Math.max(.01,1-(x/.095)**2-((z-.128)/.140)**2));
  const pedestal=new T.Shape();pedestal.absellipse(0,.128,.094,.136,0,Math.PI*2,false,0);
  pedestal.holes.push(new T.Path(slot.getPoints(8)));
  // Pedestal and plate share the same crown and the same open gear slot.
  mappedShape(floor,pedestal,shellMaterial,(x,z,d)=>new T.Vector3(x,gateY(x,z)-.003-d,z),'shift-pedestal',.027,()=>.012);
  mappedShape(floor,gate,handleMaterial,(x,z,d)=>new T.Vector3(x,gateY(x,z)-d,z),'automatic-gate',.003,()=>.010);
  mappedShape(floor,slot,m.dark,(x,z)=>new T.Vector3(x,gateY(x,z)-.010,z),'gear-slot',0,()=>.007);
  surface(floor,(u,v)=>{
    const z=.040+v*.182,x=.035+(.5-u)*.019;return new T.Vector3(x,gateY(x,z)+.0008,z);
  },m.shiftFace,6,24,'gear-positions');
  tube(floor,[[0,gateY(0,.205)-.005,.205],[0,.552,.147],[0,.604,.106]],.008,m.dark,false,'gear-lever');
  softForm(floor,m.dark,'gear-selector',p=>new T.Vector3(spow(p.x,.68)*.035,.605+spow(p.y,.72)*.019,.106+spow(p.z,.72)*.023));
  buildHandbrake(floor,m,shellMaterial);
}

export function buildCabinSeats(parent:T.Object3D,m:CarMaterials){
  const thread=m.fabric.clone();thread.color.set('#556772');thread.map=null;thread.bumpMap=null;
  const shell=m.fabric.clone();shell.color.set('#546771');
  const hardware=m.dark.clone();hardware.color.set('#303a41');hardware.roughness=.88;
  for(const side of [-1,1]){
    const seat=new T.Group();seat.name='front-seat';seat.position.x=side*.365;parent.add(seat);
    const cushionTop=(x:number,z:number)=>{
      const f=Math.max(0,1-(Math.abs(x)/.225)**(2/.60)-(Math.abs(z+.245)/.250)**(2/.55));
      return .515+(.060+.045*(Math.abs(x)/.225)**4)*f**.15;
    };
    softForm(seat,m.fabric,'seat-cushion',p=>{
      const x=spow(p.x,.60)*.225,z=-.245+spow(p.z,.55)*.250;
      return new T.Vector3(x,.515+spow(p.y,.30)*(.060+(p.y>0?.045*(Math.abs(x)/.225)**4:0)),z);
    },64,40);
    const insert=roundedRect(.295,.372,.060,0,-.243);
    clothUV(flipFaces(mappedShape(seat,insert,m.insert,(x,z,d)=>new T.Vector3(x,cushionTop(x,z)+.0013+d,z),'seat-cushion-insert',0,()=>.014)),'xz',.30,.38).castShadow=false;
    line(seat,insert.getSpacedPoints(110).slice(0,-1).map(p=>new T.Vector3(p.x,cushionTop(p.x,p.y)+.0014,p.y)),.0009,thread,'seat-cushion-stitch',true);
    box(seat,[.349,.055,.376],[0,.414,-.268],m.dark,.022,'seat-base');
    const back=new T.Group();back.position.set(0,.807,-.476);back.rotation.x=-.12;seat.add(back);
    const backFace=(x:number,y:number)=>{
      const ny=y/.249,w=.226*(1-.06*(ny+1)),f=Math.max(0,1-(Math.abs(x)/w)**(2/.62)-Math.abs(ny)**(2/.60));
      return .070*f**.20+.029*(Math.abs(x)/w)**4*f**.18+.012*Math.exp(-(((ny+.34)/.46)**2))*f;
    };
    softForm(back,m.fabric,'seat-back',p=>{
      const y=spow(p.y,.60)*.249,w=.226*(1-.06*(y/.249+1)),x=spow(p.x,.62)*w;
      const z=spow(p.z,.40)*.070+(p.z>0?.029*(Math.abs(x)/w)**4*Math.abs(p.z)**.36+.012*Math.exp(-(((y/.249+.34)/.46)**2))*p.z*p.z:0);
      return new T.Vector3(x,y,z);
    },64,40);
    const backInsert=roundedRect(.281,.376,.064,0,-.005);
    clothUV(mappedShape(back,backInsert,m.insert,(x,y,d)=>new T.Vector3(x,y,backFace(x,y)+.001+d),'seat-back-insert',0,()=>.013),'xy',.28,.38).castShadow=false;
    line(back,backInsert.getSpacedPoints(110).slice(0,-1).map(p=>new T.Vector3(p.x,p.y,backFace(p.x,p.y)+.0012)),.0009,thread,'seat-back-stitch',true);
    const rear=(x:number,y:number)=>{
      const w=.226*(1-.06*(y/.249+1)),f=Math.max(0,1-(Math.abs(x)/w)**(2/.62)-Math.abs(y/.249)**(2/.60));
      return -.070*f**.20-.0015;
    };
    const pocket=new T.Shape();
    pocket.moveTo(-.162,.049);pocket.quadraticCurveTo(0,-.004,.162,.049);
    pocket.bezierCurveTo(.164,.004,.158,-.088,.133,-.151);pocket.quadraticCurveTo(0,-.177,-.133,-.151);
    pocket.bezierCurveTo(-.158,-.088,-.164,.004,-.162,.049);pocket.closePath();
    const pocketPoint=(x:number,y:number)=>new T.Vector3(x,y,rear(x,y)-.005*Math.max(0,1-(x/.164)**2)*T.MathUtils.smoothstep(y,-.165,.055));
    clothUV(flipFaces(mappedShape(back,pocket,shell,pocketPoint,'front-seat-map-pocket',0,()=>.018)),'xy',.32,.24);
    line(back,pocket.getSpacedPoints(80).slice(0,-1).map(p=>pocketPoint(p.x,p.y)),.0012,thread,'front-map-pocket-piping',true);
    line(back,Array.from({length:24},(_,i)=>{const p=pocket.curves[0].getPoint(i/23);return pocketPoint(p.x,p.y);}),.0022,shell,'front-map-pocket-hem');
    for(const x of [-.067,.067]){
      rod(seat,[x,1.024,-.506],[x,1.120,-.525],.0055,m.silver,'headrest-post');
      rod(seat,[x,1.037,-.508],[x,1.048,-.511],.010,hardware,'headrest-grommet');
    }
    softForm(seat,m.fabric,'headrest',p=>new T.Vector3(spow(p.x,.70)*.128,1.166+spow(p.y,.66)*.088,-.537+spow(p.z,.76)*.057));
    line(seat,Array.from({length:64},(_,i)=>{
      const a=i/64*Math.PI*2;return new T.Vector3(.127*spow(Math.cos(a),.70),1.166+.087*spow(Math.sin(a),.66),-.535);
    }),.001,thread,'front-headrest-piping',true);
    const adjust=box(seat,[.056,.097,.272],[side*.170,.452,-.322],hardware,.018,'front-seat-side-apron');
    const dial=softForm(adjust,hardware,'front-seat-recline-wheel',p=>{
      const a=Math.atan2(p.y,p.z),r=1+.07*Math.cos(9*a);
      return new T.Vector3(spow(p.x,.65)*.012,p.y*.037*r,p.z*.037*r);
    },32,20);
    dial.position.set(side*.048,.029,-.046);
    rod(dial,[0,0,0],[side*.012,0,0],.020,m.seam,'front-recline-wheel-cap');
    const release=box(adjust,[.020,.033,.068],[side*.030,-.013,-.089],m.trim,.012,'front-seat-release');
    release.rotation.x=-.27;
    buildFrontSeatBelt(parent,m,side);
    box(parent,[.034,.050,.031],[side*.115,.561,-.383],m.dark,.007,'belt-buckle');
    box(parent,[.025,.009,.020],[side*.115,.588,-.383],m.red,.003,'belt-release');
  }
  buildRearCabin(parent,m);
}

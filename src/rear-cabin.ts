import * as T from 'three';
import {box,surface} from './geometry.ts';
import {rod} from './mechanical-geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {carpetY} from './floor-profile.ts';
import {sideSkinX} from './profile.ts';
import {clothUV,flipFaces,line,roundedRect,softForm,spow} from './cabin-upholstery.ts';
import type {CarMaterials} from './materials.ts';
import type {Point} from './geometry.ts';

const smooth=T.MathUtils.smoothstep;
const tubZ=-1.185,tubRadius=.337,tubBase=.290;
const tubTop=(z:number)=>tubBase+Math.sqrt(Math.max(0,tubRadius**2-(z-tubZ)**2));
const rearTread=(x:number,z:number)=>.084+.017*Math.exp(-(((Math.abs(x)-.505)/.13)**2))
  -.009*Math.exp(-(((Math.abs(x)-.315)/.190)**2)-(((z+1.02)/.15)**2));
const cushionTop=(x:number,z:number)=>.547+rearTread(x,z)*Math.max(0,1-(Math.abs(x)/.569)**(2/.55)
  -(Math.abs(z+1.028)/.216)**(2/.57))**.20;
const backWidth=(y:number)=>.626*(1-.069*smooth(y,.89,1.061));
const backZ=(y:number)=>-1.267-.040*(y-.839)/.213;
const backDepth=(x:number,y:number)=>.074+.026*(Math.abs(x)/backWidth(y))**3
  -.005*Math.exp(-(((Math.abs(x)-.325)/.18)**2)-(((y-.859)/.14)**2));
const backFace=(x:number,y:number)=>backZ(y)+backDepth(x,y)*Math.max(0,1-(Math.abs(x)/backWidth(y))**(2/.58)
  -(Math.abs(y-.839)/.213)**(2/.55))**.24;

export function buildRearCabin(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='rear-cabin';parent.add(group);
  const bench=new T.Group();bench.name='rear-bench';group.add(bench);
  const molded=m.dash.clone();molded.color.set('#59656c');molded.roughness=.91;
  const carpet=m.fabric.clone();carpet.color.set('#3d494f');carpet.roughness=1;
  const plastic=m.dark.clone();plastic.color.set('#303a40');plastic.roughness=.88;
  const belt=m.fabric.clone();belt.color.set('#283039');belt.roughness=.95;
  const stitch=m.fabric.clone();stitch.color.set('#536872');stitch.map=null;stitch.bumpMap=null;
  const red=m.red.clone();red.color.set('#b13936');red.emissiveIntensity=0;red.clearcoat=0;red.roughness=.68;

  softForm(bench,m.fabric,'rear-seat-cushion',p=>{
    const x=spow(p.x,.55)*.569,z=-1.028+spow(p.z,.57)*.216;
    return new T.Vector3(x,.547+spow(p.y,.40)*(p.y>0?rearTread(x,z):.080),z);
  },64,40);
  softForm(bench,m.fabric,'rear-seat-back',p=>{
    const y=.839+spow(p.y,.55)*.213,x=spow(p.x,.58)*backWidth(y);
    return new T.Vector3(x,y,backZ(y)+spow(p.z,.48)*(p.z>0?backDepth(x,y):.061));
  },64,40);

  // Each sculpted insert is evaluated on the same upholstery profile as
  // its foam shell. The deep U-shaped seam follows the early XP10 pattern.
  for(const side of [-1,1]){
    const pad=new T.Shape();
    pad.moveTo(side*.078,-1.181);pad.bezierCurveTo(side*.244,-1.196,side*.474,-1.196,side*.514,-1.141);
    pad.bezierCurveTo(side*.550,-1.083,side*.532,-.957,side*.472,-.910);
    pad.bezierCurveTo(side*.395,-.861,side*.187,-.852,side*.125,-.890);
    pad.bezierCurveTo(side*.072,-.927,side*.052,-1.066,side*.078,-1.181);pad.closePath();
    const cushion=(x:number,z:number)=>new T.Vector3(x,cushionTop(x,z)+.0015,z);
    clothUV(flipFaces(mappedShape(bench,pad,m.insert,cushion,'rear-cushion-insert',0,()=>.015)),'xz',.40,.34).castShadow=false;
    seam(bench,pad,cushion,stitch,'rear-cushion-seam');
    const panel=new T.Shape();
    panel.moveTo(side*.071,1.011);panel.bezierCurveTo(side*.168,1.031,side*.431,1.032,side*.504,1.000);
    panel.bezierCurveTo(side*.556,.973,side*.548,.855,side*.501,.787);
    panel.bezierCurveTo(side*.426,.706,side*.208,.704,side*.117,.766);
    panel.bezierCurveTo(side*.059,.801,side*.051,.954,side*.071,1.011);panel.closePath();
    const back=(x:number,y:number)=>new T.Vector3(x,y,backFace(x,y)+.0016);
    clothUV(mappedShape(bench,panel,m.insert,back,'rear-back-insert',0,()=>.014),'xy',.46,.34).castShadow=false;
    seam(bench,panel,back,stitch,'rear-back-seam');

    const x=side*.385;
    for(const offset of [-.052,.052]){
      rod(bench,[x+offset,1.023,-1.293],[x+offset,1.086,-1.296],.0054,m.silver,'rear-headrest-post');
      rod(bench,[x+offset,1.029,-1.293],[x+offset,1.042,-1.294],.010,plastic,'rear-headrest-grommet');
    }
    softForm(bench,m.fabric,'rear-headrest',p=>new T.Vector3(x+spow(p.x,.68)*.131,1.117+spow(p.y,.65)*.078,-1.297+spow(p.z,.72)*.048),36,24);
    line(bench,Array.from({length:56},(_,i)=>{
      const a=i/56*Math.PI*2;return new T.Vector3(x+.130*spow(Math.cos(a),.68),1.117+.0775*spow(Math.sin(a),.65),-1.294);
    }),.001,stitch,'rear-headrest-piping',true);

    const lx=side*.518,ly=.990;
    const release=box(bench,[.028,.022,.026],[lx,ly,backFace(lx,ly)+.003],plastic,.007,'rear-fold-latch');
    box(release,[.017,.004,.012],[0,.011,0],m.trim,.002,'rear-latch-button');
    box(bench,[.047,.052,.083],[side*.469,.463,-1.151],plastic,.011,'rear-seat-hinge');
    const receiver=new T.Group();receiver.position.set(side*.133,.630,-1.148);receiver.rotation.set(.35,0,side*.14);bench.add(receiver);
    box(receiver,[.018,.052,.014],[0,-.018,0],belt,.003,'rear-buckle-stalk');
    box(receiver,[.034,.039,.031],[0,.010,0],plastic,.008,'rear-belt-buckle');
    box(receiver,[.025,.007,.021],[0,.029,.003],red,.003,'rear-buckle-release');
    box(receiver,[.017,.006,.002],[0,.014,.0155],m.dark,.001,'rear-buckle-slot');
  }
  line(bench,Array.from({length:30},(_,i)=>{
    const y=.661+i/29*.373;return new T.Vector3(.034,y,backFace(.034,y)+.0007);
  }),.0015,stitch,'rear-split-seat-seam');
  const rearFacing=roundedRect(1.02,.339,.059,0,.829);
  const backRear=(x:number,y:number)=>{
    const f=Math.max(0,1-(Math.abs(x)/backWidth(y))**(2/.58)-(Math.abs(y-.839)/.213)**(2/.55));
    return new T.Vector3(x,y,backZ(y)-.061*f**.24-.0017);
  };
  clothUV(flipFaces(mappedShape(bench,rearFacing,carpet,backRear,'rear-seat-cargo-facing',0,()=>.025)),'xy',.65,.39).castShadow=false;

  for(const side of [-1,1])buildQuarter(group,m,side,molded,carpet,plastic,belt);
  const shelf=new T.Shape();
  shelf.moveTo(-.616,1.333);shelf.quadraticCurveTo(0,1.305,.616,1.333);
  shelf.quadraticCurveTo(.628,1.478,.565,1.561);shelf.quadraticCurveTo(0,1.619,-.565,1.561);
  shelf.quadraticCurveTo(-.628,1.478,-.616,1.333);shelf.closePath();
  const shelfPoint=(x:number,q:number,d=0)=>new T.Vector3(x,.845+.021*(q-1.333)+d,-q);
  clothUV(mappedShape(group,shelf,carpet,shelfPoint,'parcel-shelf',.018,()=>.039),'xz',.66,.38);
  seam(group,shelf,(x,q)=>shelfPoint(x,q,.015),plastic,'rear-parcel-shelf-edge',.003);
  box(group,[.127,.012,.027],[0,.868,-1.521],m.rubber,.005,'rear-shelf-pull');

  const hatch=new T.Shape();
  hatch.moveTo(-.610,.477);hatch.quadraticCurveTo(-.684,.558,-.641,.747);hatch.quadraticCurveTo(-.653,.914,-.568,.952);
  hatch.quadraticCurveTo(0,.982,.568,.952);hatch.quadraticCurveTo(.653,.914,.641,.747);
  hatch.quadraticCurveTo(.684,.558,.610,.477);hatch.quadraticCurveTo(0,.420,-.610,.477);hatch.closePath();
  const hatchPoint=(x:number,y:number,d=0)=>new T.Vector3(x,y,-1.624+.023*(Math.abs(x)/.68)**3+.012*Math.exp(-(((y-.74)/.17)**2))+d);
  mappedShape(group,hatch,molded,hatchPoint,'hatch-inner-trim',.012,()=>.034);
  seam(group,hatch,(x,y)=>hatchPoint(x,y,.013),plastic,'hatch-inner-seal',.0045);
  box(group,[.146,.042,.017],[.361,.889,-1.594],plastic,.011,'hatch-pull-recess');
  box(group,[.108,.012,.016],[.361,.887,-1.580],molded,.005,'hatch-pull-grip');
  box(group,[.110,.021,.026],[0,.456,-1.610],plastic,.007,'hatch-latch-cover');
  box(group,[.045,.014,.014],[0,.464,-1.594],m.silver,.004,'hatch-striker');
  const cargo=roundedRect(1.066,.279,.055,0,1.477);
  clothUV(mappedShape(group,cargo,carpet,(x,q)=>new T.Vector3(x,Math.max(.420,carpetY(x,-q))+.005,-q),'rear-luggage-carpet',0,()=>.033),'xz',.63,.35);
}

function seam(parent:T.Object3D,shape:T.Shape,map:(x:number,y:number)=>T.Vector3,material:T.Material,name:string,radius=.0011){
  return line(parent,shape.getSpacedPoints(70).slice(0,-1).map(p=>map(p.x,p.y)),radius,material,name,true);
}

function buildQuarter(parent:T.Object3D,m:CarMaterials,side:number,molded:T.Material,carpet:T.Material,plastic:T.Material,belt:T.Material){
  const group=new T.Group();group.name=`rear-quarter-${side}`;parent.add(group);
  const card=new T.Shape();
  card.moveTo(-.773,.909);card.bezierCurveTo(-.821,.994,-1.087,1.024,-1.246,.996);
  card.bezierCurveTo(-1.359,.985,-1.533,.946,-1.610,.858);card.quadraticCurveTo(-1.636,.813,-1.617,.566);
  card.quadraticCurveTo(-1.609,.447,-1.551,.432);card.bezierCurveTo(-1.325,.425,-.970,.405,-.825,.411);
  card.quadraticCurveTo(-.756,.418,-.754,.511);card.lineTo(-.751,.829);card.quadraticCurveTo(-.752,.887,-.773,.909);card.closePath();
  const lip=(z:number,y:number)=>Math.min(sideSkinX(z,y)-.026,
    .756-.074*Math.exp(-(((y-.743)/.156)**2))-.013*Math.exp(-(((y-.898)/.08)**2)));
  const quarterX=(z:number,y:number)=>T.MathUtils.lerp(Math.min(lip(z,y),.564),lip(z,y),
    smooth(y,tubTop(z)+.017,tubTop(z)+.144)*(1-.70*Math.exp(-(((y-.436)/.071)**2))));
  const point=(z:number,y:number,d=0)=>new T.Vector3(side*(quarterX(z,y)-d),y,z);
  const face=(shape:T.Shape,material:T.Material,map:(z:number,y:number,d:number)=>T.Vector3,name:string,thickness=0,step=.022)=>{
    const result=mappedShape(group,shape,material,map,name,thickness,()=>step);
    return side<0?flipFaces(result):result;
  };
  const pocket=roundedRect(.105,.033,.015,-.901,.797),opening=pocket.getPoints(18);
  card.holes.push(new T.Path(opening));
  face(card,molded,(z,y,d)=>point(z,y,d),'rear-quarter-card',.010,.030);
  seam(group,card,(z,y)=>point(z,y,.010),plastic,'rear-quarter-panel-seal',.003);
  const insert=new T.Shape();
  insert.moveTo(-.799,.919);insert.bezierCurveTo(-.871,.973,-1.148,.974,-1.241,.932);
  insert.bezierCurveTo(-1.303,.894,-1.287,.807,-1.231,.758);insert.bezierCurveTo(-1.159,.713,-.960,.694,-.869,.746);
  insert.bezierCurveTo(-.806,.778,-.787,.878,-.799,.919);insert.closePath();
  insert.holes.push(new T.Path(opening));
  clothUV(face(insert,m.insert,(z,y)=>point(z,y,.0118),'rear-quarter-cloth-insert'),'zy',.46,.27).castShadow=false;
  seam(group,insert,(z,y)=>point(z,y,.012),plastic,'rear-quarter-insert-piping',.0018);
  const pocketBase=(y:number)=>-.007+.005*T.MathUtils.smoothstep(y,.782,.812);
  const pocketTaper=(p:T.Vector2,v:number)=>new T.Vector2(-.901+(p.x+.901)*(1-.15*v),.797+(p.y-.797)*(1-.24*v));
  const pocketBottom=new T.Shape(opening.map(p=>pocketTaper(p,1)));
  face(pocketBottom,plastic,(z,y)=>point(z,y,pocketBase(y)),'rear-quarter-pocket',0,.016);
  const pocketPath=new T.SplineCurve(pocket.getSpacedPoints(40));
  const pocketWall=surface(group,(u,v)=>{
    const p=pocketTaper(pocketPath.getPoint(u),v),depth=T.MathUtils.lerp(.012,pocketBase(p.y),v);
    return point(p.x,p.y,depth);
  },plastic,40,3,'rear-quarter-pocket-wall');
  if(side<0)flipFaces(pocketWall);
  seam(group,pocket,(z,y)=>point(z,y,.017),molded,'rear-quarter-pocket-rim',.0048);

  // The inboard cover never enters the wheel cavity. Its top curls outward
  // only above the actual chassis wheelhouse radius.
  const cover=new T.Shape();cover.moveTo(-1.540,.435);cover.bezierCurveTo(-1.489,.469,-1.494,.566,-1.412,.606);
  cover.bezierCurveTo(-1.350,.658,-1.096,.676,-.987,.611);cover.bezierCurveTo(-.932,.583,-.884,.470,-.859,.431);
  cover.quadraticCurveTo(-1.197,.398,-1.540,.435);cover.closePath();
  const cap=(z:number,y:number,d=0)=>new T.Vector3(side*(Math.min(quarterX(z,y)-.015,
    .555+.069*smooth(y,tubTop(z)+.019,tubTop(z)+.061))-.013*Math.exp(-(((z+1.166)/.21)**2)-(((y-.537)/.091)**2))-d),y,z);
  face(cover,molded,cap,'rear-wheel-tub-cover',.004);
  seam(group,cover,(z,y)=>cap(z,y,.004),plastic,'rear-wheel-tub-seam',.0023);
  const mat=roundedRect(.464,.337,.056,side*.352,.694);
  const matPoint=(x:number,q:number)=>new T.Vector3(x,carpetY(x,-q)+.005,-q);
  clothUV(mappedShape(group,mat,carpet,matPoint,'rear-footwell-carpet',0,()=>.028),'xz',.44,.36);
  seam(group,mat,matPoint,m.seam,'rear-mat-binding',.0017);

  const rail=box(group,[.084,.038,.299],[side*.619,.833,-1.465],molded,.014,'rear-shelf-support');rail.rotation.x=.045;
  box(group,[.045,.021,.073],[side*.591,.860,-1.348],plastic,.006,'rear-shelf-hinge');
  const pillar=new T.Shape();
  pillar.moveTo(-1.224,1.002);pillar.bezierCurveTo(-1.184,1.115,-1.191,1.261,-1.120,1.343);
  pillar.quadraticCurveTo(-1.175,1.390,-1.250,1.377);pillar.bezierCurveTo(-1.309,1.306,-1.390,1.209,-1.469,1.080);
  pillar.quadraticCurveTo(-1.484,1.045,-1.479,.970);pillar.quadraticCurveTo(-1.316,.950,-1.224,1.002);pillar.closePath();
  const pillarX=(z:number,y:number)=>Math.min(.745,sideSkinX(z,y)-.038);
  face(pillar,molded,(z,y,d)=>new T.Vector3(side*(pillarX(z,y)-d),y,z),'rear-upper-pillar-trim',.011,.032);
  const gz=-1.412,gy=1.138,gx=pillarX(gz,gy)-.026;
  const guide:Point=[side*gx,gy,gz],anchor:Point=[side*.577,.456,-.869];
  const guideMount=box(group,[.039,.065,.059],[side*(gx+.012),gy+.013,gz],plastic,.009,'rear-belt-guide-mount');guideMount.rotation.x=.15;
  box(group,[.038,.024,.058],guide,molded,.007,'rear-belt-guide');
  box(group,[.036,.039,.043],anchor,plastic,.008,'rear-belt-anchor');
  rod(group,[side*.577,.429,-.869],[side*.577,.461,-.869],.012,m.silver,'rear-belt-floor-bolt');
  const strap=[guide,[side*(gx-.030),1.064,-1.352],[side*.617,.856,-1.173],
    [side*.586,.669,-.993],[side*.577,.524,-.885],anchor] as const;
  ribbon(group,strap,.041,belt,'rear-belt-webbing');
  const tongue=box(group,[.013,.032,.039],[side*.612,.830,-1.146],m.silver,.005,'rear-belt-tongue');
  tongue.rotation.x=-.54;
  box(tongue,[.014,.017,.031],[.001*side,.015,0],plastic,.004,'rear-belt-tongue-guide');
}

function ribbon(parent:T.Object3D,points:readonly Point[],width:number,material:T.Material,name:string){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
  const side=Math.sign(points[0][0]),axis=new T.Vector3(.45*side,.09,.90).normalize();
  return surface(parent,(u,v)=>{
    const t=Math.max(0,Math.min(1,v)),tangent=curve.getTangent(t);
    const across=axis.clone().addScaledVector(tangent,-axis.dot(tangent)).normalize();
    return curve.getPoint(t).addScaledVector(across,(.5-u)*width*side);
  },material,1,44,name);
}

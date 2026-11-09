import * as T from 'three';
import {box,mesh,surface,tube} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {mappedShape} from './shape-mesh.ts';
import {frontCowl,frontPanelPoint,frontWidth} from './profile.ts';

const halfWidth=.755,angleScale=.20;
const endScale=(x:number)=>Math.sqrt(Math.max(.08,1-(x/.79)**8));
const centerZ=(x:number)=>.655+.065*(x/halfWidth)**2;

/** Shared dashboard skin, t is arc length-like rather than a vertical plane. */
export function dashPoint(x:number,t:number,depth=0){
  const a=t/angleScale,s=endScale(x);
  const p=new T.Vector3(x,.804+.208*s*Math.sin(a),centerZ(x)-.245*s*Math.cos(a));
  if(depth){
    const e=1e-5,dx=dashPoint(x+e,t).sub(dashPoint(x-e,t)),dt=dashPoint(x,t+e).sub(dashPoint(x,t-e));
    p.addScaledVector(dt.cross(dx).normalize(),depth);
  }
  return p;
}
const dashT=(x:number,y:number)=>angleScale*Math.asin(T.MathUtils.clamp((y-.804)/(.208*endScale(x)),-.9999,.9999));
const dashFace=(x:number,y:number,depth=0)=>dashPoint(x,dashT(x,y),depth);

// The upper deck reaches inside the existing bonnet thickness, just below
// the windshield frame. The old circular rear return fell away before here.
const cowlY=frontCowl.y-.004,cowlHalfWidth=frontWidth(cowlY)-.012;
const cowlZ=(x:number)=>frontPanelPoint(x,cowlY).z-.009;
function deckY(x:number,z:number){
  const center=centerZ(x),crown=.804+.208*endScale(x);
  if(z<=center)return .804+.208*endScale(x)*Math.sqrt(Math.max(0,1-((z-center)/.245)**2));
  return T.MathUtils.lerp(crown,cowlY,T.MathUtils.smoothstep(z,center,cowlZ(x)));
}
function cowlDeckPoint(r:number,t:number){
  const width=T.MathUtils.lerp(halfWidth,cowlHalfWidth,T.MathUtils.smootherstep(t,0,1)),x=r*width;
  const z=T.MathUtils.lerp(centerZ(x),cowlZ(x),t);
  return new T.Vector3(x,deckY(x,z),z);
}

function roundedRect(cx:number,cy:number,w:number,h:number,r:number){
  const s=new T.Shape(),l=cx-w/2,b=cy-h/2;
  s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);
  s.lineTo(l+w,b+h-r);s.quadraticCurveTo(l+w,b+h,l+w-r,b+h);
  s.lineTo(l+r,b+h);s.quadraticCurveTo(l,b+h,l,b+h-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);s.closePath();return s;
}
function curveLine(parent:T.Object3D,points:T.Vector3[],radius:number,material:T.Material,name:string,closed=false){
  return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points,closed,'centripetal'),Math.max(48,points.length*2),radius,10,closed),material,name);
}
function reverseSurface(object:T.Mesh){
  const geometry=object.geometry,index=geometry.index!,normals=geometry.getAttribute('normal');
  for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
  for(let i=0;i<normals.count;i++)normals.setXYZ(i,-normals.getX(i),-normals.getY(i),-normals.getZ(i));
  return object;
}

const vents=[[-.610,.924],[-.290,.929],[.290,.929],[.610,.924]] as const;
function ventOutline(x:number,y:number,r=.043){
  const t=dashT(x,y),s=new T.Shape();s.absellipse(x,t,r,r*.96,0,Math.PI*2,false,0);return s;
}
function buildVent(parent:T.Object3D,x:number,y:number,m:CarMaterials,trim:T.Material){
  const group=new T.Group();group.name='round-air-vent';parent.add(group);const t=dashT(x,y);
  const at=(a:number,r:number,d:number)=>dashPoint(x+r*Math.cos(a),t+r*.96*Math.sin(a),d);
  // The body opening, rolled lip and recessed duct share this exact boundary.
  surface(group,(u,v)=>{
    const a=u*Math.PI*2,b=v*Math.PI*2,r=.043+.0034*Math.cos(b);
    return at(a,r,.0018+.0034*Math.sin(b));
  },trim,80,16,'vent-bezel',true);
  surface(group,(u,v)=>at(u*Math.PI*2,.0406-.003*v,-.027*v),m.dark,80,12,'vent-well',true);
  const back=new T.Shape();back.absellipse(x,t,.039,.039*.96,0,Math.PI*2,false,0);
  mappedShape(group,back,m.dark,(a,b)=>dashPoint(a,b,-.027),'vent-back',0,()=>.010);
  for(let i=-2;i<=2;i++){
    const v=i*.012,span=Math.sqrt(.037**2-v*v),points:T.Vector3[]=[];
    for(let j=0;j<=12;j++)points.push(dashPoint(x-span+2*span*j/12,t+v*.96,-.005));
    curveLine(group,points,.0023,m.dash,'vent-louvre');
  }
  curveLine(group,[dashPoint(x-.010,t,-.002),dashPoint(x+.010,t,-.002)],.0035,trim,'vent-adjuster');
}

const fasciaZ=(x:number,y:number)=>.291+.207*((y-.54)/.475)**2-.011*(1-(x/.22)**2);
function fasciaPoint(x:number,y:number,d=0){return new T.Vector3(x,y,fasciaZ(x,y)-d);}
function fasciaFrame(parent:T.Object3D,shape:T.Shape,material:T.Material,name:string,depth=.003){
  return mappedShape(parent,shape,material,(x,y,d)=>fasciaPoint(x,y,depth-d),name,.006,()=>.009);
}
function decal(parent:T.Object3D,x:number,y:number,w:number,h:number,material:T.Material,name:string,depth=.006){
  return surface(parent,(u,v)=>fasciaPoint(x+w*(.5-u),y+h*(v-.5),depth),material,28,12,name,true);
}
function fasciaAttachment(parent:T.Object3D,x:number,y:number){
  const g=new T.Group(),e=1e-5,n=new T.Vector3(0,(fasciaZ(x,y+e)-fasciaZ(x,y-e))/(2*e),-1).normalize();
  g.position.copy(fasciaPoint(x,y,.007));g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);parent.add(g);return g;
}

export function buildDashboard(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='dashboard';parent.add(group);
  const upper=m.dash.clone();upper.color.set('#606b72');upper.roughness=.91;
  const lower=m.trim.clone();lower.color.set('#7b858b');lower.roughness=.85;
  const panelMaterial=lower.clone();panelMaterial.color.set('#858d91');
  const shell=new T.Shape();shell.moveTo(-halfWidth,-Math.PI*angleScale/2);shell.lineTo(halfWidth,-Math.PI*angleScale/2);
  shell.lineTo(halfWidth,Math.PI*angleScale/2);shell.lineTo(-halfWidth,Math.PI*angleScale/2);shell.closePath();
  for(const [x,y] of vents)shell.holes.push(new T.Path(ventOutline(x,y).getPoints(48)));
  const skin=reverseSurface(mappedShape(group,shell,upper,(x,t,d)=>dashPoint(x,t,d),'dashboard-top',0,()=>.018));
  const p=skin.geometry.getAttribute('position'),colors:number[]=[],a=new T.Color('#606b72'),b=new T.Color('#7b858b');
  for(let i=0;i<p.count;i++)colors.push(...a.clone().lerp(b,1-T.MathUtils.smoothstep(p.getY(i),.840,.925)).toArray());
  upper.color.set('white');upper.vertexColors=true;skin.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  // Rear and lower return of the same cross section; the seam is on the hidden firewall side.
  reverseSurface(surface(group,(u,v)=>dashPoint(-halfWidth+2*halfWidth*u,angleScale*(Math.PI/2+Math.PI*v)),lower,100,44,'dashboard-rear-return',true));
  for(const side of [-1,1])surface(group,(u,v)=>{
    const edge=dashPoint(side*halfWidth,angleScale*(u*Math.PI*2));
    return edge.lerp(new T.Vector3(side*.772,.804,centerZ(side*halfWidth)),v);
  },lower,80,12,'dashboard-end-cap');
  const deckMaterial=m.dash.clone();deckMaterial.color.set('#606b72');deckMaterial.roughness=.91;
  const deck=reverseSurface(surface(group,(u,v)=>cowlDeckPoint(2*u-1,v),deckMaterial,128,32,'dashboard-cowl-deck',true));
  deck.receiveShadow=false;
  // Close the forward and side returns too, so a low or oblique cabin view
  // cannot see through the new upper deck into the engine compartment.
  surface(group,(u,v)=>cowlDeckPoint(2*u-1,1).lerp(dashPoint((2*u-1)*halfWidth,Math.PI*angleScale),v),deckMaterial,128,16,'dashboard-cowl-firewall',true);
  for(const side of [-1,1])surface(group,(u,v)=>cowlDeckPoint(side,u).lerp(dashPoint(side*halfWidth,angleScale*(Math.PI/2+u*Math.PI/2)),v),deckMaterial,48,12,'dashboard-cowl-cheek',true);
  for(const [x,y] of vents)buildVent(group,x,y,m,panelMaterial);

  // A low eyebrow grows out of the deck, enclosing a deep, dark oval opening.
  const podFront=.468,podBack=.803;
  const hood=(u:number,v:number)=>{
    const a=u*Math.PI,z=T.MathUtils.lerp(podFront,podBack,v),w=.245*(1-.31*v),x=w*Math.cos(a);
    const height=.151*(1-v*v)*(1-.16*v);
    return new T.Vector3(x,deckY(x,z)+height*Math.sin(a)+.001,z);
  };
  const hoodMaterial=m.dash.clone();hoodMaterial.color.set('#5f6970');
  surface(group,hood,hoodMaterial,96,48,'meter-hood',true);
  const opening=new T.Shape();opening.moveTo(-.215,0);opening.bezierCurveTo(-.217,.080,-.100,.131,0,.131);
  opening.bezierCurveTo(.100,.131,.217,.080,.215,0);opening.quadraticCurveTo(0,-.006,-.215,0);opening.closePath();
  const mouthY=.951;
  mappedShape(group,opening,m.dark,(x,y)=>new T.Vector3(x,mouthY+y,podFront+.046),'meter-recess',.008,()=>.010);
  const lip:T.Vector3[]=[];for(let i=0;i<=96;i++)lip.push(hood(i/96,0));
  curveLine(group,lip,.0042,hoodMaterial,'meter-hood-lip');
  surface(group,(u,v)=>{
    const outer=hood(u,0),inner=new T.Vector3(outer.x*.88,mouthY+(outer.y-mouthY)*.84,podFront+.040);
    return outer.lerp(inner,v);
  },hoodMaterial,96,12,'meter-hood-return',true);
  const display=mesh(group,new T.PlaneGeometry(.292,.056),m.meter,'digital-meter-display');
  display.position.set(0,1.010,podFront+.043);display.rotation.y=Math.PI;
  curveLine(group,[new T.Vector3(-.198,.951,podFront+.010),new T.Vector3(0,.943,podFront+.010),new T.Vector3(.198,.951,podFront+.010)],.004,hoodMaterial,'meter-lower-lip');

  const fascia=new T.Shape();fascia.moveTo(-.198,.972);fascia.quadraticCurveTo(0,.982,.198,.972);
  fascia.bezierCurveTo(.225,.961,.201,.864,.182,.775);fascia.bezierCurveTo(.170,.687,.162,.594,.143,.545);
  fascia.quadraticCurveTo(0,.521,-.143,.545);fascia.bezierCurveTo(-.162,.594,-.170,.687,-.182,.775);
  fascia.bezierCurveTo(-.201,.864,-.225,.961,-.198,.972);fascia.closePath();
  mappedShape(group,fascia,panelMaterial,(x,y,d)=>fasciaPoint(x,y,-d),'center-console',.090,()=>.012);
  const edge=fascia.getSpacedPoints(180).slice(0,-1).map(p=>fasciaPoint(p.x,p.y,.0005));
  curveLine(group,edge,.0035,lower,'center-console-soft-edge',true);
  const radio=roundedRect(0,.916,.287,.074,.012);
  fasciaFrame(group,radio,m.dark,'radio',.004);
  decal(group,0,.917,.258,.054,m.radioFace,'radio-face',.007);
  for(const x of [-.118,.118]){
    const knob=fasciaAttachment(group,x,.915);
    const k=mesh(knob,new T.CylinderGeometry(.011,.013,.010,32),m.dark,'radio-knob');k.rotation.x=Math.PI/2;k.position.z=.004;
  }
  fasciaFrame(group,roundedRect(0,.849,.270,.024,.006),m.dash,'center-switch-strip',.004);
  for(let i=0;i<5;i++)fasciaFrame(group,roundedRect((i-2)*.047,.849,.036,.015,.004),lower,'center-switch',.006);
  const hazard=new T.Shape();hazard.moveTo(-.006,.844);hazard.lineTo(.006,.844);hazard.lineTo(0,.855);hazard.closePath();
  fasciaFrame(group,hazard,m.red,'hazard-symbol',.008);
  decal(group,0,.777,.300,.095,m.hvacFace,'climate-labels',.0035);
  for(const x of [-.100,0,.100]){
    const knob=fasciaAttachment(group,x,.777);
    const ring=mesh(knob,new T.TorusGeometry(.026,.003,12,48),lower,'climate-knob-bezel');ring.position.z=.001;
    const k=mesh(knob,new T.CylinderGeometry(.022,.025,.015,48),m.dash,'climate-knob');k.rotation.x=Math.PI/2;k.position.z=.008;
    box(knob,[.008,.030,.009],[0,0,.017],lower,.004,'climate-grip');
    box(knob,[.002,.005,.0015],[0,.011,.022],m.plate,.0006,'climate-pointer');
  }
  fasciaFrame(group,roundedRect(0,.662,.273,.071,.010),m.dark,'lower-audio',.004);
  decal(group,0,.664,.248,.049,m.audioFace,'lower-audio-face',.008);
  fasciaFrame(group,roundedRect(0,.579,.246,.035,.010),m.dark,'console-cubby',.003);
  curveLine(group,[fasciaPoint(-.106,.561,.006),fasciaPoint(0,.555,.008),fasciaPoint(.106,.561,.006)],.004,lower,'console-cubby-lip');

  // Flush glovebox follows the passenger-side skin, including its bowed seam.
  const glove=new T.Shape();glove.moveTo(.245,.865);glove.bezierCurveTo(.320,.895,.550,.885,.652,.847);
  glove.bezierCurveTo(.668,.818,.642,.723,.593,.694);glove.quadraticCurveTo(.431,.673,.267,.708);
  glove.quadraticCurveTo(.236,.773,.245,.865);glove.closePath();
  mappedShape(group,glove,lower,(x,y,d)=>dashFace(x,y,.0018-d),'glove-box',.004,()=>.010);
  curveLine(group,glove.getSpacedPoints(160).slice(0,-1).map(p=>dashFace(p.x,p.y,.002)),.0012,m.seam,'glove-box-seam',true);
  const latch=roundedRect(.442,.814,.090,.030,.012);
  mappedShape(group,latch,m.dash,(x,y,d)=>dashFace(x,y,.004-d),'glove-box-latch',.003,()=>.008);
  curveLine(group,[dashFace(.414,.819,.009),dashFace(.442,.817,.011),dashFace(.470,.817,.009)],.0035,lower,'glove-box-handle');
  // Narrow demister slots sit on the top deck below the windshield.
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const x=side*(.30+i*.055),z=.780;
    tube(group,[[x-.019,deckY(x-.019,z)+.002,z],[x+.019,deckY(x+.019,z)+.002,z]],.0025,m.dark,false,'demister-slot');
  }
  return group;
}

import * as T from 'three';
import {sampleSurface,surfaceFairer} from './surface-fairing.ts';
import type {SurfaceSample} from './surface-fairing.ts';

type Keys=readonly (readonly [number,number])[];

// C1 interpolation avoids the row-by-row flat spots of smoothstep interpolation.
export function profile(keys:Keys,x:number) {
  if(x<=keys[0][0])return keys[0][1];
  const last=keys.length-1;if(x>=keys[last][0])return keys[last][1];
  let i=0;while(x>keys[i+1][0])i++;
  const a=keys[i],b=keys[i+1],h=b[0]-a[0],t=(x-a[0])/h;
  const slope=(j:number)=>{
    const lo=Math.max(j-1,0),hi=Math.min(j+1,last);
    return (keys[hi][1]-keys[lo][1])/(keys[hi][0]-keys[lo][0]);
  };
  return (2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*h*slope(i)+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*h*slope(i+1);
}

const widths:Keys=[[-1.80,.65],[-1.70,.758],[-1.43,.807],[-.90,.823],[-.20,.824],[.55,.812],[1.10,.815],[1.45,.800],[1.72,.751],[1.82,.66]];
const shoulderHeight=.070,shoulderRadius=.055,shoulderArc=.93;
const roofSideSlope=.396+shoulderRadius/shoulderHeight*shoulderArc**2/Math.sqrt(1-shoulderArc**2);
export function sideSkinX(z:number,y:number) {
  const w=profile(widths,z);
  const sill=.046*Math.exp(-(((y-.235)/.095)**2));
  const shoulder=.014*Math.exp(-(((y-.963)/.075)**2));
  const haunch=.013*(Math.exp(-(((z-1.185)/.23)**2))+Math.exp(-(((z+1.185)/.23)**2)))*Math.exp(-(((y-.53)/.21)**2));
  const lower=w-sill-shoulder+haunch;
  const cabin=w-.014-.198*(y-.97)/.50;
  // Roll just the upper 70 mm of the cabin into the roof. Continue the arc
  // slightly beyond its edge so finite-difference normals keep its tangent.
  const arc=Math.min(.995,Math.max(0,(y-roofEdgeY(z)+shoulderHeight)/shoulderHeight)*shoulderArc);
  const roll=shoulderRadius*(1-Math.sqrt(1-arc*arc));
  return T.MathUtils.lerp(lower,cabin,T.MathUtils.smoothstep(y,.925,1.015))-roll;
}

// Side-reference proportions: a short rising bonnet flows into the swept
// windscreen, rather than ending at the old low, rearward cowl shelf.
export const frontCowl={z:.940,y:1.020,slope:.350};
export const frontWindowAdvance=.100;
const frontEdges:Keys=[[.245,1.635],[.32,1.703],[.49,1.717],[.61,1.709],[.685,1.695],[.75,1.659],[.825,1.581],[.865,1.490],[.935,1.240],[.985,1.040],[frontCowl.y,frontCowl.z]];
const rearEdges:Keys=[[.245,-1.640],[.32,-1.737],[.48,-1.742],[.69,-1.709],[.88,-1.664],[1.0,-1.590]];
export const frontEdge=(y:number)=>y>frontCowl.y?frontCowl.z-(y-frontCowl.y)/frontCowl.slope:profile(frontEdges,y);
export const rearEdge=(y:number)=>profile(rearEdges,y);
export const frontWidth=(y:number)=>sideSkinX(frontEdge(y),y);
export const rearWidth=(y:number)=>sideSkinX(rearEdge(y),y);
export const frontDetailY=(y:number)=>y-.075*T.MathUtils.smoothstep(y,.49,.75);
export function frontZ(x:number,y:number){
  const r=x/frontWidth(y),fade=1-T.MathUtils.smoothstep(y,.960,frontCowl.y);
  return frontEdge(y)+T.MathUtils.lerp(.032*(1-r*r),.093*Math.sqrt(Math.max(0,1-r*r)),fade);
}
const rearCrown=(y:number)=>.085-.050*T.MathUtils.smoothstep(y,.57,.85);
export function rearZ(x:number,y:number){return rearEdge(y)-rearCrown(y)*Math.sqrt(Math.max(0,1-(x/rearWidth(y))**2));}

const frontRoofZ=.17,frontRoofY=1.438,frontRoofSlope=(frontRoofY-1.467)/.27;
const roofEdges:Keys=[[-1.25,1.437],[-1.00,1.458],[-.70,1.473],[-.39,1.474],[-.10,1.467],[frontRoofZ,frontRoofY]];
export function roofEdgeY(z:number){
  if(z<=frontRoofZ)return profile(roofEdges,z);
  // Continue the front tangent into the shoulder reference instead of
  // clamping it at the roof edge, which halved the boundary mesh normals.
  const reach=.10,d=Math.min(z-frontRoofZ,reach),t=d/reach;
  return frontRoofY+frontRoofSlope*reach*(t-t**3+.5*t**4);
}
function roofCrown(r:number,z:number){
  const width=sideSkinX(z,roofEdgeY(z));
  // Match the side's tangent at |r|=1, keeping the original centre height.
  const shoulderCrown=(width/roofSideSlope-.056)/2;
  return (1-r*r)*(.028+shoulderCrown*r**8);
}
function rawRoofPoint(r:number,z:number){
  const y=roofEdgeY(z);return new T.Vector3(r*sideSkinX(z,y),y+roofCrown(r,z),z);
}
export function roofPoint(r:number,z:number){return fairRearCorner(rawRoofPoint(r,z));}
export const aPillar=new T.CubicBezierCurve3(new T.Vector3(frontCowl.z,frontCowl.y,0),new T.Vector3(frontCowl.z-.220,frontCowl.y+.220*frontCowl.slope,0),new T.Vector3(.370,frontRoofY+frontRoofSlope*(.370-frontRoofZ),0),new T.Vector3(frontRoofZ,frontRoofY,0));
export const cPillar=new T.CubicBezierCurve3(new T.Vector3(-1.590,1,0),new T.Vector3(-1.500,1.160,0),new T.Vector3(-1.330,1.360,0),new T.Vector3(-1.250,1.437,0));

function rawWindPoint(r:number,t:number){
  const e=aPillar.getPoint(t),c=1-r*r,blend=T.MathUtils.smootherstep(t,0,1);
  // The crown starts with zero derivative so every width station shares the
  // bonnet's cowl tangent. Both charts also share exactly the same edge.
  return new T.Vector3(r*sideSkinX(e.x,e.y),e.y+roofCrown(r,aPillar.v3.x)*blend,e.x+.032*c*(1-blend));
}
export function windPoint(r:number,t:number){return fairFrontCowl(rawWindPoint(r,t));}
function rawRearWindowPoint(r:number,t:number){
  const e=cPillar.getPoint(t),c=1-r*r;
  // Meet the hatch's curved upper edge exactly, including its outer corners.
  const crown=T.MathUtils.lerp(Math.sqrt(Math.max(0,c)),c,T.MathUtils.smootherstep(t,0,.25));
  return new T.Vector3(r*sideSkinX(e.x,e.y),e.y+roofCrown(r,cPillar.v3.x)*t,e.x-rearCrown(1)*crown*(1-t)-.012*Math.sin(Math.PI*t)*c);
}

type PanelJoin={curve:T.CubicBezierCurve3;edge:number;span:number;faceStart:number};
const bonnetSections=new Map<number,PanelJoin|null>(),rearSections=new Map<number,PanelJoin|null>();
function cachedJoin(cache:Map<number,PanelJoin|null>,key:number,build:(key:number)=>PanelJoin|null){
  if(cache.has(key))return cache.get(key)!;
  const result=build(key);
  // Clear in batches: repeatedly creating an iterator to find the oldest
  // entry scans accumulated Map tombstones during dense mesh generation.
  if(cache.size>=16384)cache.clear();
  cache.set(key,result);return result;
}
function filletCurve(a:T.Vector3,b:T.Vector3,ta:T.Vector3,tb:T.Vector3){
  const handle=a.distanceTo(b)*.40;
  return new T.CubicBezierCurve3(a,a.clone().addScaledVector(ta.normalize(),handle),b.clone().addScaledVector(tb.normalize(),-handle),b);
}
function joinPoint(join:PanelJoin,u:number){
  const c=join.curve;
  // The normal mapper samples just outside each chart. Extend end tangents
  // linearly there so a vanishing fillet never extrapolates a huge cubic.
  if(u<0)return c.v0.clone().addScaledVector(c.v1.clone().sub(c.v0),3*u);
  if(u>1)return c.v3.clone().addScaledVector(c.v3.clone().sub(c.v2),3*(u-1));
  return c.getPoint(u);
}
function bonnetJoin(y:number):PanelJoin|null{
  if(y<=.847||y>=frontCowl.y)return null;
  return cachedJoin(bonnetSections,y,buildBonnetJoin);
}
function buildBonnetJoin(y:number):PanelJoin|null{
  const blend=T.MathUtils.smoothstep(y,.847,.880)*(1-T.MathUtils.smootherstep(y,.945,frontCowl.y));
  if(blend<1e-5)return null;
  const edge=frontEdge(y),span=.045*blend,faceStart=frontWidth(y)-.070*blend,e=1e-5;
  const a=new T.Vector3(sideSkinX(edge-span,y),y,edge-span),b=new T.Vector3(faceStart,y,frontZ(faceStart,y));
  const ta=new T.Vector3((sideSkinX(a.z+e,y)-sideSkinX(a.z-e,y))/(2*e),0,1);
  const tb=new T.Vector3(-1,0,-(frontZ(faceStart+e,y)-frontZ(faceStart-e,y))/(2*e));
  return {curve:filletCurve(a,b,ta,tb),edge,span,faceStart};
}
function rearJoin(t:number):PanelJoin|null{
  if(t<=0||t>=1)return null;
  return cachedJoin(rearSections,t,buildRearJoin);
}
function buildRearJoin(t:number):PanelJoin|null{
  const blend=T.MathUtils.smootherstep(t,0,.24)*(1-T.MathUtils.smootherstep(t,.68,1));
  if(blend<1e-5)return null;
  const edge=cPillar.getPoint(t),span=.055*blend,faceStart=1-.060*blend/sideSkinX(edge.x,edge.y),e=1e-5;
  const a=new T.Vector3(sideSkinX(edge.x+span,edge.y),edge.y,edge.x+span),b=rawRearWindowPoint(faceStart,t);
  const ta=new T.Vector3(-(sideSkinX(a.z+e,a.y)-sideSkinX(a.z-e,a.y))/(2*e),0,-1);
  const tb=rawRearWindowPoint(faceStart-e,t).sub(rawRearWindowPoint(faceStart+e,t));
  return {curve:filletCurve(a,b,ta,tb),edge:edge.x,span,faceStart};
}
function rearParameter(y:number){
  // Invert the monotone cubic without allocating a sampled lookup per vertex.
  const a=-cPillar.v0.y+3*cPillar.v1.y-3*cPillar.v2.y+cPillar.v3.y;
  const b=3*cPillar.v0.y-6*cPillar.v1.y+3*cPillar.v2.y,c=3*(cPillar.v1.y-cPillar.v0.y);
  let t=T.MathUtils.clamp((y-cPillar.v0.y)/(cPillar.v3.y-cPillar.v0.y),0,1);
  for(let i=0;i<5;i++)t-=(((a*t+b)*t+c)*t+cPillar.v0.y-y)/((3*a*t+2*b)*t+c);
  return t;
}

function rawSidePanelPoint(z:number,y:number){
  if(y>.847&&y<frontCowl.y&&z>frontEdge(y)-.045){
    const front=bonnetJoin(y);
    if(front&&z>front.edge-front.span)return joinPoint(front,(z-front.edge+front.span)/(2*front.span));
  }
  if(z<-1.24&&y>cPillar.v0.y&&y<cPillar.v3.y){
    const rear=rearJoin(rearParameter(y));
    if(rear&&z<rear.edge+rear.span)return joinPoint(rear,(rear.edge+rear.span-z)/(2*rear.span));
  }
  return new T.Vector3(sideSkinX(z,y),y,z);
}
export function sidePanelPoint(z:number,y:number){return fairRearCorner(fairFrontCowl(rawSidePanelPoint(z,y)));}
function rawFrontPanelPoint(x:number,y:number){
  const xx=Math.abs(x);
  if(y>.847&&y<frontCowl.y&&xx>frontWidth(y)-.070){
    const join=bonnetJoin(y);
    if(join&&xx>join.faceStart){
      const p=joinPoint(join,1-(xx-join.faceStart)/(2*(frontWidth(y)-join.faceStart)));
      p.x*=x<0?-1:1;return p;
    }
  }
  return new T.Vector3(x,y,frontZ(x,y));
}
export function frontPanelPoint(x:number,y:number){return fairFrontCowl(rawFrontPanelPoint(x,y));}

let frontCowlFairer:((point:T.Vector3)=>T.Vector3)|undefined;
const frontCowlCache=new Map<string,T.Vector3>();
function buildFrontCowlFairer(){
  const samples:SurfaceSample[]=[];
  for(let y=.940;y<1.120;y+=.007){
    let edge=frontEdge(y);
    if(y>frontCowl.y){
      let a=0,b=1;for(let i=0;i<22;i++){const t=(a+b)/2;if(aPillar.getPoint(t).y<y)a=t;else b=t;}
      edge=aPillar.getPoint((a+b)/2).x;
    }
    for(let z=.775;z<Math.min(edge,1.18);z+=.007)sampleSurface(samples,rawSidePanelPoint,z,y,.007,.007,.65);
  }
  for(let y=.940;y<=frontCowl.y;y+=.006)for(let x=.650;x<frontWidth(y);x+=.007)
    sampleSurface(samples,rawFrontPanelPoint,x,y,.007,.006,.65);
  for(let r=.78;r<=1;r+=.010)for(let t=0;t<.23;t+=.012)
    sampleSurface(samples,rawWindPoint,r,t,.010,.012,.65);
  return surfaceFairer(samples,.055,true);
}
function fairFrontCowl(point:T.Vector3){
  if(point.y<.940||point.y>1.135||point.z<.795||point.z>1.085||Math.abs(point.x)<.650)return point;
  const sign=point.x<0?-1:1,p=point.clone();p.x=Math.abs(p.x);
  const center=new T.Vector3(frontWidth(frontCowl.y),frontCowl.y,frontCowl.z),distance=p.distanceTo(center);
  if(distance>=.115)return point;
  const key=`${p.x},${p.y},${p.z}`;let result=frontCowlCache.get(key);
  if(!result){
    const project=frontCowlFairer??=buildFrontCowlFairer();
    result=p.clone().lerp(project(p),1-T.MathUtils.smootherstep(distance,.065,.115));
    if(frontCowlCache.size>=32768)frontCowlCache.clear();frontCowlCache.set(key,result);
  }
  return new T.Vector3(sign*result.x,result.y,result.z);
}
function filletedRearWindowPoint(r:number,t:number){
  const rr=Math.abs(r);
  if(rr>.88){
    const join=rearJoin(t);
    if(join&&rr>join.faceStart){
      const p=joinPoint(join,1-(rr-join.faceStart)/(2*(1-join.faceStart)));
      p.x*=r<0?-1:1;return p;
    }
  }
  return rawRearWindowPoint(r,t);
}
export function rearWindowPoint(r:number,t:number){return fairRearCorner(filletedRearWindowPoint(r,t));}
export function rearPanelPoint(x:number,y:number){return fairRearCorner(new T.Vector3(x,y,rearZ(x,y)));}

type CornerFairer={center:T.Vector3;core:number;outer:number;project:(p:T.Vector3)=>T.Vector3};
let rearCornerFairers:CornerFairer[]|undefined;
const fairingCache=new Map<string,T.Vector3>();
function buildRearCornerFairers(){
  const samples:SurfaceSample[]=[];
  // Area-weighted samples keep the fit independent of mesh triangulation.
  for(let y=.972;y<1.485;y+=.007)for(let z=-1.68;z<-1.07;z+=.007){
    const edge=y<=1?rearEdge(y):cPillar.getPoint(rearParameter(Math.min(y,1.437))).x;
    if(z<edge||y>roofEdgeY(z))continue;
    sampleSurface(samples,rawSidePanelPoint,z,y,.007,.007);
  }
  for(let r=.68;r<1;r+=.011)for(let t=.005;t<1;t+=.014)sampleSurface(samples,filletedRearWindowPoint,r,t,.011,.014);
  for(let r=.68;r<1;r+=.011)for(let z=-1.246;z<-1.07;z+=.007)sampleSurface(samples,rawRoofPoint,r,z,.011,.007);
  const cap=(r:number,y:number)=>new T.Vector3(r*rearWidth(y),y,rearZ(r*rearWidth(y),y));
  for(let r=.68;r<1;r+=.011)for(let y=.973;y<1;y+=.006)sampleSurface(samples,cap,r,y,.011,.006);
  return [
    {center:new T.Vector3(.756,1.014,-1.581),core:.090,outer:.155,radius:.065},
    {center:new T.Vector3(.584,1.437,-1.25),core:.090,outer:.145,radius:.075},
  ].map(({center,core,outer,radius})=>({center,core,outer,project:surfaceFairer(samples.filter(s=>s.point.distanceTo(center)<outer+radius),radius)}));
}
function fairRearCorner(point:T.Vector3){
  if(point.z> -1.10||point.z< -1.75||point.y<.974||point.x*point.x<.42**2)return point;
  const sign=point.x<0?-1:1,p=point.clone();p.x=Math.abs(p.x);
  const corners=rearCornerFairers??=buildRearCornerFairers();
  const corner=corners.find(c=>p.distanceToSquared(c.center)<c.outer*c.outer);
  if(!corner)return point;
  const weight=(1-T.MathUtils.smootherstep(p.distanceTo(corner.center),corner.core,corner.outer))*T.MathUtils.smootherstep(p.y,.974,1);
  if(weight===0)return point;
  const key=`${p.x},${p.y},${p.z}`;
  let result=fairingCache.get(key);
  if(!result){
    result=p.clone().lerp(corner.project(p),weight);
    if(fairingCache.size>=32768)fairingCache.clear();
    fairingCache.set(key,result);
  }
  return new T.Vector3(sign*result.x,result.y,result.z);
}

export function headlightOutline(){
  const s=new T.Shape();s.moveTo(.367,.727);
  s.bezierCurveTo(.387,.805,.465,.915,.555,.930);
  s.bezierCurveTo(.636,.948,.739,.941,frontWidth(frontDetailY(.921))-.0003,.921);
  for(let i=1;i<=36;i++){const y=.921-(.921-.728)*i/36;s.lineTo(frontWidth(frontDetailY(y))-.0003,y);}
  s.bezierCurveTo(.658,.714,.478,.718,.367,.727);s.closePath();return s;
}
export function headlightWing(){
  const s=new T.Shape();s.moveTo(frontEdge(.653)-.0003,.653);
  s.bezierCurveTo(1.619,.653,1.517,.751,1.484,.813);
  s.quadraticCurveTo(1.475,.851,frontEdge(.846)-.0003,.846);
  for(let i=1;i<=36;i++){const y=.846-(.846-.653)*i/36;s.lineTo(frontEdge(y)-.0003,y);}
  s.closePath();return s;
}
export function tailLightOutline(){
  const s=new T.Shape();s.moveTo(.455,.974);
  s.bezierCurveTo(.528,.995,.701,.995,rearWidth(.974)-.0003,.974);
  for(let i=1;i<=36;i++){const y=.974-(.974-.775)*i/36;s.lineTo(rearWidth(y)-.0003,y);}
  s.quadraticCurveTo(.608,.762,.474,.775);
  s.quadraticCurveTo(.449,.886,.455,.974);s.closePath();return s;
}
export function tailLightWing(){
  const s=new T.Shape();s.moveTo(rearEdge(.974)+.0003,.974);
  s.bezierCurveTo(-1.548,.984,-1.515,.975,-1.500,.954);
  s.quadraticCurveTo(-1.487,.923,-1.510,.866);
  s.quadraticCurveTo(-1.560,.797,rearEdge(.775)+.0003,.775);
  for(let i=1;i<=36;i++){const y=.775+(.974-.775)*i/36;s.lineTo(rearEdge(y)+.0003,y);}
  s.closePath();return s;
}
export function upperGrilleShape(){
  const s=new T.Shape();s.moveTo(-.356,.762);
  s.bezierCurveTo(-.300,.791,-.130,.795,0,.762);
  s.bezierCurveTo(.130,.795,.300,.791,.356,.762);
  s.quadraticCurveTo(.380,.714,.343,.689);s.lineTo(.093,.680);
  s.quadraticCurveTo(0,.641,-.093,.680);s.lineTo(-.343,.689);
  s.quadraticCurveTo(-.380,.714,-.356,.762);s.closePath();return s;
}
export function lowerGrilleShape(){
  const s=new T.Shape();s.moveTo(-.455,.437);s.quadraticCurveTo(0,.448,.455,.437);
  s.quadraticCurveTo(.433,.326,.358,.314);s.quadraticCurveTo(0,.297,-.358,.314);
  s.quadraticCurveTo(-.433,.326,-.455,.437);s.closePath();return s;
}
export function mirroredShape(s:T.Shape,side:number){return new T.Shape(s.getPoints(36).map(p=>new T.Vector2(side*p.x,p.y)));}
function capOutline(width:(y:number)=>number,top:number){
  const s=new T.Shape();s.moveTo(-width(.245),.245);s.lineTo(width(.245),.245);
  for(let i=1;i<=100;i++){const y=.245+(top-.245)*i/100;s.lineTo(width(y),y);}
  s.lineTo(-width(top),top);
  for(let i=99;i>=0;i--){const y=.245+(top-.245)*i/100;s.lineTo(-width(y),y);}
  s.closePath();return s;
}
function cut(s:T.Shape,hole:T.Shape){const p=new T.Path();p.curves=hole.curves;p.autoClose=true;s.holes.push(p);}
export function frontFaceOutline(){
  const s=capOutline(frontWidth,frontCowl.y);
  for(const side of [-1,1])cut(s,new T.Shape(mirroredShape(headlightOutline(),side).getPoints(36).map(p=>new T.Vector2(p.x,frontDetailY(p.y)))));
  for(const shape of [upperGrilleShape(),lowerGrilleShape()])cut(s,new T.Shape(shape.getPoints(36).map(p=>new T.Vector2(p.x,frontDetailY(p.y)))));
  return s;
}
export function rearFaceOutline(){
  const s=capOutline(rearWidth,1.0);
  for(const side of [-1,1])cut(s,mirroredShape(tailLightOutline(),side));
  return s;
}

export function doorWindow(){
  const s=new T.Shape();
  s.moveTo(.800,.966);
  s.bezierCurveTo(.660,1.130,.360,1.350,.125,1.386);
  s.bezierCurveTo(-.020,1.424,-.220,1.432,-.345,1.424);
  s.quadraticCurveTo(-.372,1.424,-.372,1.391);
  s.lineTo(-.377,1.086);
  s.quadraticCurveTo(-.377,1.045,-.337,1.040);
  s.bezierCurveTo(-.050,1.008,.450,.978,.755,.958);
  s.quadraticCurveTo(.794,.954,.800,.966);s.closePath();return s;
}

export function frontDoorOutline(){
  const window=doorWindow(),leading=window.curves[0],top=window.curves[1];
  // The door includes its painted window frame. Keep a continuous 22 mm
  // flange around the current A-pillar instead of a detached seam endpoint.
  const frame=(curve:T.Curve<T.Vector2>,t:number)=>{
    const p=curve.getPoint(t),tangent=curve.getTangent(t);
    return p.add(new T.Vector2(tangent.y,-tangent.x).multiplyScalar(.022));
  };
  const start=frame(leading,0),upperRear=frame(top,1),s=new T.Path();
  s.moveTo(start.x,start.y);s.bezierCurveTo(.800,.82,.781,.49,.730,.300);
  s.quadraticCurveTo(.720,.251,.633,.247);s.bezierCurveTo(.26,.222,-.20,.219,-.374,.252);
  s.quadraticCurveTo(-.464,.257,-.468,.336);s.lineTo(-.443,1.007);s.lineTo(-.425,1.425);
  s.quadraticCurveTo(-.426,1.454,-.391,1.450);
  s.quadraticCurveTo(-.370,1.448,upperRear.x,upperRear.y);
  for(let i=1;i<=48;i++){const p=frame(top,1-i/48);s.lineTo(p.x,p.y);}
  for(let i=1;i<=72;i++){const p=frame(leading,1-i/72);s.lineTo(p.x,p.y);}
  s.closePath();return s;
}

export function quarterWindow(){
  const s=new T.Shape();s.moveTo(-.495,1.421);
  s.bezierCurveTo(-.680,1.422,-.900,1.407,-1.025,1.370);
  s.bezierCurveTo(-1.108,1.335,-1.177,1.185,-1.184,1.098);
  s.quadraticCurveTo(-1.187,1.068,-1.146,1.061);
  s.bezierCurveTo(-.970,1.043,-.755,1.036,-.619,1.044);
  s.quadraticCurveTo(-.581,1.045,-.573,1.082);
  s.lineTo(-.510,1.390);s.quadraticCurveTo(-.505,1.417,-.495,1.421);s.closePath();return s;
}

export const doorHandleAnchor={z:-.310,y:.835,widthScale:1.10};
export function doorHandleOpening(){
  const s=new T.Shape(),p=(u:number,v:number):[number,number]=>[doorHandleAnchor.z+u*doorHandleAnchor.widthScale,doorHandleAnchor.y+v];
  s.moveTo(...p(.076,.004));
  s.bezierCurveTo(...p(.079,.017),...p(.068,.026),...p(.047,.028));
  s.bezierCurveTo(...p(.012,.031),...p(-.052,.028),...p(-.078,.022));
  s.quadraticCurveTo(...p(-.094,.019),...p(-.093,.004));
  s.quadraticCurveTo(...p(-.091,-.010),...p(-.074,-.012));
  s.lineTo(...p(-.056,-.014));
  s.quadraticCurveTo(...p(-.056,-.042),...p(-.037,-.046));
  s.quadraticCurveTo(...p(.010,-.052),...p(.046,-.043));
  s.quadraticCurveTo(...p(.060,-.039),...p(.061,-.014));
  s.quadraticCurveTo(...p(.078,-.010),...p(.076,.004));
  s.closePath();return s;
}

export function sideOutline(){
  const s=new T.Shape();s.moveTo(frontEdge(.245),.245);
  for(let i=1;i<=360;i++){const y=.245+(frontCowl.y-.245)*i/360;s.lineTo(frontEdge(y),y);}
  for(let i=1;i<=36;i++){const p=aPillar.getPoint(i/36);s.lineTo(p.x,p.y);}
  for(let i=1;i<=70;i++){const z=.17-1.42*i/70;s.lineTo(z,roofEdgeY(z));}
  for(let i=95;i>=0;i--){const p=cPillar.getPoint(i/96);s.lineTo(p.x,p.y);}
  for(let i=1;i<=360;i++){const y=1-.755*i/360;s.lineTo(rearEdge(y),y);}
  s.lineTo(-1.527,.245);
  s.bezierCurveTo(-1.524,.438,-1.430,.620,-1.185,.625);
  s.bezierCurveTo(-.944,.625,-.850,.442,-.845,.245);
  s.quadraticCurveTo(0,.205,.845,.245);
  s.bezierCurveTo(.850,.440,.945,.625,1.185,.625);
  s.bezierCurveTo(1.429,.625,1.523,.439,1.527,.245);
  s.closePath();return s;
}

import * as T from 'three';
import {box,surface} from './geometry.ts';
import {rod} from './mechanical-geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {carpetY} from './floor-profile.ts';
import {line,softForm} from './cabin-upholstery.ts';
import type {CarMaterials} from './materials.ts';

export function buildHandbrake(parent:T.Object3D,m:CarMaterials,plastic:T.Material){
  const group=new T.Group();group.name='parking-brake';parent.add(group);
  const plan=new T.Shape();
  // q = -z, so the mapped console's crown faces upwards.
  plan.moveTo(-.098,.333);plan.quadraticCurveTo(-.043,.355,.047,.340);
  plan.quadraticCurveTo(.088,.353,.088,.404);plan.bezierCurveTo(.092,.491,.058,.538,-.001,.543);
  plan.bezierCurveTo(-.067,.546,-.111,.514,-.113,.459);plan.quadraticCurveTo(-.120,.391,-.098,.333);plan.closePath();
  const top=(x:number,z:number)=>.379+.015*Math.exp(-(((x+.035)/.091)**4)-(((z+.422)/.13)**4))
    -.022*T.MathUtils.smoothstep(-z,.472,.547)-.020*(1-T.MathUtils.smoothstep(-z,.343,.399));
  mappedShape(group,plan,plastic,(x,q)=>new T.Vector3(x,top(x,-q),-q),'handbrake-console-crown',0,()=>.019);
  const perimeter=plan.getSpacedPoints(80),curve=new T.SplineCurve(perimeter);
  surface(group,(u,v)=>{
    const p=curve.getPoint(1-u),z=-p.y,carpet=carpetY(p.x,z);
    return new T.Vector3(p.x,T.MathUtils.lerp(top(p.x,z),carpet-.002,v),z);
  },plastic,80,3,'handbrake-console-return');
  line(group,perimeter.slice(0,-1).map(p=>new T.Vector3(p.x,top(p.x,-p.y)-.001,-p.y)),.0027,plastic,'console-return-edge',true);

  const x=-.063,pivotY=.411,pivotZ=-.461;
  const boot=m.rubber.clone();boot.color.set('#252e34');boot.roughness=.92;
  box(group,[.063,.084,.077],[x,.367,pivotZ],m.dark,.010,'handbrake-floor-bracket');
  rod(group,[x-.029,pivotY,pivotZ],[x+.029,pivotY,pivotZ],.013,m.silver,'handbrake-pivot');
  box(group,[.022,.026,.070],[x+.014,.410,pivotZ+.012],m.dark,.007,'handbrake-ratchet');
  const angle=.47,axis=new T.Vector3(0,Math.sin(angle),Math.cos(angle));
  const origin=new T.Vector3(x,pivotY,pivotZ),p=(d:number)=>origin.clone().addScaledVector(axis,d);
  rod(group,p(0).toArray(),p(.163).toArray(),.015,m.dark,'handbrake-lever',.011);
  surface(group,(u,v)=>{
    const a=u*Math.PI*2,fold=Math.sin(v*Math.PI*3)**2*Math.sin(v*Math.PI)*.004;
    const z=pivotZ+.054*Math.cos(a)*(1-.72*v)+v*.029;
    const px=x+(.040*(1-.69*v)+fold)*Math.sin(a);
    return new T.Vector3(px,T.MathUtils.lerp(top(px,z)-.001,.433+.010*Math.cos(a),v),z);
  },boot,42,14,'handbrake-gaiter');
  const grip=softForm(group,boot,'handbrake-grip',p=>new T.Vector3(p.x*.0185,p.y*.0165,Math.sign(p.z)*Math.abs(p.z)**.56*.061),36,22);
  grip.position.copy(p(.153));grip.rotation.x=-angle;
  rod(group,p(.209).toArray(),p(.222).toArray(),.009,m.silver,'handbrake-release',.0085);
  line(grip,Array.from({length:30},(_,i)=>{
    const a=.23+Math.PI*1.54*i/29;
    return new T.Vector3(.0179*Math.cos(a),.0159*Math.sin(a),.045);
  }),.00085,m.seam,'handbrake-grip-cap-seam');
}

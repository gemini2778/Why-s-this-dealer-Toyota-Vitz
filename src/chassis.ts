import * as T from 'three';
import {box,mesh,ellipsoid,surface} from './geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {floorOutline,structuralFloorY} from './floor-profile.ts';
import {rod,pipe,spring,bolt} from './mechanical-geometry.ts';
import {buildEngine} from './engine.ts';
import type {CarMaterials} from './materials.ts';

export function buildChassis(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='chassis';parent.add(group);
  const coated=new T.MeshStandardMaterial({color:'#424c50',metalness:.20,roughness:.86,side:T.DoubleSide});
  const steel=new T.MeshStandardMaterial({color:'#333b40',metalness:.56,roughness:.62,side:T.DoubleSide});
  const alloy=new T.MeshStandardMaterial({color:'#969c9b',metalness:.67,roughness:.49,side:T.DoubleSide});
  const exhaustMetal=new T.MeshStandardMaterial({color:'#969084',metalness:.65,roughness:.59,side:T.DoubleSide});
  const pan=mappedShape(group,floorOutline(),coated,(x,z,d)=>new T.Vector3(x,structuralFloorY(x,z)-d,z),'formed-floor-pan',.025,()=>.065);pan.receiveShadow=false;
  const firewall=new T.Shape([new T.Vector2(-1,.2335),new T.Vector2(1,.2335),new T.Vector2(1,1.0065),new T.Vector2(-1,1.0065)]);
  mappedShape(group,firewall,coated,(r,y,d)=>new T.Vector3(r*(.585+.120*T.MathUtils.smoothstep(y,.36,.44)),y,.884+d),'structural-firewall',.026,()=>.060);
  // Stamped channels, box sills and crossmembers run with the complete floor.
  for(const side of [-1,1]){
    box(group,[.083,.084,1.65],[side*.701,.255,-.002],coated,.018,'boxed-sill');
    pipe(group,[[side*.47,.226,-1.60],[side*.48,.273,-1.28],[side*.48,.273,-.86],[side*.48,.227,.30],[side*.47,.247,.91],[side*.47,.247,1.57]],.032,coated,'longitudinal-rail');
    for(const x of [.24,.40,.56]){
      const points=[];for(let i=0;i<=12;i++){const z=-.69+i*.10;points.push([side*x,structuralFloorY(side*x,z)-.028,z] as const);}
      pipe(group,points,.009,coated,'floor-stamping-rib');
    }
  }
  for(const z of [-1.52,-.57,-.12,.44]){
    const y=structuralFloorY(.35,z)-.044;
    box(group,[1.16,.039,.075],[0,y,z],coated,.012,'floor-crossmember');
  }
  box(group,[1.23,.032,.30],[0,.236,1.515],coated,.022,'front-undertray');
  for(const side of [-1,1]){
    box(group,[.142,.028,.53],[side*.511,.239,1.120],coated,.015,'engine-splash-guard');
    for(const z of [.94,1.46,1.61])bolt(group,[side*.51,.218,z],alloy,.010).rotation.x=Math.PI;
  }
  // Opaque wheel tubs join the floor at the inboard tire wall. The outer body
  // and its approved wheel arch silhouette remain separate and unchanged.
  for(const side of [-1,1])for(const z of [-1.185,1.185]){
    surface(group,(u,v)=>{
      const a=u*Math.PI;return new T.Vector3(side*(.590+.175*v),.29+.337*Math.sin(a),z+.337*Math.cos(a));
    },coated,64,8,'wheelhouse-roof',true);
    const shape=new T.Shape();shape.moveTo(-.337,0);shape.absarc(0,0,.337,Math.PI,0,true);shape.lineTo(-.337,0);shape.closePath();
    mappedShape(group,shape,coated,(q,y)=>new T.Vector3(side*.590,.29+y,z+q),'wheelhouse-inner-wall',0,()=>.055);
    box(group,[.030,.073,.675],[side*.582,.261,z],coated,.010,'wheelhouse-lower-flange');
  }

  const front=new T.Group();front.name='front-suspension';group.add(front);
  box(front,[1.00,.072,.096],[0,.264,.930],steel,.023,'front-subframe-rear');
  box(front,[.98,.065,.095],[0,.252,1.444],steel,.020,'front-subframe-crossmember');
  for(const side of [-1,1]){
    box(front,[.079,.065,.516],[side*.472,.260,1.187],steel,.020,'subframe-side-rail');
    for(const z of [.930,1.444]){rod(front,[side*.472,.253,z],[side*.472,.325,z],.032,m.rubber,'subframe-bush');bolt(front,[side*.472,.332,z],alloy,.014);}
    const arm=new T.Group();arm.name='front-lower-control-arm';front.add(arm);
    pipe(arm,[[side*.395,.263,.974],[side*.640,.263,1.185],[side*.410,.263,1.378]],.023,steel,'control-arm');
    rod(arm,[side*.395,.263,.974],[side*.410,.263,1.378],.014,steel,'control-arm-web');
    ellipsoid(arm,[side*.640,.267,1.185],[.029,.027,.029],m.rubber,'lower-ball-joint');
    box(front,[.047,.152,.071],[side*.641,.333,1.185],steel,.015,'steering-knuckle');
    rod(front,[side*.620,.352,1.185],[side*.543,.789,1.112],.024,steel,'macpherson-strut');
    rod(front,[side*.556,.710,1.124],[side*.538,.839,1.102],.010,alloy,'strut-piston');
    spring(front,[side*.568,.610,1.142],[side*.543,.789,1.112],.060,.0075,steel,'front-coil-spring');
    rod(front,[side*.568,.597,1.142],[side*.568,.610,1.142],.073,steel,'lower-spring-seat');
    rod(front,[side*.543,.788,1.112],[side*.543,.799,1.112],.072,steel,'upper-spring-seat');
    rod(front,[side*.538,.815,1.102],[side*.538,.850,1.102],.082,coated,'strut-tower');
    // The outboard pressed web seats on the wheel tub and overlaps the top
    // mounting plate, leaving the spring and engine-facing side open.
    box(front,[.024,.230,.063],[side*.602,.716,1.104],coated,.010,'tower-support-web');
    bolt(front,[side*.538,.860,1.102],alloy,.015);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;bolt(front,[side*.538+.060*Math.cos(a),.853,1.102+.060*Math.sin(a)],alloy,.007);}
    rod(front,[side*.652,.29,1.185],[side*.675,.29,1.185],.145,alloy,'front-brake-disc');
    rod(front,[side*.650,.29,1.185],[side*.800,.29,1.185],.047,steel,'front-wheel-hub');
    box(front,[.055,.086,.045],[side*.649,.313,1.300],casting(m),.013,'front-brake-caliper');
    pipe(front,[[side*.648,.360,1.300],[side*.559,.476,1.253],[side*.533,.680,1.095]],.004,m.rubber,'brake-flex-hose');
  }
  rod(front,[-.47,.367,.983],[.47,.367,.983],.023,alloy,'steering-rack');
  for(const side of [-1,1]){
    rod(front,[side*.45,.367,.983],[side*.653,.342,1.143],.009,alloy,'tie-rod');
    for(let i=0;i<7;i++)rod(front,[side*(.355+i*.012),.367,.983],[side*(.360+i*.012),.367,.983],.032,m.rubber,'rack-bellows');
    const innerX=side<0?-.385:.405;
    rod(front,[innerX,.372,1.043],[side*.662,.290,1.185],.014,alloy,'drive-half-shaft');
    for(let i=0;i<6;i++){
      const t=i/6,p=new T.Vector3(innerX,.372,1.043).lerp(new T.Vector3(side*.662,.29,1.185),.76+t*.18);
      rod(front,[p.x-.004,p.y,p.z],[p.x+.004,p.y,p.z],.026+.010*Math.sin(t*Math.PI),m.rubber,'outer-cv-boot');
    }
  }
  rod(front,[-.385,.372,1.043],[.405,.372,1.043],.014,alloy,'intermediate-drive-shaft');
  pipe(front,[[-.62,.31,1.30],[-.49,.31,1.31],[-.40,.32,1.02],[.40,.32,1.02],[.49,.31,1.31],[.62,.31,1.30]],.011,steel,'front-antiroll-bar');

  const rear=new T.Group();rear.name='rear-suspension';group.add(rear);
  box(rear,[1.11,.081,.100],[0,.286,-1.111],steel,.018,'torsion-beam');
  for(const side of [-1,1]){
    pipe(rear,[[side*.534,.296,-.742],[side*.556,.274,-.946],[side*.654,.289,-1.185]],.036,steel,'rear-trailing-arm');
    rod(rear,[side*.509,.296,-.742],[side*.563,.296,-.742],.044,m.rubber,'trailing-arm-bush');
    spring(rear,[side*.476,.316,-1.074],[side*.476,.389,-1.074],.061,.006,steel,'rear-coil-spring');
    rod(rear,[side*.476,.318,-1.074],[side*.476,.332,-1.074],.075,steel,'rear-spring-seat');
    rod(rear,[side*.615,.309,-1.247],[side*.597,.543,-1.193],.023,steel,'rear-damper');
    rod(rear,[side*.597,.520,-1.198],[side*.588,.634,-1.172],.009,alloy,'rear-damper-piston');
    box(rear,[.052,.044,.070],[side*.588,.638,-1.172],coated,.009,'rear-shock-mount');
    rod(rear,[side*.633,.29,-1.185],[side*.683,.29,-1.185],.131,steel,'rear-brake-drum');
    rod(rear,[side*.632,.29,-1.185],[side*.800,.29,-1.185],.042,alloy,'rear-wheel-hub');
  }
  box(group,[.680,.110,.310],[.040,.265,-.850],m.dark,.043,'fuel-tank');
  for(const x of [-.19,.27])box(group,[.028,.013,.329],[x,.204,-.850],steel,.004,'fuel-tank-strap');
  pipe(group,[[.35,.28,-.94],[.52,.35,-1.14],[.65,.65,-1.24]],.023,m.rubber,'fuel-filler-pipe');
  for(const x of [.56,.58])pipe(group,[[x,.31,-1.01],[x,.268,-.60],[x,.263,.50],[x,.39,.88]],.003,steel,'underfloor-hard-line');

  const exhaust=new T.Group();exhaust.name='exhaust-system';group.add(exhaust);
  pipe(exhaust,[[0,.334,.961],[0,.238,.867],[-.12,.228,.683],[-.15,.228,.38],[-.18,.226,-.34],[-.40,.228,-.64],[-.43,.239,-1.04],[-.39,.384,-1.16],[-.33,.283,-1.35]],.018,exhaustMetal,'exhaust-pipe');
  rod(exhaust,[-.14,.236,.47],[-.12,.236,.71],.047,exhaustMetal,'catalytic-converter');
  rod(exhaust,[-.18,.230,-.26],[-.17,.230,.08],.040,exhaustMetal,'center-resonator');
  box(exhaust,[.37,.133,.27],[-.30,.260,-1.484],exhaustMetal,.054,'rear-muffler');
  pipe(exhaust,[[-.42,.252,-1.553],[-.44,.224,-1.671],[-.44,.222,-1.735]],.020,exhaustMetal,'muffler-outlet');
  const tip=mesh(exhaust,new T.CylinderGeometry(.021,.021,.12,24,1,true),exhaustMetal,'exhaust');tip.rotation.x=Math.PI/2;tip.position.set(-.44,.222,-1.735);
  const hole=mesh(exhaust,new T.CircleGeometry(.018,24),m.rubber,'exhaust-dark-opening');hole.position.set(-.44,.222,-1.787);hole.rotation.y=Math.PI;
  box(exhaust,[.22,.008,1.02],[-.16,.277,.14],alloy,.012,'exhaust-heat-shield');
  for(const z of [.50,-.18,-1.50])pipe(exhaust,[[-.45,.30,z],[-.48,.26,z],[-.40,.24,z]],.006,steel,'exhaust-hanger');
  buildEngine(group,m);
  group.traverse(o=>{if(o instanceof T.Mesh)o.receiveShadow=false;});
  return group;
}

function casting(m:CarMaterials){const material=m.dark.clone();material.color.set('#6d7477');material.metalness=.6;material.roughness=.60;return material;}

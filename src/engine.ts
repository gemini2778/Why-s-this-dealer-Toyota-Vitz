import * as T from 'three';
import {box,mesh,surface} from './geometry.ts';
import type {Point} from './geometry.ts';
import {pipe,rod,bolt} from './mechanical-geometry.ts';
import {connectedHose,formedPart,socket} from './engine-geometry.ts';
import type {CarMaterials} from './materials.ts';

const blockOutline=[
  [-.274,-.111],[-.292,-.064],[-.281,.109],[-.234,.149],[-.083,.150],
  [-.035,.132],[.215,.141],[.275,.103],[.287,-.060],[.248,-.144],[-.221,-.144],
] as const;
const coverOutline=[
  [-.259,-.165],[-.294,-.133],[-.310,-.068],[-.303,.091],[-.289,.151],
  [-.255,.168],[-.216,.167],[-.199,.145],[-.171,.143],[-.149,.169],
  [-.079,.174],[-.057,.160],[-.027,.161],[-.006,.174],[.062,.173],
  [.088,.153],[.116,.152],[.131,.174],[.199,.174],[.227,.149],
  [.250,.153],[.289,.140],[.310,.093],[.306,.051],[.284,.023],
  [.292,-.092],[.251,-.153],[.104,-.164],[-.039,-.157],[-.164,-.166],
] as const;
const coverRelief=(x:number,z:number)=>
  -.057*T.MathUtils.smoothstep(z,1.278,1.366)
  -.008*T.MathUtils.smoothstep(Math.abs(x+.14),.215,.303)
  -.007*T.MathUtils.smoothstep(1.165-z,.060,.136);

export function buildEngine(parent:T.Object3D,m:CarMaterials){
  const engine=new T.Group();engine.name='engine-1nz-fe';parent.add(engine);
  const alloy=new T.MeshStandardMaterial({color:'#959a97',metalness:.47,roughness:.64});
  const casting=new T.MeshStandardMaterial({color:'#6e7473',metalness:.44,roughness:.77});
  const plastic=new T.MeshStandardMaterial({color:'#333b3d',roughness:.85});
  const coverMaterial=new T.MeshStandardMaterial({color:'#687074',roughness:.83});
  const hoseMaterial=new T.MeshStandardMaterial({color:'#222729',roughness:.93});
  const fluid=new T.MeshStandardMaterial({color:'#c5c2ad',roughness:.51});
  const yellow=new T.MeshStandardMaterial({color:'#d0ac43',roughness:.52});

  formedPart(engine,[-.138,1.210],blockOutline,[
    [.402,0,0],[.402,.79,.83],[.421,.94,.96],[.465,.98,.97],
    [.548,1,.92],[.638,.985,.98],[.669,1,1],[.678,.96,.96],[.678,0,0],
  ],casting,'engine-block');
  formedPart(engine,[-.133,1.209],blockOutline,[
    [.657,0,0],[.657,1.025,1.025],[.665,1.06,1.05],
    [.691,1.025,1.04],[.752,1.04,1.045],[.777,1.015,1.02],[.782,.92,.93],[.782,0,0],
  ],alloy,'cylinder-head');
  formedPart(engine,[-.167,1.224],blockOutline,[
    [.310,0,0],[.310,.58,.60],[.324,.69,.68],[.381,.78,.82],
    [.398,.84,.87],[.412,.84,.88],[.415,.79,.83],[.415,0,0],
  ],m.dark,'engine-oil-pan');
  for(const [x,z] of [[-.355,1.329],[-.244,1.344],[-.131,1.345],[-.012,1.337],[.101,1.324]]){
    rod(engine,[x,.432,z-.023],[x,.651,z],.011,casting,'block-casting-rib',.020);
    bolt(engine,[x,.670,z-.006],m.silver,.008);
  }

  const cover=formedPart(engine,[-.143,1.195],coverOutline,[
    [.783,0,0],[.783,.91,.93],[.787,.986,.985],[.801,1,1],[.831,.989,.996],
    [.852,.956,.968],[.859,.892,.904],[.862,.72,.74],[.862,.42,.45],[.862,0,0],
  ],coverMaterial,'vvt-i-cover',coverRelief);
  surface(cover,(u,w)=>{
    const x=-.310+.342*u,z=1.289-.135*w;
    return new T.Vector3(x,.8632+coverRelief(x,z),z);
  },m.engineMark,24,12,'engine-cover-mark');
  for(const x of [-.362,-.204,-.057,.086]){
    box(cover,[.033,.036,.037],[x,.762,1.351],coverMaterial,.010,'cover-mounting-tab');
    bolt(cover,[x,.782,1.352],m.silver,.008);
    box(engine,[.041,.025,.055],[x,.788,1.061],plastic,.007,'ignition-coil');
  }
  const oilCap:Point=[-.355,.858,1.096];
  rod(engine,[-.355,.838,1.096],oilCap,.038,casting,'oil-filler-neck');
  rod(engine,oilCap,[-.355,.879,1.096],.030,plastic,'oil-filler-cap');
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5;
    box(engine,[.009,.013,.009],[oilCap[0]+.028*Math.cos(a),.871,oilCap[2]+.028*Math.sin(a)],plastic,.003,'oil-cap-grip');
  }

  const intake=new T.Group();intake.name='intake-manifold';engine.add(intake);
  formedPart(intake,[-.083,1.401],[
    [-.252,-.035],[-.276,-.006],[-.247,.042],[-.184,.061],
    [.157,.058],[.251,.037],[.272,-.018],[.231,-.049],[-.143,-.053],
  ],[
    [.465,0,0],[.466,.75,.70],[.477,.93,.92],[.501,1,1],
    [.534,.977,.98],[.551,.83,.83],[.553,0,0],
  ],plastic,'intake-plenum');
  for(const [x,shift,front] of [[-.360,.057,1.463],[-.215,.052,1.487],[-.070,.045,1.486],[.075,.039,1.470]]){
    const headPort:Point=[x,.716,1.349],plenumPort:Point=[x+shift,.521,1.410];
    rod(intake,[x,.716,1.344],[x,.711,1.372],.041,plastic,'intake-runner-flange');
    pipe(intake,[headPort,[x,.671,1.414],[x+.020,.597,front],[x+shift,.550,front-.022],plenumPort],.035,plastic,'intake-runner');
    rod(intake,[x+shift,.515,1.405],[x+shift,.538,1.433],.041,plastic,'intake-runner-socket');
  }
  pipe(engine,[[-.357,.527,1.362],[-.400,.650,1.389],[-.387,.727,1.386]],.005,m.silver,'dipstick-tube');
  const dip=mesh(engine,new T.TorusGeometry(.014,.004,8,28),yellow,'oil-dipstick');
  dip.position.set(-.386,.738,1.386);dip.rotation.y=.38;

  const transaxle=new T.Group();transaxle.name='transaxle';engine.add(transaxle);
  rod(transaxle,[.103,.507,1.205],[.280,.507,1.205],.168,alloy,'bellhousing',.134);
  rod(transaxle,[.124,.507,1.205],[.143,.507,1.205],.174,casting,'bellhousing-flange',.170);
  const gearCase=[
    [-.134,-.095],[-.102,-.160],[.024,-.162],[.085,-.122],[.116,-.056],
    [.119,.067],[.086,.127],[.005,.161],[-.132,.125],
  ] as const;
  formedPart(transaxle,[.390,1.168],gearCase,[
    [.354,0,0],[.355,.76,.75],[.377,.96,.93],[.421,1,1],[.530,1.03,.99],
    [.596,.89,.92],[.628,.70,.76],[.635,.48,.54],[.635,0,0],
  ],alloy,'gearbox-case');
  formedPart(transaxle,[.387,1.161],gearCase,[
    [.340,0,0],[.341,.66,.68],[.354,.80,.82],[.370,.86,.89],[.374,.80,.84],[.374,0,0],
  ],casting,'gearbox-sump');
  for(const [y,s] of [[.413,1.02],[.453,1.06],[.492,1.07],[.530,1.065],[.570,1]]){
    formedPart(transaxle,[.392,1.168],gearCase,[
      [y-.006,s*.95,s*.95],[y-.003,s,s],[y+.003,s,s],[y+.006,s*.95,s*.95],
    ],casting,'gearbox-rib');
  }
  rod(transaxle,[.174,.372,1.043],[.405,.372,1.043],.065,alloy,'differential');
  for(const x of [-.45,.53]){
    box(engine,[.119,.045,.115],[x,.576,1.149],casting,.009,'engine-mount-bracket');
    rod(engine,[x,.535,1.149],[x,.590,1.149],.041,hoseMaterial,'engine-mount-bush');
    rod(engine,[Math.sign(x)*.472,.287,1.187],[x,.545,1.149],.025,casting,'engine-mount-support',.033);
    bolt(engine,[x,.600,1.149],m.silver,.014);
  }
  formedPart(engine,[-.439,1.218],[
    [-.047,-.089],[-.050,.047],[-.042,.101],[.006,.135],[.029,.091],[.038,-.076],[.009,-.127],
  ],[
    [.411,0,0],[.412,.67,.67],[.441,.89,.93],[.522,1,1],[.615,.985,.90],
    [.686,.87,.68],[.747,.71,.57],[.759,.52,.53],[.759,0,0],
  ],alloy,'timing-cover');
  const pulleyCenters=[[-.491,.444,1.229,.065],[-.491,.576,1.390,.052],[-.491,.690,1.185,.040]] as const;
  for(const [x,y,z,r] of pulleyCenters){
    rod(engine,[x-.016,y,z],[x+.015,y,z],r,plastic,'accessory-pulley');
    rod(engine,[x-.022,y,z],[x-.016,y,z],r*.31,m.silver,'pulley-hub');
  }
  for(const x of [-.500,-.507]){
    pipe(engine,[[x,.444,1.162],[x,.637,1.155],[x,.731,1.185],[x,.703,1.225],
      [x,.617,1.425],[x,.550,1.441],[x,.386,1.250],[x,.444,1.162]],.004,hoseMaterial,'accessory-belt');
  }
  rod(engine,[-.466,.576,1.390],[-.343,.576,1.390],.056,casting,'alternator');
  for(const x of [-.465,-.447,-.375,-.351])
    rod(engine,[x,.576,1.390],[x+.013,.576,1.390],.063,alloy,'alternator-end-frame',.059);
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5,y=.576+.056*Math.sin(a),z=1.390+.056*Math.cos(a);
    rod(engine,[-.450,y,z],[-.361,y,z],.007,alloy,'alternator-frame-web');
  }
  rod(engine,[-.430,.527,1.349],[-.422,.508,1.301],.018,alloy,'alternator-mount-ear');

  box(engine,[.40,.142,.061],[-.10,.646,1.001],alloy,.030,'exhaust-heat-shield');
  for(const x of [-.25,-.10,.05])bolt(engine,[x,.720,1.014],casting,.008);
  pipe(engine,[[-.05,.590,.997],[-.03,.482,.964],[0,.334,.961]],.026,casting,'exhaust-downpipe');

  buildEngineServices(engine,m,{alloy,casting,plastic,hoseMaterial,fluid,yellow});
  return engine;
}

type ServiceMaterials = Record<'alloy'|'casting'|'plastic'|'hoseMaterial'|'fluid'|'yellow',T.Material>;

function buildEngineServices(engine:T.Object3D,m:CarMaterials,{alloy,casting,plastic,hoseMaterial,fluid,yellow}:ServiceMaterials){
  const airboxOutline=[
    [-.096,-.086],[-.107,-.046],[-.110,.047],[-.080,.098],[-.008,.115],
    [.071,.096],[.112,.060],[.107,-.036],[.078,-.087],
  ] as const;
  formedPart(engine,[.329,1.045],airboxOutline,[
    [.635,0,0],[.635,.72,.71],[.666,.94,.92],[.713,1,1],
    [.751,1,1],[.768,.89,.89],[.774,.70,.70],[.774,0,0],
  ],plastic,'air-cleaner');
  formedPart(engine,[.329,1.045],airboxOutline,[
    [.727,.995,.995],[.730,1.047,1.045],[.739,1.047,1.045],[.742,1,1],
  ],m.dark,'airbox-case-seam');
  for(const [x,z] of [[.234,1.035],[.421,1.055],[.320,1.140]])
    box(engine,[.024,.025,.020],[x,.732,z],alloy,.004,'airbox-latch');
  for(let i=0;i<5;i++){
    const z=.998+i*.024;
    pipe(engine,[[.259,.771,z],[.312,.777,z+.005],[.389,.767,z+.012]],.0035,plastic,'airbox-rib');
  }
  const airboxOutlet=socket(engine,'airbox-outlet',[.359,.700,1.132],[.386,.683,1.180],.046,plastic);
  rod(engine,[.153,.515,1.410],[.217,.549,1.409],.047,casting,'throttle-to-plenum-flange');
  rod(engine,[.201,.543,1.409],[.264,.571,1.405],.043,alloy,'throttle-body',.039);
  const throttleInlet=socket(engine,'throttle-inlet',[.253,.569,1.405],[.286,.581,1.404],.043,alloy);
  box(engine,[.039,.036,.027],[.240,.606,1.372],plastic,.010,'throttle-actuator');
  connectedHose(engine,'intake-hose',[airboxOutlet,[.427,.644,1.270],[.429,.600,1.364],[.382,.584,1.405],throttleInlet],
    .045,hoseMaterial,alloy,[.36,.41,.46,.51,.56,.61]);

  box(engine,[.197,.176,.263],[.550,.650,1.268],plastic,.014,'battery');
  box(engine,[.205,.016,.274],[.550,.742,1.268],m.dark,.007,'battery-lid');
  box(engine,[.219,.021,.290],[.550,.573,1.268],m.dark,.009,'battery-tray');
  for(const x of [.444,.656]){
    box(engine,[.012,.028,.279],[x,.581,1.268],casting,.004,'battery-tray-lip');
    rod(engine,[x,.569,1.251],[x,.759,1.251],.004,alloy,'battery-hold-down-stud');
    bolt(engine,[x,.763,1.251],alloy,.007);
  }
  box(engine,[.223,.010,.022],[.550,.754,1.251],casting,.004,'battery-clamp');
  rod(engine,[.506,.749,1.164],[.506,.770,1.164],.012,alloy,'battery-positive-post');
  box(engine,[.044,.023,.041],[.506,.768,1.164],m.red,.008,'battery-positive');
  rod(engine,[.609,.748,1.369],[.609,.765,1.369],.012,alloy,'battery-negative');
  box(engine,[.055,.002,.079],[.579,.751,1.312],fluid,.001,'battery-specification-label');
  for(let i=0;i<4;i++)box(engine,[.033,.0015,.002],[.582,.753,1.292+i*.008],plastic,.0006,'battery-label-ink');
  box(engine,[.069,.045,.096],[.473,.679,1.026],plastic,.009,'battery-fusible-link-box');
  const positiveTerminal=socket(engine,'battery-positive-boot',[.506,.769,1.164],[.493,.762,1.139],.010,m.red);
  const fuseTerminal=socket(engine,'fusible-link-boot',[.473,.679,1.063],[.476,.700,1.082],.009,plastic);
  pipe(engine,[positiveTerminal,[.483,.751,1.109],fuseTerminal],.006,hoseMaterial,'battery-cable');
  const negativeTerminal=socket(engine,'battery-negative-lug',[.609,.759,1.369],[.614,.754,1.389],.010,alloy);
  const bodyGround=socket(engine,'body-ground-lug',[.644,.613,1.405],[.632,.642,1.412],.010,alloy);
  pipe(engine,[negativeTerminal,[.625,.722,1.424],bodyGround],.006,hoseMaterial,'battery-ground-cable');
  box(engine,[.038,.037,.081],[.650,.594,1.405],casting,.008,'battery-ground-bracket');

  box(engine,[1.076,.229,.039],[0,.475,1.589],casting,.005,'radiator-core');
  for(let i=0;i<26;i++)
    box(engine,[1.072,.0025,.042],[0,.367+i*.0085,1.590],plastic,.001,'radiator-fin');
  for(const x of [-.550,.550])box(engine,[.032,.272,.059],[x,.476,1.588],alloy,.008,'radiator-end-plate');
  box(engine,[1.088,.044,.063],[0,.612,1.585],plastic,.016,'radiator-header');
  box(engine,[1.088,.038,.063],[0,.346,1.585],plastic,.014,'radiator-tank-lower');
  const shroud=new T.Shape();
  shroud.moveTo(-.427,.361);shroud.lineTo(.418,.361);shroud.quadraticCurveTo(.457,.361,.460,.390);
  shroud.lineTo(.460,.549);shroud.quadraticCurveTo(.459,.601,.413,.604);
  shroud.lineTo(-.426,.604);shroud.quadraticCurveTo(-.463,.603,-.463,.568);
  shroud.lineTo(-.463,.397);shroud.quadraticCurveTo(-.462,.361,-.427,.361);
  const opening=new T.Path();opening.absarc(.069,.483,.113,0,Math.PI*2,true);shroud.holes.push(opening);
  const shroudMesh=mesh(engine,new T.ExtrudeGeometry(shroud,{depth:.009,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:24}),plastic,'radiator-fan-shroud');
  shroudMesh.position.z=1.548;
  const rim=mesh(engine,new T.TorusGeometry(.115,.007,10,48),plastic,'radiator-fan-inlet-rim');rim.position.set(.069,.483,1.545);
  for(const [x,y] of [[-.031,.411],[.170,.411],[.069,.601]])
    rod(engine,[x,y,1.540],[.069,.483,1.540],.006,plastic,'fan-motor-brace');
  rod(engine,[.069,.483,1.524],[.069,.483,1.550],.029,casting,'fan-motor');
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,blade=box(engine,[.027,.071,.006],[.069+.064*Math.sin(a),.483+.064*Math.cos(a),1.553],plastic,.008,'fan-blade');
    blade.rotation.z=-a+.27;
  }
  const upperRadiator=socket(engine,'radiator-upper-nipple',[.183,.611,1.574],[.164,.615,1.545],.024,plastic);
  const headWaterOutlet=socket(engine,'head-water-outlet',[-.119,.701,1.349],[-.110,.683,1.385],.025,alloy);
  connectedHose(engine,'radiator-upper-hose',[upperRadiator,[.109,.644,1.516],[-.020,.656,1.503],[-.081,.672,1.461],headWaterOutlet],.024,hoseMaterial,alloy);
  const lowerRadiator=socket(engine,'radiator-lower-nipple',[-.389,.347,1.573],[-.379,.363,1.538],.020,plastic);
  const waterPumpInlet=socket(engine,'water-pump-inlet',[-.407,.477,1.320],[-.407,.458,1.358],.022,alloy);
  connectedHose(engine,'radiator-lower-hose',[lowerRadiator,[-.359,.384,1.493],[-.376,.417,1.415],waterPumpInlet],.022,hoseMaterial,alloy);
  rod(engine,[.172,.619,1.580],[.172,.652,1.578],.026,alloy,'radiator-neck');
  rod(engine,[.172,.651,1.578],[.172,.662,1.578],.031,yellow,'radiator-cap');
  for(const x of [.143,.201])box(engine,[.015,.008,.018],[x,.656,1.578],yellow,.003,'radiator-cap-tab');

  formedPart(engine,[-.572,1.427],[
    [-.043,-.046],[-.057,-.020],[-.052,.037],[-.027,.063],
    [.035,.058],[.048,.023],[.041,-.047],[.015,-.065],
  ],[
    [.554,0,0],[.555,.66,.71],[.567,.92,.96],[.609,1,1],[.658,.93,.94],
    [.692,.83,.83],[.704,.56,.63],[.704,0,0],
  ],fluid,'coolant-reservoir');
  box(engine,[.107,.017,.122],[-.571,.552,1.425],casting,.008,'coolant-reservoir-cradle');
  rod(engine,[-.571,.690,1.423],[-.571,.716,1.423],.023,fluid,'coolant-filler-neck');
  rod(engine,[-.571,.709,1.423],[-.571,.725,1.423],.027,plastic,'coolant-cap');
  const overflowPort=socket(engine,'radiator-overflow-port',[.151,.637,1.574],[.137,.632,1.551],.008,alloy);
  const overflowReturn=socket(engine,'coolant-reservoir-return',[-.552,.714,1.421],[-.535,.710,1.432],.008,plastic);
  connectedHose(engine,'radiator-overflow-line',[overflowPort,[.071,.621,1.551],[-.258,.619,1.550],[-.462,.643,1.522],overflowReturn],.006,hoseMaterial,alloy);
  for(const x of [-.267,-.050])box(engine,[.015,.015,.020],[x,.618,1.550],plastic,.004,'overflow-line-clip');

  rod(engine,[-.548,.609,.941],[-.548,.609,1.001],.088,plastic,'brake-booster');
  rod(engine,[-.549,.608,.990],[-.549,.608,1.065],.024,alloy,'brake-master-cylinder',.020);
  formedPart(engine,[-.551,1.039],[
    [-.032,-.036],[-.038,.016],[-.029,.043],[.028,.043],[.039,.013],[.027,-.041],
  ],[
    [.625,0,0],[.627,.66,.66],[.646,.91,.92],[.684,1,1],[.693,.83,.87],[.694,0,0],
  ],fluid,'brake-fluid-reservoir');
  rod(engine,[-.551,.688,1.039],[-.551,.708,1.039],.023,plastic,'brake-reservoir-cap');

  const vacuumBooster=socket(engine,'booster-vacuum-port',[-.493,.646,.994],[-.468,.652,1.005],.009,plastic);
  const vacuumIntake=socket(engine,'plenum-vacuum-port',[.116,.533,1.396],[.147,.562,1.364],.009,plastic);
  connectedHose(engine,'booster-vacuum-hose',[vacuumBooster,[-.365,.716,1.009],[-.095,.759,1.011],[.148,.709,1.066],[.159,.618,1.262],vacuumIntake],.008,hoseMaterial,alloy);
  const breather=socket(engine,'cam-cover-breather',[.126,.780,1.172],[.168,.780,1.162],.011,casting);
  const intakeBreather=socket(engine,'intake-breather-port',[.410,.647,1.254],[.385,.669,1.240],.010,plastic);
  connectedHose(engine,'crankcase-breather-hose',[breather,[.226,.765,1.175],[.316,.716,1.200],intakeBreather],.010,hoseMaterial,alloy);
  const pcv=socket(engine,'pcv-valve',[.138,.768,1.097],[.167,.764,1.110],.010,alloy);
  const pcvIntake=socket(engine,'plenum-pcv-port',[.150,.529,1.376],[.182,.552,1.349],.009,plastic);
  connectedHose(engine,'pcv-hose',[pcv,[.202,.710,1.140],[.201,.612,1.248],pcvIntake],.007,hoseMaterial,alloy);
  const loomStart=socket(engine,'loom-main-connector',[.283,.690,1.009],[.261,.711,1.017],.013,plastic);
  const loomEnd=socket(engine,'loom-retaining-boot',[-.385,.757,1.067],[-.359,.761,1.044],.011,plastic);
  pipe(engine,[loomStart,[.151,.751,1.042],[-.100,.763,1.030],loomEnd],.009,hoseMaterial,'engine-harness');
  box(engine,[.038,.040,.031],[.284,.690,1.006],plastic,.006,'loom-junction-bracket');
  for(const x of [-.362,-.204,-.057,.086]){
    const coil=socket(engine,'coil-connector',[x,.788,1.045],[x,.785,1.031],.008,plastic);
    pipe(engine,[coil,[x,.773,1.029],[x+.020,.760,1.034]],.004,hoseMaterial,'coil-branch-wire');
    box(engine,[.020,.019,.023],[x+.020,.762,1.035],plastic,.004,'engine-loom-clip');
  }
  const alternatorTerminal=socket(engine,'alternator-terminal',[-.349,.601,1.383],[-.329,.615,1.372],.010,plastic);
  pipe(engine,[alternatorTerminal,[-.345,.651,1.326],[-.405,.712,1.228],[-.389,.758,1.081],loomEnd],.006,hoseMaterial,'alternator-charge-wire');
}

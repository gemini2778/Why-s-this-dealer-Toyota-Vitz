import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {getViewPose,isCabinView,viewFit} from './camera-views.ts';
import type {ViewName} from './camera-views.ts';
export {getViewPose,isCabinView};
export type {ViewName};

export type LightName='studio'|'night';

export function createStage(container:HTMLElement,update:(delta:number)=>void) {
  const scene=new T.Scene();scene.background=new T.Color('#242c2f');scene.fog=new T.Fog('#242c2f',13,35);
  const camera=new T.PerspectiveCamera(34,1,0.015,70);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=0.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','银色初代 Vitz 三维渲染，可拖动旋转');
  container.append(renderer.domElement);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,0.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  const hemi=new T.HemisphereLight('#e8eff6','#4e5a5a',1.05);scene.add(hemi);
  const key=new T.DirectionalLight('#fff5e5',2.8);key.position.set(3,6,4);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:0.5,far:20});
  key.shadow.normalBias=0.015;key.shadow.bias=-0.0001;key.shadow.radius=3;scene.add(key);
  const rim=new T.DirectionalLight('#cfe4ff',2.1);rim.position.set(-4,3,-4);scene.add(rim);
  const fill=new T.DirectionalLight('#e5eae4',0.9);fill.position.set(-2,3,4);scene.add(fill);
  const underLight=new T.DirectionalLight('#dce7ef',2.1);underLight.position.set(0,-4,2);underLight.visible=false;scene.add(underLight);
  const floorMat=new T.MeshStandardMaterial({color:'#202a2e',roughness:0.87,metalness:0.05});
  const floor=new T.Mesh(new T.PlaneGeometry(100,100),floorMat);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const grid=new T.GridHelper(30,60,'#69786e','#515f60');grid.position.y=-0.001;
  const gm=grid.material as T.LineBasicMaterial;gm.transparent=true;gm.opacity=0.20;scene.add(grid);
  const ringMaterial=new T.MeshBasicMaterial({color:'#b8c97e',transparent:true,opacity:0.37});
  const ring=new T.Mesh(new T.RingGeometry(2.30,2.305,128),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=0.001;scene.add(ring);
  const ticks:number[]=[];
  for(let i=0;i<64;i++) {
    const a=i/64*Math.PI*2,r=i%8===0?2.43:2.37;
    ticks.push(Math.cos(a)*2.32,0.002,Math.sin(a)*2.32,Math.cos(a)*r,0.002,Math.sin(a)*r);
  }
  const tickGeom=new T.BufferGeometry();tickGeom.setAttribute('position',new T.Float32BufferAttribute(ticks,3));
  const tickMarks=new T.LineSegments(tickGeom,new T.LineBasicMaterial({color:'#c3d688',transparent:true,opacity:0.45}));scene.add(tickMarks);
  const modelRoot=new T.Group();scene.add(modelRoot);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=0.08;controls.minDistance=2.4;controls.maxDistance=12;
  controls.maxPolarAngle=Math.PI/2-0.015;controls.autoRotateSpeed=0.7;controls.enablePan=false;
  let transition:{from:T.Vector3;fromTarget:T.Vector3;to:T.Vector3;target:T.Vector3;fromFov:number;fov:number;t:number}|null=null;
  let activeView:ViewName='front',currentFit=1;
  const cabinScale=new T.Vector3(1,1,1),previousCabinScale=new T.Vector3(1,1,1);
  function setCabinScale(scale:T.Vector3){cabinScale.copy(scale);}
  function setView(name:ViewName,animate=true) {
    const view=getViewPose(name,camera.aspect);controls.autoRotate=false;activeView=name;currentFit=viewFit(name,camera.aspect);previousCabinScale.set(1,1,1);
    const inspection=name==='chassis'||name==='engine';
    floor.visible=grid.visible=ring.visible=tickMarks.visible=!inspection;underLight.visible=name==='chassis';
    controls.minDistance=isCabinView(name)?0.05:name==='engine'?.60:2.4;controls.maxDistance=isCabinView(name)?1.6:24;
    controls.minPolarAngle=0;controls.maxPolarAngle=isCabinView(name)||inspection?Math.PI:Math.PI/2-0.015;
    if(animate)transition={from:camera.position.clone(),fromTarget:controls.target.clone(),to:view.position,target:view.target,fromFov:camera.fov,fov:view.fov,t:0};
    else {transition=null;camera.position.copy(view.position);controls.target.copy(view.target);camera.fov=view.fov;camera.updateProjectionMatrix();controls.update();}
  }
  setView('front',false);
  const cancelTransition=()=>{transition=null;};controls.addEventListener('start',cancelTransition);
  function setLighting(name:LightName) {
    const night=name==='night';
    (scene.background as T.Color).set(night?'#091321':'#242c2f');(scene.fog as T.Fog).color.copy(scene.background as T.Color);
    key.color.set(night?'#c4dcff':'#fff5e5');key.intensity=night?1.6:2.8;
    rim.color.set(night?'#8f92ff':'#cfe4ff');rim.intensity=night?3.5:2.1;
    fill.intensity=night?0.35:0.9;hemi.intensity=night?0.5:1.05;
    floorMat.color.set(night?'#121d29':'#202a2e');ringMaterial.color.set(night?'#8998ff':'#b8c97e');
    renderer.toneMappingExposure=night?0.9:0.95;
  }
  function resize(){
    const w=Math.max(container.clientWidth,1),h=Math.max(container.clientHeight,1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setSize(w,h);
    camera.aspect=w/h;
    const nextFit=viewFit(activeView,camera.aspect),view=getViewPose(activeView,camera.aspect);
    if(transition){transition.to.copy(view.position);transition.fov=view.fov;}
    else if(!isCabinView(activeView))camera.position.sub(controls.target).multiplyScalar(nextFit/currentFit).add(controls.target);
    currentFit=nextFit;camera.fov=view.fov;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let previous=performance.now();
  renderer.setAnimationLoop((time:number)=>{
    const delta=Math.min((time-previous)/1000,0.06);previous=time;
    if(document.hidden)return;
    try {update(delta);} catch(error) {renderer.setAnimationLoop(null);throw error;}
    if(transition){
      transition.t=Math.min(transition.t+delta/0.8,1);const t=transition.t*transition.t*(3-2*transition.t);
      camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.target,t);
      camera.fov=T.MathUtils.lerp(transition.fromFov,transition.fov,t);camera.updateProjectionMatrix();
      if(transition.t===1)transition=null;
    }
    if(transition)camera.lookAt(controls.target);
    else {
      if(isCabinView(activeView)){camera.position.divide(previousCabinScale);controls.target.divide(previousCabinScale);}
      controls.update(delta);
      if(isCabinView(activeView)){
        camera.position.multiply(cabinScale);controls.target.multiply(cabinScale);camera.lookAt(controls.target);previousCabinScale.copy(cabinScale);
      }
    }
    renderer.render(scene,camera);renderer.domElement.dataset.rendered='true';
  });
  function dispose(){
    renderer.setAnimationLoop(null);observer.disconnect();controls.removeEventListener('start',cancelTransition);controls.dispose();
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
    scene.traverse(o=>{const object=o as T.Mesh;if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
    materials.forEach(m=>{Object.values(m).forEach(value=>{if(value instanceof T.Texture)textures.add(value);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());environment.dispose();key.shadow.dispose();renderer.dispose();renderer.domElement.remove();
  }
  return {scene,camera,renderer,controls,modelRoot,setView,setLighting,setCabinScale,dispose};
}

import * as T from 'three';
import {createStage,isCabinView} from './scene.ts';
import type {ViewName,LightName} from './scene.ts';
import {createVitz} from './car.ts';
import {createTextures} from './textures.ts';
import {sampleBounce,applyBounce} from './motion.ts';
import {initBgm} from './bgm.ts';
import './style.css';

const $=<E extends HTMLElement>(selector:string)=>document.querySelector<E>(selector)!;
const status=$('#status'),container=$('#stage'),play=$<HTMLButtonElement>('#play');
const amplitude=$<HTMLInputElement>('#amplitude'),speed=$<HTMLInputElement>('#speed'),phaseInput=$<HTMLInputElement>('#phase');
const rotate=$<HTMLButtonElement>('#rotate'),wire=$<HTMLButtonElement>('#wireframe');
const dialog=$<HTMLDialogElement>('#references');
const events=new AbortController(),signal=events.signal;
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
let playing=!preference.matches,phase=0,amount=0.8,hz=1.6,view:ViewName='front';
let wireframe=false;
const viewLabels:Record<ViewName,string>={front:'01 / FRONT THREE-QUARTER',rear:'02 / REAR THREE-QUARTER',side:'03 / SIDE ELEVATION',interior:'04 / INSIDE THE LITTLE VITZ',chassis:'05 / UNDERBODY',engine:'06 / 1NZ-FE ENGINE BAY',rearInterior:'07 / REAR CABIN',cabinDetail:'08 / SEATS & HANDBRAKE'};

function updatePlay(){
  play.setAttribute('aria-pressed',String(playing));play.setAttribute('aria-label',playing?'暂停弹跳':'播放弹跳');
  $('#play-icon').innerHTML=playing?'<path d="M4 3h3v12H4zm7 0h3v12h-3z"/>':'<path d="M5 2.5 15 9 5 15.5z"/>';
  $('#play-label').textContent=playing?'正在弹跳':'暂停观察';
}
function fill(input:HTMLInputElement){input.style.setProperty('--fill',`${(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`);}

try {
  const textures=createTextures(),car=createVitz(textures);
  let readoutTime=0;
  const stage=createStage(container,delta=>{
    if(playing)phase=(phase+delta*hz)%1;
    const pose=sampleBounce(phase,amount);applyBounce(car.root,pose);stage.setCabinScale(car.root.scale);
    phaseInput.value=String(Math.round(phase*1000));fill(phaseInput);
    readoutTime+=delta;
    if(readoutTime>0.08){
      $('#height-value').innerHTML=`${Math.round(pose.height*100)}<span>%</span>`;
      $('#phase-value').textContent=`${String(Math.round(phase*100)).padStart(3,'0')}%`;
      container.dataset.height=pose.height.toFixed(5);container.dataset.phase=phase.toFixed(5);
      readoutTime=0;
    }
  });
  stage.modelRoot.add(car.root);
  initBgm(signal);
  status.textContent='实时渲染';$('#version').textContent=`THREE.JS r${T.REVISION}`;
  container.dataset.camera=view;
  function stopOrbit(){stage.controls.autoRotate=false;rotate.setAttribute('aria-pressed','false');}
  function chooseView(next:ViewName){
    view=next;stopOrbit();
    const inspection=next==='chassis'||next==='engine';car.setMechanicalView(inspection);
    if(isCabinView(next)||inspection){playing=false;phase=0;updatePlay();}
    stage.setView(next,!preference.matches);car.materials.glass.opacity=isCabinView(next)?0.18:0.74;
    container.dataset.camera=next;$('#view-label').textContent=viewLabels[next];
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===next)));
    rotate.disabled=isCabinView(next);
  }
  play.addEventListener('click',()=>{playing=!playing;updatePlay();},{signal});
  document.addEventListener('keydown',e=>{
    const target=e.target as HTMLElement;
    if(e.code==='Space'&&!dialog.open&&!['INPUT','BUTTON','A','TEXTAREA','SELECT'].includes(target.tagName)){
      e.preventDefault();playing=!playing;updatePlay();
    }
  },{signal});
  amplitude.addEventListener('input',()=>{
    amount=Number(amplitude.value)/100;$('#amplitude-value').innerHTML=`${amplitude.value}<span>%</span>`;fill(amplitude);
  },{signal});
  speed.addEventListener('input',()=>{
    hz=Number(speed.value);$('#speed-value').innerHTML=`${hz.toFixed(2)}<span>Hz</span>`;fill(speed);
  },{signal});
  phaseInput.addEventListener('input',()=>{playing=false;phase=Number(phaseInput.value)/1000;updatePlay();fill(phaseInput);},{signal});
  $('#neutral').addEventListener('click',()=>{playing=false;phase=0;updatePlay();stopOrbit();},{signal});
  rotate.addEventListener('click',()=>{
    stage.controls.autoRotate=!stage.controls.autoRotate;rotate.setAttribute('aria-pressed',String(stage.controls.autoRotate));
  },{signal});
  wire.addEventListener('click',()=>{
    wireframe=!wireframe;car.root.traverse(o=>{
      const object=o as T.Mesh;if(!object.isMesh)return;
      for(const material of (Array.isArray(object.material)?object.material:[object.material])){
        if('wireframe' in material)(material as T.MeshStandardMaterial).wireframe=wireframe;
      }
    });
    wire.setAttribute('aria-pressed',String(wireframe));
  },{signal});
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.addEventListener('click',()=>chooseView(button.dataset.view as ViewName),{signal}));
  document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.light as LightName;stage.setLighting(name);car.materials.lamp.emissiveIntensity=name==='night'?1.5:0.04;
    car.materials.red.emissiveIntensity=name==='night'?0.6:0.04;
    document.querySelectorAll<HTMLButtonElement>('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  },{signal}));
  $('#show-refs').addEventListener('click',()=>dialog.showModal(),{signal});
  $('#close-refs').addEventListener('click',()=>dialog.close(),{signal});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}},{signal});
  preference.addEventListener('change',e=>{if(e.matches){playing=false;stopOrbit();stage.setView(view,false);updatePlay();}},{signal});
  fill(amplitude);fill(speed);fill(phaseInput);updatePlay();
  if(import.meta.hot)import.meta.hot.dispose(()=>{events.abort();dialog.close();stage.dispose();});
} catch(error) {
  events.abort();status.classList.add('error');status.textContent='渲染初始化失败，请刷新重试';
  const message=document.createElement('p');message.className='render-error';message.setAttribute('role','alert');
  message.textContent='无法初始化三维渲染。请启用浏览器硬件加速后刷新页面。';container.replaceChildren(message);
  document.querySelectorAll('button,input').forEach(b=>(b as HTMLButtonElement).disabled=true);
  console.error(error);
}

import * as T from 'three';
import {mesh,tube} from './geometry.ts';
import type {Point} from './geometry.ts';
import {mappedShape} from './shape-mesh.ts';
import {sideSkinX,doorHandleAnchor,doorHandleOpening} from './profile.ts';
import type {CarMaterials} from './materials.ts';

type Mapper=(u:number,v:number,depth:number)=>T.Vector3;
type Ring=readonly [scale:number,depth:number];
const contour=(shape:T.Shape)=>{
  const points=shape.getPoints(24);
  if(points[0].equals(points[points.length-1]))points.pop();
  return points;
};

// Rounded, shallow pressed surfaces with an exact perimeter. An optional
// centre closes a cup/cap; without it the same loft forms a rolled trim lip.
function loft(parent:T.Object3D,outline:T.Vector2[],center:T.Vector2,rings:Ring[],map:Mapper,side:number,material:T.Material,name:string,poleDepth?:number){
  const positions:number[]=[],indices:number[]=[],n=outline.length;
  for(const [scale,depth] of rings)for(const p of outline){
    const q=p.clone().sub(center).multiplyScalar(scale).add(center);
    positions.push(...map(q.x,q.y,depth).toArray());
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){
    const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;
    indices.push(a,b,c,b,d,c);
  }
  if(poleDepth!==undefined){
    const pole=positions.length/3;positions.push(...map(center.x,center.y,poleDepth).toArray());
    for(let i=0;i<n;i++)indices.push((rings.length-1)*n+i,(rings.length-1)*n+(i+1)%n,pole);
  }
  if(side>0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
  const object=mesh(parent,g,material,name);object.receiveShadow=false;return object;
}

function escutcheon(){
  const s=new T.Shape();s.moveTo(.077,.003);
  s.bezierCurveTo(.079,.017,.069,.026,.047,.028);
  s.bezierCurveTo(.015,.031,-.053,.029,-.078,.022);
  s.quadraticCurveTo(-.094,.018,-.093,.004);s.quadraticCurveTo(-.092,-.008,-.075,-.011);
  s.bezierCurveTo(-.025,-.008,.038,-.009,.060,-.008);
  s.quadraticCurveTo(.078,-.008,.077,.003);s.closePath();return s;
}

function paddle(){
  const s=new T.Shape();s.moveTo(.059,-.004);
  s.quadraticCurveTo(.066,-.004,.066,.003);s.lineTo(.065,.012);
  s.quadraticCurveTo(.064,.019,.055,.020);
  s.bezierCurveTo(.022,.023,-.024,.022,-.048,.018);
  s.quadraticCurveTo(-.055,.017,-.055,.010);s.lineTo(-.054,-.002);
  s.quadraticCurveTo(-.054,-.006,-.045,-.006);
  s.quadraticCurveTo(.007,-.004,.059,-.004);s.closePath();return s;
}

export function buildDoorHandles(parent:T.Object3D,m:CarMaterials){
  const anchor=doorHandleAnchor,outline=contour(doorHandleOpening());
  const cupMaterial=m.paint.clone();cupMaterial.roughness=.40;cupMaterial.vertexColors=true;
  const surround=contour(escutcheon()),surroundCenter=new T.Vector2(-.006,.009);
  const blade=contour(paddle()),bladeCenter=new T.Vector2(.005,.009);
  const innerSurround=surround.map(p=>p.clone().sub(surroundCenter).multiplyScalar(.94).add(surroundCenter));
  const bladeGap=blade.map(p=>p.clone().sub(bladeCenter).multiplyScalar(1.065).add(bladeCenter));
  for(const side of [-1,1]){
    const group=new T.Group();group.name=`door-handle-assembly-${side}`;parent.add(group);
    const skin:Mapper=(z,y,d)=>new T.Vector3(side*(sideSkinX(z,y)+d),y,z);
    const map:Mapper=(u,v,d)=>skin(anchor.z+u*anchor.widthScale,anchor.y+v,d);
    // A smooth height field avoids radial spokes in the cup's reflections.
    // The edge fade also makes every point of its irregular mouth meet paint.
    const cupDepth=(z:number,y:number)=>{
      const r2=((z-anchor.z)/.063)**2+((y-anchor.y+.018)/.030)**2;
      if(r2>=1)return 0;
      let distance=Infinity;
      for(let i=0;i<outline.length;i++){
        const a=outline[i],b=outline[(i+1)%outline.length],dz=b.x-a.x,dy=b.y-a.y;
        const t=T.MathUtils.clamp(((z-a.x)*dz+(y-a.y)*dy)/(dz*dz+dy*dy),0,1);
        distance=Math.min(distance,Math.hypot(z-a.x-t*dz,y-a.y-t*dy));
      }
      return -.016*(1-r2)**2*T.MathUtils.smoothstep(distance,0,.004);
    };
    const cup=mappedShape(group,doorHandleOpening(),cupMaterial,(z,y)=>skin(z,y,cupDepth(z,y)),'door-handle-pocket',0,()=>.003);
    // Subtle cavity occlusion, fading to the unmodified paint at the lip.
    const p=cup.geometry.getAttribute('position'),colors:number[]=[];
    for(let i=0;i<p.count;i++){
      const depth=T.MathUtils.clamp((sideSkinX(p.getZ(i),p.getY(i))-Math.abs(p.getX(i)))/.016,0,1);
      const upper=T.MathUtils.smoothstep(p.getY(i),anchor.y-.035,anchor.y+.010);
      const shade=1-depth*(.15+.22*upper);colors.push(shade,shade,shade);
    }
    cup.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    loft(group,surround,surroundCenter,[[1,.0005],[.985,.0012],[.96,.0030],[.94,.0035]],map,side,m.paint,'door-handle-bezel');
    const bezel=new T.Shape(innerSurround);bezel.holes.push(new T.Path(bladeGap));
    mappedShape(group,bezel,m.paint,(u,v)=>map(u,v,.0035),'door-handle-escutcheon',0,()=>.004);
    mappedShape(group,new T.Shape(bladeGap),m.seam,(u,v)=>map(u,v,.0023),'door-handle-paddle-gap',0,()=>.006);
    loft(group,blade,bladeCenter,[[1,.0035],[.97,.0057],[.90,.0078],[.72,.0090],[.40,.0094]],map,side,m.paint,'door-handle',.0095);
    const key=new T.Shape();key.absarc(-.076,.006,.0055,0,Math.PI*2,false);
    loft(group,contour(key),new T.Vector2(-.076,.006),[[1,.0036],[.86,.0051]],map,side,m.chrome,'door-key-cylinder',.0051);
    const slot=new T.Shape([new T.Vector2(-.0766,.0030),new T.Vector2(-.0754,.0030),new T.Vector2(-.0754,.0090),new T.Vector2(-.0766,.0090)]);
    mappedShape(group,slot,m.rubber,(u,v)=>map(u,v,.0053),'door-key-slot');
  }
}

export function buildFenderIndicators(parent:T.Object3D,m:CarMaterials){
  const lensMaterial=m.head.clone();lensMaterial.color.set('#c7d0d0');lensMaterial.opacity=.32;lensMaterial.roughness=.19;lensMaterial.depthWrite=false;
  const reflector=m.silver.clone();reflector.color.set('#8d9698');reflector.roughness=.40;
  const amber=m.amber.clone();amber.emissiveIntensity=0;amber.roughness=.30;
  const prism=new T.MeshStandardMaterial({color:'#bdc8c9',transparent:true,opacity:.30,roughness:.38});
  const shape=new T.Shape();shape.absellipse(0,0,.039,.0125,0,Math.PI*2,false,0);
  const outline=contour(shape),center=new T.Vector2();
  for(const side of [-1,1]){
    const group=new T.Group();group.name=`fender-repeater-${side}`;parent.add(group);
    const map:Mapper=(u,v,d)=>{
      const z=1.130+u,y=.826+v-.10*u;
      return new T.Vector3(side*(sideSkinX(z,y)+d),y,z);
    };
    loft(group,outline,center,[[1.025,.0003],[1,.0008]],map,side,m.seam,'fender-indicator-bezel',.0008);
    loft(group,outline,center,[[.97,.0009],[.75,.0014]],map,side,reflector,'fender-indicator-reflector',.0017);
    const core=new T.Shape();core.absellipse(.003,0,.0060,.0075,0,Math.PI*2,false,0);
    loft(group,contour(core),new T.Vector2(.003,0),[[1,.0018],[.78,.0025],[.40,.0029]],map,side,amber,'fender-indicator',.0030);
    const lensRings:Ring[]=[];
    for(let i=0;i<16;i++){const r=1-i/16;lensRings.push([r,.0009+.0036*(1-r*r)]);}
    const lens=loft(group,outline,center,lensRings,map,side,lensMaterial,'fender-indicator-lens',.0045);
    lens.renderOrder=4;lens.castShadow=false;
    for(let j=-4;j<=4;j++){
      const u=j*.0075,half=.0125*Math.sqrt(1-(u/.039)**2)*.82,points:Point[]=[];
      for(let i=0;i<=10;i++){
        const v=-half+2*half*i/10,d=.0006+.0036*(1-(u/.039)**2-(v/.0125)**2);
        points.push(map(u,v,d).toArray() as Point);
      }
      const rib=tube(group,points,.00010,prism,false,'indicator-lens-prism');rib.castShadow=false;rib.renderOrder=3;
    }
  }
}

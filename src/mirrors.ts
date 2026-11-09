import * as T from 'three';
import {ellipsoid,mesh} from './geometry.ts';
import {mappedShape,scaledContour} from './shape-mesh.ts';
import {sideSkinX,frontWindowAdvance,doorWindow} from './profile.ts';
import type {CarMaterials} from './materials.ts';

const segments=96;
function sailPanel(){
  // Take the forward corner from the actual window, including its curved
  // leading edge and sill. Overlap the ceramic surround without covering paint.
  const outline=scaledContour(doorWindow(),.992),points:T.Vector2[]=[];
  const distance=(p:T.Vector2)=>p.x-(.550+.36*(p.y-.970));
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length],da=distance(a),db=distance(b);
    if(da>=0)points.push(a);
    if((da>=0)!==(db>=0))points.push(a.clone().lerp(b,da/(da-db)));
  }
  const shape=new T.Shape(points);shape.closePath();return shape;
}

function mirrorContour(){
  // Narrow at the sail, fuller at the outer shoulder, with a swept lower edge.
  const s=new T.Shape();s.moveTo(-.080,-.032);
  s.bezierCurveTo(-.088,-.013,-.087,.022,-.072,.037);
  s.bezierCurveTo(-.046,.056,.018,.058,.067,.045);
  s.bezierCurveTo(.090,.039,.100,.024,.098,.002);
  s.bezierCurveTo(.097,-.024,.080,-.043,.057,-.048);
  s.bezierCurveTo(.012,-.055,-.053,-.047,-.080,-.032);
  s.closePath();return s.getSpacedPoints(segments).slice(0,-1);
}

function ringGeometry(contour:T.Vector2[],rings:readonly (readonly [number,number])[],side:number,pole?:[number,number,number]){
  const positions:number[]=[],indices:number[]=[];
  if(pole)positions.push(side*pole[0],pole[1],pole[2]);
  for(const [radius,z] of rings)for(const p of contour){
    positions.push(side*(p.x*radius+.006*(1-radius*radius)),p.y*radius+.004*(1-radius*radius),z);
  }
  const offset=pole?1:0;
  if(pole)for(let i=0;i<segments;i++)indices.push(0,1+i,1+(i+1)%segments);
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=offset+j*segments+i,b=offset+j*segments+(i+1)%segments,c=a+segments,d=b+segments;
    indices.push(a,c,b,b,c,d);
  }
  if(side<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}

export function buildMirrors(parent:T.Object3D,m:CarMaterials){
  const contour=mirrorContour();
  const housing=m.rubber.clone();housing.color.set('#171b1e');housing.roughness=.49;
  const mirror=new T.MeshPhysicalMaterial({color:'#b6c5ce',metalness:1,roughness:.065,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1,side:T.DoubleSide});
  for(const side of [-1,1]){
    const assembly=new T.Group();assembly.name=`wing-mirror-${side}`;parent.add(assembly);
    mappedShape(assembly,sailPanel(),m.rubber,(z,y,d)=>new T.Vector3(side*(sideSkinX(z,y)+.0025+d),y,z),'mirror-mount',.0035,()=>.012);
    // Broad pivot overlaps both the curved sail and the inner housing flank.
    ellipsoid(assembly,[side*.800,1.046,.551+frontWindowAdvance],[.047,.024,.032],housing,'mirror-support');
    const place=(geometry:T.BufferGeometry,material:T.Material,name:string)=>{
      const object=mesh(assembly,geometry,material,name);
      object.position.set(side*.876,1.065,.534+frontWindowAdvance);
      object.rotation.set(.045,side*.20,0);object.receiveShadow=false;
      return object;
    };
    const dome:[number,number][]=[];
    for(let i=1;i<=24;i++){const angle=i/24*Math.PI/2;dome.push([Math.sin(angle),-.048+.115*Math.cos(angle)]);}
    place(ringGeometry(contour,dome,side,[.006,.004,.067]),housing,'side-mirror');
    const lip:[number,number][]=[];
    const curve=new T.CubicBezierCurve(new T.Vector2(1,-.048),new T.Vector2(.98,-.054),new T.Vector2(.91,-.054),new T.Vector2(.90,-.047));
    for(let i=0;i<=12;i++){const p=curve.getPoint(i/12);lip.push([p.x,p.y]);}
    place(ringGeometry(contour,lip,side),housing,'mirror-bezel');
    place(ringGeometry(contour,[[.90,-.047],[.898,-.045]],side),m.rubber,'mirror-glass-gasket');
    const glass:[number,number][]=[];
    for(let i=1;i<=12;i++){const r=i/12;glass.push([.898*r,-.045-.0015*(1-r*r)]);}
    const lens=place(ringGeometry(contour,glass,side,[.006,.004,-.0465]),mirror,'mirror-glass');
    lens.castShadow=false;
  }
}

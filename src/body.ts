import * as T from 'three';
import {surface,tube} from './geometry.ts';
import type {Point} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {sideSkinX,sidePanelPoint,frontPanelPoint,rearPanelPoint,frontEdge,frontWidth,frontCowl,sideOutline,doorWindow,quarterWindow,doorHandleOpening,doorHandleAnchor,headlightWing,tailLightWing,frontFaceOutline,rearFaceOutline,roofPoint,roofEdgeY,windPoint,rearWindowPoint} from './profile.ts';
import {mappedShape,ringShape,scaledContour,shapeRim} from './shape-mesh.ts';

function windowSkin(parent:T.Object3D,shape:T.Shape,side:number,m:CarMaterials,name:string){
  const inner=scaledContour(shape,name.startsWith('quarter')?.895:.966),map=(z:number,y:number)=>new T.Vector3(side*(sideSkinX(z,y)+.003),y,z);
  mappedShape(parent,ringShape(shape,inner),m.rubber,(z,y)=>map(z,y),`${name}-ceramic-border`,0,()=>.025);
  const glazing=mappedShape(parent,new T.Shape(inner),m.glass,(z,y)=>map(z,y).add(new T.Vector3(side*.001,0,0)),name);
  glazing.renderOrder=3;glazing.castShadow=false;
  shapeRim(parent,shape,map,m.seam,.0023);
}

function largeWindow(parent:T.Object3D,map:(r:number,t:number)=>T.Vector3,m:CarMaterials,name:string){
  const rear=name==='rear-window',rx=rear?.15:.10,ry=rear?.13:.085;
  const left=-.943,right=.943,bottom=.053,top=.955,opening=new T.Shape();
  opening.moveTo(left+rx,bottom);opening.lineTo(right-rx,bottom);
  opening.quadraticCurveTo(right,bottom,right,bottom+ry);opening.lineTo(right,top-ry);
  opening.quadraticCurveTo(right,top,right-rx,top);opening.lineTo(left+rx,top);
  opening.quadraticCurveTo(left,top,left,top-ry);opening.lineTo(left,bottom+ry);
  opening.quadraticCurveTo(left,bottom,left+rx,bottom);opening.closePath();
  const frame=new T.Shape([new T.Vector2(-1,0),new T.Vector2(1,0),new T.Vector2(1,1),new T.Vector2(-1,1)]);
  frame.holes.push(new T.Path(opening.getPoints(32)));
  mappedShape(parent,frame,m.paint,(r,t)=>map(r,t),`${name}-paint-frame`,0,()=>rear?.012:.025);
  const inner=scaledContour(opening,rear?.945:.968);
  mappedShape(parent,ringShape(opening,inner),m.rubber,(r,t)=>map(r,t),`${name}-ceramic-border`,0,()=>rear?.012:.025);
  const glass=mappedShape(parent,new T.Shape(inner),m.glass,(r,t)=>map(r,t),name,0,rear?(r)=>Math.abs(r)>.85?.012:.05:undefined);
  glass.renderOrder=3;glass.castShadow=false;
  shapeRim(parent,opening,map,m.seam,.0025);
}

export function buildBody(parent:T.Object3D,m:CarMaterials){
  const body=new T.Group();body.name='continuous-body';parent.add(body);
  for(const side of [-1,1]){
    const outline=sideOutline();
    for(const shape of [doorWindow(),quarterWindow(),doorHandleOpening(),headlightWing(),tailLightWing()]){
      const hole=new T.Path();hole.curves=shape.curves;hole.autoClose=true;outline.holes.push(hole);
    }
    mappedShape(body,outline,m.paint,(z,y,d)=>{
      const p=sidePanelPoint(z,y);p.x=side*(p.x+d-.025);return p;
    },`body-side-${side}`,.025,(z,y)=>Math.abs(z-doorHandleAnchor.z)<.12&&Math.abs(y-doorHandleAnchor.y)<.065?.010:y>.846&&y<frontCowl.y+.001&&z>frontEdge(y)-.085?.008:z<-1.24&&y>.974?.008:y>roofEdgeY(z)-.10?.012:z>.30&&y>.90?.025:.075);
    windowSkin(body,doorWindow(),side,m,`door-glass-${side}`);
    windowSkin(body,quarterWindow(),side,m,`quarter-glass-${side}`);
    for(const center of [-1.185,1.185])surface(body,(u,t)=>{
      const angle=Math.PI*u,z=center+.329*Math.cos(angle),y=.290+.329*Math.sin(angle);
      return new T.Vector3(side*(sideSkinX(z,y)-.006-.135*t),y,z);
    },m.dark,48,3,'wheel-well');
  }
  mappedShape(body,frontFaceOutline(),m.paint,(x,y,d)=>{
    const p=frontPanelPoint(x,y);p.z+=d-.025;return p;
  },'bonnet-and-front-cap',.025,(x,y)=>y>.847&&Math.abs(x)>frontWidth(y)-.085?.008:y>.77?.025:.075);
  mappedShape(body,rearFaceOutline(),m.paint,(x,y,d)=>rearPanelPoint(x,y).add(new T.Vector3(0,0,-d+.025)),'hatch-and-rear-cap',.025,(x,y)=>y>.97&&Math.abs(x)>.55?.008:.075);
  const roof=surface(body,(u,v)=>roofPoint(2*u-1,-1.25+v*1.42),m.paint,128,72,'arched-roof',true);roof.receiveShadow=false;
  largeWindow(body,windPoint,m,'windscreen');
  largeWindow(body,rearWindowPoint,m,'rear-window');
  for(const side of [-1,1]){
    const gutter:Point[]=[];
    for(let i=0;i<=34;i++){const p=roofPoint(side*.964,-1.205+i/34*1.295);p.y+=.001;gutter.push(p.toArray() as Point);}
    tube(body,gutter,.0018,m.seam);
  }
  return body;
}

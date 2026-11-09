import * as T from 'three';
import {ellipsoid,surface,tube} from './geometry.ts';
import type {Point} from './geometry.ts';
import type {CarMaterials} from './materials.ts';
import {frontZ,rearPanelPoint,sidePanelPoint,frontDetailY,frontWidth,frontEdge,rearWidth,rearEdge,sideSkinX,headlightOutline,headlightWing,tailLightOutline,tailLightWing,upperGrilleShape,lowerGrilleShape} from './profile.ts';
import {mappedShape,scaledContour,shapeRim} from './shape-mesh.ts';

function contains(points:T.Vector2[],x:number,y:number){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

function clippedBand(shape:T.Shape,low:number,high:number){
  let points=shape.getPoints(32);
  for(const [level,above] of [[low,true],[high,false]] as const){
    const next:T.Vector2[]=[];
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[j],b=points[i],ain=above?a.y>=level:a.y<=level,bin=above?b.y>=level:b.y<=level;
      if(ain!==bin)next.push(new T.Vector2(a.x+(b.x-a.x)*(level-a.y)/(b.y-a.y),level));
      if(bin)next.push(b.clone());
    }
    points=next;
  }
  return new T.Shape(points);
}

// The face and wing are offset in different directions. Bridge their actual
// edges at every layer instead of leaving a transparent slit at the corner.
function cornerJoin(parent:T.Object3D,cap:(y:number,d:number)=>T.Vector3,wing:(y:number,d:number)=>T.Vector3,low:number,high:number,material:T.Material,lensMaterial:T.Material,name:string){
  const point=(u:number,y:number,d:number)=>cap(y,d).lerp(wing(y,d),u);
  surface(parent,(u,t)=>point(u,T.MathUtils.lerp(low,high,t),.001),material,6,96,`${name}-seal`);
  const lens=surface(parent,(u,t)=>point(u,T.MathUtils.lerp(low,high,t),.004),lensMaterial,6,96,`${name}-lens`);
  lens.renderOrder=4;lens.castShadow=false;
  return point;
}

function frontLight(parent:T.Object3D,side:number,m:CarMaterials){
  const shape=headlightOutline();
  const recessDepth=(x:number,y:number)=>T.MathUtils.lerp(-.034,-.006,T.MathUtils.smoothstep(x/frontWidth(frontDetailY(y)),.86,.995));
  const map=(x:number,y:number,d=0)=>{
    const xx=side*x,yy=frontDetailY(y),e=1e-4;
    const normal=new T.Vector3(-(frontZ(xx+e,yy)-frontZ(xx-e,yy))/(2*e),-(frontZ(xx,yy+e)-frontZ(xx,yy-e))/(2*e),1).normalize();
    return new T.Vector3(xx,yy,frontZ(xx,yy)).addScaledVector(normal,d);
  };
  mappedShape(parent,shape,m.dark,(x,y)=>map(x,y,-.048),`headlamp-housing-${side}`);
  mappedShape(parent,shape,m.chrome,(x,y)=>map(x,y,recessDepth(x,y)),`headlamp-recess-${side}`);
  surface(parent,(u,t)=>{
    const p=shape.getPointAt(u);return map(p.x,p.y,T.MathUtils.lerp(.002,recessDepth(p.x,p.y),t));
  },m.chrome,192,4,`headlamp-bezel-return-${side}`);
  const border=shape.getPoints(32),join=border.findIndex(p=>p.y<.76&&frontWidth(frontDetailY(p.y))-p.x<.002);
  const frontBorder=[...border.slice(join),...border.slice(0,join)].filter(p=>frontWidth(frontDetailY(p.y))-p.x>.002);
  tube(parent,frontBorder.map(p=>map(p.x,p.y,.001).toArray() as Point),.0025,m.rubber);
  const cx=.555,cy=.806,rx=.103,ry=.075;
  surface(parent,(u,r)=>{
    const a=u*Math.PI*2,x=cx+rx*r*Math.cos(a),y=cy+ry*r*Math.sin(a);
    return map(x,y,-.028*(1-r*r)-.002);
  },m.chrome,64,12,`headlamp-reflector-${side}`);
  const circle=new T.Shape();circle.absellipse(cx,cy,rx,ry,0,Math.PI*2,false,0);
  shapeRim(parent,circle,(x,y)=>map(x,y,.001),m.silver,.0015);
  const facets:number[]=[];
  for(let i=0;i<36;i++){
    const a=i/36*Math.PI*2;
    for(const r of [.40,.96]){const p=map(cx+rx*r*Math.cos(a),cy+ry*r*Math.sin(a),-.025*(1-r*r));facets.push(...p.toArray());}
  }
  const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(facets,3));
  parent.add(new T.LineSegments(fg,new T.LineBasicMaterial({color:'#9da6ab',transparent:true,opacity:.55})));
  const bulb=ellipsoid(parent,map(cx,cy,-.008).toArray() as Point,[.012,.011,.009],m.lamp,'headlight-bulb');
  bulb.rotation.x=-.30;
  const amber=new T.Shape();amber.absellipse(.698,.794,.031,.050,0,2*Math.PI,false,0);
  mappedShape(parent,amber,m.amber,(x,y)=>map(x,y,-.008),`headlamp-amber-${side}`);
  for(let i=-3;i<=3;i++){
    const x=.698+i*.006,half=.047*Math.sqrt(1-(i*.006/.031)**2);
    tube(parent,[map(x,.794-half,-.005).toArray() as Point,map(x,.794+half,-.005).toArray() as Point],.0008,m.chrome);
  }
  const lens=mappedShape(parent,shape,m.head,(x,y)=>map(x,y,.004),`headlight-lens-${side}`);
  lens.renderOrder=4;lens.castShadow=false;
  // The lamp wraps into the fender, so the real side view includes a lens,
  // rather than the complete headlight disappearing behind the side shell.
  const wing=headlightWing(),wm=(z:number,y:number,d=0)=>new T.Vector3(side*(sideSkinX(z,y)+d),y,z);
  mappedShape(parent,wing,m.dark,(z,y)=>wm(z,y,-.027),`headlamp-wing-housing-${side}`);
  mappedShape(parent,wing,m.chrome,(z,y)=>wm(z,y,-.006),`headlamp-wing-reflector-${side}`);
  surface(parent,(u,t)=>{
    const p=wing.getPointAt(u);return wm(p.x,p.y,T.MathUtils.lerp(.002,-.006,t));
  },m.chrome,192,3,`headlamp-wing-bezel-return-${side}`);
  const wingBorder=wing.getPoints(32).filter(p=>frontEdge(p.y)-p.x>.003);
  tube(parent,wingBorder.map(p=>wm(p.x,p.y,.001).toArray() as Point),.0025,m.rubber);
  const amberWing=new T.Shape();amberWing.absellipse(1.616,.713,.017,.023,0,2*Math.PI,false,0);
  mappedShape(parent,amberWing,m.amber,(z,y)=>wm(z,y,-.003),`headlamp-wing-amber-${side}`);
  const wingLens=mappedShape(parent,wing,m.head,(z,y)=>wm(z,y,.004),`headlamp-wing-lens-${side}`);
  wingLens.renderOrder=4;wingLens.castShadow=false;
  cornerJoin(parent,(y,d)=>{
    let low=.728,high=.921;
    for(let i=0;i<22;i++){const mid=(low+high)/2;if(frontDetailY(mid)<y)low=mid;else high=mid;}
    return map(frontWidth(y)-.0003,(low+high)/2,d);
  },(y,d)=>wm(frontEdge(y)-.0003,y,d),frontDetailY(.728),frontDetailY(.921),m.chrome,m.head,`headlamp-corner-${side}`);
}

function rearLight(parent:T.Object3D,side:number,m:CarMaterials){
  const shape=tailLightOutline(),map=(x:number,y:number,d=0)=>rearPanelPoint(side*x,y).add(new T.Vector3(0,0,-d));
  mappedShape(parent,shape,m.rubber,(x,y)=>map(x,y,-.015),`tail-housing-${side}`);
  const red=mappedShape(parent,shape,m.red,(x,y)=>map(x,y,-.002),`rear-light-${side}`);
  red.renderOrder=1;
  surface(parent,(u,t)=>{
    const p=shape.getPointAt(u);return map(p.x,p.y,T.MathUtils.lerp(.002,-.002,t));
  },m.red,192,3,`tail-bezel-return-${side}`);
  const border=shape.getPoints(32),join=border.findIndex(p=>p.y<.84&&rearWidth(p.y)-p.x<.002);
  const rearBorder=[...border.slice(join),...border.slice(0,join)].filter(p=>rearWidth(p.y)-p.x>.002);
  tube(parent,rearBorder.map(p=>map(p.x,p.y,.001).toArray() as Point),.002,m.seam);
  const white=new T.Shape();white.moveTo(.468,.974);white.quadraticCurveTo(.60,.987,.745,.969);white.lineTo(.746,.940);
  white.quadraticCurveTo(.63,.951,.519,.945);white.quadraticCurveTo(.502,.907,.515,.795);
  white.lineTo(.477,.792);white.quadraticCurveTo(.463,.898,.468,.974);white.closePath();
  mappedShape(parent,white,m.silver,(x,y)=>map(x,y,.003),`tail-clear-section-${side}`);
  const ribs:number[]=[];
  const mask=scaledContour(shape,.94);
  for(let y=.780;y<.981;y+=.008)for(let x=.46;x<.75;x+=.009){
    if(contains(mask,x,y)&&contains(mask,x+.006,y))ribs.push(...map(x,y,.006).toArray(),...map(x+.006,y,.006).toArray());
  }
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(ribs,3));
  parent.add(new T.LineSegments(rg,new T.LineBasicMaterial({color:'#bf766c',transparent:true,opacity:.26})));
  const lens=mappedShape(parent,shape,m.head,(x,y)=>map(x,y,.004),`tail-lens-${side}`);
  lens.renderOrder=4;lens.castShadow=false;
  const wing=tailLightWing(),wm=(z:number,y:number,d=0)=>{
    const p=sidePanelPoint(z,y);p.x=side*(p.x+d);return p;
  };
  mappedShape(parent,wing,m.rubber,(z,y)=>wm(z,y,-.020),`tail-wing-housing-${side}`);
  mappedShape(parent,wing,m.red,(z,y)=>wm(z,y,-.002),`tail-wing-red-${side}`);
  surface(parent,(u,t)=>{
    const p=wing.getPointAt(u);return wm(p.x,p.y,T.MathUtils.lerp(.002,-.002,t));
  },m.red,192,3,`tail-wing-bezel-return-${side}`);
  const wingBorder=wing.getPoints(32).filter(p=>p.x-rearEdge(p.y)>.003);
  tube(parent,wingBorder.map(p=>wm(p.x,p.y,.001).toArray() as Point),.002,m.seam);
  mappedShape(parent,clippedBand(new T.Shape(scaledContour(wing,.956)),.940,.966),m.silver,(z,y)=>wm(z,y,.001),`tail-wing-clear-${side}`);
  const wingLens=mappedShape(parent,wing,m.head,(z,y)=>wm(z,y,.004),`tail-wing-lens-${side}`);
  wingLens.renderOrder=4;wingLens.castShadow=false;
  const corner=cornerJoin(parent,(y,d)=>map(rearWidth(y)-.0003,y,d),(y,d)=>wm(rearEdge(y)+.0003,y,d),.775,.974,m.red,m.head,`tail-corner-${side}`);
  surface(parent,(u,t)=>corner(u,T.MathUtils.lerp(.940,.966,t),.002),m.silver,6,24,`tail-corner-clear-${side}`);
}

function grille(parent:T.Object3D,shape:T.Shape,m:CarMaterials,name:string){
  const map=(x:number,y:number,d:number)=>{const yy=frontDetailY(y);return new T.Vector3(x,yy,frontZ(x,yy)+d);};
  mappedShape(parent,shape,m.dark,(x,y)=>map(x,y,-.020),name);
  shapeRim(parent,shape,(x,y)=>map(x,y,.001),m.seam,.0025);
  const points=shape.getPoints(40),bounds=new T.Box2().setFromPoints(points),positions:number[]=[];
  const radius=.0114,dx=radius*1.72,dy=radius*1.50;
  let row=0;
  for(let y=bounds.min.y;y<bounds.max.y;y+=dy,row++)for(let x=bounds.min.x;x<bounds.max.x;x+=dx){
    const cx=x+(row%2)*dx/2;
    for(let i=0;i<6;i++){
      const a=Math.PI/3*i+Math.PI/6,b=Math.PI/3*(i+1)+Math.PI/6;
      const x1=cx+Math.cos(a)*radius,y1=y+Math.sin(a)*radius,x2=cx+Math.cos(b)*radius,y2=y+Math.sin(b)*radius;
      if(contains(points,x1,y1)&&contains(points,x2,y2))positions.push(...map(x1,y1,-.006).toArray(),...map(x2,y2,-.006).toArray());
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  parent.add(new T.LineSegments(g,new T.LineBasicMaterial({color:'#485052'})));
}

export function buildLights(parent:T.Object3D,m:CarMaterials){
  const group=new T.Group();group.name='flush-lights';parent.add(group);
  for(const side of [-1,1]){frontLight(group,side,m);rearLight(group,side,m);}
  grille(group,upperGrilleShape(),m,'upper-grille');grille(group,lowerGrilleShape(),m,'lower-grille');
  return group;
}

import * as T from 'three';

export type SurfaceSample={point:T.Vector3;normal:T.Vector3;area:number};

// A common implicit surface fairs a multi-panel corner without treating its
// adjoining charts as separate patches. Compact moving-plane weights give a
// smooth field; projecting every chart to its zero set also aligns tangents.
export function surfaceFairer(samples:SurfaceSample[],radius:number,lockHeight=false){
  const cells=new Map<string,SurfaceSample[]>(),r2=radius*radius;
  const key=(x:number,y:number,z:number)=>`${x},${y},${z}`;
  for(const sample of samples){
    const p=sample.point,k=key(Math.floor(p.x/radius),Math.floor(p.y/radius),Math.floor(p.z/radius));
    const bucket=cells.get(k);if(bucket)bucket.push(sample);else cells.set(k,[sample]);
  }
  // Cache the scalar field on an 8 mm lattice. Tricubic interpolation keeps
  // its first derivative continuous, while avoiding a point-cloud search for
  // every normal probe of the high-resolution render mesh.
  const spacing=.008,bounds=new T.Box3().setFromPoints(samples.map(s=>s.point)).expandByScalar(.032);
  const origin=bounds.min,size=bounds.getSize(new T.Vector3()).divideScalar(spacing).ceil().addScalar(1);
  const nx=size.x,ny=size.y,nz=size.z,values=new Float64Array(nx*ny*nz).fill(NaN);
  function field(ix:number,iy:number,iz:number){
    const index=(iz*ny+iy)*nx+ix,known=values[index];if(!Number.isNaN(known))return known;
    const px=origin.x+ix*spacing,py=origin.y+iy*spacing,pz=origin.z+iz*spacing;
    const cx=Math.floor(px/radius),cy=Math.floor(py/radius),cz=Math.floor(pz/radius);
    let value=0,weight=0;
    for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(let z=cz-1;z<=cz+1;z++){
      const bucket=cells.get(key(x,y,z));if(!bucket)continue;
      for(const s of bucket){
        const dx=px-s.point.x,dy=py-s.point.y,dz=pz-s.point.z,d2=dx*dx+dy*dy+dz*dz;
        if(d2>=r2)continue;
        const w=(1-d2/r2)**4*s.area;
        value+=w*(dx*s.normal.x+dy*s.normal.y+dz*s.normal.z);weight+=w;
      }
    }
    return values[index]=weight>1e-15?value/weight:0;
  }
  const weights=(t:number)=>[-.5*t+t*t-.5*t**3,1-2.5*t*t+1.5*t**3,.5*t+2*t*t-1.5*t**3,-.5*t*t+.5*t**3];
  const slopes=(t:number)=>[-.5+2*t-1.5*t*t,-5*t+4.5*t*t,.5+4*t-4.5*t*t,-t+1.5*t*t];
  return (point:T.Vector3)=>{
    const p=point.clone();
    for(let iteration=0;iteration<6;iteration++){
      const x=(p.x-origin.x)/spacing,y=(p.y-origin.y)/spacing,z=(p.z-origin.z)/spacing;
      const ix=T.MathUtils.clamp(Math.floor(x),1,nx-3),iy=T.MathUtils.clamp(Math.floor(y),1,ny-3),iz=T.MathUtils.clamp(Math.floor(z),1,nz-3);
      const wx=weights(x-ix),wy=weights(y-iy),wz=weights(z-iz),sx=slopes(x-ix),sy=slopes(y-iy),sz=slopes(z-iz);
      let value=0,gx=0,gy=0,gz=0;
      for(let k=0;k<4;k++)for(let j=0;j<4;j++)for(let i=0;i<4;i++){
        const f=field(ix+i-1,iy+j-1,iz+k-1);
        value+=f*wx[i]*wy[j]*wz[k];gx+=f*sx[i]*wy[j]*wz[k];gy+=f*wx[i]*sy[j]*wz[k];gz+=f*wx[i]*wy[j]*sz[k];
      }
      gx/=spacing;gy/=spacing;gz/=spacing;
      // A cowl joins a finished horizontal dashboard deck. Project its
      // contour in X/Z while preserving the original attachment height.
      if(lockHeight)gy=0;
      const norm=gx*gx+gy*gy+gz*gz;if(norm<1e-20)break;
      const step=value/norm;
      p.x-=step*gx;p.y-=step*gy;p.z-=step*gz;
      if(step*step*norm<1e-18)break;
    }
    return p;
  };
}

export function sampleSurface(samples:SurfaceSample[],map:(u:number,v:number)=>T.Vector3,u:number,v:number,du:number,dv:number,outwardZ=-.65){
  const e=1e-5,point=map(u,v),a=map(u+e,v).sub(map(u-e,v)),b=map(u,v+e).sub(map(u,v-e));
  const normal=a.cross(b),area=normal.length()*du*dv/(4*e*e);
  // Orient the side, roof and end-cap charts consistently on either end.
  if(normal.dot(new T.Vector3(point.x,point.y-.65,outwardZ))<0)normal.negate();
  if(area>1e-12&&Number.isFinite(area))samples.push({point,normal:normal.normalize(),area});
}

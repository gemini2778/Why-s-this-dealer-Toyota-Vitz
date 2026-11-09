import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Point = readonly [number, number, number];
export const v = (p: Point) => new T.Vector3(...p);

export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, name = '') {
  const object = new T.Mesh(geometry, material);
  object.name = name;
  object.castShadow = !material.transparent;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function box(parent: T.Object3D, size: Point, position: Point, material: T.Material, radius = 0.025, name = '') {
  const b = mesh(parent, new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(n => n / 2))), material, name);
  b.position.set(...position);
  return b;
}

export function ellipsoid(parent: T.Object3D, position: Point, size: Point, material: T.Material, name = '') {
  const object = mesh(parent, new T.SphereGeometry(1, 32, 20), material, name);
  object.position.set(...position);
  object.scale.set(...size);
  return object;
}

export function tube(parent: T.Object3D, points: Point[], radius: number, material: T.Material, closed = false, name = '') {
  const curve = new T.CatmullRomCurve3(points.map(v), closed, 'centripetal');
  return mesh(parent, new T.TubeGeometry(curve, Math.max(points.length * 10, 24), radius, 6, closed), material, name);
}

export function surface(parent: T.Object3D, fn: (u: number, w: number) => T.Vector3, material: T.Material, nu = 40, nv = 16, name = '', analyticNormals = false) {
  const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv);
    positions.push(p.x, p.y, p.z);
    uvs.push(i / nu, j / nv);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i;
    indices.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  if(analyticNormals){
    const normals:number[]=[],e=1e-5;
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
      const u=i/nu,w=j/nv;
      const du=fn(u+e,w).sub(fn(u-e,w)),dv=fn(u,w+e).sub(fn(u,w-e));
      normals.push(...du.cross(dv).normalize().toArray());
    }
    g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  } else g.computeVertexNormals();
  return mesh(parent, g, material, name);
}

export function outline(points: Point[], round = 0.16) {
  const result: T.Vector3[] = [];
  const ps = points.map(v);
  for (let i = 0; i < ps.length; i++) {
    const a = ps[(i + ps.length - 1) % ps.length].clone().lerp(ps[i], 1 - round);
    const b = ps[i];
    const c = ps[i].clone().lerp(ps[(i + 1) % ps.length], round);
    const curve = new T.QuadraticBezierCurve3(a, b, c);
    result.push(...curve.getPoints(6));
  }
  return result;
}

export function panel(parent: T.Object3D, points: Point[], material: T.Material, normal: Point = [0, 0, 1], bulge = 0.01, name = '', round = 0.16) {
  const boundary = outline(points, round);
  const center = boundary.reduce((c, p) => c.add(p), new T.Vector3()).divideScalar(boundary.length);
  const positions = [...center.toArray()], indices: number[] = [], uvs = [0.5, 0.5];
  const rings = 7, n = boundary.length;
  const axis = v(normal);
  // Radial tessellation yields gently crowned, real three-dimensional panels.
  for (let r = 1; r <= rings; r++) for (let i = 0; i < n; i++) {
    const t = r / rings;
    const p = center.clone().lerp(boundary[i], t).addScaledVector(axis, bulge * (1 - t * t));
    positions.push(...p.toArray());
    uvs.push(0.5 + (boundary[i].x - center.x) * t, 0.5 + (boundary[i].y - center.y) * t);
  }
  for (let i = 0; i < n; i++) indices.push(0, 1 + i, 1 + (i + 1) % n);
  for (let r = 1; r < rings; r++) for (let i = 0; i < n; i++) {
    const a = 1 + (r - 1) * n + i, b = 1 + (r - 1) * n + (i + 1) % n;
    indices.push(a, a + n, b, b, a + n, b + n);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material, name);
}

export function rim(parent: T.Object3D, points: Point[], radius: number, material: T.Material, round = 0.16) {
  return tube(parent, outline(points, round).map(p => p.toArray() as [number, number, number]), radius, material, true);
}

export function lerpProfile(keys: readonly (readonly [number, number])[], z: number) {
  for (let i = 1; i < keys.length; i++) {
    if (z <= keys[i][0]) {
      const t = T.MathUtils.clamp((z - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]), 0, 1);
      const e = t * t * (3 - 2 * t);
      return T.MathUtils.lerp(keys[i - 1][1], keys[i][1], e);
    }
  }
  return keys[keys.length - 1][1];
}

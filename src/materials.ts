import * as T from 'three';

export type CarTextures = {plate?: T.Texture; badge?: T.Texture; meter?: T.Texture; fabric?: T.Texture; fabricInsert?:T.Texture; fabricWeave?:T.Texture; radio?:T.Texture; hvac?:T.Texture; audio?:T.Texture; shift?:T.Texture; engine?:T.Texture};

export function createCarMaterials(textures: CarTextures = {}) {
  const paint = new T.MeshPhysicalMaterial({color: '#b9bfc6', metalness: 0.73, roughness: 0.30, clearcoat: 0.8, clearcoatRoughness: 0.19, envMapIntensity: 1.35, side: T.DoubleSide});
  const chrome = new T.MeshStandardMaterial({color:'#e0e3e5', metalness:0.93, roughness:0.20, side:T.DoubleSide});
  const rubber = new T.MeshStandardMaterial({color:'#101316', metalness:0, roughness:0.87, side:T.DoubleSide});
  const seam = new T.MeshStandardMaterial({color:'#30373c', roughness:0.72, side:T.DoubleSide});
  const glass = new T.MeshPhysicalMaterial({color:'#2d4240', metalness:0.02, roughness:0.09, transparent:true, opacity:0.74, depthWrite:false, side:T.DoubleSide, envMapIntensity:0.8});
  const dark = new T.MeshStandardMaterial({color:'#171e22', roughness:0.62, side:T.DoubleSide});
  const silver = new T.MeshStandardMaterial({color:'#aeb4bb', metalness:0.56, roughness:0.33, side:T.DoubleSide});
  const head = new T.MeshPhysicalMaterial({color:'#d8e0e1', metalness:0.02, roughness:0.08, transparent:true, opacity:0.08, depthWrite:false, side:T.DoubleSide, clearcoat:1,envMapIntensity:1.1});
  const lamp = new T.MeshStandardMaterial({color:'#fcffff', metalness:0.7, roughness:0.19, emissive:'#cbe6e9', emissiveIntensity:0.04, side:T.DoubleSide});
  const red = new T.MeshPhysicalMaterial({color:'#940611', metalness:0.08, roughness:0.23, clearcoat:1, emissive:'#b90010', emissiveIntensity:0.04, side:T.DoubleSide});
  const amber = new T.MeshPhysicalMaterial({color:'#dd7826', metalness:0.1, roughness:0.22, clearcoat:1, emissive:'#ce5a05', emissiveIntensity:0.15, side:T.DoubleSide});
  const dash = new T.MeshStandardMaterial({color:'#4c5b62', roughness:0.88, side:T.DoubleSide});
  const trim = new T.MeshStandardMaterial({color:'#89969b', roughness:0.67, side:T.DoubleSide});
  const fabric = new T.MeshPhysicalMaterial({
    color:'#647782',roughness:.96,map:textures.fabric??null,bumpMap:textures.fabricWeave??null,
    bumpScale:.00085,sheen:.20,sheenColor:'#64747e',sheenRoughness:.96,side:T.DoubleSide,
  });
  const insert = new T.MeshPhysicalMaterial({
    color:'#607581',roughness:.96,map:textures.fabricInsert??textures.fabric??null,bumpMap:textures.fabricWeave??null,
    bumpScale:.00085,sheen:.18,sheenColor:'#667984',sheenRoughness:.94,side:T.DoubleSide,
  });
  const meter = new T.MeshBasicMaterial({color:'#f5ffff', map:textures.meter ?? null, side:T.DoubleSide});
  const plate = new T.MeshStandardMaterial({color:'#f5f3e7', map:textures.plate ?? null, roughness:0.5, metalness:0.12, side:T.DoubleSide});
  const radioFace=new T.MeshStandardMaterial({color:'#b7bfc0',roughness:.82,map:textures.radio??null,side:T.DoubleSide});
  const audioFace=new T.MeshStandardMaterial({color:'#aab4b7',roughness:.80,map:textures.audio??null,side:T.DoubleSide});
  const hvacFace=new T.MeshStandardMaterial({color:'#c5cbce',roughness:.86,map:textures.hvac??null,transparent:true,opacity:textures.hvac?1:0,alphaTest:.02,depthWrite:false,side:T.DoubleSide});
  const shiftFace=new T.MeshStandardMaterial({color:'#b5bdc0',roughness:.82,map:textures.shift??null,side:T.DoubleSide});
  const engineMark=new T.MeshStandardMaterial({color:'#dde1dc',roughness:.85,map:textures.engine??null,transparent:true,opacity:textures.engine?1:0,alphaTest:.03,depthWrite:false,side:T.DoubleSide});
  return {paint, chrome, rubber, seam, glass, dark, silver, head, lamp, red, amber, dash, trim, fabric, insert, meter, plate,radioFace,hvacFace,audioFace,shiftFace,engineMark};
}

export type CarMaterials = ReturnType<typeof createCarMaterials>;

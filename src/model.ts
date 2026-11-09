import {Mesh} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

/** Resolve files in public/models/ correctly in both Vite and a built subdirectory. */
export function modelUrl(filename: string) {
  return new URL(`${import.meta.env.BASE_URL}models/${filename}`, document.baseURI).href;
}

/** Standard glTF/GLB entry point for the next modeling step. */
export async function loadModel(url: string) {
  const gltf = await new GLTFLoader().loadAsync(url);
  gltf.scene.traverse(object => {
    if (object instanceof Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return gltf;
}

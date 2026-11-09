import type {Object3D} from 'three';

export type BouncePose = {height: number; width: number; length: number};

// A soft anticipation, a decisive squash, and two settling overshoots.
const keys = [[0, 1], [0.12, 0.96], [0.32, 0.64], [0.43, 0.69], [0.62, 1.10], [0.79, 0.975], [0.91, 1.018], [1, 1]] as const;

export function sampleBounce(phase: number, amplitude: number): BouncePose {
  const p = ((phase % 1) + 1) % 1;
  const a = Math.max(0, Math.min(1, amplitude));
  let height = 1;
  for (let i = 1; i < keys.length; i++) {
    const left = keys[i - 1];
    const right = keys[i];
    if (p <= right[0]) {
      const t = (p - left[0]) / (right[0] - left[0]);
      const ease = t * t * (3 - 2 * t);
      height = 1 + ((left[1] + (right[1] - left[1]) * ease) - 1) * a;
      break;
    }
  }
  const spread = 1 / Math.sqrt(height);
  return {height, width: spread, length: spread};
}

export function applyBounce(root: Object3D, pose: BouncePose) {
  root.position.set(0, 0, 0);
  root.scale.set(pose.width, pose.height, pose.length);
}

import test from 'node:test';
import assert from 'node:assert/strict';

test('a complete bounce cycle is seamless and actually compresses and rebounds', async () => {
  const {sampleBounce} = await import('../src/motion.ts');
  assert.deepEqual(sampleBounce(0, 1), sampleBounce(1, 1));
  const heights = Array.from({length: 241}, (_, i) => sampleBounce(i / 240, 1).height);
  assert.ok(Math.min(...heights) < 0.7, 'body must visibly compress');
  assert.ok(Math.max(...heights) > 1.05, 'body must visibly rebound');
  assert.ok(Math.abs(sampleBounce(1 - 1e-6, 1).height - sampleBounce(1e-6, 1).height) < 0.0001);
});

test('zero amplitude stays neutral and every pose preserves nominal volume', async () => {
  const {sampleBounce} = await import('../src/motion.ts');
  for (let i = 0; i <= 120; i++) {
    assert.deepEqual(sampleBounce(i / 120, 0), {height: 1, width: 1, length: 1});
    const p = sampleBounce(i / 120, 1);
    assert.ok(Math.abs(p.height * p.width * p.length - 1) < 1e-9);
    assert.ok(Object.values(p).every(Number.isFinite));
  }
});

test('the real car and all four tire meshes stay at ground level throughout the cycle', async () => {
  const THREE = await import('three');
  const {createVitz} = await import('../src/car.ts');
  const {sampleBounce, applyBounce} = await import('../src/motion.ts');
  const car = createVitz();
  const tires = [];
  car.root.traverse(o => { if (o.name.startsWith('tire-')) tires.push(o); });
  assert.equal(tires.length, 4);
  for (let i = 0; i <= 48; i++) {
    applyBounce(car.root, sampleBounce(i / 48, 1));
    car.root.updateMatrixWorld(true);
    for (const tire of tires) {
      const box = new THREE.Box3().setFromObject(tire);
      assert.ok(Math.abs(box.min.y) < 1e-5, `tire floating/sinking at phase ${i / 48}: ${box.min.y}`);
    }
    const box = new THREE.Box3().setFromObject(car.root);
    assert.ok(Math.abs(box.min.y) < 1e-5);
    assert.ok([...box.min, ...box.max].every(Number.isFinite));
  }
  assert.ok(car.root.getObjectByName('dashboard'));
  assert.ok(car.root.getObjectByName('steering-wheel'));
  assert.ok(car.root.getObjectByName('rear-bench'));
  assert.ok(car.root.getObjectByName('chassis'));
  assert.ok(car.root.getObjectByName('engine-1nz-fe'));
  const before=[];car.root.traverse(o=>before.push([o,o.visible]));const transform=car.root.matrixWorld.clone();
  car.setMechanicalView(true);
  assert.equal(car.root.getObjectByName('continuous-body').visible,false);assert.equal(car.interior.visible,false);
  assert.equal(car.root.getObjectByName('rolling-gear').visible,true);assert.equal(car.root.getObjectByName('chassis').visible,true);
  car.setMechanicalView(false);
  for(const [o,visible] of before)assert.equal(o.visible,visible,`${o.name} not restored`);
  assert.ok(car.root.matrixWorld.equals(transform));
});

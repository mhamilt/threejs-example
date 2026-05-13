import * as THREE from
  'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.165/examples/jsm/controls/OrbitControls.js";

// --------------------------------------------------
// EMBEDDINGS
// --------------------------------------------------

import { embeddings } from './data/embeddings.js';

// --------------------------------------------------
// HUD
// --------------------------------------------------

const hud = document.getElementById('hud');
// --------------------------------------------------
// SCENE
// --------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.001,
  10000
);

camera.position.set(0, 0, 30);

// const helper = new THREE.CameraHelper(camera);
// scene.add(helper);
// --------------------------------------------------
// RENDERER
// --------------------------------------------------

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

document.body.appendChild(renderer.domElement);


// --------------------------------------------------
// ORBIT CONTROLS
// --------------------------------------------------

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.05;


// --------------------------------------------------
// LIGHTING
// --------------------------------------------------

const ambient = new THREE.AmbientLight(
  0xffffff,
  0.25
);

scene.add(ambient);

const pointLight = new THREE.PointLight(
  0xffffff,
  200
);

pointLight.position.set(5, 0, 0);

const lightSphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
});

const lightSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  lightSphereMaterial
);

lightSphereMaterial.emissive.r = 1;
lightSphereMaterial.emissive.g = 1;
lightSphereMaterial.emissive.b = 1;

console.log(lightSphereMaterial.emissive);
lightSphere.position.set(5, 0, 0);

// scene.add(pointLight);
// scene.add(lightSphere);


// --------------------------------------------------
// BUILD POINT CLOUD
// --------------------------------------------------

const SCALE = 100;

const words = [];
const positions = [];

for (const word in embeddings) {

  const [x, y, z] = embeddings[word];

  positions.push(
    x * SCALE,
    y * SCALE,
    z * SCALE
  );

  words.push(word);
}

const geometry = new THREE.BufferGeometry();

geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(
    positions,
    3
  )
);


// --------------------------------------------------
// POINT MATERIAL
// --------------------------------------------------

const material = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.06,
  sizeAttenuation: true
});


// --------------------------------------------------
// POINT CLOUD
// --------------------------------------------------

const pointCloud = new THREE.Points(
  geometry,
  material
);

scene.add(pointCloud);


// --------------------------------------------------
// HOVER SPHERE
// --------------------------------------------------

const hoverSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xff0000
  })
);

const selectedSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0x00ff00
  })
);

const originSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0x0000ff
  })
);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(30.9, 32, 32),
  lightSphereMaterial
);
sun.position.set(300, 0, 0);

const sunLight = new THREE.PointLight(
  0xffffff,
  200000
);
sunLight.position.set(300, 0, 0);


hoverSphere.visible = false;
selectedSphere.visible = false;

scene.add(hoverSphere);
scene.add(selectedSphere);
scene.add(originSphere);
scene.add(sun);
scene.add(sunLight);

// two points
const origin = new THREE.Vector3(0, 0, 0);
const lineEnd = new THREE.Vector3(1, 1, 1);

// // geometry from points
// const lineGeometry = new THREE.BufferGeometry().setFromPoints([
//   point1,
//   point2
// ]);

// // create the line
// const originLine = new THREE.Line(lineGeometry, lightSphereMaterial);
const originCyli = new THREE.CylinderGeometry(
  0.1,
  0.1,
  10,
  8
);
const originLine = new THREE.Mesh(originCyli, lightSphereMaterial);
// add to scene
// scene.add(originLine);



// --------------------------------------------------
// RAYCASTER
// --------------------------------------------------

const raycaster = new THREE.Raycaster();

// controls picking radius
raycaster.params.Points.threshold = 0.12;

const mouse = new THREE.Vector2();


// --------------------------------------------------
// MOUSE MOVE
// --------------------------------------------------

window.addEventListener("mousemove", (e) => {

  mouse.x =
    (e.clientX / window.innerWidth) * 2 - 1;

  mouse.y =
    -(e.clientY / window.innerHeight) * 2 + 1;
});


// --------------------------------------------------
// DOUBLE CLICK
// --------------------------------------------------

window.addEventListener("dblclick", () => {


  raycaster.setFromCamera(mouse, camera);

  const hits =
    raycaster.intersectObject(pointCloud);

  if (hits.length > 0) {

    const hit = hits[0];

    const p = hit.point;
    const i = hit.index;
    const pos = pointCloud.geometry.attributes.position;

    selectedSphere.position.set(
      pos.getX(i),
      pos.getY(i),
      pos.getZ(i)
    );

    // move second point
    // const v2 = originLine.geometry.attributes.position.array;

    // v2[3] = pos.getX(i); // x
    // v2[4] = pos.getY(i);  // y
    // v2[5] = pos.getZ(i); // z
    // originLine.geometry.attributes.position.needsUpdate = true;
    // lineEnd.set({x:pos.getX(i),y:pos.getY(i),z:pos.getZ(i)});
    // updateLine(originLine, origin, lineEnd);
  //   originLine.quaternion.setFromUnitVectors(
  //   new THREE.Vector3(0, 1, 0), // cylinder default up axis
  //   direction.clone().normalize()
  // );

    selectedSphere.visible = true;

    // smooth orbit target transition
    targetFocus.copy(p);

    const word = words[i];
    hud.textContent = word;
  }
});


// --------------------------------------------------
// CAMERA FOCUS
// --------------------------------------------------

const targetFocus = new THREE.Vector3();
const currentFocus = new THREE.Vector3();


// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

function animate(time) {

  requestAnimationFrame(animate);

  // Example 1: smooth circular motion
  sun.position.x = Math.sin(time * 0.00003) * 300;
  sun.position.y = Math.cos(time * 0.00003) * 300;
  sunLight.position.x = sun.position.x;
  sunLight.position.y = sun.position.y;

  // Optional: rotation too
  // sun.rotation.y += 0.01;


  controls.update();


  // --------------------------------
  // RAYCAST
  // --------------------------------

  raycaster.setFromCamera(mouse, camera);

  const intersects =
    raycaster.intersectObject(pointCloud);


  // --------------------------------
  // HOVER
  // --------------------------------

  if (intersects.length > 0) {

    const hit = intersects[0];

    const i = hit.index;

    const pos = pointCloud.geometry.attributes.position;

    hoverSphere.position.set(
      pos.getX(i),
      pos.getY(i),
      pos.getZ(i)
    );

    hoverSphere.visible = true;

  } else {

    hoverSphere.visible = false;
  }


  // --------------------------------
  // SMOOTH FOCUS
  // --------------------------------

  currentFocus.lerp(targetFocus, 0.035);

  controls.target.copy(currentFocus);


  // --------------------------------
  // RENDER
  // --------------------------------

  renderer.render(scene, camera);
}

animate();


// --------------------------------------------------
// RESIZE
// --------------------------------------------------

window.addEventListener("resize", () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

window.addEventListener('keydown', (event) => {

  if (event.key === 'c' || event.key === 'C') {

    console.log('Camera position:', camera.position);
  }

});


function makeline(start, end, radius = 0.02, color = 0xffffff) {
  // direction vector
  const direction = new THREE.Vector3().subVectors(end, start);

  // cylinder length
  const length = direction.length();

  // geometry
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    length,
    8
  );

  // material
  const material = new THREE.MeshBasicMaterial({ color });

  const cylinder = new THREE.Mesh(geometry, material);

  // midpoint between start/end
  const midpoint = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);

  cylinder.position.copy(midpoint);

  // orient cylinder
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // cylinder default up axis
    direction.clone().normalize()
  );

  return cylinder;
}

function updateLine(cylinder, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  // update position
  cylinder.position.copy(
    new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5)
  );

  // update rotation
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  // update scale instead of rebuilding geometry
  cylinder.scale.set(1, length, 1);
}
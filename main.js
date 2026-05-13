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
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 0, 500);


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
  4
);

pointLight.position.set(5, 5, 5);

scene.add(pointLight);


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
  new THREE.SphereGeometry(0.9, 126, 126),
  new THREE.MeshStandardMaterial({
    color: 0xff0000
  })
);

const selectedSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 126, 126),
  new THREE.MeshStandardMaterial({
    color: 0x00ff00
  })
);

const originSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 126, 126),
  new THREE.MeshStandardMaterial({
    color: 0x0000ff
  })
);

hoverSphere.visible = false;
selectedSphere.visible = false;

scene.add(hoverSphere);
scene.add(selectedSphere);
scene.add(originSphere);


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

function animate() {

  requestAnimationFrame(animate);

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



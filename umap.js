import * as THREE from
  'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';
import { OrbitControls } from
  "https://cdn.jsdelivr.net/npm/three@0.165/examples/jsm/controls/OrbitControls.js";
import { ImprovedNoise } from 'https://cdn.jsdelivr.net/npm/three@0.165/examples/jsm/math/ImprovedNoise.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165/examples/jsm/loaders/STLLoader.js';

// --------------------------------------------------
// EMBEDDINGS
// --------------------------------------------------

import { embeddings } from './data/embeddings_MAP.js';

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
  0.05
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

const SCALE = 300;

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
  size: 0.01,
  sizeAttenuation: true
});


const pointMaterial = new THREE.ShaderMaterial({

  uniforms: {
    pointSize: { value: 0.2 }
  },

  vertexShader: `

    uniform float pointSize;

    void main() {

      vec4 mvPosition =
        modelViewMatrix * vec4(position, 1.0);

      gl_PointSize =
        pointSize * (300.0 / -mvPosition.z);

      gl_Position =
        projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: `

    void main() {

      vec2 c = gl_PointCoord - vec2(0.5);

      if (length(c) > 0.5)
        discard;

      gl_FragColor =
        vec4(1.0, 1.0, 1.0, 1.0);
    }
  `,

  transparent: true
});

// --------------------------------------------------
// POINT CLOUD
// --------------------------------------------------

const pointCloud = new THREE.Points(
  geometry,
  pointMaterial
);

scene.add(pointCloud);


// --------------------------------------------------
// HOVER SPHERE
// --------------------------------------------------

const sphereGeometry =
  new THREE.SphereGeometry(1, 128, 128);

const hoverSphere = new THREE.Mesh(
  sphereGeometry,
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

// const noise = new ImprovedNoise();

// function changeSphere() {
//   //   const position = sphereGeometry.attributes.position;
//   // const vertex = new THREE.Vector3();
//   // const normal = new THREE.Vector3();
//   // for (let i = 0; i < position.count; i++) {

//   //     vertex.fromBufferAttribute(position, i);

//   //     // Original sphere direction
//   //     normal.copy(vertex).normalize();

//   //     // Noise coordinates
//   //     const frequency = 8;
//   //     const amplitude = 0.07;

//   //     const n = noise.noise(
//   //       normal.x * frequency,
//   //       normal.y * frequency,
//   //       normal.z * frequency
//   //     );

//   //     // Push vertex outward along normal
//   //     const radius = 1 + n * amplitude;

//   //     vertex.copy(normal).multiplyScalar(radius);

//   //     position.setXYZ(i, vertex.x, vertex.y, vertex.z);
//   //   }

//   //   position.needsUpdate = true;

//   //   sphereGeometry.computeVertexNormals();
//   const position = sphereGeometry.attributes.position;

//   const p = new THREE.Vector3();
//   const n = new THREE.Vector3();

//   const frequency = 5.2;   // constant everywhere
//   const amplitude = 0.25;

//   for (let i = 0; i < position.count; i++) {

//     p.fromBufferAttribute(position, i);

//     // normalize -> point on unit sphere
//     n.copy(p).normalize();

//     // seamless 3D noise sampling on sphere surface
//     const value = noise.noise(
//       n.x * frequency,
//       n.y * frequency,
//       n.z * frequency
//     );

//     // displacement strictly along normal
//     const radius = 1 + value * amplitude;

//     p.copy(n).multiplyScalar(radius);

//     position.setXYZ(i, p.x, p.y, p.z);
//   }

//   sphereGeometry.computeVertexNormals();
//   position.needsUpdate = true;
// }

// changeSphere();

const loader = new STLLoader();

loader.load('/earthmap.stl', (geometry) => {
  const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const mesh = new THREE.Mesh(geometry, material);

  // Optional: center it
  geometry.computeBoundingBox();
  geometry.center();
   geometry.computeVertexNormals();

  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);

  console.log(size)

  scene.add(mesh);
},
  undefined,
  function (error) {
    console.error("Error loading STL:", error);
  });


const originSphere = new THREE.Mesh(
  sphereGeometry,
  new THREE.MeshStandardMaterial({
    color: 0x0000ff
  })
);



const sun = new THREE.Mesh(
  new THREE.SphereGeometry(30.9, 32, 32),
  lightSphereMaterial
);
sun.position.set(3 * SCALE, 0, 0);

const sunLight = new THREE.PointLight(
  0xffffff,
  2000000
);
sunLight.position.set(3 * SCALE, 0, 0);


hoverSphere.visible = false;
selectedSphere.visible = false;

scene.add(hoverSphere);
scene.add(selectedSphere);
// scene.add(originSphere);
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
  else {
    targetFocus.copy(origin)
    selectedSphere.visible = false;
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
  sun.position.x = Math.sin(time * 0.00003) * 2.5 * SCALE;
  sun.position.y = Math.cos(time * 0.00003) * 2.5 * SCALE;
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



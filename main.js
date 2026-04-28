import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Floor
const floorTexture = new THREE.TextureLoader().load('/textures/grid.png');
floorTexture.repeat = new THREE.Vector2(500, 500);
floorTexture.wrapS = THREE.ReplaceWrapping;
floorTexture.wrapT = THREE.ReplaceWrapping;

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ map: floorTexture })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Tank
let tank;
let leftTrackMeshes  = [];
let rightTrackMeshes = [];
let leftWheels       = [];
let rightWheels      = [];

const LEFT_WHEEL_NAMES = [
  "RoadWheel_L_1", "RoadWheel_L_2", "RoadWheel_L_3",
  "RoadWheel_L_4", "RoadWheel_L_5", "RoadWheel_L_6", "RoadWheel_L_7",
  "Idler_L", "Sprocket_L",
  "ReturnRoller_L_1", "ReturnRoller_L_2",
];

const RIGHT_WHEEL_NAMES = [
  "RoadWheel_R_1", "RoadWheel_R_2", "RoadWheel_R_3",
  "RoadWheel_R_4", "RoadWheel_R_5", "RoadWheel_R_6", "RoadWheel_R_7",
  "Idler_R", "Sprocket_R",
  "ReturnRoller_R_1", "ReturnRoller_R_2",
];

// Load GLB
const loader = new GLTFLoader();
loader.load("./models/tank.glb", (gltf) => {
  tank = gltf.scene;
  scene.add(tank);

  // Tracks
  const leftTrackNames  = ["Object_136"];
  const rightTrackNames = ["Object_139"];

  tank.traverse((child) => {
    // Tracks — use previously working names
    if (child.isMesh) {
      if (leftTrackNames.includes(child.name)) {
        if (child.material.map) {
          child.material.map.wrapS = THREE.RepeatWrapping;
          child.material.map.wrapT = THREE.RepeatWrapping;
          child.material.map.needsUpdate = true;
        }
        leftTrackMeshes.push(child);
        console.log("Left track found:", child.name);
      }

      if (rightTrackNames.includes(child.name)) {
        if (child.material.map) {
          child.material.map.wrapS = THREE.RepeatWrapping;
          child.material.map.wrapT = THREE.RepeatWrapping;
          child.material.map.needsUpdate = true;
        }
        rightTrackMeshes.push(child);
        console.log("Right track found:", child.name);
      }
    }

    // Wheels check 
    if (LEFT_WHEEL_NAMES.includes(child.name)) {
      leftWheels.push(child);
      console.log("Left wheel found:", child.name);
    }
    if (RIGHT_WHEEL_NAMES.includes(child.name)) {
      rightWheels.push(child);
      console.log("Right wheel found:", child.name);
    }
  });
});

// UV Texture Scrolling tracks
function scrollTracks(meshes, amount) {
  for (const mesh of meshes) {
    if (mesh.material.map) {
      mesh.material.map.offset.x += amount;
    }
  }
}

// Rotate wheels on local X axis
function rotateWheels(wheels, amount) {
  for (const w of wheels) {
    w.rotation.x -= amount;
  }
}

// Movement
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup",   (e) => (keys[e.key.toLowerCase()] = false));

const speed         = 0.03;
const rotationSpeed = 0.003;
const scrollSpeed   = 0.003;
const wheelSpeed    = 0.03;

// Orbit camera
let orbitTheta  = Math.PI;
let orbitPhi    = 0.4;
let orbitRadius = 10;

const minPhi    = 0.1;
const maxPhi    = Math.PI / 2 - 0.05;
const minRadius = 3;
const maxRadius = 30;

let isDragging = false;
let prevMouseX = 0;
let prevMouseY = 0;

renderer.domElement.addEventListener("mousedown", (e) => {
  isDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});
window.addEventListener("mouseup", () => { isDragging = false; });
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - prevMouseX;
  const dy = e.clientY - prevMouseY;
  orbitTheta -= dx * 0.005;
  orbitPhi    = Math.max(minPhi, Math.min(maxPhi, orbitPhi - dy * 0.005));
  prevMouseX  = e.clientX;
  prevMouseY  = e.clientY;
});

renderer.domElement.addEventListener("touchstart", (e) => {
  isDragging = true;
  prevMouseX = e.touches[0].clientX;
  prevMouseY = e.touches[0].clientY;
});
window.addEventListener("touchend",  () => { isDragging = false; });
window.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - prevMouseX;
  const dy = e.touches[0].clientY - prevMouseY;
  orbitTheta -= dx * 0.005;
  orbitPhi    = Math.max(minPhi, Math.min(maxPhi, orbitPhi - dy * 0.005));
  prevMouseX  = e.touches[0].clientX;
  prevMouseY  = e.touches[0].clientY;
});

window.addEventListener("wheel", (e) => {
  orbitRadius = Math.max(minRadius, Math.min(maxRadius, orbitRadius + e.deltaY * 0.02));
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (tank) {
    if (keys["w"]) {
      tank.translateZ(-speed);
      scrollTracks(leftTrackMeshes,   scrollSpeed);
      scrollTracks(rightTrackMeshes,  scrollSpeed);
      rotateWheels(leftWheels,         wheelSpeed);
      rotateWheels(rightWheels,        wheelSpeed);
    }
    if (keys["s"]) {
      tank.translateZ(speed);
      scrollTracks(leftTrackMeshes,  -scrollSpeed);
      scrollTracks(rightTrackMeshes, -scrollSpeed);
      rotateWheels(leftWheels,        -wheelSpeed);
      rotateWheels(rightWheels,       -wheelSpeed);
    }
    if (keys["a"]) {
      tank.rotation.y += rotationSpeed;
      scrollTracks(leftTrackMeshes,  -scrollSpeed);
      scrollTracks(rightTrackMeshes,  scrollSpeed * 2);
      rotateWheels(leftWheels,        -wheelSpeed);
      rotateWheels(rightWheels,        wheelSpeed * 2);
    }
    if (keys["d"]) {
      tank.rotation.y -= rotationSpeed;
      scrollTracks(leftTrackMeshes,   scrollSpeed * 2);
      scrollTracks(rightTrackMeshes, -scrollSpeed);
      rotateWheels(leftWheels,         wheelSpeed * 2);
      rotateWheels(rightWheels,       -wheelSpeed);
    }

    // Orbit camera
    const tankPos = tank.position;
    const camX = tankPos.x + orbitRadius * Math.sin(orbitTheta) * Math.cos(orbitPhi);
    const camY = tankPos.y + orbitRadius * Math.sin(orbitPhi);
    const camZ = tankPos.z + orbitRadius * Math.cos(orbitTheta) * Math.cos(orbitPhi);
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
    camera.lookAt(tankPos);
  }

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

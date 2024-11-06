import * as THREE from "three";
// import picture from "/textures/grid_medium.png";
import picture from "/textures/earth.jpg";
import { addRotate } from "./add_rotate";

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(picture);

let theta = 0;
let phi = 0;

const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // vUv = vec2(1., .5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

const fragmentShader = `
      uniform sampler2D texture_2d;
      uniform float u_time;
      uniform vec2 u_clickUv;
      varying vec2 vUv;

      #define PI 3.1415926535897932384626433832795
      uniform float barrel_power;

      vec2 distort(vec2 p)
      {
          float theta  = atan(p.y, p.x);
          float radius = length(p);
          radius = pow(radius, barrel_power);
          p.x = radius * cos(theta);
          p.y = radius * sin(theta);
          return 0.5 * (p + 1.0);
      }

      #define SCALING_FACTOR 4.0

      void main()
      {
        float x = SCALING_FACTOR * vUv.x - 0.;
        float y = SCALING_FACTOR * vUv.y - 1.;
        vec2 xy = vec2(x, y);
        vec2 uv;
        float d = length(xy);

        float x2 = 4.0 * vUv.x - 4.;
        float y2 = 4.0 * vUv.y - 1.;
        vec2 xy2 = vec2(x2, y2);
        float d2 = length(xy2);

        if      (d < 1.)  { uv = distort(xy); }
        else if (d2 < 1.) { uv = distort(xy2); }
        else              { uv = vUv.xy; }

        vec4 c = texture2D(texture_2d, uv);
        // c = texture2D(texture_2d, vUv);
        gl_FragColor = c;
      }
    `;

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let planes = [];

const create_plane = (x, y) => {
  // Create a plane geometry and apply the shader material
  const geometry = new THREE.PlaneGeometry(1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texture_2d: { value: texture },
      u_time: { value: 0 },
      u_clickUv: { value: new THREE.Vector2(0.55, 0.55) },
      barrel_power: { value: 1.5 },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(x, y, 0);

  planes.push(plane);
  scene.add(plane);
};

// create_plane(-1, -1);
// create_plane(-1, 0);
// create_plane(-1, 1);
// create_plane(0, -1);
// create_plane(0, 0);
// create_plane(0, 1);
// create_plane(1, -1);
// create_plane(1, 0);
// create_plane(1, 1);

const geometry = new THREE.SphereGeometry(0.75, 32, 32);
const material = new THREE.ShaderMaterial({
  uniforms: {
    texture_2d: { value: texture },
    u_time: { value: 0 },
    u_clickUv: { value: new THREE.Vector2(0.55, 0.55) },
    barrel_power: { value: 1.5 },
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
});

let sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

addRotate({ forObject: sphere });

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  let clock = new THREE.Clock();
  let delta_in_seconds = clock.getDelta();
  let delta_in_millis = delta_in_seconds / 1000;

  planes.forEach(
    (plane) => (plane.material.uniforms.u_time.value += delta_in_millis),
  );
}

animate();

planes.length;

import * as THREE from "three";
import { addRotate } from "./add_rotate";

// import picture from "/textures/grid_medium.png";
import picture from "/textures/earth.jpg";

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

      vec3 uvToSphere(vec2 uv) {
        float theta = uv.y * PI; // v * π
        float phi = uv.x * 2. * PI; // u * 2π

        float x = sin(theta) * cos(phi);
        float y = sin(theta) * sin(phi);
        float z = cos(theta);
        return vec3(x, y, z);
      }

      vec2 sphereToUv(vec3 uv3) {
        float theta = acos(uv3.z);
        float phi = atan(uv3.y, uv3.x);

        // Ensure phi is in the range [0, 2π]
        if (phi < 0.0) {
            phi += 2.0 * PI;
        }

        return vec2(
          phi / (2. * PI),
          theta / PI
        );
      }

      float sphericalDistance(vec2 uv1, vec2 uv2) {
        vec3 p = uvToSphere(uv1);
        vec3 q = uvToSphere(uv2);
        return acos(dot(p, q));
      }

      void main()
      {
        vec2 uv = vUv;
        const float ZOOM_POWER = 10.;
        const float CIRCLE_RADIUS = 0.25;
        const vec2 CIRCLE_1_POS = vec2(.5); // TODO: čia yra u_clickUv

        // vec2 circle_1_center = vec2(CIRCLE_1_POS);
        // vec2 dir_1 = circle_1_center - vUv;
        // dir_1 *= -1.;
        // float d_1 = sphericalDistance(circle_1_center, vUv);

        // if (d_1 < CIRCLE_RADIUS) {
        //   float _d = (CIRCLE_RADIUS - d_1);
        //   uv = vUv - dir_1 * _d * ZOOM_POWER;
        // }

        vec3 uv3 = uvToSphere(uv);
        uv = sphereToUv(uv3);

        vec4 colour = texture2D(texture_2d, uv);
        // vec3 c = vec3(d_1, 0., 0.);
        // colour = vec4(c, 1.);
        gl_FragColor = colour;
      }
      // void main()
      // {
      //   vec2 uv = vUv;
      //   const float ZOOM_POWER = 0.5;
      //   const float CIRCLE_RADIUS = 0.25;
      //   const vec2 CIRCLE_1_POS = vec2(.5);

      //   // Convert UV positions to 3D sphere positions
      //   vec3 p_center = uvToSphere(CIRCLE_1_POS);
      //   vec3 p_uv = uvToSphere(vUv);

      //   // Calculate the direction on the sphere's surface
      //   vec3 dir_1 = p_center - p_uv;

      //   // Get the spherical distance between the two UV points
      //   float d_1 = sphericalDistance(CIRCLE_1_POS, vUv);

      //   // // Apply zoom effect if within the circle radius
      //   // if (d_1 < CIRCLE_RADIUS) {
      //   //   float _d = (CIRCLE_RADIUS - d_1);
      //   //   // Project the 3D direction back to UV space
      //   //   vec3 displacedPoint = p_uv + dir_1 * _d * ZOOM_POWER;

      //   //   // Inverse transform to UV space
      //   //   float theta = acos(displacedPoint.z); // angle from the z-axis
      //   //   float phi = atan(displacedPoint.y, displacedPoint.x); // angle around the z-axis
      //   //   uv.x = phi / (2. * PI);
      //   //   uv.y = theta / PI;
      //   // }

      //   vec4 colour = texture2D(texture_2d, uv);
      //   gl_FragColor = colour;
      // }
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
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(x, y, 0);

  planes.push(plane);
  scene.add(plane);
};

create_plane(-1, -1);
create_plane(-1, 0);
create_plane(-1, 1);
create_plane(0, -1);
create_plane(0, 0);
create_plane(0, 1);
create_plane(1, -1);
create_plane(1, 0);
create_plane(1, 1);

const geometry = new THREE.SphereGeometry(0.75, 32, 32);
const material = new THREE.ShaderMaterial({
  uniforms: {
    texture_2d: { value: texture },
    u_time: { value: 0 },
    u_clickUv: { value: new THREE.Vector2(0.55, 0.55) },
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

import * as THREE from "three";
import { addRotate } from "./add_rotate";

import picture from "/textures/grid_tiny.png";
// import picture from "/textures/earth.jpg";

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

      vec3 rotateY(vec3 point, float angle) {
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);
          mat3 rotationMatrix = mat3(
              cosAngle, 0.0, sinAngle,
              0.0, 1.0, 0.0,
              -sinAngle, 0.0, cosAngle
          );
          return rotationMatrix * point;
      }

      vec3 rotateZ(vec3 point, float angle) {
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);

          // Rotation matrix around the Z-axis
          mat3 rotationMatrix = mat3(
              cosAngle, -sinAngle, 0.0,
              sinAngle, cosAngle,  0.0,
              0.0,      0.0,       1.0
          );

          // Apply the rotation matrix to the point
          return rotationMatrix * point;
      }

      vec3 rotateX(vec3 point, float angle) {
          float cosAngle = cos(angle);
          float sinAngle = sin(angle);

          mat3 rotationMatrix = mat3(
              1.0, 0.0, 0.0,
              0.0, cosAngle, -sinAngle,
              0.0, sinAngle, cosAngle
          );

          return rotationMatrix * point;
      }

      void main()
      {
        vec2 uv = vUv;
        const float ZOOM_POWER = 2.;
        const float CIRCLE_RADIUS = 0.4;
        vec2 CIRCLE_CENTER_POS = vec2(0.5);

        vec3 uv3 = uvToSphere(uv);
        vec3 CIRCLE_CENTER_POS_3 = uvToSphere(CIRCLE_CENTER_POS);

        const vec3 ROTATION = vec3(0.0, PI / 2., 0.);
        // const vec3 ROTATION = vec3(0.0, 0., 0.);

        uv3 = rotateX(uv3, ROTATION.x);
        uv3 = rotateY(uv3, ROTATION.y);
        uv3 = rotateZ(uv3, ROTATION.z);
        CIRCLE_CENTER_POS_3 = rotateX(CIRCLE_CENTER_POS_3, ROTATION.x);
        CIRCLE_CENTER_POS_3 = rotateY(CIRCLE_CENTER_POS_3, ROTATION.y);
        CIRCLE_CENTER_POS_3 = rotateZ(CIRCLE_CENTER_POS_3, ROTATION.z);

        uv = sphereToUv(uv3);
        CIRCLE_CENTER_POS = sphereToUv(CIRCLE_CENTER_POS_3);

        vec2 dir_1 = CIRCLE_CENTER_POS - uv;
        dir_1 *= -1.;
        float d_1 = sphericalDistance(CIRCLE_CENTER_POS, uv);

        if (d_1 < CIRCLE_RADIUS) {
          float _d = (CIRCLE_RADIUS - d_1); //* 5.*sin(.35 / d);
          uv = uv - dir_1 * _d * ZOOM_POWER;
          // colour = vec4(1., 1., 0., 1.);
        }

        vec4 colour = texture2D(texture_2d, uv);
        // vec3 c = vec3(d_1, 0., 0.);
        // colour = vec4(c, 1.);
        gl_FragColor = colour;
      }`;

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

sphere.rotateY(-Math.PI / 2);

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

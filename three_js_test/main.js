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

        const float ZOOM_POWER = 3.;
        const float ELLIPSE_RADIUS = 0.1;
        vec2 ELLIPSE_CENTER_POS = vec2(0.5); // i.e. u_clickUv

        vec3 uv3 = uvToSphere(uv);
        vec3 ELLIPSE_CENTER_POS_3 = uvToSphere(ELLIPSE_CENTER_POS);

        const vec2 ROTATION = vec2(2., 2.);

        uv3 = rotateX(uv3, ROTATION.x);
        uv3 = rotateY(uv3, ROTATION.y);
        ELLIPSE_CENTER_POS_3 = rotateX(ELLIPSE_CENTER_POS_3, ROTATION.x);
        ELLIPSE_CENTER_POS_3 = rotateY(ELLIPSE_CENTER_POS_3, ROTATION.y);

        uv = sphereToUv(uv3);
        ELLIPSE_CENTER_POS = sphereToUv(ELLIPSE_CENTER_POS_3);

        // čia elipsės sdf'as, i think...
        vec2 coord = (uv - ELLIPSE_CENTER_POS) / vec2(ELLIPSE_RADIUS / 2., ELLIPSE_RADIUS);
        float d = dot(coord, coord);
        vec2 dir = uv - ELLIPSE_CENTER_POS;

        vec4 colour = texture2D(texture_2d, uv);
        if (d <= 1.) {
          // float _d = (ELLIPSE_RADIUS - d); //* 5.*sin(.35 / d);
          // vec2 offset = dir * _d * .1;
          // // uv.x = uv.x - offset.x / 2.;
          // // uv.y = uv.y - offset.y;
          // // colour = vec4(1., 1., 0., 1.);
          // uv = uv + offset;
          // colour = texture(texture_2d, uv);

          // colour = vec4(1., 1., 0., 1.);
        }

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

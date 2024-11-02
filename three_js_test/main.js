import * as THREE from "three";
import earthTexture from "/textures/earth.jpg";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// Load texture
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(earthTexture);

// Create a sphere with custom shader material
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_zoom: { value: 1 },
    u_texture: { value: texture },
    u_clickUv: { value: new THREE.Vector2(0.5, 0.5) }, // Start zoom at center by default
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform float u_zoom;
      uniform sampler2D u_texture;
      uniform vec2 u_clickUv;
      varying vec2 vUv;

      void main() {
        // Calculate continuous UVs with wrapping
        vec2 uvOffset = (vUv - u_clickUv) * u_zoom;
        uvOffset = mod(uvOffset + 1.0, 1.0); // Wrap UVs in [0,1]
        vec2 wrappedUv = uvOffset + u_clickUv;

        // Sample texture with wrapped UV coordinates
        vec4 texColor = texture2D(u_texture, vUv);
        gl_FragColor = texColor;
      }`,
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

const line_material = new THREE.LineBasicMaterial({ color: 0x0000ff });
const points = [];
points.push(new THREE.Vector3(-10, -5, 2));
points.push(new THREE.Vector3(0, 5, 0));
points.push(new THREE.Vector3(5, 0, -2));

const line_geometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(line_geometry, line_material);
scene.add(line);

camera.position.z = 2;
camera.position.y = 0;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function animate() {
  renderer.render(scene, camera);
  sphere.rotation.x += 0.005;
  sphere.rotation.y += 0.0025;

  camera.position.z += 0.002;
}
renderer.setAnimationLoop(animate);

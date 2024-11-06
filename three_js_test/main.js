import * as THREE from "three";
import picture from "/textures/grid_medium.png";
// import picture from "/textures/cat.png";

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(picture);

// Vertex shader (example.vert)
const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // vUv = vec2(1., .5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

// Fragment shader (example.frag)
const fragmentShader = `
      uniform sampler2D u_texture;
      uniform float u_time;
      varying vec2 vUv;

      void main() {
        float u_zoom = 1.;
        vec2 uv = vUv;
        // gl_FragColor = vec4(0., vUv.xy / 2., 1.0);

        vec2 click_pos = vec2(0.5, 0.5); // <- Šitą vėliau reikės pakeist į actual click'o koordinates
        vec2 u_clickUv = click_pos;
        vec3 circle = vec3(click_pos, 0.25);
        float d = length(vUv - circle.xy) - circle.z;

        // float frag_zoom = d/(.5 + exp(2.0 * d));

        float frag_zoom = d/(10.0 + exp(5.0 * d));
        // vec2 vUv = vec2(vUv.x + frag_zoom, vUv.y + frag_zoom);
        // vUv = mod(vUv, 1.0); // Wrap UVs in [0,1]
        // vec2 offsetUV = vUv;
        // vec2 offsetUV = vUv + (1. / (lenght(click_pos - vUv) + .000000001) );

        float thing = (1. - smoothstep(0., 1., length( (click_pos - vUv) / .25))) / 10.;
        // vec4 texColor = vec4(thing, thing, .0, 1.);

        float x_dir = 0.;
        float y_dir = 0.;

        x_dir = (uv.x < click_pos.x) ? -1. : 1.; // čia biški neteisingas skaičiavimas, kai uv == click_pos
        y_dir = (uv.y < click_pos.y) ? -1. : 1.; // čia biški neteisingas skaičiavimas, kai uv == click_pos

        vec2 offsetUV = vec2(
          uv.x + thing * x_dir,
          uv.y + thing * y_dir
        );

        // [ GLOBE-ZOOM ]
        vec2 ray = normalize(u_clickUv - vUv);

        frag_zoom = d/(.5 + exp(2.0 * d));

        uv = vUv + normalize(ray) * u_zoom * frag_zoom;

        uv = mod(uv, 1.0); // Wrap UVs in [0,1]

        offsetUV = uv;
        // [ GLOBE-ZOOM ]

        vec4 texColor = texture2D(u_texture, offsetUV);
        // vec4 texColor = vec4(, 0., 0., 1.);

        gl_FragColor = texColor;
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
      u_texture: { value: texture },
      u_time: { value: 0 },
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

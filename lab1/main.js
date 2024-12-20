import _ from 'lodash';
import { pow2 } from 'three/webgpu';

const sleep = ({forTime, andThen}) => {
  setTimeout(andThen, forTime);
}

const canvas = document.getElementById('canvas');
const width = canvas.getAttribute('width');
const height = canvas.getAttribute('height');

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

const block = [
  [0, 1, 1, 0],
  [1, 0, 1, 1],
  [1, 0, 1, 0],
  [1, 0, 1, 0],
];
const blockSize = block.length;

// ctx.fillRect(0, 0, 10, 10); // Top-left
// ctx.fillRect(0, height - 10, 10, 10); // Bottom-left
// ctx.fillRect(width - 10, height - 10, 10, 10); // Bottom-right
// ctx.fillRect(width - 10, 0, 10, 10); // Top-right

const renderBlock = (x, y, l) => {
  const length = l / blockSize;

  ctx.beginPath();
  block.forEach((line, ix) => {
    line.forEach((mask, jx) => {
      if (mask != 1) { return; }

      ctx.rect(x + jx * length, y + ix * length, length, length);
      ctx.fill();
    });
  })
  ctx.closePath();
};

const transformBlock = () => {}; // TODO

renderBlock(0, 0, 512);

const depthLimit = 1;
const depth = depthLimit;

console.log(`depth: ${depth}`);
ctx.clearRect(0, 0, width, height);

renderBlock(0, 0, 512 / (2**depth));

console.log('done rendering');
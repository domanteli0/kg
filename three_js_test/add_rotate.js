export const addRotate = (params) => {
  let object = params.forObject;

  const onKeyDown = (event) => {
    console.log(event.key);
    switch (event.key) {
      case "ArrowLeft":
        // Left pressed
        object.rotation.y += 0.05;
        break;
      case "ArrowRight":
        // Right pressed
        object.rotation.y -= 0.05;
        break;
      case "ArrowUp":
        // Left pressed
        object.rotation.x += 0.05;
        break;
      case "ArrowDown":
        // Right pressed
        object.rotation.x -= 0.05;
        break;
      // case "Escape":
      //   const material = sphere.material;
      //   material.uniforms.u_zoom.value = 0.0; // Reset zoom
      //   break;
    }
  };

  window.addEventListener("keydown", onKeyDown);
};

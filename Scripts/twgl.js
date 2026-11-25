const canvasImg = document.createElement('canvas');
const ctx = canvasImg.getContext('2d');
canvasImg.width = 1;
canvasImg.height = 1;
function createTexturFromPix(color) {
 const buffer = new Uint8ClampedArray(1 * 1 * 4);
alert(buffer.length)
// Example: Fill the buffer with a simple red gradient
for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = color[0]; // Red value (0-99 across width)
    buffer[i + 1] = color[1];         // Green value
    buffer[i + 2] = color[2];         // Blue value
    buffer[i + 3] = color[3];       // Alpha value (fully opaque)
}
const imageData = new ImageData(buffer, 1, 1);
ctx.putImageData(imageData, 0, 0);

const img = new Image();
img.src = canvasImg.toDataURL('image/png'); // Produces a PNG data URI
return img
}

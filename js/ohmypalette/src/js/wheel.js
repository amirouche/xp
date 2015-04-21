function renderColorWheel(canvas, height, width) {
    var imageData, pixels, hue, saturation, value;
    var x, y, rx, ry, d, f, g, p, u, v, w, rgb;
    var i = 0;
    var context = canvas.getContext('2d');
    var cx = width / 2;
    var cy = height / 2;
    var radius = width  / 2;
    
    canvas.width = width;
    canvas.height = height;
    
    imageData = context.createImageData(width, height);
    pixels = imageData.data;
    
    for (y = 0; y < height; y = y + 1) {
        for (x = 0; x < width; x = x + 1, i = i + 4) {
            rx = x - cx;
            ry = y - cy;
            d = rx * rx + ry * ry;
            if (d < radius * radius) {
                hue = 6 * (Math.atan2(ry, rx) + Math.PI) / (2 * Math.PI);
                saturation = Math.sqrt(d) / radius;
                g = Math.floor(hue);
                f = hue - g;
                u = 255 * (1 - saturation);
                v = 255 * (1 - saturation * f);
                w = 255 * (1 - saturation * (1 - f));
                pixels[i] = [255, v, u, u, w, 255, 255][g];
                pixels[i + 1] = [w, 255, 255, v, u, u, w][g];
                pixels[i + 2] = [u, u, w, 255, 255, v, u][g];
                pixels[i + 3] = 255;
            }
        }
    }


    context.putImageData(imageData, 0, 0);
}


module.exports = renderColorWheel;

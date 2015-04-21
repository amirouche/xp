function getStops(base, property, minvalue, maxvalue, steps) {
    var stops = [];
    var diff = maxvalue - minvalue;
    var step, stop;
    
    for (var i = 0; i < steps; ++i) {
        step = i / (steps - 1);
        stop = base.clone();
	stop[property](step * diff + minvalue);
        stops[i] = {
            color: stop,
            position: Math.round(step * 100),
        };
    }
    
    return stops;
}


function getStyle(stops) {
    var css = "";

    for (var i = 0; i < stops.length; i++) {
        var stop = stops[i];
        css += "," + stop.color.hslaString() + " " + stop.position + "%";
    }

    return {'backgroundImage': "linear-gradient(to right" + css + ")"};
}

function getHue(color) {
    var stops = getStops(color, "hue", 0, 360, 7);
    var style = getStyle(stops);
 
    return style;
}

function getSaturation(color) {
    var stops = getStops(color, "saturation", 0, 100, 2);
    var style = getStyle(stops);

    return style;
}

function getLightness(color) {
    var stops = getStops(color, "lightness", 0, 100, 3);
    var style = getStyle(stops);
    return style;
}


module.exports = {
    hue: getHue,
    saturation: getSaturation,
    lightness: getLightness
}

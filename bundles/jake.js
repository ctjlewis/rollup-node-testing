import events from 'events';
import fs from 'fs';
import os from 'os';
import path$1 from 'path';
import util from 'util';
import child_process from 'child_process';
import coffeescript from 'coffeescript';
import 'livescript';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var escapeStringRegexp = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

var colorName = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

var conversions = createCommonjsModule(function (module) {
/* MIT license */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in colorName) {
	if (colorName.hasOwnProperty(key)) {
		reverseKeywords[colorName[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in colorName) {
		if (colorName.hasOwnProperty(keyword)) {
			var value = colorName[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};
});

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

var colorConvert = convert;

var ansiStyles = createCommonjsModule(function (module) {


const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var hasFlag = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};

const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

var templates = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

var chalk = createCommonjsModule(function (module) {


const stdoutColor = supportsColor_1.stdout;



const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return templates(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript
});

var async = createCommonjsModule(function (module) {
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--;
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        };
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
          return a.priority - b.priority;
        }
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }

        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };

              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if ( module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else {
        root.async = async;
    }

}());
});

let Task = task$1.Task;

// Split a task to two parts, name space and task name.
// For example, given 'foo:bin/a%.c', return an object with
// - 'ns'     : foo
// - 'name'   : bin/a%.c
function splitNs(task) {
  let parts = task.split(':');
  let name = parts.pop();
  let ns = resolveNs(parts);
  return {
    'name' : name,
    'ns'   : ns
  };
}

// Return the namespace based on an array of names.
// For example, given ['foo', 'baz' ], return the namespace
//
//   default -> foo -> baz
//
// where default is the global root namespace
// and -> means child namespace.
function resolveNs(parts) {
  let  ns = jake.defaultNamespace;
  for(let i = 0, l = parts.length; ns && i < l; i++) {
    ns = ns.childNamespaces[parts[i]];
  }
  return ns;
}

// Given a pattern p, say 'foo:bin/a%.c'
// Return an object with
// - 'ns'     : foo
// - 'dir'    : bin
// - 'prefix' : a
// - 'suffix' : .c
function resolve(p) {
  let task = splitNs(p);
  let name  = task.name;
  let ns    = task.ns;
  let split = path$1.basename(name).split('%');
  return {
    ns: ns,
    dir: path$1.dirname(name),
    prefix: split[0],
    suffix: split[1]
  };
}

// Test whether string a is a suffix of string b
function stringEndWith(a, b) {
  let l;
  return (l = b.lastIndexOf(a)) == -1 ? false : l + a.length == b.length;
}

// Replace the suffix a of the string s with b.
// Note that, it is assumed a is a suffix of s.
function stringReplaceSuffix(s, a, b) {
  return s.slice(0, s.lastIndexOf(a)) + b;
}

class Rule {
  constructor(opts) {
    this.pattern = opts.pattern;
    this.source = opts.source;
    this.prereqs = opts.prereqs;
    this.action = opts.action;
    this.opts = opts.opts;
    this.desc =  opts.desc;
    this.ns = opts.ns;
  }

  // Create a file task based on this rule for the specified
  // task-name
  // ======
  // FIXME: Right now this just throws away any passed-in args
  // for the synthsized task (taskArgs param)
  // ======
  createTask(fullName, level) {
    let self = this;
    let pattern;
    let source;
    let action;
    let opts;
    let prereqs;
    let valid;
    let src;
    let tNs;
    let createdTask;
    let name = Task.getBaseTaskName(fullName);
    let nsPath = Task.getBaseNamespacePath(fullName);
    let ns = this.ns.resolveNamespace(nsPath);

    pattern = this.pattern;
    source = this.source;

    if (typeof source == 'string') {
      src = Rule.getSource(name, pattern, source);
    }
    else {
      src = source(name);
    }

    // TODO: Write a utility function that appends a
    // taskname to a namespace path
    src = nsPath.split(':').filter(function (item) {
      return !!item;
    }).concat(src).join(':');

    // Generate the prerequisite for the matching task.
    //    It is the original prerequisites plus the prerequisite
    //    representing source file, i.e.,
    //
    //      rule( '%.o', '%.c', ['some.h'] ...
    //
    //    If the objective is main.o, then new task should be
    //
    //      file( 'main.o', ['main.c', 'some.h' ] ...
    prereqs = this.prereqs.slice(); // Get a copy to work with
    prereqs.unshift(src);

    // Prereq should be:
    // 1. an existing task
    // 2. an existing file on disk
    // 3. a valid rule (i.e., not at too deep a level)
    valid = prereqs.some(function (p) {
      let ns = self.ns;
      return ns.resolveTask(p) ||
        fs.existsSync(Task.getBaseTaskName(p)) ||
        jake.attemptRule(p, ns, level + 1);
    });

    // If any of the prereqs aren't valid, the rule isn't valid
    if (!valid) {
      return null;
    }
    // Otherwise, hunky-dory, finish creating the task for the rule
    else {
      // Create the action for the task
      action = function () {
        let task = this;
        self.action.apply(task);
      };

      opts = this.opts;

      // Insert the file task into Jake
      //
      // Since createTask function stores the task as a child task
      // of currentNamespace. Here we temporariliy switch the namespace.
      // FIXME: Should allow optional ns passed in instead of this hack
      tNs = jake.currentNamespace;
      jake.currentNamespace = ns;
      createdTask = jake.createTask('file', name, prereqs, action, opts);
      createdTask.source = src.split(':').pop();
      jake.currentNamespace = tNs;

      return createdTask;
    }
  }

  match(name) {
    return Rule.match(this.pattern, name);
  }

  // Test wether the a prerequisite matchs the pattern.
  // The arg 'pattern' does not have namespace as prefix.
  // For example, the following tests are true
  //
  //   pattern      |    name
  //   bin/%.o      |    bin/main.o
  //   bin/%.o      |    foo:bin/main.o
  //
  // The following tests are false (trivally)
  //
  //   pattern      |    name
  //   bin/%.o      |    foobin/main.o
  //   bin/%.o      |    bin/main.oo
  static match(pattern, name) {
    let p;
    let task;
    let obj;
    let filename;

    if (pattern instanceof RegExp) {
      return pattern.test(name);
    }
    else if (pattern.indexOf('%') == -1) {
      // No Pattern. No Folder. No Namespace.
      // A Simple Suffix Rule. Just test suffix
      return stringEndWith(pattern, name);
    }
    else {
      // Resolve the dir, prefix and suffix of pattern
      p = resolve(pattern);

      // Resolve the namespace and task-name
      task = splitNs(name);
      name = task.name;

      // Set the objective as the task-name
      obj = name;

      // Namespace is already matched.

      // Check dir
      if (path$1.dirname(obj) != p.dir) {
        return false;
      }

      filename = path$1.basename(obj);

      // Check file name length
      if ((p.prefix.length + p.suffix.length + 1) > filename.length) {
        // Length does not match.
        return false;
      }

      // Check prefix
      if (filename.indexOf(p.prefix) !== 0) {
        return false;
      }

      // Check suffix
      if (!stringEndWith(p.suffix, filename)) {
        return false;
      }

      // OK. Find a match.
      return true;
    }
  }

  // Generate the source based on
  //  - name    name for the synthesized task
  //  - pattern    pattern for the objective
  //  - source    pattern for the source
  //
  // Return the source with properties
  //  - dep      the prerequisite of source
  //             (with the namespace)
  //
  //  - file     the file name of source
  //             (without the namespace)
  //
  // For example, given
  //
  //  - name   foo:bin/main.o
  //  - pattern    bin/%.o
  //  - source    src/%.c
  //
  //    return 'foo:src/main.c',
  //
  static getSource(name, pattern, source) {
    let dep;
    let pat;
    let match;
    let file;
    let src;

    // Regex pattern -- use to look up the extension
    if (pattern instanceof RegExp) {
      match = pattern.exec(name);
      if (match) {
        if (typeof source == 'function') {
          src = source(name);
        }
        else {
          src = stringReplaceSuffix(name, match[0], source);
        }
      }
    }
    // Assume string
    else {
      // Simple string suffix replacement
      if (pattern.indexOf('%') == -1) {
        if (typeof source == 'function') {
          src = source(name);
        }
        else {
          src = stringReplaceSuffix(name, pattern, source);
        }
      }
      // Percent-based substitution
      else {
        pat = pattern.replace('%', '(.*?)');
        pat = new RegExp(pat);
        match = pat.exec(name);
        if (match) {
          if (typeof source == 'function') {
            src = source(name);
          }
          else {
            file = match[1];
            file = source.replace('%', file);
            dep = match[0];
            src = name.replace(dep, file);
          }
        }
      }
    }

    return src;
  }
}


var Rule_1 = Rule;

var rule = {
	Rule: Rule_1
};

let EventEmitter = events.EventEmitter;


// 'rule' module is required at the bottom because circular deps

// Used for task value, so better not to use
// null, since value should be unset/uninitialized
let UNDEFINED_VALUE;

const ROOT_TASK_NAME = '__rootTask__';
const POLLING_INTERVAL = 100;

// Parse any positional args attached to the task-name
function parsePrereqName(name) {
  let taskArr = name.split('[');
  let taskName = taskArr[0];
  let taskArgs = [];
  if (taskArr[1]) {
    taskArgs = taskArr[1].replace(/\]$/, '');
    taskArgs = taskArgs.split(',');
  }
  return {
    name: taskName,
    args: taskArgs
  };
}

/**
  @name jake.Task
  @class
  @extends EventEmitter
  @description A Jake Task

  @param {String} name The name of the Task
  @param {Array} [prereqs] Prerequisites to be run before this task
  @param {Function} [action] The action to perform for this task
  @param {Object} [opts]
    @param {Array} [opts.asyc=false] Perform this task asynchronously.
    If you flag a task with this option, you must call the global
    `complete` method inside the task's action, for execution to proceed
    to the next task.
 */
class Task$1 extends EventEmitter {

  constructor(name, prereqs, action, options) {
    // EventEmitter ctor takes no args
    super();

    if (name.indexOf(':') > -1) {
      throw new Error('Task name cannot include a colon. It is used internally as namespace delimiter.');
    }
    let opts = options || {};

    this._currentPrereqIndex = 0;
    this._internal = false;
    this._skipped = false;

    this.name = name;
    this.prereqs = prereqs;
    this.action = action;
    this.async = false;
    this.taskStatus = Task$1.runStatuses.UNSTARTED;
    this.description = null;
    this.args = [];
    this.value = UNDEFINED_VALUE;
    this.concurrency = 1;
    this.startTime = null;
    this.endTime = null;
    this.directory = null;
    this.namespace = null;

    // Support legacy async-flag -- if not explicitly passed or falsy, will
    // be set to empty-object
    if (typeof opts == 'boolean' && opts === true) {
      this.async = true;
    }
    else {
      if (opts.async) {
        this.async = true;
      }
      if (opts.concurrency) {
        this.concurrency = opts.concurrency;
      }
    }

    //Do a test on self dependencies for this task
    if(Array.isArray(this.prereqs) && this.prereqs.indexOf(this.name) !== -1) {
      throw new Error("Cannot use prereq " + this.name + " as a dependency of itself");
    }
  }

  get fullName() {
    return this._getFullName();
  }

  _initInvocationChain() {
    // Legacy global invocation chain
    jake._invocationChain.push(this);

    // New root chain
    if (!this._invocationChain) {
      this._invocationChainRoot = true;
      this._invocationChain = [];
      if (jake.currentRunningTask) {
        jake.currentRunningTask._waitForChains = jake.currentRunningTask._waitForChains || [];
        jake.currentRunningTask._waitForChains.push(this._invocationChain);
      }
    }
  }

  /**
    @name jake.Task#invoke
    @function
    @description Runs prerequisites, then this task. If the task has already
    been run, will not run the task again.
   */
  invoke() {
    this._initInvocationChain();

    this.args = Array.prototype.slice.call(arguments);
    this.reenabled = false;
    this.runPrereqs();
  }

  /**
    @name jake.Task#execute
    @function
    @description Run only this task, without prereqs. If the task has already
    been run, *will* run the task again.
   */
  execute() {
    this._initInvocationChain();

    this.args = Array.prototype.slice.call(arguments);
    this.reenable();
    this.reenabled = true;
    this.run();
  }

  runPrereqs() {
    if (this.prereqs && this.prereqs.length) {

      if (this.concurrency > 1) {
        async.eachLimit(this.prereqs, this.concurrency,

          (name, cb) => {
            let parsed = parsePrereqName(name);

            let prereq = this.namespace.resolveTask(parsed.name) ||
          jake.attemptRule(name, this.namespace, 0) ||
          jake.createPlaceholderFileTask(name, this.namespace);

            if (!prereq) {
              throw new Error('Unknown task "' + name + '"');
            }

            //Test for circular invocation
            if(prereq === this) {
              setImmediate(function () {
                cb(new Error("Cannot use prereq " + prereq.name + " as a dependency of itself"));
              });
            }

            if (prereq.taskStatus == Task$1.runStatuses.DONE) {
            //prereq already done, return
              setImmediate(cb);
            }
            else {
            //wait for complete before calling cb
              prereq.once('_done', () => {
                prereq.removeAllListeners('_done');
                setImmediate(cb);
              });
              // Start the prereq if we are the first to encounter it
              if (prereq.taskStatus === Task$1.runStatuses.UNSTARTED) {
                prereq.taskStatus = Task$1.runStatuses.STARTED;
                prereq.invoke.apply(prereq, parsed.args);
              }
            }
          },

          (err) => {
          //async callback is called after all prereqs have run.
            if (err) {
              throw err;
            }
            else {
              setImmediate(this.run.bind(this));
            }
          }
        );
      }
      else {
        setImmediate(this.nextPrereq.bind(this));
      }
    }
    else {
      setImmediate(this.run.bind(this));
    }
  }

  nextPrereq() {
    let self = this;
    let index = this._currentPrereqIndex;
    let name = this.prereqs[index];
    let prereq;
    let parsed;

    if (name) {

      parsed = parsePrereqName(name);

      prereq = this.namespace.resolveTask(parsed.name) ||
          jake.attemptRule(name, this.namespace, 0) ||
          jake.createPlaceholderFileTask(name, this.namespace);

      if (!prereq) {
        throw new Error('Unknown task "' + name + '"');
      }

      // Do when done
      if (prereq.taskStatus == Task$1.runStatuses.DONE) {
        self.handlePrereqDone(prereq);
      }
      else {
        prereq.once('_done', () => {
          this.handlePrereqDone(prereq);
          prereq.removeAllListeners('_done');
        });
        if (prereq.taskStatus == Task$1.runStatuses.UNSTARTED) {
          prereq.taskStatus = Task$1.runStatuses.STARTED;
          prereq._invocationChain = this._invocationChain;
          prereq.invoke.apply(prereq, parsed.args);
        }
      }
    }
  }

  /**
    @name jake.Task#reenable
    @function
    @description Reenables a task so that it can be run again.
   */
  reenable(deep) {
    let prereqs;
    let prereq;
    this._skipped = false;
    this.taskStatus = Task$1.runStatuses.UNSTARTED;
    this.value = UNDEFINED_VALUE;
    if (deep && this.prereqs) {
      prereqs = this.prereqs;
      for (let i = 0, ii = prereqs.length; i < ii; i++) {
        prereq = jake.Task[prereqs[i]];
        if (prereq) {
          prereq.reenable(deep);
        }
      }
    }
  }

  handlePrereqDone(prereq) {
    this._currentPrereqIndex++;
    if (this._currentPrereqIndex < this.prereqs.length) {
      setImmediate(this.nextPrereq.bind(this));
    }
    else {
      setImmediate(this.run.bind(this));
    }
  }

  isNeeded() {
    let needed = true;
    if (this.taskStatus == Task$1.runStatuses.DONE) {
      needed = false;
    }
    return needed;
  }

  run() {
    let val, previous;
    let hasAction = typeof this.action == 'function';

    if (!this.isNeeded()) {
      this.emit('skip');
      this.emit('_done');
    }
    else {
      if (this._invocationChain.length) {
        previous = this._invocationChain[this._invocationChain.length - 1];
        // If this task is repeating and its previous is equal to this, don't check its status because it was set to UNSTARTED by the reenable() method
        if (!(this.reenabled && previous == this)) {
          if (previous.taskStatus != Task$1.runStatuses.DONE) {
            let now = (new Date()).getTime();
            if (now - this.startTime > jake._taskTimeout) {
              return jake.fail(`Timed out waiting for task: ${previous.name} with status of ${previous.taskStatus}`);
            }
            setTimeout(this.run.bind(this), POLLING_INTERVAL);
            return;
          }
        }
      }
      if (!(this.reenabled && previous == this)) {
        this._invocationChain.push(this);
      }

      if (!(this._internal || jake.program.opts.quiet)) {
        console.log("Starting '" + chalk.green(this.fullName) + "'...");
      }

      this.startTime = (new Date()).getTime();
      this.emit('start');

      jake.currentRunningTask = this;

      if (hasAction) {
        try {
          if (this.directory) {
            process.chdir(this.directory);
          }

          val = this.action.apply(this, this.args);

          if (typeof val == 'object' && typeof val.then == 'function') {
            this.async = true;

            val.then(
              (result) => {
                setImmediate(() => {
                  this.complete(result);
                });
              },
              (err) => {
                setImmediate(() => {
                  this.errorOut(err);
                });
              });
          }
        }
        catch (err) {
          this.errorOut(err);
          return; // Bail out, not complete
        }
      }

      if (!(hasAction && this.async)) {
        setImmediate(() => {
          this.complete(val);
        });
      }
    }
  }

  errorOut(err) {
    this.taskStatus = Task$1.runStatuses.ERROR;
    this._invocationChain.chainStatus = Task$1.runStatuses.ERROR;
    this.emit('error', err);
  }

  complete(val) {

    if (Array.isArray(this._waitForChains)) {
      let stillWaiting = this._waitForChains.some((chain) => {
        return !(chain.chainStatus == Task$1.runStatuses.DONE ||
              chain.chainStatus == Task$1.runStatuses.ERROR);
      });
      if (stillWaiting) {
        let now = (new Date()).getTime();
        let elapsed = now - this.startTime;
        if (elapsed > jake._taskTimeout) {
          return jake.fail(`Timed out waiting for task: ${this.name} with status of ${this.taskStatus}. Elapsed: ${elapsed}`);
        }
        setTimeout(() => {
          this.complete(val);
        }, POLLING_INTERVAL);
        return;
      }
    }

    jake._invocationChain.splice(jake._invocationChain.indexOf(this), 1);

    if (this._invocationChainRoot) {
      this._invocationChain.chainStatus = Task$1.runStatuses.DONE;
    }

    this._currentPrereqIndex = 0;

    // If 'complete' getting called because task has been
    // run already, value will not be passed -- leave in place
    if (!this._skipped) {
      this.taskStatus = Task$1.runStatuses.DONE;
      this.value = val;

      this.emit('complete', this.value);
      this.emit('_done');

      this.endTime = (new Date()).getTime();
      let taskTime = this.endTime - this.startTime;

      if (!(this._internal || jake.program.opts.quiet)) {
        console.log("Finished '" + chalk.green(this.fullName) + "' after " + chalk.magenta(taskTime + ' ms'));
      }

    }
  }

  _getFullName() {
    let ns = this.namespace;
    let path = (ns && ns.path) || '';
    path = (path && path.split(':')) || [];
    if (this.namespace !== jake.defaultNamespace) {
      path.push(this.namespace.name);
    }
    path.push(this.name);
    return path.join(':');
  }

  static getBaseNamespacePath(fullName) {
    return fullName.split(':').slice(0, -1).join(':');
  }

  static getBaseTaskName(fullName) {
    return fullName.split(':').pop();
  }
}

Task$1.runStatuses = {
  UNSTARTED: 'unstarted',
  DONE: 'done',
  STARTED: 'started',
  ERROR: 'error'
};

Task$1.ROOT_TASK_NAME = ROOT_TASK_NAME;

var Task_1 = Task$1;

// Required here because circular deps

var task$1 = {
	Task: Task_1
};

let FileTask = file_task.FileTask;

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.DirectoryTask
  @constructor
  @augments EventEmitter
  @augments jake.Task
  @augments jake.FileTask
  @description A Jake DirectoryTask

  @param {String} name The name of the directory to create.
 */
class DirectoryTask extends FileTask {
  constructor(...args) {
    super(...args);
    if (fs.existsSync(this.name)) {
      this.updateModTime();
    }
    else {
      this.modTime = null;
    }
  }
}

var DirectoryTask_1 = DirectoryTask;

var directory_task = {
	DirectoryTask: DirectoryTask_1
};

let Task$2 = task$1.Task;

function isFileOrDirectory(t) {
  return (t instanceof FileTask$1 ||
          t instanceof DirectoryTask$1);
}

function isFile(t) {
  return (t instanceof FileTask$1 && !(t instanceof DirectoryTask$1));
}

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.FileTask
  @class`
  @extentds Task
  @description A Jake FileTask

  @param {String} name The name of the Task
  @param {Array} [prereqs] Prerequisites to be run before this task
  @param {Function} [action] The action to perform to create this file
  @param {Object} [opts]
    @param {Array} [opts.asyc=false] Perform this task asynchronously.
    If you flag a task with this option, you must call the global
    `complete` method inside the task's action, for execution to proceed
    to the next task.
 */
class FileTask$1 extends Task$2 {
  constructor(...args) {
    super(...args);
    this.dummy = false;
    if (fs.existsSync(this.name)) {
      this.updateModTime();
    }
    else {
      this.modTime = null;
    }
  }

  isNeeded() {
    let prereqs = this.prereqs;
    let prereqName;
    let prereqTask;

    // No repeatsies
    if (this.taskStatus == Task$2.runStatuses.DONE) {
      return false;
    }
    // The always-make override
    else if (jake.program.opts['always-make']) {
      return true;
    }
    // Default case
    else {

      // We need either an existing file, or an action to create one.
      // First try grabbing the actual mod-time of the file
      try {
        this.updateModTime();
      }
      // Then fall back to looking for an action
      catch(e) {
        if (typeof this.action == 'function') {
          return true;
        }
        else {
          throw new Error('File-task ' + this.fullName + ' has no ' +
            'existing file, and no action to create one.');
        }
      }

      // Compare mod-time of all the prereqs with its mod-time
      // If any prereqs are newer, need to run the action to update
      if (prereqs && prereqs.length) {
        for (let i = 0, ii = prereqs.length; i < ii; i++) {
          prereqName = prereqs[i];
          prereqTask = this.namespace.resolveTask(prereqName) ||
            jake.createPlaceholderFileTask(prereqName, this.namespace);
          // Run the action if:
          // 1. The prereq is a normal task (not file/dir)
          // 2. The prereq is a file-task with a mod-date more recent than
          // the one for this file/dir
          if (prereqTask) {
            if (!isFileOrDirectory(prereqTask) ||
                (isFile(prereqTask) && prereqTask.modTime > this.modTime)) {
              return true;
            }
          }
        }
      }
      // File/dir has no prereqs, and exists -- no need to run
      else {
        // Effectively done
        this.taskStatus = Task$2.runStatuses.DONE;
        return false;
      }
    }
  }

  updateModTime() {
    let stats = fs.statSync(this.name);
    this.modTime = stats.mtime;
  }

  complete() {
    if (!this.dummy) {
      this.updateModTime();
    }
    // Hackity hack
    Task$2.prototype.complete.apply(this, arguments);
  }

}

var FileTask_1 = FileTask$1;

// DirectoryTask is a subclass of FileTask, depends on it
// being defined
let DirectoryTask$1 = directory_task.DirectoryTask;

var file_task = {
	FileTask: FileTask_1
};

let Task$3 = task$1.Task;
let FileTask$2 = file_task.FileTask;
let DirectoryTask$2 = directory_task.DirectoryTask;

var Task_1$1 = Task$3;
var FileTask_1$1 = FileTask$2;
var DirectoryTask_1$1 = DirectoryTask$2;

var task$2 = {
	Task: Task_1$1,
	FileTask: FileTask_1$1,
	DirectoryTask: DirectoryTask_1$1
};

const ROOT_NAMESPACE_NAME = '__rootNamespace__';

class Namespace {
  constructor(name, parentNamespace) {
    this.name = name;
    this.parentNamespace = parentNamespace;
    this.childNamespaces = {};
    this.tasks = {};
    this.rules = {};
    this.path = this.getPath();
  }

  get fullName() {
    return this._getFullName();
  }

  addTask(task) {
    this.tasks[task.name] = task;
    task.namespace = this;
  }

  resolveTask(name) {
    if (!name) {
      return;
    }

    let taskPath = name.split(':');
    let taskName = taskPath.pop();
    let task;
    let ns;

    // Namespaced, return either relative to current, or from root
    if (taskPath.length) {
      taskPath = taskPath.join(':');
      ns = this.resolveNamespace(taskPath) ||
        Namespace.ROOT_NAMESPACE.resolveNamespace(taskPath);
      task = (ns && ns.resolveTask(taskName));
    }
    // Bare task, return either local, or top-level
    else {
      task = this.tasks[name] || Namespace.ROOT_NAMESPACE.tasks[name];
    }

    return task || null;
  }


  resolveNamespace(relativeName) {
    if (!relativeName) {
      return this;
    }

    let parts = relativeName.split(':');
    let ns = this;

    for (let i = 0, ii = parts.length; (ns && i < ii); i++) {
      ns = ns.childNamespaces[parts[i]];
    }

    return ns || null;
  }

  matchRule(relativeName) {
    let parts = relativeName.split(':');
    parts.pop();
    let ns = this.resolveNamespace(parts.join(':'));
    let rules = ns ? ns.rules : [];
    let r;
    let match;

    for (let p in rules) {
      r = rules[p];
      if (r.match(relativeName)) {
        match = r;
      }
    }

    return (ns && match) ||
        (this.parentNamespace &&
        this.parentNamespace.matchRule(relativeName));
  }

  getPath() {
    let parts = [];
    let next = this.parentNamespace;
    while (next) {
      parts.push(next.name);
      next = next.parentNamespace;
    }
    parts.pop(); // Remove '__rootNamespace__'
    return parts.reverse().join(':');
  }

  _getFullName() {
    let path = this.path;
    path = (path && path.split(':')) || [];
    path.push(this.name);
    return path.join(':');
  }

  isRootNamespace() {
    return !this.parentNamespace;
  }
}

class RootNamespace extends Namespace {
  constructor() {
    super(ROOT_NAMESPACE_NAME, null);
    Namespace.ROOT_NAMESPACE = this;
  }
}

var Namespace_1 = Namespace;
var RootNamespace_1 = RootNamespace;

var namespace$1 = {
	Namespace: Namespace_1,
	RootNamespace: RootNamespace_1
};

let logger = new (function () {
  let _output = function (type, out) {
    let quiet = typeof jake != 'undefined' && jake.program &&
        jake.program.opts && jake.program.opts.quiet;
    let msg;
    if (!quiet) {
      msg = typeof out == 'string' ? out : util.inspect(out);
      console[type](msg);
    }
  };

  this.log = function (out) {
    _output('log', out);
  };

  this.error = function (out) {
    _output('error', out);
  };

})();

var logger_1 = logger;

/*
 * Utilities: A classic collection of JavaScript utilities
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/




/**
  @name file
  @namespace file
*/

let fileUtils = new (function () {

  // Recursively copy files and directories
  let _copyFile = function (fromPath, toPath, opts) {
    let from = path$1.normalize(fromPath);
    let to = path$1.normalize(toPath);
    let options = opts || {};
    let fromStat;
    let toStat;
    let destExists;
    let destDoesNotExistErr;
    let content;
    let filename;
    let dirContents;
    let targetDir;

    fromStat = fs.statSync(from);

    try {
      //console.dir(to + ' destExists');
      toStat = fs.statSync(to);
      destExists = true;
    }
    catch(e) {
      //console.dir(to + ' does not exist');
      destDoesNotExistErr = e;
      destExists = false;
    }
    // Destination dir or file exists, copy into (directory)
    // or overwrite (file)
    if (destExists) {

      // If there's a rename-via-copy file/dir name passed, use it.
      // Otherwise use the actual file/dir name
      filename = options.rename || path$1.basename(from);

      // Copying a directory
      if (fromStat.isDirectory()) {
        dirContents = fs.readdirSync(from);
        targetDir = path$1.join(to, filename);
        // We don't care if the target dir already exists
        try {
          fs.mkdirSync(targetDir, {mode: fromStat.mode & 0o777});
        }
        catch(e) {
          if (e.code !== 'EEXIST') {
            throw e;
          }
        }
        for (let i = 0, ii = dirContents.length; i < ii; i++) {
          _copyFile(path$1.join(from, dirContents[i]), targetDir, {preserveMode: options.preserveMode});
        }
      }
      // Copying a file
      else {
        content = fs.readFileSync(from);
        let mode = fromStat.mode & 0o777;
        let targetFile = to;

        if (toStat.isDirectory()) {
          targetFile = path$1.join(to, filename);
        }

        let fileExists = fs.existsSync(targetFile);
        fs.writeFileSync(targetFile, content);

        // If the file didn't already exist, use the original file mode.
        // Otherwise, only update the mode if preserverMode is true.
        if(!fileExists || options.preserveMode) {
          fs.chmodSync(targetFile, mode);
        }
      }
    }
    // Dest doesn't exist, can't create it
    else {
      throw destDoesNotExistErr;
    }
  };

  // Remove the given directory
  let _rmDir = function (dirPath) {
    let dir = path$1.normalize(dirPath);
    let paths = [];
    paths = fs.readdirSync(dir);
    paths.forEach(function (p) {
      let curr = path$1.join(dir, p);
      let stat = fs.lstatSync(curr);
      if (stat.isDirectory()) {
        _rmDir(curr);
      }
      else {
        try {
          fs.unlinkSync(curr);
        } catch(e) {
          if (e.code === 'EPERM') {
            fs.chmodSync(curr, parseInt(666, 8));
            fs.unlinkSync(curr);
          } else {
            throw e;
          }
        }
      }
    });
    fs.rmdirSync(dir);
  };

  /**
    @name file#cpR
    @public
    @function
    @description Copies a directory/file to a destination
    @param {String} fromPath The source path to copy from
    @param {String} toPath The destination path to copy to
    @param {Object} opts Options to use
      @param {Boolean} [opts.preserveMode] If target file already exists, this
        determines whether the original file's mode is copied over. The default of
        false mimics the behavior of the `cp` command line tool. (Default: false)
  */
  this.cpR = function (fromPath, toPath, options) {
    let from = path$1.normalize(fromPath);
    let to = path$1.normalize(toPath);
    let toStat;
    let doesNotExistErr;
    let filename;
    let opts = options || {};

    if (from == to) {
      throw new Error('Cannot copy ' + from + ' to itself.');
    }

    // Handle rename-via-copy
    try {
      toStat = fs.statSync(to);
    }
    catch(e) {
      doesNotExistErr = e;

      // Get abs path so it's possible to check parent dir
      if (!this.isAbsolute(to)) {
        to = path$1.join(process.cwd(), to);
      }

      // Save the file/dir name
      filename = path$1.basename(to);
      // See if a parent dir exists, so there's a place to put the
      /// renamed file/dir (resets the destination for the copy)
      to = path$1.dirname(to);
      try {
        toStat = fs.statSync(to);
      }
      catch(e) {}
      if (toStat && toStat.isDirectory()) {
        // Set the rename opt to pass to the copy func, will be used
        // as the new file/dir name
        opts.rename = filename;
        //console.log('filename ' + filename);
      }
      else {
        throw doesNotExistErr;
      }
    }

    _copyFile(from, to, opts);
  };

  /**
    @name file#mkdirP
    @public
    @function
    @description Create the given directory(ies) using the given mode permissions
    @param {String} dir The directory to create
    @param {Number} mode The mode to give the created directory(ies)(Default: 0755)
  */
  this.mkdirP = function (dir, mode) {
    let dirPath = path$1.normalize(dir);
    let paths = dirPath.split(/\/|\\/);
    let currPath = '';
    let next;

    if (paths[0] == '' || /^[A-Za-z]+:/.test(paths[0])) {
      currPath = paths.shift() || '/';
      currPath = path$1.join(currPath, paths.shift());
      //console.log('basedir');
    }
    while ((next = paths.shift())) {
      if (next == '..') {
        currPath = path$1.join(currPath, next);
        continue;
      }
      currPath = path$1.join(currPath, next);
      try {
        //console.log('making ' + currPath);
        fs.mkdirSync(currPath, mode || parseInt(755, 8));
      }
      catch(e) {
        if (e.code != 'EEXIST') {
          throw e;
        }
      }
    }
  };

  /**
    @name file#rmRf
    @public
    @function
    @description Deletes the given directory/file
    @param {String} p The path to delete, can be a directory or file
  */
  this.rmRf = function (p, options) {
    let stat;
    try {
      stat = fs.lstatSync(p);
      if (stat.isDirectory()) {
        _rmDir(p);
      }
      else {
        fs.unlinkSync(p);
      }
    }
    catch (e) {}
  };

  /**
    @name file#isAbsolute
    @public
    @function
    @return {Boolean/String} If it's absolute the first character is returned otherwise false
    @description Checks if a given path is absolute or relative
    @param {String} p Path to check
  */
  this.isAbsolute = function (p) {
    let match = /^[A-Za-z]+:\\|^\//.exec(p);
    if (match && match.length) {
      return match[0];
    }
    return false;
  };

  /**
    @name file#absolutize
    @public
    @function
    @return {String} Returns the absolute path for the given path
    @description Returns the absolute path for the given path
    @param {String} p The path to get the absolute path for
  */
  this.absolutize = function (p) {
    if (this.isAbsolute(p)) {
      return p;
    }
    else {
      return path$1.join(process.cwd(), p);
    }
  };

})();

var file$1 = fileUtils;

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


 // Native Node util module
let spawn = child_process.spawn;
let EventEmitter$1 = events.EventEmitter;


let Exec;

const _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

let parseArgs = function (argumentsObj) {
  let args;
  let arg;
  let cmds;
  let callback;
  let opts = {
    interactive: false,
    printStdout: false,
    printStderr: false,
    breakOnError: true
  };

  args = Array.prototype.slice.call(argumentsObj);

  cmds = args.shift();
  // Arrayize if passed a single string command
  if (typeof cmds == 'string') {
    cmds = [cmds];
  }
  // Make a copy if it's an actual list
  else {
    cmds = cmds.slice();
  }

  // Get optional callback or opts
  while((arg = args.shift())) {
    if (typeof arg == 'function') {
      callback = arg;
    }
    else if (typeof arg == 'object') {
      opts = Object.assign(opts, arg);
    }
  }

  // Backward-compat shim
  if (typeof opts.stdout != 'undefined') {
    opts.printStdout = opts.stdout;
    delete opts.stdout;
  }
  if (typeof opts.stderr != 'undefined') {
    opts.printStderr = opts.stderr;
    delete opts.stderr;
  }

  return {
    cmds: cmds,
    opts: opts,
    callback: callback
  };
};

/**
  @name jake
  @namespace jake
*/
let utils = new (function () {
  /**
    @name jake.exec
    @static
    @function
    @description Executes shell-commands asynchronously with an optional
    final callback.
    `
    @param {String[]} cmds The list of shell-commands to execute
    @param {Object} [opts]
      @param {Boolean} [opts.printStdout=false] Print stdout from each command
      @param {Boolean} [opts.printStderr=false] Print stderr from each command
      @param {Boolean} [opts.breakOnError=true] Stop further execution on
      the first error.
      @param {Boolean} [opts.windowsVerbatimArguments=false] Don't translate
      arguments on Windows.
    @param {Function} [callback] Callback to run after executing  the
    commands

    @example
    let cmds = [
          'echo "showing directories"'
        , 'ls -al | grep ^d'
        , 'echo "moving up a directory"'
        , 'cd ../'
        ]
      , callback = function () {
          console.log('Finished running commands.');
        }
    jake.exec(cmds, {stdout: true}, callback);
   */
  this.exec = function (a, b, c) {
    let parsed = parseArgs(arguments);
    let cmds = parsed.cmds;
    let opts = parsed.opts;
    let callback = parsed.callback;

    let ex = new Exec(cmds, opts, callback);

    ex.addListener('error', function (msg, code) {
      if (opts.breakOnError) {
        fail(msg, code);
      }
    });
    ex.run();

    return ex;
  };

  this.createExec = function (a, b, c) {
    return new Exec(a, b, c);
  };

  // From Math.uuid.js, https://github.com/broofa/node-uuid
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function (length, radix) {
    var chars = _UUID_CHARS
      , uuid = []
      , r
      , i;

    radix = radix || chars.length;

    if (length) {
      // Compact form
      i = -1;
      while (++i < length) {
        uuid[i] = chars[0 | Math.random()*radix];
      }
    } else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      i = -1;
      while (++i < 36) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

})();

Exec = function () {
  let parsed = parseArgs(arguments);
  let cmds = parsed.cmds;
  let opts = parsed.opts;
  let callback = parsed.callback;

  this._cmds = cmds;
  this._callback = callback;
  this._config = opts;
};

util.inherits(Exec, EventEmitter$1);

Object.assign(Exec.prototype, new (function () {

  let _run = function () {
    let self = this;
    let sh;
    let cmd;
    let args;
    let next = this._cmds.shift();
    let config = this._config;
    let errData = '';
    let shStdio;
    let handleStdoutData = function (data) {
      self.emit('stdout', data);
    };
    let handleStderrData = function (data) {
      let d = data.toString();
      self.emit('stderr', data);
      // Accumulate the error-data so we can use it as the
      // stack if the process exits with an error
      errData += d;
    };

    // Keep running as long as there are commands in the array
    if (next) {
      let spawnOpts = {};
      this.emit('cmdStart', next);

      // Ganking part of Node's child_process.exec to get cmdline args parsed
      if (process.platform == 'win32') {
        cmd = 'cmd';
        args = ['/c', next];
        if (config.windowsVerbatimArguments) {
          spawnOpts.windowsVerbatimArguments = true;
        }
      }
      else {
        cmd = '/bin/sh';
        args = ['-c', next];
      }

      if (config.interactive) {
        spawnOpts.stdio = 'inherit';
        sh = spawn(cmd, args, spawnOpts);
      }
      else {
        shStdio = [
          process.stdin
        ];
        if (config.printStdout) {
          shStdio.push(process.stdout);
        }
        else {
          shStdio.push('pipe');
        }
        if (config.printStderr) {
          shStdio.push(process.stderr);
        }
        else {
          shStdio.push('pipe');
        }
        spawnOpts.stdio = shStdio;
        sh = spawn(cmd, args, spawnOpts);
        if (!config.printStdout) {
          sh.stdout.addListener('data', handleStdoutData);
        }
        if (!config.printStderr) {
          sh.stderr.addListener('data', handleStderrData);
        }
      }

      // Exit, handle err or run next
      sh.on('exit', function (code) {
        let msg;
        if (code !== 0) {
          msg = errData || 'Process exited with error.';
          msg = msg.trim();
          self.emit('error', msg, code);
        }
        if (code === 0 || !config.breakOnError) {
          self.emit('cmdEnd', next);
          setTimeout(function () { _run.call(self); }, 0);
        }
      });

    }
    else {
      self.emit('end');
      if (typeof self._callback == 'function') {
        self._callback();
      }
    }
  };

  this.append = function (cmd) {
    this._cmds.push(cmd);
  };

  this.run = function () {
    _run.call(this);
  };

})());

utils.Exec = Exec;
utils.file = file$1;
utils.logger = logger_1;

var utils_1 = utils;

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
let { uuid } = utils_1;

let api = new (function () {
  /**
    @name task
    @static
    @function
    @description Creates a Jake Task
    `
    @param {String} name The name of the Task
    @param {Array} [prereqs] Prerequisites to be run before this task
    @param {Function} [action] The action to perform for this task
    @param {Object} [opts]
      @param {Boolean} [opts.asyc=false] Perform this task asynchronously.
      If you flag a task with this option, you must call the global
      `complete` method inside the task's action, for execution to proceed
      to the next task.

    @example
    desc('This is the default task.');
    task('default', function (params) {
      console.log('This is the default task.');
    });

    desc('This task has prerequisites.');
    task('hasPrereqs', ['foo', 'bar', 'baz'], function (params) {
      console.log('Ran some prereqs first.');
    });

    desc('This is an asynchronous task.');
    task('asyncTask', function () {
      setTimeout(complete, 1000);
    }, {async: true});
   */
  this.task = function (name, prereqs, action, opts) {
    let args = Array.prototype.slice.call(arguments);
    let createdTask;
    args.unshift('task');
    createdTask = jake.createTask.apply(commonjsGlobal, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name rule
    @static
    @function
    @description Creates a Jake Suffix Rule
    `
    @param {String} pattern The suffix name of the objective
    @param {String} source The suffix name of the objective
    @param {Array} [prereqs] Prerequisites to be run before this task
    @param {Function} [action] The action to perform for this task
    @param {Object} [opts]
      @param {Boolean} [opts.asyc=false] Perform this task asynchronously.
      If you flag a task with this option, you must call the global
      `complete` method inside the task's action, for execution to proceed
      to the next task.
    @example
    desc('This is a rule, which does not support namespace or pattern.');
    rule('.o', '.c', {async: true}, function () {
      let cmd = util.format('gcc -o %s %s', this.name, this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    desc('This rule has prerequisites.');
    rule('.o', '.c', ['util.h'], {async: true}, function () {
      let cmd = util.format('gcc -o %s %s', this.name, this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    desc('This is a rule with patterns.');
    rule('%.o', '%.c', {async: true}, function () {
      let cmd = util.format('gcc -o %s %s', this.name, this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    desc('This is another rule with patterns.');
    rule('obj/%.o', 'src/%.c', {async: true}, function () {
      let cmd = util.format('gcc -o %s %s', this.name, this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    desc('This is an example with chain rules.');
    rule('%.pdf', '%.dvi', {async: true}, function () {
      let cmd = util.format('dvipdfm %s',this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    rule('%.dvi', '%.tex', {async: true}, function () {
      let cmd = util.format('latex %s',this.source);
      jake.exec([cmd], function () {
        complete();
      }, {printStdout: true});
    });

    desc('This rule has a namespace.');
    task('default', ['debug:obj/main.o]);

    namespace('debug', {async: true}, function() {
      rule('obj/%.o', 'src/%.c', function () {
        // ...
      });
    }
   */
  this.rule = function () {
    let args = Array.prototype.slice.call(arguments);
    let arg;
    let pattern = args.shift();
    let source = args.shift();
    let prereqs = [];
    let action = function () {};
    let opts = {};
    let key = pattern.toString(); // May be a RegExp

    while ((arg = args.shift())) {
      if (typeof arg == 'function') {
        action = arg;
      }
      else if (Array.isArray(arg)) {
        prereqs = arg;
      }
      else {
        opts = arg;
      }
    }

    jake.currentNamespace.rules[key] = new jake.Rule({
      pattern: pattern,
      source: source,
      prereqs: prereqs,
      action: action,
      opts: opts,
      desc: jake.currentTaskDescription,
      ns: jake.currentNamespace
    });
    jake.currentTaskDescription = null;
  };

  /**
    @name directory
    @static
    @function
    @description Creates a Jake DirectoryTask. Can be used as a prerequisite
    for FileTasks, or for simply ensuring a directory exists for use with a
    Task's action.
    `
    @param {String} name The name of the DiretoryTask

    @example

    // Creates the package directory for distribution
    directory('pkg');
   */
  this.directory = function (name) {
    let args = Array.prototype.slice.call(arguments);
    let createdTask;
    args.unshift('directory');
    createdTask = jake.createTask.apply(commonjsGlobal, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name file
    @static
    @function
    @description Creates a Jake FileTask.
    `
    @param {String} name The name of the FileTask
    @param {Array} [prereqs] Prerequisites to be run before this task
    @param {Function} [action] The action to create this file, if it doesn't
    exist already.
    @param {Object} [opts]
      @param {Array} [opts.asyc=false] Perform this task asynchronously.
      If you flag a task with this option, you must call the global
      `complete` method inside the task's action, for execution to proceed
      to the next task.

   */
  this.file = function (name, prereqs, action, opts) {
    let args = Array.prototype.slice.call(arguments);
    let createdTask;
    args.unshift('file');
    createdTask = jake.createTask.apply(commonjsGlobal, args);
    jake.currentTaskDescription = null;
    return createdTask;
  };

  /**
    @name desc
    @static
    @function
    @description Creates a description for a Jake Task (or FileTask,
    DirectoryTask). When invoked, the description that iscreated will
    be associated with whatever Task is created next.
    `
    @param {String} description The description for the Task
   */
  this.desc = function (description) {
    jake.currentTaskDescription = description;
  };

  /**
    @name namespace
    @static
    @function
    @description Creates a namespace which allows logical grouping
    of tasks, and prevents name-collisions with task-names. Namespaces
    can be nested inside of other namespaces.
    `
    @param {String} name The name of the namespace
    @param {Function} scope The enclosing scope for the namespaced tasks

    @example
    namespace('doc', function () {
      task('generate', ['doc:clobber'], function () {
        // Generate some docs
      });

      task('clobber', function () {
        // Clobber the doc directory first
      });
    });
   */
  this.namespace = function (name, closure) {
    let curr = jake.currentNamespace;
    let ns = curr.childNamespaces[name] || new jake.Namespace(name, curr);
    let fn = closure || function () {};
    curr.childNamespaces[name] = ns;
    jake.currentNamespace = ns;
    fn();
    jake.currentNamespace = curr;
    jake.currentTaskDescription = null;
    return ns;
  };

  /**
    @name complete
    @static
    @function
    @description Completes an asynchronous task, allowing Jake's
    execution to proceed to the next task. Calling complete globally or without
    arguments completes the last task on the invocationChain. If you use parallel
    execution of prereqs this will probably complete a wrong task. You should call this
    function with this task as the first argument, before the optional return value.
    Alternatively you can call task.complete()
    `
    @example
    task('generate', ['doc:clobber'], function () {
      exec('./generate_docs.sh', function (err, stdout, stderr) {
        if (err || stderr) {
          fail(err || stderr);
        }
        else {
          console.log(stdout);
          complete();
        }
      });
    }, {async: true});
   */
  this.complete = function (task, val) {
    //this should detect if the first arg is a task, but I guess it should be more thorough
    if(task && task. _currentPrereqIndex >=0 ) {
      task.complete(val);
    }
    else {
      val = task;
      if(jake._invocationChain.length > 0) {
        jake._invocationChain[jake._invocationChain.length-1].complete(val);
      }
    }
  };

  /**
    @name fail
    @static
    @function
    @description Causes Jake execution to abort with an error.
    Allows passing an optional error code, which will be used to
    set the exit-code of exiting process.
    `
    @param {Error|String} err The error to thow when aborting execution.
    If this argument is an Error object, it will simply be thrown. If
    a String, it will be used as the error-message. (If it is a multi-line
    String, the first line will be used as the Error message, and the
    remaining lines will be used as the error-stack.)

    @example
    task('createTests, function () {
      if (!fs.existsSync('./tests')) {
        fail('Test directory does not exist.');
      }
      else {
        // Do some testing stuff ...
      }
    });
   */
  this.fail = function (err, code) {
    let msg;
    let errObj;
    if (code) {
      jake.errorCode = code;
    }
    if (err) {
      if (typeof err == 'string') {
        // Use the initial or only line of the error as the error-message
        // If there was a multi-line error, use the rest as the stack
        msg = err.split('\n');
        errObj = new Error(msg.shift());
        if (msg.length) {
          errObj.stack = msg.join('\n');
        }
        throw errObj;
      }
      else if (err instanceof Error) {
        throw err;
      }
      else {
        throw new Error(err.toString());
      }
    }
    else {
      throw new Error();
    }
  };

  this.packageTask = function (name, version, prereqs, definition) {
    return new jake.PackageTask(name, version, prereqs, definition);
  };

  this.publishTask = function (name, prereqs, opts, definition) {
    return new jake.PublishTask(name, prereqs, opts, definition);
  };

  // Backward-compat
  this.npmPublishTask = function (name, prereqs, opts, definition) {
    return new jake.PublishTask(name, prereqs, opts, definition);
  };

  this.testTask = function () {
    let ctor = function () {};
    let t;
    ctor.prototype = jake.TestTask.prototype;
    t = new ctor();
    jake.TestTask.apply(t, arguments);
    return t;
  };

  this.setTaskTimeout = function (t) {
    this._taskTimeout = t;
  };

  this.setSeriesAutoPrefix = function (prefix) {
    this._seriesAutoPrefix = prefix;
  };

  this.series = function (...args) {
    let prereqs = args.map((arg) => {
      let name = (this._seriesAutoPrefix || '') + arg.name;
      jake.task(name, arg);
      return name;
    });
    let seriesName = uuid();
    let seriesTask = jake.task(seriesName, prereqs);
    seriesTask._internal = true;
    let res = function () {
      return new Promise((resolve) => {
        seriesTask.invoke();
        seriesTask.on('complete', (val) => {
          resolve(val);
        });
      });
    };
    Object.defineProperty(res, 'name', {value: uuid(),
      writable: false});
    return res;
  };

})();

var api_1 = api;

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

let parseargs = {};
let isOpt = function (arg) { return arg.indexOf('-') === 0 };
let removeOptPrefix = function (opt) { return opt.replace(/^--/, '').replace(/^-/, '') };

/**
 * @constructor
 * Parses a list of command-line args into a key/value object of
 * options and an array of positional commands.
 * @ param {Array} opts A list of options in the following format:
 * [{full: 'foo', abbr: 'f'}, {full: 'bar', abbr: 'b'}]]
 */
parseargs.Parser = function (opts) {
  // A key/value object of matching options parsed out of the args
  this.opts = {};
  this.taskNames = null;
  this.envVars = null;

  // Data structures used for parsing
  this.reg = opts;
  this.shortOpts = {};
  this.longOpts = {};

  let self = this;
  [].forEach.call(opts, function (item) {
    self.shortOpts[item.abbr] = item;
    self.longOpts[item.full] = item;
  });
};

parseargs.Parser.prototype = new function () {

  let _trueOrNextVal = function (argParts, args) {
    if (argParts[1]) {
      return argParts[1];
    }
    else {
      return (!args[0] || isOpt(args[0])) ?
        true : args.shift();
    }
  };

  /**
   * Parses an array of arguments into options and positional commands
   * @param {Array} args The command-line args to parse
   */
  this.parse = function (args) {
    let cmds = [];
    let cmd;
    let envVars = {};
    let opts = {};
    let arg;
    let argItem;
    let argParts;
    let cmdItems;
    let taskNames = [];
    let preempt;

    while (args.length) {
      arg = args.shift();

      if (isOpt(arg)) {
        arg = removeOptPrefix(arg);
        argParts = arg.split('=');
        argItem = this.longOpts[argParts[0]] || this.shortOpts[argParts[0]];
        if (argItem) {
          // First-encountered preemptive opt takes precedence -- no further opts
          // or possibility of ambiguity, so just look for a value, or set to
          // true and then bail
          if (argItem.preempts) {
            opts[argItem.full] = _trueOrNextVal(argParts, args);
            preempt = true;
            break;
          }
          // If the opt requires a value, see if we can get a value from the
          // next arg, or infer true from no-arg -- if it's followed by another
          // opt, throw an error
          if (argItem.expectValue || argItem.allowValue) {
            opts[argItem.full] = _trueOrNextVal(argParts, args);
            if (argItem.expectValue && !opts[argItem.full]) {
              throw new Error(argItem.full + ' option expects a value.');
            }
          }
          else {
            opts[argItem.full] = true;
          }
        }
      }
      else {
        cmds.unshift(arg);
      }
    }

    if (!preempt) {
      // Parse out any env-vars and task-name
      while ((cmd = cmds.pop())) {
        cmdItems = cmd.split('=');
        if (cmdItems.length > 1) {
          envVars[cmdItems[0]] = cmdItems[1];
        }
        else {
          taskNames.push(cmd);
        }
      }

    }

    return {
      opts: opts,
      envVars: envVars,
      taskNames: taskNames
    };
  };

};

var parseargs_1 = parseargs;

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/




let Program;
let usage = fs.readFileSync(`${__dirname}/../usage.txt`).toString();
let { Task: Task$4 } = task$1;

function die(msg) {
  console.log(msg);
  process.stdout.write('', function () {
    process.stderr.write('', function () {
      process.exit();
    });
  });
}

let preempts = {
  version: function () {
    die(jake.version);
  },
  help: function () {
    die(usage);
  }
};

let AVAILABLE_OPTS = [
  { full: 'jakefile',
    abbr: 'f',
    expectValue: true
  },
  { full: 'quiet',
    abbr: 'q',
    expectValue: false
  },
  { full: 'directory',
    abbr: 'C',
    expectValue: true
  },
  { full: 'always-make',
    abbr: 'B',
    expectValue: false
  },
  { full: 'tasks',
    abbr: 'T',
    expectValue: false,
    allowValue: true
  },
  // Alias t
  { full: 'tasks',
    abbr: 't',
    expectValue: false,
    allowValue: true
  },
  // Alias ls
  { full: 'tasks',
    abbr: 'ls',
    expectValue: false,
    allowValue: true
  },
  { full: 'help',
    abbr: 'h',
  },
  { full: 'version',
    abbr: 'V',
  },
  // Alias lowercase v
  { full: 'version',
    abbr: 'v',
  },
  { full: 'jakelibdir',
    abbr: 'J',
    expectValue: true
  },
  { full: 'allow-rejection',
    abbr: 'ar',
    expectValue: false
  }
];

Program = function () {
  this.availableOpts = AVAILABLE_OPTS;
  this.opts = {};
  this.taskNames = null;
  this.taskArgs = null;
  this.envVars = null;
  this.die = die;
};

Program.prototype = new (function () {

  this.handleErr = function (err) {
    if (jake.listeners('error').length !== 0) {
      jake.emit('error', err);
      return;
    }

    if (jake.listeners('error').length) {
      jake.emit('error', err);
      return;
    }

    utils_1.logger.error('jake aborted.');
    if (err.stack) {
      utils_1.logger.error(err.stack);
    }
    else {
      utils_1.logger.error(err.message);
    }

    process.stdout.write('', function () {
      process.stderr.write('', function () {
        jake.errorCode = jake.errorCode || 1;
        process.exit(jake.errorCode);
      });
    });
  };

  this.parseArgs = function (args) {
    let result = (new parseargs_1.Parser(this.availableOpts)).parse(args);
    this.setOpts(result.opts);
    this.setTaskNames(result.taskNames);
    this.setEnvVars(result.envVars);
  };

  this.setOpts = function (options) {
    let opts = options || {};
    Object.assign(this.opts, opts);
  };

  this.internalOpts = function (options) {
    this.availableOpts = this.availableOpts.concat(options);
  };

  this.autocompletions = function (cur) {
    let p; let i; let task;
    let commonPrefix = '';
    let matches = [];

    for (p in jake.Task) {
      task = jake.Task[p];
      if (
        'fullName' in task
          && (
            // if empty string, program converts to true
            cur === true ||
            task.fullName.indexOf(cur) === 0
          )
      ) {
        if (matches.length === 0) {
          commonPrefix = task.fullName;
        }
        else {
          for (i = commonPrefix.length; i > -1; --i) {
            commonPrefix = commonPrefix.substr(0, i);
            if (task.fullName.indexOf(commonPrefix) === 0) {
              break;
            }
          }
        }
        matches.push(task.fullName);
      }
    }

    if (matches.length > 1 && commonPrefix === cur) {
      matches.unshift('yes-space');
    }
    else {
      matches.unshift('no-space');
    }

    process.stdout.write(matches.join(' '));
  };

  this.setTaskNames = function (names) {
    if (names && !Array.isArray(names)) {
      throw new Error('Task names must be an array');
    }
    this.taskNames = (names && names.length) ? names : ['default'];
  };

  this.setEnvVars = function (vars) {
    this.envVars = vars || null;
  };

  this.firstPreemptiveOption = function () {
    let opts = this.opts;
    for (let p in opts) {
      if (preempts[p]) {
        return preempts[p];
      }
    }
    return false;
  };

  this.init = function (configuration) {
    let self = this;
    let config = configuration || {};
    if (config.options) {
      this.setOpts(config.options);
    }
    if (config.taskNames) {
      this.setTaskNames(config.taskNames);
    }
    if (config.envVars) {
      this.setEnvVars(config.envVars);
    }
    process.addListener('uncaughtException', function (err) {
      self.handleErr(err);
    });
    if (!this.opts['allow-rejection']) {
      process.addListener('unhandledRejection', (reason, promise) => {
        utils_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
        self.handleErr(reason);
      });
    }
    if (this.envVars) {
      Object.assign(process.env, this.envVars);
    }
  };

  this.run = function () {
    let rootTask;
    let taskNames;
    let dirname;
    let opts = this.opts;

    if (opts.autocomplete) {
      return this.autocompletions(opts['autocomplete-cur'], opts['autocomplete-prev']);
    }
    // Run with `jake -T`, just show descriptions
    if (opts.tasks) {
      return jake.showAllTaskDescriptions(opts.tasks);
    }

    taskNames = this.taskNames;
    if (!(Array.isArray(taskNames) && taskNames.length)) {
      throw new Error('Please pass jake.runTasks an array of task-names');
    }

    // Set working dir
    dirname = opts.directory;
    if (dirname) {
      if (fs.existsSync(dirname) &&
        fs.statSync(dirname).isDirectory()) {
        process.chdir(dirname);
      }
      else {
        throw new Error(dirname + ' is not a valid directory path');
      }
    }

    rootTask = task(Task$4.ROOT_TASK_NAME, taskNames, function () {});
    rootTask._internal = true;

    rootTask.once('complete', function () {
      jake.emit('complete');
    });
    jake.emit('start');
    rootTask.invoke();
  };

})();

var Program_1 = Program;

var program = {
	Program: Program_1
};

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/



let existsSync = fs.existsSync;


// Files like jakelib/foobar.jake.js
const JAKELIB_FILE_PAT = /\.jake$|\.js$/;
const SUPPORTED_EXTENSIONS = {
  'js': null,
  'coffee': function () {
    try {
      let cs = coffeescript;
      if (typeof cs.register == 'function') {
        cs.register();
      }
    }
    catch(e) {
      throw new Error('You have a CoffeeScript Jakefile, but have not installed CoffeeScript');
    }
  },
  'ls': function () {
  }
};
const IMPLICIT_JAKEFILE_NAMES = [
  'Jakefile',
  'Gulpfile'
];

let Loader = function () {
  // Load a Jakefile, running the code inside -- this may result in
  // tasks getting defined using the original Jake API, e.g.,
  // `task('foo' ['bar', 'baz']);`, or can also auto-create tasks
  // from any functions exported from the file
  function loadFile(filePath) {
    let exported = commonjsRequire();
    for (let [key, value] of Object.entries(exported)) {
      let t;
      if (typeof value == 'function') {
        t = jake.task(key, value);
        t.description = '(Exported function)';
      }
    }
  }

  function fileExists(name) {
    let nameWithExt = null;
    // Support no file extension as well
    let exts = Object.keys(SUPPORTED_EXTENSIONS).concat(['']);
    exts.some((ext) => {
      let fname = ext ? `${name}.${ext}` : name;
      if (existsSync(fname)) {
        nameWithExt = fname;
        return true;
      }
    });
    return nameWithExt;
  }

  // Recursive
  function findImplicitJakefile() {
    let cwd = process.cwd();
    let names = IMPLICIT_JAKEFILE_NAMES;
    let found = null;
    names.some((name) => {
      let n;
      // Prefer all-lowercase
      n = name.toLowerCase();
      if ((found = fileExists(n))) {
        return found;
      }
      // Check mixed-case as well
      n = name;
      if ((found = fileExists(n))) {
        return found;
      }
    });
    if (found) {
      return found;
    }
    else {
      process.chdir("..");
      // If we've walked all the way up the directory tree,
      // bail out with no result
      if (cwd === process.cwd()) {
        return null;
      }
      return findImplicitJakefile();
    }
  }

  this.loadFile = function (fileSpecified) {
    let jakefile;
    let origCwd = process.cwd();

    if (fileSpecified) {
      if (existsSync(fileSpecified)) {
        jakefile = fileSpecified;
      }
    }
    else {
      jakefile = findImplicitJakefile();
    }

    if (jakefile) {
      let ext = jakefile.split('.')[1];
      let loaderFunc = SUPPORTED_EXTENSIONS[ext];
      loaderFunc && loaderFunc();

      loadFile(utils_1.file.absolutize(jakefile));
      return true;
    }
    else {
      if (!fileSpecified) {
        // Restore the working directory on failure
        process.chdir(origCwd);
      }
      return false;
    }
  };

  this.loadDirectory = function (d) {
    let dirname = d || 'jakelib';
    let dirlist;
    dirname = utils_1.file.absolutize(dirname);
    if (existsSync(dirname)) {
      dirlist = fs.readdirSync(dirname);
      dirlist.forEach(function (filePath) {
        if (JAKELIB_FILE_PAT.test(filePath)) {
          loadFile(path$1.join(dirname, filePath));
        }
      });
      return true;
    }
    return false;
  };

};

var loader = function () {
  return new Loader();
};

var concatMap = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var balancedMatch = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

var braceExpansion = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balancedMatch('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balancedMatch('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length);
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}

var minimatch_1 = minimatch;
minimatch.Minimatch = Minimatch;

var path = { sep: '/' };
try {
  path = path$1;
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};


var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]';

// * => any number of characters
var star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!');

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/;

minimatch.filter = filter;
function filter (pattern, options) {
  options = options || {};
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {};
  b = b || {};
  var t = {};
  Object.keys(b).forEach(function (k) {
    t[k] = b[k];
  });
  Object.keys(a).forEach(function (k) {
    t[k] = a[k];
  });
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch;

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  };

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  };

  return m
};

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
};

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {};

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {};
  pattern = pattern.trim();

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/');
  }

  this.options = options;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;

  // make the set of regexps etc.
  this.make();
}

Minimatch.prototype.debug = function () {};

Minimatch.prototype.make = make;
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern;
  var options = this.options;

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true;
    return
  }
  if (!pattern) {
    this.empty = true;
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate();

  // step 2: expand braces
  var set = this.globSet = this.braceExpand();

  if (options.debug) this.debug = console.error;

  this.debug(this.pattern, set);

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  });

  this.debug(this.pattern, set);

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this);

  this.debug(this.pattern, set);

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  });

  this.debug(this.pattern, set);

  this.set = set;
}

Minimatch.prototype.parseNegate = parseNegate;
function parseNegate () {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate;
    negateOffset++;
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
};

Minimatch.prototype.braceExpand = braceExpand;

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options;
    } else {
      options = {};
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern;

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return braceExpansion(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse;
var SUBPARSE = {};
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options;

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = '';
  var hasMagic = !!options.nocase;
  var escaping = false;
  // ? => one single character
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)';
  var self = this;

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star;
          hasMagic = true;
        break
        case '?':
          re += qmark;
          hasMagic = true;
        break
        default:
          re += '\\' + stateChar;
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re);
      stateChar = false;
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c);

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c;
      escaping = false;
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar();
        escaping = true;
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class');
          if (c === '!' && i === classStart + 1) c = '^';
          re += c;
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar);
        clearStateChar();
        stateChar = c;
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar();
      continue

      case '(':
        if (inClass) {
          re += '(';
          continue
        }

        if (!stateChar) {
          re += '\\(';
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        });
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
        this.debug('plType %j %j', stateChar, re);
        stateChar = false;
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)';
          continue
        }

        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close;
        if (pl.type === '!') {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|';
          escaping = false;
          continue
        }

        clearStateChar();
        re += '|';
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar();

        if (inClass) {
          re += '\\' + c;
          continue
        }

        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c;
          escaping = false;
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i);
          try {
            RegExp('[' + cs + ']');
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE);
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
            hasMagic = hasMagic || sp[1];
            inClass = false;
            continue
          }
        }

        // finish up the class.
        hasMagic = true;
        inClass = false;
        re += c;
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar();

        if (escaping) {
          // no need
          escaping = false;
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\';
        }

        re += c;

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE);
    re = re.substr(0, reClassStart) + '\\[' + sp[0];
    hasMagic = hasMagic || sp[1];
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug('setting tail', re, pl);
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\';
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    });

    this.debug('tail=%j\n   %s', tail, tail, pl, re);
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type;

    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
  }

  // handle trailing things that only matter at the very end.
  clearStateChar();
  if (escaping) {
    // trailing \\
    re += '\\\\';
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true;
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];

    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);

    nlLast += nlAfter;

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
    }
    nlAfter = cleanAfter;

    var dollar = '';
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$';
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re;
  }

  if (addPatternStart) {
    re = patternStart + re;
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : '';
  try {
    var regExp = new RegExp('^' + re + '$', flags);
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern;
  regExp._src = re;

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
};

Minimatch.prototype.makeRe = makeRe;
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set;

  if (!set.length) {
    this.regexp = false;
    return this.regexp
  }
  var options = this.options;

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot;
  var flags = options.nocase ? 'i' : '';

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|');

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$';

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$';

  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) {
    this.regexp = false;
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {};
  var mm = new Minimatch(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f)
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

Minimatch.prototype.match = match;
function match (f, partial) {
  this.debug('match', f, this.pattern);
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options;

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/');
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit);
  this.debug(this.pattern, 'split', f);

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set;
  this.debug(this.pattern, 'set', set);

  // Find the basename of the path by looking for the last non-empty segment
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file = f;
    if (options.matchBase && pattern.length === 1) {
      file = [filename];
    }
    var hit = this.matchOne(file, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options;

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern });

  this.debug('matchOne', file.length, pattern.length);

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop');
    var p = pattern[pi];
    var f = file[fi];

    this.debug(pattern, p, f);

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f]);

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi;
      var pr = pi + 1;
      if (pr === pl) {
        this.debug('** at the end');
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr];

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee);
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr);
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue');
          fr++;
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit;
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase();
      } else {
        hit = f === p;
      }
      this.debug('string match', p, f, hit);
    } else {
      hit = f.match(p);
      this.debug('pattern match', p, f, hit);
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '');
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
};

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
var escapeRegExpChars
, merge
, basedir
, _readDir
, readdirR
, globSync;

  /**
    @name escapeRegExpChars
    @function
    @return {String} A string of escaped characters
    @description Escapes regex control-characters in strings
                 used to build regexes dynamically
    @param {String} string The string of chars to escape
  */
  escapeRegExpChars = (function () {
    var specials = [ '^', '$', '/', '.', '*', '+', '?', '|', '(', ')',
        '[', ']', '{', '}', '\\' ];
    var sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return function (string) {
      var str = string || '';
      str = String(str);
      return str.replace(sRE, '\\$1');
    };
  })();

  /**
    @name merge
    @function
    @return {Object} Returns the merged object
    @description Merge merges `otherObject` into `object` and takes care of deep
                 merging of objects
    @param {Object} object Object to merge into
    @param {Object} otherObject Object to read from
  */
  merge = function (object, otherObject) {
    var obj = object || {}
      , otherObj = otherObject || {}
      , key, value;

    for (key in otherObj) {
      value = otherObj[key];

      // Check if a value is an Object, if so recursively add it's key/values
      if (typeof value === 'object' && !(value instanceof Array)) {
        // Update value of object to the one from otherObj
        obj[key] = merge(obj[key], value);
      }
      // Value is anything other than an Object, so just add it
      else {
        obj[key] = value;
      }
    }

    return obj;
  };
  /**
    Given a patern, return the base directory of it (ie. the folder
    that will contain all the files matching the path).
    eg. file.basedir('/test/**') => '/test/'
    Path ending by '/' are considerd as folder while other are considerd
    as files, eg.:
        file.basedir('/test/a/') => '/test/a'
        file.basedir('/test/a') => '/test'
    The returned path always end with a '/' so we have:
        file.basedir(file.basedir(x)) == file.basedir(x)
  */
  basedir = function (pathParam) {
    var bd = ''
      , parts
      , part
      , pos = 0
      , p = pathParam || '';

    // If the path has a leading asterisk, basedir is the current dir
    if (p.indexOf('*') == 0 || p.indexOf('**') == 0) {
      return '.';
    }

    // always consider .. at the end as a folder and not a filename
    if (/(?:^|\/|\\)\.\.$/.test(p.slice(-3))) {
      p += '/';
    }

    parts = p.split(/\\|\//);
    for (var i = 0, l = parts.length - 1; i < l; i++) {
      part = parts[i];
      if (part.indexOf('*') > -1 || part.indexOf('**') > -1) {
        break;
      }
      pos += part.length + 1;
      bd += part + p[pos - 1];
    }
    if (!bd) {
      bd = '.';
    }
    // Strip trailing slashes
    if (!(bd == '\\' || bd == '/')) {
      bd = bd.replace(/\\$|\/$/, '');
    }
    return bd;

  };

  // Return the contents of a given directory
  _readDir = function (dirPath) {
    var dir = path$1.normalize(dirPath)
      , paths = []
      , ret = [dir]
      , msg;

    try {
      paths = fs.readdirSync(dir);
    }
    catch (e) {
      msg = 'Could not read path ' + dir + '\n';
      if (e.stack) {
        msg += e.stack;
      }
      throw new Error(msg);
    }

    paths.forEach(function (p) {
      var curr = path$1.join(dir, p);
      var stat = fs.statSync(curr);
      if (stat.isDirectory()) {
        ret = ret.concat(_readDir(curr));
      }
      else {
        ret.push(curr);
      }
    });

    return ret;
  };

  /**
    @name file#readdirR
    @function
    @return {Array} Returns the contents as an Array, can be configured via opts.format
    @description Reads the given directory returning it's contents
    @param {String} dir The directory to read
    @param {Object} opts Options to use
      @param {String} [opts.format] Set the format to return(Default: Array)
  */
  readdirR = function (dir, opts) {
    var options = opts || {}
      , format = options.format || 'array'
      , ret;
    ret = _readDir(dir);
    return format == 'string' ? ret.join('\n') : ret;
  };


globSync = function (pat, opts) {
  var dirname = basedir(pat)
    , files
    , matches;

  try {
    files = readdirR(dirname).map(function(file){
      return file.replace(/\\/g, '/');
    });
  }
  // Bail if path doesn't exist -- assume no files
  catch(e) {
    console.error(e.message);
  }

  if (files) {
    pat = path$1.normalize(pat);
    matches = minimatch_1.match(files, pat, opts || {});
  }
  return matches || [];
};

// Constants
// ---------------
// List of all the builtin Array methods we want to override
var ARRAY_METHODS = Object.getOwnPropertyNames(Array.prototype)
// Array methods that return a copy instead of affecting the original
  , SPECIAL_RETURN = {
      'concat': true
    , 'slice': true
    , 'filter': true
    , 'map': true
    }
// Default file-patterns we want to ignore
  , DEFAULT_IGNORE_PATTERNS = [
      /(^|[\/\\])CVS([\/\\]|$)/
    , /(^|[\/\\])\.svn([\/\\]|$)/
    , /(^|[\/\\])\.git([\/\\]|$)/
    , /\.bak$/
    , /~$/
    ]
// Ignore core files
  , DEFAULT_IGNORE_FUNCS = [
      function (name) {
        var isDir = false
          , stats;
        try {
          stats = fs.statSync(name);
          isDir = stats.isDirectory();
        }
        catch(e) {}
        return (/(^|[\/\\])core$/).test(name) && !isDir;
      }
    ];

var FileList = function () {
  var self = this
    , wrap;

  // List of glob-patterns or specific filenames
  this.pendingAdd = [];
  // Switched to false after lazy-eval of files
  this.pending = true;
  // Used to calculate exclusions from the list of files
  this.excludes = {
    pats: DEFAULT_IGNORE_PATTERNS.slice()
  , funcs: DEFAULT_IGNORE_FUNCS.slice()
  , regex: null
  };
  this.items = [];

  // Wrap the array methods with the delegates
  wrap = function (prop) {
    var arr;
    self[prop] = function () {
      if (self.pending) {
        self.resolve();
      }
      if (typeof self.items[prop] == 'function') {
        // Special method that return a copy
        if (SPECIAL_RETURN[prop]) {
          arr = self.items[prop].apply(self.items, arguments);
          return FileList.clone(self, arr);
        }
        else {
          return self.items[prop].apply(self.items, arguments);
        }
      }
      else {
        return self.items[prop];
      }
    };
  };
  for (var i = 0, ii = ARRAY_METHODS.length; i < ii; i++) {
    wrap(ARRAY_METHODS[i]);
  }

  // Include whatever files got passed to the constructor
  this.include.apply(this, arguments);

  // Fix constructor linkage
  this.constructor = FileList;
};

FileList.prototype = new (function () {
  var globPattern = /[*?\[\{]/;

  var _addMatching = function (item) {
        var matches = globSync(item.path, item.options);
        this.items = this.items.concat(matches);
      }

    , _resolveAdd = function (item) {
        if (globPattern.test(item.path)) {
          _addMatching.call(this, item);
        }
        else {
          this.push(item.path);
        }
      }

    , _calculateExcludeRe = function () {
        var pats = this.excludes.pats
          , pat
          , excl = []
          , matches = [];

        for (var i = 0, ii = pats.length; i < ii; i++) {
          pat = pats[i];
          if (typeof pat == 'string') {
            // Glob, look up files
            if (/[*?]/.test(pat)) {
              matches = globSync(pat);
              matches = matches.map(function (m) {
                return escapeRegExpChars(m);
              });
              excl = excl.concat(matches);
            }
            // String for regex
            else {
              excl.push(escapeRegExpChars(pat));
            }
          }
          // Regex, grab the string-representation
          else if (pat instanceof RegExp) {
            excl.push(pat.toString().replace(/^\/|\/$/g, ''));
          }
        }
        if (excl.length) {
          this.excludes.regex = new RegExp('(' + excl.join(')|(') + ')');
        }
        else {
          this.excludes.regex = /^$/;
        }
      }

    , _resolveExclude = function () {
        var self = this;
        _calculateExcludeRe.call(this);
        // No `reject` method, so use reverse-filter
        this.items = this.items.filter(function (name) {
          return !self.shouldExclude(name);
        });
      };

  /**
   * Includes file-patterns in the FileList. Should be called with one or more
   * pattern for finding file to include in the list. Arguments should be strings
   * for either a glob-pattern or a specific file-name, or an array of them
   */
  this.include = function () {
    var args = Array.prototype.slice.call(arguments)
        , arg
        , includes = { items: [], options: {} };

    for (var i = 0, ilen = args.length; i < ilen; i++) {
      arg = args[i];

      if (typeof arg === 'object' && !Array.isArray(arg)) {
        merge(includes.options, arg);
      } else {
        includes.items = includes.items.concat(arg).filter(function (item) {
          return !!item;
        });
      }
    }

    var items = includes.items.map(function(item) {
      return { path: item, options: includes.options };
    });

    this.pendingAdd = this.pendingAdd.concat(items);

    return this;
  };

  /**
   * Indicates whether a particular file would be filtered out by the current
   * exclusion rules for this FileList.
   * @param {String} name The filename to check
   * @return {Boolean} Whether or not the file should be excluded
   */
  this.shouldExclude = function (name) {
    if (!this.excludes.regex) {
      _calculateExcludeRe.call(this);
    }
    var excl = this.excludes;
    return excl.regex.test(name) || excl.funcs.some(function (f) {
      return !!f(name);
    });
  };

  /**
   * Excludes file-patterns from the FileList. Should be called with one or more
   * pattern for finding file to include in the list. Arguments can be:
   * 1. Strings for either a glob-pattern or a specific file-name
   * 2. Regular expression literals
   * 3. Functions to be run on the filename that return a true/false
   */
  this.exclude = function () {
    var args = Array.isArray(arguments[0]) ? arguments[0] : arguments
      , arg;
    for (var i = 0, ii = args.length; i < ii; i++) {
      arg = args[i];
      if (typeof arg == 'function' && !(arg instanceof RegExp)) {
        this.excludes.funcs.push(arg);
      }
      else {
        this.excludes.pats.push(arg);
      }
    }
    if (!this.pending) {
      _resolveExclude.call(this);
    }
    return this;
  };

  /**
   * Populates the FileList from the include/exclude rules with a list of
   * actual files
   */
  this.resolve = function () {
    var item
      , uniqueFunc = function (p, c) {
          if (p.indexOf(c) < 0) {
            p.push(c);
          }
          return p;
        };
    if (this.pending) {
      this.pending = false;
      while ((item = this.pendingAdd.shift())) {
        _resolveAdd.call(this, item);
      }
      // Reduce to a unique list
      this.items = this.items.reduce(uniqueFunc, []);
      // Remove exclusions
      _resolveExclude.call(this);
    }
    return this;
  };

  /**
   * Convert to a plain-jane array
   */
  this.toArray = function () {
    // Call slice to ensure lazy-resolution before slicing items
    var ret = this.slice().items.slice();
    return ret;
  };

  /**
   * Clear any pending items -- only useful before
   * calling `resolve`
   */
  this.clearInclusions = function () {
    this.pendingAdd = [];
    return this;
  };

  /**
   * Clear any current exclusion rules
   */
  this.clearExclusions = function () {
    this.excludes = {
      pats: []
    , funcs: []
    , regex: null
    };
    return this;
  };

})();

// Static method, used to create copy returned by special
// array methods
FileList.clone = function (list, items) {
  var clone = new FileList();
  if (items) {
    clone.items = items;
  }
  clone.pendingAdd = list.pendingAdd;
  clone.pending = list.pending;
  for (var p in list.excludes) {
    clone.excludes[p] = list.excludes[p];
  }
  return clone;
};

var FileList_1 = FileList;

var filelist = {
	FileList: FileList_1
};

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/



let exec = child_process.exec;
let FileList$1 = filelist.FileList;

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.PackageTask
  @constructor
  @description Instantiating a PackageTask creates a number of Jake
  Tasks that make packaging and distributing your software easy.

  @param {String} name The name of the project
  @param {String} version The current project version (will be
  appended to the project-name in the package-archive
  @param {Function} definition Defines the contents of the package,
  and format of the package-archive. Will be executed on the instantiated
  PackageTask (i.e., 'this', will be the PackageTask instance),
  to set the various instance-propertiess.

  @example
  let t = new jake.PackageTask('rous', 'v' + version, function () {
    let files = [
      'Capfile'
    , 'Jakefile'
    , 'README.md'
    , 'package.json'
    , 'app/*'
    , 'bin/*'
    , 'config/*'
    , 'lib/*'
    , 'node_modules/*'
    ];
    this.packageFiles.include(files);
    this.packageFiles.exclude('node_modules/foobar');
    this.needTarGz = true;
  });

 */
let PackageTask = function () {
  let args = Array.prototype.slice.call(arguments);
  let name = args.shift();
  let version = args.shift();
  let definition = args.pop();
  let prereqs = args.pop() || []; // Optional

  prereqs = [].concat(prereqs); // Accept string or list

  /**
    @name jake.PackageTask#name
    @public
    @type {String}
    @description The name of the project
   */
  this.name = name;
  /**
    @name jake.PackageTask#version
    @public
    @type {String}
    @description The project version-string
   */
  this.version = version;
  /**
    @name jake.PackageTask#prereqs
    @public
    @type {Array}
    @description Tasks to run before packaging
   */
  this.prereqs = prereqs;
  /**
    @name jake.PackageTask#packageDir
    @public
    @type {String='pkg'}
    @description The directory-name to use for packaging the software
   */
  this.packageDir = 'pkg';
  /**
    @name jake.PackageTask#packageFiles
    @public
    @type {jake.FileList}
    @description The list of files and directories to include in the
    package-archive
   */
  this.packageFiles = new FileList$1();
  /**
    @name jake.PackageTask#needTar
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a gzip .tgz archive of the package
   */
  this.needTar = false;
  /**
    @name jake.PackageTask#needTarGz
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a gzip .tar.gz archive of the package
   */
  this.needTarGz = false;
  /**
    @name jake.PackageTask#needTarBz2
    @public
    @type {Boolean=false}
    @description If set to true, uses the `tar` utility to create
    a bzip2 .bz2 archive of the package
   */
  this.needTarBz2 = false;
  /**
    @name jake.PackageTask#needJar
    @public
    @type {Boolean=false}
    @description If set to true, uses the `jar` utility to create
    a .jar archive of the package
   */
  this.needJar = false;
  /**
    @name jake.PackageTask#needZip
    @public
    @type {Boolean=false}
    @description If set to true, uses the `zip` utility to create
    a .zip archive of the package
   */
  this.needZip = false;
  /**
    @name jake.PackageTask#manifestFile
    @public
    @type {String=null}
    @description Can be set to point the `jar` utility at a manifest
    file to use in a .jar archive. If unset, one will be automatically
    created by the `jar` utility. This path should be relative to the
    root of the package directory (this.packageDir above, likely 'pkg')
   */
  this.manifestFile = null;
  /**
    @name jake.PackageTask#tarCommand
    @public
    @type {String='tar'}
    @description The shell-command to use for creating tar archives.
   */
  this.tarCommand = 'tar';
  /**
    @name jake.PackageTask#jarCommand
    @public
    @type {String='jar'}
    @description The shell-command to use for creating jar archives.
   */
  this.jarCommand = 'jar';
  /**
    @name jake.PackageTask#zipCommand
    @public
    @type {String='zip'}
    @description The shell-command to use for creating zip archives.
   */
  this.zipCommand = 'zip';
  /**
    @name jake.PackageTask#archiveNoBaseDir
    @public
    @type {Boolean=false}
    @description Simple option for performing the archive on the
    contents of the directory instead of the directory itself
   */
  this.archiveNoBaseDir = false;
  /**
    @name jake.PackageTask#archiveChangeDir
    @public
    @type {String=null}
    @description Equivalent to the '-C' command for the `tar` and `jar`
    commands. ("Change to this directory before adding files.")
   */
  this.archiveChangeDir = null;
  /**
    @name jake.PackageTask#archiveContentDir
    @public
    @type {String=null}
    @description Specifies the files and directories to include in the
    package-archive. If unset, this will default to the main package
    directory -- i.e., name + version.
   */
  this.archiveContentDir = null;

  if (typeof definition == 'function') {
    definition.call(this);
  }
  this.define();
};

PackageTask.prototype = new (function () {

  let _compressOpts = {
    Tar: {
      ext: '.tgz',
      flags: 'czf',
      cmd: 'tar'
    },
    TarGz: {
      ext: '.tar.gz',
      flags: 'czf',
      cmd: 'tar'
    },
    TarBz2: {
      ext: '.tar.bz2',
      flags: 'cjf',
      cmd: 'tar'
    },
    Jar: {
      ext: '.jar',
      flags: 'cf',
      cmd: 'jar'
    },
    Zip: {
      ext: '.zip',
      flags: 'qr',
      cmd: 'zip'
    }
  };

  this.define = function () {
    let self = this;
    let packageDirPath = this.packageDirPath();
    let compressTaskArr = [];

    desc('Build the package for distribution');
    task('package', self.prereqs.concat(['clobberPackage', 'buildPackage']));
    // Backward-compat alias
    task('repackage', ['package']);

    task('clobberPackage', function () {
      jake.rmRf(self.packageDir, {silent: true});
    });

    desc('Remove the package');
    task('clobber', ['clobberPackage']);

    let doCommand = function (p) {
      let filename = path$1.resolve(self.packageDir + '/' + self.packageName() +
                                  _compressOpts[p].ext);
      if (process.platform == 'win32') {
        // Windows full path may have drive letter, which is going to cause
        // namespace problems, so strip it.
        if (filename.length > 2 && filename[1] == ':') {
          filename = filename.substr(2);
        }
      }
      compressTaskArr.push(filename);

      file(filename, [packageDirPath], function () {
        let cmd;
        let opts = _compressOpts[p];
        // Directory to move to when doing the compression-task
        // Changes in the case of zip for emulating -C option
        let chdir = self.packageDir;
        // Save the current dir so it's possible to pop back up
        // after compressing
        let currDir = process.cwd();
        let archiveChangeDir;
        let archiveContentDir;

        if (self.archiveNoBaseDir) {
          archiveChangeDir = self.packageName();
          archiveContentDir = '.';
        }
        else {
          archiveChangeDir = self.archiveChangeDir;
          archiveContentDir = self.archiveContentDir;
        }

        cmd = self[opts.cmd + 'Command'];
        cmd += ' -' + opts.flags;
        if (opts.cmd == 'jar' && self.manifestFile) {
          cmd += 'm';
        }

        // The name of the archive to create -- use full path
        // so compression can be performed from a different dir
        // if needed
        cmd += ' ' + filename;

        if (opts.cmd == 'jar' && self.manifestFile) {
          cmd += ' ' + self.manifestFile;
        }

        // Where to perform the compression -- -C option isn't
        // supported in zip, so actually do process.chdir for this
        if (archiveChangeDir) {
          if (opts.cmd == 'zip') {
            chdir = path$1.join(chdir, archiveChangeDir);
          }
          else {
            cmd += ' -C ' + archiveChangeDir;
          }
        }

        // Where to get the archive content
        if (archiveContentDir) {
          cmd += ' ' + archiveContentDir;
        }
        else {
          cmd += ' ' + self.packageName();
        }

        // Move into the desired dir (usually packageDir) to compress
        // Return back up to the current dir after the exec
        process.chdir(chdir);

        exec(cmd, function (err, stdout, stderr) {
          if (err) { throw err; }

          // Return back up to the starting directory (see above,
          // before exec)
          process.chdir(currDir);

          complete();
        });
      }, {async: true});
    };

    for (let p in _compressOpts) {
      if (this['need' + p]) {
        doCommand(p);
      }
    }

    task('buildPackage', compressTaskArr, function () {});

    directory(this.packageDir);

    file(packageDirPath, this.packageFiles, function () {
      jake.mkdirP(packageDirPath);
      let fileList = [];
      self.packageFiles.forEach(function (name) {
        let f = path$1.join(self.packageDirPath(), name);
        let fDir = path$1.dirname(f);
        jake.mkdirP(fDir, {silent: true});

        // Add both files and directories
        fileList.push({
          from: name,
          to: f
        });
      });
      let _copyFile = function () {
        let file = fileList.pop();
        let stat;
        if (file) {
          stat = fs.statSync(file.from);
          // Target is a directory, just create it
          if (stat.isDirectory()) {
            jake.mkdirP(file.to, {silent: true});
            _copyFile();
          }
          // Otherwise copy the file
          else {
            jake.cpR(file.from, file.to, {silent: true});
            _copyFile();
          }
        }
        else {
          complete();
        }
      };
      _copyFile();
    }, {async: true});


  };

  this.packageName = function () {
    if (this.version) {
      return this.name + '-' + this.version;
    }
    else {
      return this.name;
    }
  };

  this.packageDirPath = function () {
    return this.packageDir + '/' + this.packageName();
  };

})();

jake.PackageTask = PackageTask;
var PackageTask_1 = PackageTask;

var package_task = {
	PackageTask: PackageTask_1
};

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/



let exec$1 = child_process.execSync;
let FileList$2 = filelist.FileList;

let PublishTask = function () {
  let args = Array.prototype.slice.call(arguments).filter(function (item) {
    return typeof item != 'undefined';
  });
  let arg;
  let opts = {};
  let definition;
  let prereqs = [];
  let createDef = function (arg) {
    return function () {
      this.packageFiles.include(arg);
    };
  };

  this.name = args.shift();

  // Old API, just name + list of files
  if (args.length == 1 && (Array.isArray(args[0]) || typeof args[0] == 'string')) {
    definition = createDef(args.pop());
  }
  // Current API, name + [prereqs] + [opts] + definition
  else {
    while ((arg = args.pop())) {
      // Definition func
      if (typeof arg == 'function') {
        definition = arg;
      }
      // Prereqs
      else if (Array.isArray(arg) || typeof arg == 'string') {
        prereqs = arg;
      }
      // Opts
      else {
        opts = arg;
      }
    }
  }

  this.prereqs = prereqs;
  this.packageFiles = new FileList$2();
  this.publishCmd = opts.publishCmd || 'npm publish %filename';
  this.publishMessage = opts.publishMessage || 'BOOM! Published.';
  this.gitCmd = opts.gitCmd || 'git';
  this.versionFiles = opts.versionFiles || ['package.json'];
  this.scheduleDelay = 5000;

  // Override utility funcs for testing
  this._ensureRepoClean = function (stdout) {
    if (stdout.length) {
      fail(new Error('Git repository is not clean.'));
    }
  };
  this._getCurrentBranch = function (stdout) {
    return String(stdout).trim();
  };

  if (typeof definition == 'function') {
    definition.call(this);
  }
  this.define();
};


PublishTask.prototype = new (function () {

  let _currentBranch = null;

  let getPackage = function () {
    let pkg = JSON.parse(fs.readFileSync(path$1.join(process.cwd(),
      '/package.json')).toString());
    return pkg;
  };
  let getPackageVersionNumber = function () {
    return getPackage().version;
  };

  this.define = function () {
    let self = this;

    namespace('publish', function () {
      task('fetchTags', function () {
        // Make sure local tags are up to date
        exec$1(self.gitCmd + ' fetch --tags');
        console.log('Fetched remote tags.');
      });

      task('getCurrentBranch', function () {
        // Figure out what branch to push to
        let stdout = exec$1(self.gitCmd + ' symbolic-ref --short HEAD').toString();
        if (!stdout) {
          throw new Error('No current Git branch found');
        }
        _currentBranch = self._getCurrentBranch(stdout);
        console.log('On branch ' + _currentBranch);
      });

      task('ensureClean', function () {
        // Only bump, push, and tag if the Git repo is clean
        let stdout = exec$1(self.gitCmd + ' status --porcelain --untracked-files=no').toString();
        // Throw if there's output
        self._ensureRepoClean(stdout);
      });

      task('updateVersionFiles', function () {
        let pkg;
        let version;
        let arr;
        let patch;

        // Grab the current version-string
        pkg = getPackage();
        version = pkg.version;
        // Increment the patch-number for the version
        arr = version.split('.');
        patch = parseInt(arr.pop(), 10) + 1;
        arr.push(patch);
        version = arr.join('.');

        // Update package.json or other files with the new version-info
        self.versionFiles.forEach(function (file) {
          let p = path$1.join(process.cwd(), file);
          let data = JSON.parse(fs.readFileSync(p).toString());
          data.version = version;
          fs.writeFileSync(p, JSON.stringify(data, true, 2) + '\n');
        });
        // Return the version string so that listeners for the 'complete' event
        // for this task can use it (e.g., to update other files before pushing
        // to Git)
        return version;
      });

      task('pushVersion', ['ensureClean', 'updateVersionFiles'], function () {
        let version = getPackageVersionNumber();
        let message = 'Version ' + version;
        let cmds = [
          self.gitCmd + ' commit -a -m "' + message + '"',
          self.gitCmd + ' push origin ' + _currentBranch,
          self.gitCmd + ' tag -a v' + version + ' -m "' + message + '"',
          self.gitCmd + ' push --tags'
        ];
        cmds.forEach((cmd) => {
          exec$1(cmd);
        });
        version = getPackageVersionNumber();
        console.log('Bumped version number to v' + version + '.');
      });

      let defineTask = task('definePackage', function () {
        let version = getPackageVersionNumber();
        new jake.PackageTask(self.name, 'v' + version, self.prereqs, function () {
          // Replace the PackageTask's FileList with the PublishTask's FileList
          this.packageFiles = self.packageFiles;
          this.needTarGz = true; // Default to tar.gz
          // If any of the need<CompressionFormat> or archive opts are set
          // proxy them to the PackageTask
          for (let p in this) {
            if (p.indexOf('need') === 0 || p.indexOf('archive') === 0) {
              if (typeof self[p] != 'undefined') {
                this[p] = self[p];
              }
            }
          }
        });
      });
      defineTask._internal = true;

      task('package', function () {
        let definePack = jake.Task['publish:definePackage'];
        let pack = jake.Task['package'];
        let version = getPackageVersionNumber();

        // May have already been run
        if (definePack.taskStatus == jake.Task.runStatuses.DONE) {
          definePack.reenable(true);
        }
        definePack.invoke();
        // Set manually, completion happens in next tick, creating deadlock
        definePack.taskStatus = jake.Task.runStatuses.DONE;
        pack.invoke();
        console.log('Created package for ' + self.name + ' v' + version);
      });

      task('publish', function () {
        return new Promise((resolve) => {
          let version = getPackageVersionNumber();
          let filename;
          let cmd;

          console.log('Publishing ' + self.name + ' v' + version);

          if (typeof self.createPublishCommand == 'function') {
            cmd = self.createPublishCommand(version);
          }
          else {
            filename = './pkg/' + self.name + '-v' + version + '.tar.gz';
            cmd = self.publishCmd.replace(/%filename/gi, filename);
          }

          if (typeof cmd == 'function') {
            cmd(function (err) {
              if (err) {
                throw err;
              }
              console.log(self.publishMessage);
              resolve();
            });
          }
          else {
            // Hackity hack -- NPM publish sometimes returns errror like:
            // Error sending version data\nnpm ERR!
            // Error: forbidden 0.2.4 is modified, should match modified time
            setTimeout(function () {
              let stdout = exec$1(cmd).toString() || '';
              stdout = stdout.trim();
              if (stdout) {
                console.log(stdout);
              }
              console.log(self.publishMessage);
              resolve();
            }, self.scheduleDelay);
          }
        });
      });

      task('cleanup', function () {
        return new Promise((resolve) => {
          let clobber = jake.Task.clobber;
          clobber.reenable(true);
          clobber.on('complete', function () {
            console.log('Cleaned up package');
            resolve();
          });
          clobber.invoke();
        });
      });

    });

    let prefixNs = function (item) {
      return 'publish:' + item;
    };

    // Create aliases in the default namespace
    desc('Create a new version and release.');
    task('publish', self.prereqs.concat(['version', 'release']
      .map(prefixNs)));

    desc('Release the existing version.');
    task('publishExisting', self.prereqs.concat(['release']
      .map(prefixNs)));

    task('version', ['fetchTags', 'getCurrentBranch', 'pushVersion']
      .map(prefixNs));

    task('release', ['package', 'publish', 'cleanup']
      .map(prefixNs));

    // Invoke proactively so there will be a callable 'package' task
    // which can be used apart from 'publish'
    jake.Task['publish:definePackage'].invoke();
  };

})();

jake.PublishTask = PublishTask;
var PublishTask_1 = PublishTask;

var publish_task = {
	PublishTask: PublishTask_1
};

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


let currDir = process.cwd();

/**
  @name jake
  @namespace jake
*/
/**
  @name jake.TestTask
  @constructor
  @description Instantiating a TestTask creates a number of Jake
  Tasks that make running tests for your software easy.

  @param {String} name The name of the project
  @param {Function} definition Defines the list of files containing the tests,
  and the name of the namespace/task for running them. Will be executed on the
  instantiated TestTask (i.e., 'this', will be the TestTask instance), to set
  the various instance-propertiess.

  @example
  let t = new jake.TestTask('bij-js', function () {
    this.testName = 'testSpecial';
    this.testFiles.include('test/**');
  });

 */
let TestTask = function () {
  let self = this;
  let args = Array.prototype.slice.call(arguments);
  let name = args.shift();
  let definition = args.pop();
  let prereqs = args.pop() || [];

  /**
    @name jake.TestTask#testNam
    @public
    @type {String}
    @description The name of the namespace to place the tests in, and
    the top-level task for running tests. Defaults to "test"
   */
  this.testName = 'test';

  /**
    @name jake.TestTask#testFiles
    @public
    @type {jake.FileList}
    @description The list of files containing tests to load
   */
  this.testFiles = new jake.FileList();

  /**
    @name jake.TestTask#showDescription
    @public
    @type {Boolean}
    @description Show the created task when doing Jake -T
   */
  this.showDescription = true;

  /*
    @name jake.TestTask#totalTests
    @public
    @type {Number}
    @description The total number of tests to run
  */
  this.totalTests = 0;

  /*
    @name jake.TestTask#executedTests
    @public
    @type {Number}
    @description The number of tests successfully run
  */
  this.executedTests = 0;

  if (typeof definition == 'function') {
    definition.call(this);
  }

  if (this.showDescription) {
    desc('Run the tests for ' + name);
  }

  task(this.testName, prereqs, {async: true}, function () {
    let t = jake.Task[this.fullName + ':run'];
    t.on('complete', function () {
      complete();
    });
    // Pass args to the namespaced test
    t.invoke.apply(t, arguments);
  });

  namespace(self.testName, function () {

    let runTask = task('run', {async: true}, function (pat) {
      let re;
      let testFiles;

      // Don't nest; make a top-level namespace. Don't want
      // re-calling from inside to nest infinitely
      jake.currentNamespace = jake.defaultNamespace;

      re = new RegExp(pat);
      // Get test files that match the passed-in pattern
      testFiles = self.testFiles.toArray()
        .filter(function (f) {
          return (re).test(f);
        }) // Don't load the same file multiple times -- should this be in FileList?
        .reduce(function (p, c) {
          if (p.indexOf(c) < 0) {
            p.push(c);
          }
          return p;
        }, []);

      // Create a namespace for all the testing tasks to live in
      namespace(self.testName + 'Exec', function () {
        // Each test will be a prereq for the dummy top-level task
        let prereqs = [];
        // Continuation to pass to the async tests, wrapping `continune`
        let next = function () {
          complete();
        };
        // Create the task for this test-function
        let createTask = function (name, action) {
          // If the test-function is defined with a continuation
          // param, flag the task as async
          let t;
          let isAsync = !!action.length;

          // Define the actual namespaced task with the name, the
          // wrapped action, and the correc async-flag
          t = task(name, createAction(name, action), {
            async: isAsync
          });
          t.once('complete', function () {
            self.executedTests++;
          });
          t._internal = true;
          return t;
        };
        // Used as the action for the defined task for each test.
        let createAction = function (n, a) {
          // A wrapped function that passes in the `next` function
          // for any tasks that run asynchronously
          return function () {
            let cb;
            if (a.length) {
              cb = next;
            }
            if (!(n == 'before' || n == 'after' ||
                    /_beforeEach$/.test(n) || /_afterEach$/.test(n))) {
              jake.logger.log(n);
            }
            // 'this' will be the task when action is run
            return a.call(this, cb);
          };
        };
          // Dummy top-level task for everything to be prereqs for
        let topLevel;

        // Pull in each test-file, and iterate over any exported
        // test-functions. Register each test-function as a prereq task
        testFiles.forEach(function (file) {
          let exp = commonjsRequire(path$1.join(currDir, file));

          // Create a namespace for each filename, so test-name collisions
          // won't be a problem
          namespace(file, function () {
            let testPrefix = self.testName + 'Exec:' + file + ':';
            let testName;
            // Dummy task for displaying file banner
            testName = '*** Running ' + file + ' ***';
            prereqs.push(testPrefix + testName);
            createTask(testName, function () {});

            // 'before' setup
            if (typeof exp.before == 'function') {
              prereqs.push(testPrefix + 'before');
              // Create the task
              createTask('before', exp.before);
            }

            // Walk each exported function, and create a task for each
            for (let p in exp) {
              if (p == 'before' || p == 'after' ||
                  p == 'beforeEach' || p == 'afterEach') {
                continue;
              }

              if (typeof exp.beforeEach == 'function') {
                prereqs.push(testPrefix + p + '_beforeEach');
                // Create the task
                createTask(p + '_beforeEach', exp.beforeEach);
              }

              // Add the namespace:name of this test to the list of prereqs
              // for the dummy top-level task
              prereqs.push(testPrefix + p);
              // Create the task
              createTask(p, exp[p]);

              if (typeof exp.afterEach == 'function') {
                prereqs.push(testPrefix + p + '_afterEach');
                // Create the task
                createTask(p + '_afterEach', exp.afterEach);
              }
            }

            // 'after' teardown
            if (typeof exp.after == 'function') {
              prereqs.push(testPrefix + 'after');
              // Create the task
              let afterTask = createTask('after', exp.after);
              afterTask._internal = true;
            }

          });
        });

        self.totalTests = prereqs.length;
        process.on('exit', function () {
          // Throw in the case where the process exits without
          // finishing tests, but no error was thrown
          if (!jake.errorCode && (self.totalTests > self.executedTests)) {
            throw new Error('Process exited without all tests completing.');
          }
        });

        // Create the dummy top-level task. When calling a task internally
        // with `invoke` that is async (or has async prereqs), have to listen
        // for the 'complete' event to know when it's done
        topLevel = task('__top__', prereqs);
        topLevel._internal = true;
        topLevel.addListener('complete', function () {
          jake.logger.log('All tests ran successfully');
          complete();
        });

        topLevel.invoke(); // Do the thing!
      });

    });
    runTask._internal = true;

  });


};

jake.TestTask = TestTask;
var TestTask_1 = TestTask;

var test_task = {
	TestTask: TestTask_1
};

/*
 * Jake JavaScript build tool
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

if (!commonjsGlobal.jake) {

  let EventEmitter = events.EventEmitter;
  // And so it begins
  commonjsGlobal.jake = new EventEmitter();

  let fs$1 = fs;
  let chalk$1 = chalk;
  let taskNs = task$2;
  let Task = taskNs.Task;
  let FileTask = taskNs.FileTask;
  let DirectoryTask = taskNs.DirectoryTask;
  let Rule = rule.Rule;
  let Namespace = namespace$1.Namespace;
  let RootNamespace = namespace$1.RootNamespace;
  let api = api_1;
  let utils = utils_1;
  let Program = program.Program;
  let loader$1 = loader();
  let pkg = JSON.parse(fs$1.readFileSync(__dirname + '/../package.json').toString());

  const MAX_RULE_RECURSION_LEVEL = 16;

  // Globalize jake and top-level API methods (e.g., `task`, `desc`)
  Object.assign(commonjsGlobal, api);

  // Copy utils onto base jake
  jake.logger = utils.logger;
  jake.exec = utils.exec;

  // File utils should be aliased directly on base jake as well
  Object.assign(jake, utils.file);

  // Also add top-level API methods to exported object for those who don't want to
  // use the globals (`file` here will overwrite the 'file' utils namespace)
  Object.assign(jake, api);

  Object.assign(jake, new (function () {

    this._invocationChain = [];
    this._taskTimeout = 30000;

    // Public properties
    // =================
    this.version = pkg.version;
    // Used when Jake exits with a specific error-code
    this.errorCode = null;
    // Loads Jakefiles/jakelibdirs
    this.loader = loader$1;
    // The root of all ... namespaces
    this.rootNamespace = new RootNamespace();
    // Non-namespaced tasks are placed into the default
    this.defaultNamespace = this.rootNamespace;
    // Start in the default
    this.currentNamespace = this.defaultNamespace;
    // Saves the description created by a 'desc' call that prefaces a
    // 'task' call that defines a task.
    this.currentTaskDescription = null;
    this.program = new Program();
    this.FileList = filelist.FileList;
    this.PackageTask = package_task.PackageTask;
    this.PublishTask = publish_task.PublishTask;
    this.TestTask = test_task.TestTask;
    this.Task = Task;
    this.FileTask = FileTask;
    this.DirectoryTask = DirectoryTask;
    this.Namespace = Namespace;
    this.Rule = Rule;

    this.parseAllTasks = function () {
      let _parseNs = function (ns) {
        let nsTasks = ns.tasks;
        let nsNamespaces = ns.childNamespaces;
        for (let q in nsTasks) {
          let nsTask = nsTasks[q];
          jake.Task[nsTask.fullName] = nsTask;
        }
        for (let p in nsNamespaces) {
          let nsNamespace = nsNamespaces[p];
          _parseNs(nsNamespace);
        }
      };
      _parseNs(jake.defaultNamespace);
    };

    /**
     * Displays the list of descriptions avaliable for tasks defined in
     * a Jakefile
     */
    this.showAllTaskDescriptions = function (f) {
      let p;
      let maxTaskNameLength = 0;
      let task;
      let padding;
      let name;
      let descr;
      let filter = typeof f == 'string' ? f : null;

      for (p in jake.Task) {
        if (!Object.prototype.hasOwnProperty.call(jake.Task, p)) {
          continue;
        }
        if (filter && p.indexOf(filter) == -1) {
          continue;
        }
        task = jake.Task[p];
        // Record the length of the longest task name -- used for
        // pretty alignment of the task descriptions
        if (task.description) {
          maxTaskNameLength = p.length > maxTaskNameLength ?
            p.length : maxTaskNameLength;
        }
      }
      // Print out each entry with descriptions neatly aligned
      for (p in jake.Task) {
        if (!Object.prototype.hasOwnProperty.call(jake.Task, p)) {
          continue;
        }
        if (filter && p.indexOf(filter) == -1) {
          continue;
        }
        task = jake.Task[p];

        //name = '\033[32m' + p + '\033[39m ';
        name = chalk$1.green(p);

        descr = task.description;
        if (descr) {
          descr = chalk$1.gray('# ' + descr);

          // Create padding-string with calculated length
          padding = (new Array(maxTaskNameLength - p.length + 2)).join(' ');

          console.log('jake ' + name + padding + descr);
        }
      }
    };

    this.createTask = function () {
      let args = Array.prototype.slice.call(arguments);
      let arg;
      let obj;
      let task;
      let type;
      let name;
      let action;
      let opts = {};
      let prereqs = [];

      type = args.shift();

      // name, [deps], [action]
      // Name (string) + deps (array) format
      if (typeof args[0] == 'string') {
        name = args.shift();
        if (Array.isArray(args[0])) {
          prereqs = args.shift();
        }
      }
      // name:deps, [action]
      // Legacy object-literal syntax, e.g.: {'name': ['depA', 'depB']}
      else {
        obj = args.shift();
        for (let p in obj) {
          prereqs = prereqs.concat(obj[p]);
          name = p;
        }
      }

      // Optional opts/callback or callback/opts
      while ((arg = args.shift())) {
        if (typeof arg == 'function') {
          action = arg;
        }
        else {
          opts = Object.assign(Object.create(null), arg);
        }
      }

      task = jake.currentNamespace.resolveTask(name);
      if (task && !action) {
        // Task already exists and no action, just update prereqs, and return it.
        task.prereqs = task.prereqs.concat(prereqs);
        return task;
      }

      switch (type) {
      case 'directory':
        action = function () {
          jake.mkdirP(name);
        };
        task = new DirectoryTask(name, prereqs, action, opts);
        break;
      case 'file':
        task = new FileTask(name, prereqs, action, opts);
        break;
      default:
        task = new Task(name, prereqs, action, opts);
      }

      jake.currentNamespace.addTask(task);

      if (jake.currentTaskDescription) {
        task.description = jake.currentTaskDescription;
        jake.currentTaskDescription = null;
      }

      // FIXME: Should only need to add a new entry for the current
      // task-definition, not reparse the entire structure
      jake.parseAllTasks();

      return task;
    };

    this.attemptRule = function (name, ns, level) {
      let prereqRule;
      let prereq;
      if (level > MAX_RULE_RECURSION_LEVEL) {
        return null;
      }
      // Check Rule
      prereqRule = ns.matchRule(name);
      if (prereqRule) {
        prereq = prereqRule.createTask(name, level);
      }
      return prereq || null;
    };

    this.createPlaceholderFileTask = function (name, namespace) {
      let parsed = name.split(':');
      let filePath = parsed.pop(); // Strip any namespace
      let task;

      task = namespace.resolveTask(name);

      // If there's not already an existing dummy FileTask for it,
      // create one
      if (!task) {
        // Create a dummy FileTask only if file actually exists
        if (fs$1.existsSync(filePath)) {
          task = new jake.FileTask(filePath);
          task.dummy = true;
          let ns;
          if (parsed.length) {
            ns = namespace.resolveNamespace(parsed.join(':'));
          }
          else {
            ns = namespace;
          }
          if (!namespace) {
            throw new Error('Invalid namespace, cannot add FileTask');
          }
          ns.addTask(task);
          // Put this dummy Task in the global Tasks list so
          // modTime will be eval'd correctly
          jake.Task[`${ns.path}:${filePath}`] = task;
        }
      }

      return task || null;
    };


    this.run = function () {
      let args = Array.prototype.slice.call(arguments);
      let program = this.program;
      let loader = this.loader;
      let preempt;
      let opts;

      program.parseArgs(args);
      program.init();

      preempt = program.firstPreemptiveOption();
      if (preempt) {
        preempt();
      }
      else {
        opts = program.opts;
        // jakefile flag set but no jakefile yet
        if (opts.autocomplete && opts.jakefile === true) {
          process.stdout.write('no-complete');
          return;
        }
        // Load Jakefile and jakelibdir files
        let jakefileLoaded = loader.loadFile(opts.jakefile);
        let jakelibdirLoaded = loader.loadDirectory(opts.jakelibdir);

        if(!jakefileLoaded && !jakelibdirLoaded && !opts.autocomplete) {
          fail('No Jakefile. Specify a valid path with -f/--jakefile, ' +
              'or place one in the current directory.');
        }

        program.run();
      }
    };

  })());
}

var jake_1 = jake;

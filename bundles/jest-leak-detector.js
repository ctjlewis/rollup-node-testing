import v8 from 'v8';
import vm from 'vm';
import weakNapi from 'weak-napi';

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

/* MIT license */
/* eslint-disable no-mixed-operators */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

const reverseKeywords = {};
for (const key of Object.keys(colorName)) {
	reverseKeywords[colorName[key]] = key;
}

const convert = {
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

var conversions = convert;

// Hide .channels and .labels properties
for (const model of Object.keys(convert)) {
	if (!('channels' in convert[model])) {
		throw new Error('missing channels property: ' + model);
	}

	if (!('labels' in convert[model])) {
		throw new Error('missing channel labels property: ' + model);
	}

	if (convert[model].labels.length !== convert[model].channels) {
		throw new Error('channel and label counts mismatch: ' + model);
	}

	const {channels, labels} = convert[model];
	delete convert[model].channels;
	delete convert[model].labels;
	Object.defineProperty(convert[model], 'channels', {value: channels});
	Object.defineProperty(convert[model], 'labels', {value: labels});
}

convert.rgb.hsl = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const min = Math.min(r, g, b);
	const max = Math.max(r, g, b);
	const delta = max - min;
	let h;
	let s;

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

	const l = (min + max) / 2;

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
	let rdif;
	let gdif;
	let bdif;
	let h;
	let s;

	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const v = Math.max(r, g, b);
	const diff = v - Math.min(r, g, b);
	const diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = 0;
		s = 0;
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
	const r = rgb[0];
	const g = rgb[1];
	let b = rgb[2];
	const h = convert.rgb.hsl(rgb)[0];
	const w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;

	const k = Math.min(1 - r, 1 - g, 1 - b);
	const c = (1 - r - k) / (1 - k) || 0;
	const m = (1 - g - k) / (1 - k) || 0;
	const y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

function comparativeDistance(x, y) {
	/*
		See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
	*/
	return (
		((x[0] - y[0]) ** 2) +
		((x[1] - y[1]) ** 2) +
		((x[2] - y[2]) ** 2)
	);
}

convert.rgb.keyword = function (rgb) {
	const reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	let currentClosestDistance = Infinity;
	let currentClosestKeyword;

	for (const keyword of Object.keys(colorName)) {
		const value = colorName[keyword];

		// Compute comparative distance
		const distance = comparativeDistance(rgb, value);

		// Check if its less, if so set as closest
		if (distance < currentClosestDistance) {
			currentClosestDistance = distance;
			currentClosestKeyword = keyword;
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName[keyword];
};

convert.rgb.xyz = function (rgb) {
	let r = rgb[0] / 255;
	let g = rgb[1] / 255;
	let b = rgb[2] / 255;

	// Assume sRGB
	r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
	g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
	b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

	const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	const xyz = convert.rgb.xyz(rgb);
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	const h = hsl[0] / 360;
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;
	let t2;
	let t3;
	let val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	const t1 = 2 * l - t2;

	const rgb = [0, 0, 0];
	for (let i = 0; i < 3; i++) {
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
	const h = hsl[0];
	let s = hsl[1] / 100;
	let l = hsl[2] / 100;
	let smin = s;
	const lmin = Math.max(l, 0.01);

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	const v = (l + s) / 2;
	const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	const h = hsv[0] / 60;
	const s = hsv[1] / 100;
	let v = hsv[2] / 100;
	const hi = Math.floor(h) % 6;

	const f = h - Math.floor(h);
	const p = 255 * v * (1 - s);
	const q = 255 * v * (1 - (s * f));
	const t = 255 * v * (1 - (s * (1 - f)));
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
	const h = hsv[0];
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;
	const vmin = Math.max(v, 0.01);
	let sl;
	let l;

	l = (2 - s) * v;
	const lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	const h = hwb[0] / 360;
	let wh = hwb[1] / 100;
	let bl = hwb[2] / 100;
	const ratio = wh + bl;
	let f;

	// Wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	const i = Math.floor(6 * h);
	const v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	const n = wh + f * (v - wh); // Linear interpolation

	let r;
	let g;
	let b;
	/* eslint-disable max-statements-per-line,no-multi-spaces */
	switch (i) {
		default:
		case 6:
		case 0: r = v;  g = n;  b = wh; break;
		case 1: r = n;  g = v;  b = wh; break;
		case 2: r = wh; g = v;  b = n; break;
		case 3: r = wh; g = n;  b = v; break;
		case 4: r = n;  g = wh; b = v; break;
		case 5: r = v;  g = wh; b = n; break;
	}
	/* eslint-enable max-statements-per-line,no-multi-spaces */

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	const c = cmyk[0] / 100;
	const m = cmyk[1] / 100;
	const y = cmyk[2] / 100;
	const k = cmyk[3] / 100;

	const r = 1 - Math.min(1, c * (1 - k) + k);
	const g = 1 - Math.min(1, m * (1 - k) + k);
	const b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	const x = xyz[0] / 100;
	const y = xyz[1] / 100;
	const z = xyz[2] / 100;
	let r;
	let g;
	let b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// Assume sRGB
	r = r > 0.0031308
		? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let x;
	let y;
	let z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	const y2 = y ** 3;
	const x2 = x ** 3;
	const z2 = z ** 3;
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let h;

	const hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	const c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	const l = lch[0];
	const c = lch[1];
	const h = lch[2];

	const hr = h / 360 * 2 * Math.PI;
	const a = c * Math.cos(hr);
	const b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args, saturation = null) {
	const [r, g, b] = args;
	let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	let ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// Optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	const r = args[0];
	const g = args[1];
	const b = args[2];

	// We use the extended greyscale palette here, with the exception of
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

	const ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	let color = args % 10;

	// Handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	const mult = (~~(args > 50) + 1) * 0.5;
	const r = ((color & 1) * mult) * 255;
	const g = (((color >> 1) & 1) * mult) * 255;
	const b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// Handle greyscale
	if (args >= 232) {
		const c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	let rem;
	const r = Math.floor(args / 36) / 5 * 255;
	const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	const b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	const integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	let colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(char => {
			return char + char;
		}).join('');
	}

	const integer = parseInt(colorString, 16);
	const r = (integer >> 16) & 0xFF;
	const g = (integer >> 8) & 0xFF;
	const b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const max = Math.max(Math.max(r, g), b);
	const min = Math.min(Math.min(r, g), b);
	const chroma = (max - min);
	let grayscale;
	let hue;

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
		hue = 4 + (r - g) / chroma;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;

	const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

	let f = 0;
	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;

	const c = s * v;
	let f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	const h = hcg[0] / 360;
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	const pure = [0, 0, 0];
	const hi = (h % 1) * 6;
	const v = hi % 1;
	const w = 1 - v;
	let mg = 0;

	/* eslint-disable max-statements-per-line */
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
	/* eslint-enable max-statements-per-line */

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const v = c + g * (1.0 - c);
	let f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const l = g * (1.0 - c) + 0.5 * c;
	let s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;
	const v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	const w = hwb[1] / 100;
	const b = hwb[2] / 100;
	const v = 1 - b;
	const c = v - w;
	let g = 0;

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

convert.gray.hsl = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hsv = convert.gray.hsl;

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
	const val = Math.round(gray[0] / 100 * 255) & 0xFF;
	const integer = (val << 16) + (val << 8) + val;

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};

/*
	This function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	const graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	const models = Object.keys(conversions);

	for (let len = models.length, i = 0; i < len; i++) {
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
	const graph = buildGraph();
	const queue = [fromModel]; // Unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		const current = queue.pop();
		const adjacents = Object.keys(conversions[current]);

		for (let len = adjacents.length, i = 0; i < len; i++) {
			const adjacent = adjacents[i];
			const node = graph[adjacent];

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
	const path = [graph[toModel].parent, toModel];
	let fn = conversions[graph[toModel].parent][toModel];

	let cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route = function (fromModel) {
	const graph = deriveBFS(fromModel);
	const conversion = {};

	const models = Object.keys(graph);
	for (let len = models.length, i = 0; i < len; i++) {
		const toModel = models[i];
		const node = graph[toModel];

		if (node.parent === null) {
			// No possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};

const convert$1 = {};

const models = Object.keys(conversions);

function wrapRaw(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];
		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		return fn(args);
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];

		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		const result = fn(args);

		// We're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (let len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(fromModel => {
	convert$1[fromModel] = {};

	Object.defineProperty(convert$1[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert$1[fromModel], 'labels', {value: conversions[fromModel].labels});

	const routes = route(fromModel);
	const routeModels = Object.keys(routes);

	routeModels.forEach(toModel => {
		const fn = routes[toModel];

		convert$1[fromModel][toModel] = wrapRounded(fn);
		convert$1[fromModel][toModel].raw = wrapRaw(fn);
	});
});

var colorConvert = convert$1;

var ansiStyles = createCommonjsModule(function (module) {

const wrapAnsi16 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => (...args) => {
	const rgb = fn(...args);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

const ansi2ansi = n => n;
const rgb2rgb = (r, g, b) => [r, g, b];

const setLazyProperty = (object, property, get) => {
	Object.defineProperty(object, property, {
		get: () => {
			const value = get();

			Object.defineProperty(object, property, {
				value,
				enumerable: true,
				configurable: true
			});

			return value;
		},
		enumerable: true,
		configurable: true
	});
};

/** @type {typeof import('color-convert')} */
let colorConvert$1;
const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
	if (colorConvert$1 === undefined) {
		colorConvert$1 = colorConvert;
	}

	const offset = isBackground ? 10 : 0;
	const styles = {};

	for (const [sourceSpace, suite] of Object.entries(colorConvert$1)) {
		const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;
		if (sourceSpace === targetSpace) {
			styles[name] = wrap(identity, offset);
		} else if (typeof suite === 'object') {
			styles[name] = wrap(suite[targetSpace], offset);
		}
	}

	return styles;
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

			// Bright color
			blackBright: [90, 39],
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

	// Alias bright black as gray (and grey)
	styles.color.gray = styles.color.blackBright;
	styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
	styles.color.grey = styles.color.blackBright;
	styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

	for (const [groupName, group] of Object.entries(styles)) {
		for (const [styleName, style] of Object.entries(group)) {
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
	}

	Object.defineProperty(styles, 'codes', {
		value: codes,
		enumerable: false
	});

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
	setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var collections = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printIteratorEntries = printIteratorEntries;
exports.printIteratorValues = printIteratorValues;
exports.printListItems = printListItems;
exports.printObjectProperties = printObjectProperties;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const getKeysOfEnumerableProperties = object => {
  const keys = Object.keys(object).sort();

  if (Object.getOwnPropertySymbols) {
    Object.getOwnPropertySymbols(object).forEach(symbol => {
      if (Object.getOwnPropertyDescriptor(object, symbol).enumerable) {
        keys.push(symbol);
      }
    });
  }

  return keys;
};
/**
 * Return entries (for example, of a map)
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, braces)
 */

function printIteratorEntries(
  iterator,
  config,
  indentation,
  depth,
  refs,
  printer, // Too bad, so sad that separator for ECMAScript Map has been ' => '
  // What a distracting diff if you change a data structure to/from
  // ECMAScript Object or Immutable.Map/OrderedMap which use the default.
  separator = ': '
) {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    while (!current.done) {
      const name = printer(
        current.value[0],
        config,
        indentationNext,
        depth,
        refs
      );
      const value = printer(
        current.value[1],
        config,
        indentationNext,
        depth,
        refs
      );
      result += indentationNext + name + separator + value;
      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return values (for example, of a set)
 * with spacing, indentation, and comma
 * without surrounding punctuation (braces or brackets)
 */

function printIteratorValues(
  iterator,
  config,
  indentation,
  depth,
  refs,
  printer
) {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    while (!current.done) {
      result +=
        indentationNext +
        printer(current.value, config, indentationNext, depth, refs);
      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return items (for example, of an array)
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, brackets)
 **/

function printListItems(list, config, indentation, depth, refs, printer) {
  let result = '';

  if (list.length) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    for (let i = 0; i < list.length; i++) {
      result +=
        indentationNext +
        printer(list[i], config, indentationNext, depth, refs);

      if (i < list.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return properties of an object
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, braces)
 */

function printObjectProperties(val, config, indentation, depth, refs, printer) {
  let result = '';
  const keys = getKeysOfEnumerableProperties(val);

  if (keys.length) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = printer(key, config, indentationNext, depth, refs);
      const value = printer(val[key], config, indentationNext, depth, refs);
      result += indentationNext + name + ': ' + value;

      if (i < keys.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
});

var AsymmetricMatcher = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



var Symbol = commonjsGlobal['jest-symbol-do-not-touch'] || commonjsGlobal.Symbol;
const asymmetricMatcher =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('jest.asymmetricMatcher')
    : 0x1357a5;
const SPACE = ' ';

const serialize = (val, config, indentation, depth, refs, printer) => {
  const stringedValue = val.toString();

  if (
    stringedValue === 'ArrayContaining' ||
    stringedValue === 'ArrayNotContaining'
  ) {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }

    return (
      stringedValue +
      SPACE +
      '[' +
      (0, collections.printListItems)(
        val.sample,
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      ']'
    );
  }

  if (
    stringedValue === 'ObjectContaining' ||
    stringedValue === 'ObjectNotContaining'
  ) {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }

    return (
      stringedValue +
      SPACE +
      '{' +
      (0, collections.printObjectProperties)(
        val.sample,
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      '}'
    );
  }

  if (
    stringedValue === 'StringMatching' ||
    stringedValue === 'StringNotMatching'
  ) {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  if (
    stringedValue === 'StringContaining' ||
    stringedValue === 'StringNotContaining'
  ) {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  return val.toAsymmetricMatcher();
};

exports.serialize = serialize;

const test = val => val && val.$$typeof === asymmetricMatcher;

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var ansiRegex = ({onlyFirst = false} = {}) => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
};

var ConvertAnsi = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;

var _ansiRegex = _interopRequireDefault(ansiRegex);

var _ansiStyles = _interopRequireDefault(ansiStyles);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const toHumanReadableAnsi = text =>
  text.replace((0, _ansiRegex.default)(), match => {
    switch (match) {
      case _ansiStyles.default.red.close:
      case _ansiStyles.default.green.close:
      case _ansiStyles.default.cyan.close:
      case _ansiStyles.default.gray.close:
      case _ansiStyles.default.white.close:
      case _ansiStyles.default.yellow.close:
      case _ansiStyles.default.bgRed.close:
      case _ansiStyles.default.bgGreen.close:
      case _ansiStyles.default.bgYellow.close:
      case _ansiStyles.default.inverse.close:
      case _ansiStyles.default.dim.close:
      case _ansiStyles.default.bold.close:
      case _ansiStyles.default.reset.open:
      case _ansiStyles.default.reset.close:
        return '</>';

      case _ansiStyles.default.red.open:
        return '<red>';

      case _ansiStyles.default.green.open:
        return '<green>';

      case _ansiStyles.default.cyan.open:
        return '<cyan>';

      case _ansiStyles.default.gray.open:
        return '<gray>';

      case _ansiStyles.default.white.open:
        return '<white>';

      case _ansiStyles.default.yellow.open:
        return '<yellow>';

      case _ansiStyles.default.bgRed.open:
        return '<bgRed>';

      case _ansiStyles.default.bgGreen.open:
        return '<bgGreen>';

      case _ansiStyles.default.bgYellow.open:
        return '<bgYellow>';

      case _ansiStyles.default.inverse.open:
        return '<inverse>';

      case _ansiStyles.default.dim.open:
        return '<dim>';

      case _ansiStyles.default.bold.open:
        return '<bold>';

      default:
        return '';
    }
  });

const test = val =>
  typeof val === 'string' && !!val.match((0, _ansiRegex.default)());

exports.test = test;

const serialize = (val, config, indentation, depth, refs, printer) =>
  printer(toHumanReadableAnsi(val), config, indentation, depth, refs);

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var DOMCollection = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const SPACE = ' ';
const OBJECT_NAMES = ['DOMStringMap', 'NamedNodeMap'];
const ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/;

const testName = name =>
  OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name);

const test = val =>
  val &&
  val.constructor &&
  !!val.constructor.name &&
  testName(val.constructor.name);

exports.test = test;

const isNamedNodeMap = collection =>
  collection.constructor.name === 'NamedNodeMap';

const serialize = (collection, config, indentation, depth, refs, printer) => {
  const name = collection.constructor.name;

  if (++depth > config.maxDepth) {
    return '[' + name + ']';
  }

  return (
    (config.min ? '' : name + SPACE) +
    (OBJECT_NAMES.indexOf(name) !== -1
      ? '{' +
        (0, collections.printObjectProperties)(
          isNamedNodeMap(collection)
            ? Array.from(collection).reduce((props, attribute) => {
                props[attribute.name] = attribute.value;
                return props;
              }, {})
            : {...collection},
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}'
      : '[' +
        (0, collections.printListItems)(
          Array.from(collection),
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        ']')
  );
};

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var escapeHTML_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = escapeHTML;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function escapeHTML(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
});

var markup = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printElementAsLeaf = exports.printElement = exports.printComment = exports.printText = exports.printChildren = exports.printProps = void 0;

var _escapeHTML = _interopRequireDefault(escapeHTML_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Return empty string if keys is empty.
const printProps = (keys, props, config, indentation, depth, refs, printer) => {
  const indentationNext = indentation + config.indent;
  const colors = config.colors;
  return keys
    .map(key => {
      const value = props[key];
      let printed = printer(value, config, indentationNext, depth, refs);

      if (typeof value !== 'string') {
        if (printed.indexOf('\n') !== -1) {
          printed =
            config.spacingOuter +
            indentationNext +
            printed +
            config.spacingOuter +
            indentation;
        }

        printed = '{' + printed + '}';
      }

      return (
        config.spacingInner +
        indentation +
        colors.prop.open +
        key +
        colors.prop.close +
        '=' +
        colors.value.open +
        printed +
        colors.value.close
      );
    })
    .join('');
}; // Return empty string if children is empty.

exports.printProps = printProps;

const printChildren = (children, config, indentation, depth, refs, printer) =>
  children
    .map(
      child =>
        config.spacingOuter +
        indentation +
        (typeof child === 'string'
          ? printText(child, config)
          : printer(child, config, indentation, depth, refs))
    )
    .join('');

exports.printChildren = printChildren;

const printText = (text, config) => {
  const contentColor = config.colors.content;
  return (
    contentColor.open + (0, _escapeHTML.default)(text) + contentColor.close
  );
};

exports.printText = printText;

const printComment = (comment, config) => {
  const commentColor = config.colors.comment;
  return (
    commentColor.open +
    '<!--' +
    (0, _escapeHTML.default)(comment) +
    '-->' +
    commentColor.close
  );
}; // Separate the functions to format props, children, and element,
// so a plugin could override a particular function, if needed.
// Too bad, so sad: the traditional (but unnecessary) space
// in a self-closing tagColor requires a second test of printedProps.

exports.printComment = printComment;

const printElement = (
  type,
  printedProps,
  printedChildren,
  config,
  indentation
) => {
  const tagColor = config.colors.tag;
  return (
    tagColor.open +
    '<' +
    type +
    (printedProps &&
      tagColor.close +
        printedProps +
        config.spacingOuter +
        indentation +
        tagColor.open) +
    (printedChildren
      ? '>' +
        tagColor.close +
        printedChildren +
        config.spacingOuter +
        indentation +
        tagColor.open +
        '</' +
        type
      : (printedProps && !config.min ? '' : ' ') + '/') +
    '>' +
    tagColor.close
  );
};

exports.printElement = printElement;

const printElementAsLeaf = (type, config) => {
  const tagColor = config.colors.tag;
  return (
    tagColor.open +
    '<' +
    type +
    tagColor.close +
    ' …' +
    tagColor.open +
    ' />' +
    tagColor.close
  );
};

exports.printElementAsLeaf = printElementAsLeaf;
});

var DOMElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const FRAGMENT_NODE = 11;
const ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/;

const testNode = val => {
  var _val$hasAttribute;

  const constructorName = val.constructor.name;
  const {nodeType, tagName = ''} = val;
  const isCustomElement =
    tagName.includes('-') ||
    ((_val$hasAttribute = val.hasAttribute) === null ||
    _val$hasAttribute === void 0
      ? void 0
      : _val$hasAttribute.call(val, 'is'));
  return (
    (nodeType === ELEMENT_NODE &&
      (ELEMENT_REGEXP.test(constructorName) || isCustomElement)) ||
    (nodeType === TEXT_NODE && constructorName === 'Text') ||
    (nodeType === COMMENT_NODE && constructorName === 'Comment') ||
    (nodeType === FRAGMENT_NODE && constructorName === 'DocumentFragment')
  );
};

const test = val => {
  var _val$constructor;

  return (
    (val === null || val === void 0
      ? void 0
      : (_val$constructor = val.constructor) === null ||
        _val$constructor === void 0
      ? void 0
      : _val$constructor.name) && testNode(val)
  );
};

exports.test = test;

function nodeIsText(node) {
  return node.nodeType === TEXT_NODE;
}

function nodeIsComment(node) {
  return node.nodeType === COMMENT_NODE;
}

function nodeIsFragment(node) {
  return node.nodeType === FRAGMENT_NODE;
}

const serialize = (node, config, indentation, depth, refs, printer) => {
  if (nodeIsText(node)) {
    return (0, markup.printText)(node.data, config);
  }

  if (nodeIsComment(node)) {
    return (0, markup.printComment)(node.data, config);
  }

  const type = nodeIsFragment(node)
    ? `DocumentFragment`
    : node.tagName.toLowerCase();

  if (++depth > config.maxDepth) {
    return (0, markup.printElementAsLeaf)(type, config);
  }

  return (0, markup.printElement)(
    type,
    (0, markup.printProps)(
      nodeIsFragment(node)
        ? []
        : Array.from(node.attributes)
            .map(attr => attr.name)
            .sort(),
      nodeIsFragment(node)
        ? {}
        : Array.from(node.attributes).reduce((props, attribute) => {
            props[attribute.name] = attribute.value;
            return props;
          }, {}),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer
    ),
    (0, markup.printChildren)(
      Array.prototype.slice.call(node.childNodes || node.children),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer
    ),
    config,
    indentation
  );
};

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var Immutable = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@'; // immutable v4

const IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

const getImmutableName = name => 'Immutable.' + name;

const printAsLeaf = name => '[' + name + ']';

const SPACE = ' ';
const LAZY = '…'; // Seq is lazy if it calls a method like filter

const printImmutableEntries = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer,
  type
) =>
  ++depth > config.maxDepth
    ? printAsLeaf(getImmutableName(type))
    : getImmutableName(type) +
      SPACE +
      '{' +
      (0, collections.printIteratorEntries)(
        val.entries(),
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      '}'; // Record has an entries method because it is a collection in immutable v3.
// Return an iterator for Immutable Record from version v3 or v4.

function getRecordEntries(val) {
  let i = 0;
  return {
    next() {
      if (i < val._keys.length) {
        const key = val._keys[i++];
        return {
          done: false,
          value: [key, val.get(key)]
        };
      }

      return {
        done: true,
        value: undefined
      };
    }
  };
}

const printImmutableRecord = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer
) => {
  // _name property is defined only for an Immutable Record instance
  // which was constructed with a second optional descriptive name arg
  const name = getImmutableName(val._name || 'Record');
  return ++depth > config.maxDepth
    ? printAsLeaf(name)
    : name +
        SPACE +
        '{' +
        (0, collections.printIteratorEntries)(
          getRecordEntries(val),
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}';
};

const printImmutableSeq = (val, config, indentation, depth, refs, printer) => {
  const name = getImmutableName('Seq');

  if (++depth > config.maxDepth) {
    return printAsLeaf(name);
  }

  if (val[IS_KEYED_SENTINEL]) {
    return (
      name +
      SPACE +
      '{' + // from Immutable collection of entries or from ECMAScript object
      (val._iter || val._object
        ? (0, collections.printIteratorEntries)(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer
          )
        : LAZY) +
      '}'
    );
  }

  return (
    name +
    SPACE +
    '[' +
    (val._iter || // from Immutable collection of values
    val._array || // from ECMAScript array
    val._collection || // from ECMAScript collection in immutable v4
    val._iterable // from ECMAScript collection in immutable v3
      ? (0, collections.printIteratorValues)(
          val.values(),
          config,
          indentation,
          depth,
          refs,
          printer
        )
      : LAZY) +
    ']'
  );
};

const printImmutableValues = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer,
  type
) =>
  ++depth > config.maxDepth
    ? printAsLeaf(getImmutableName(type))
    : getImmutableName(type) +
      SPACE +
      '[' +
      (0, collections.printIteratorValues)(
        val.values(),
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      ']';

const serialize = (val, config, indentation, depth, refs, printer) => {
  if (val[IS_MAP_SENTINEL]) {
    return printImmutableEntries(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedMap' : 'Map'
    );
  }

  if (val[IS_LIST_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'List'
    );
  }

  if (val[IS_SET_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedSet' : 'Set'
    );
  }

  if (val[IS_STACK_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'Stack'
    );
  }

  if (val[IS_SEQ_SENTINEL]) {
    return printImmutableSeq(val, config, indentation, depth, refs, printer);
  } // For compatibility with immutable v3 and v4, let record be the default.

  return printImmutableRecord(val, config, indentation, depth, refs, printer);
}; // Explicitly comparing sentinel properties to true avoids false positive
// when mock identity-obj-proxy returns the key as the value for any key.

exports.serialize = serialize;

const test = val =>
  val &&
  (val[IS_ITERABLE_SENTINEL] === true || val[IS_RECORD_SENTINEL] === true);

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?
Symbol.for("react.suspense_list"):60120,r=b?Symbol.for("react.memo"):60115,t=b?Symbol.for("react.lazy"):60116,v=b?Symbol.for("react.block"):60121,w=b?Symbol.for("react.fundamental"):60117,x=b?Symbol.for("react.responder"):60118,y=b?Symbol.for("react.scope"):60119;
function z(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case t:case r:case h:return a;default:return u}}case d:return u}}}function A(a){return z(a)===m}var AsyncMode=l;var ConcurrentMode=m;var ContextConsumer=k;var ContextProvider=h;var Element=c;var ForwardRef=n;var Fragment=e;var Lazy=t;var Memo=r;var Portal=d;
var Profiler=g;var StrictMode=f;var Suspense=p;var isAsyncMode=function(a){return A(a)||z(a)===l};var isConcurrentMode=A;var isContextConsumer=function(a){return z(a)===k};var isContextProvider=function(a){return z(a)===h};var isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};var isForwardRef=function(a){return z(a)===n};var isFragment=function(a){return z(a)===e};var isLazy=function(a){return z(a)===t};
var isMemo=function(a){return z(a)===r};var isPortal=function(a){return z(a)===d};var isProfiler=function(a){return z(a)===g};var isStrictMode=function(a){return z(a)===f};var isSuspense=function(a){return z(a)===p};
var isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||a===q||"object"===typeof a&&null!==a&&(a.$$typeof===t||a.$$typeof===r||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n||a.$$typeof===w||a.$$typeof===x||a.$$typeof===y||a.$$typeof===v)};var typeOf=z;

var reactIs_production_min = {
	AsyncMode: AsyncMode,
	ConcurrentMode: ConcurrentMode,
	ContextConsumer: ContextConsumer,
	ContextProvider: ContextProvider,
	Element: Element,
	ForwardRef: ForwardRef,
	Fragment: Fragment,
	Lazy: Lazy,
	Memo: Memo,
	Portal: Portal,
	Profiler: Profiler,
	StrictMode: StrictMode,
	Suspense: Suspense,
	isAsyncMode: isAsyncMode,
	isConcurrentMode: isConcurrentMode,
	isContextConsumer: isContextConsumer,
	isContextProvider: isContextProvider,
	isElement: isElement,
	isForwardRef: isForwardRef,
	isFragment: isFragment,
	isLazy: isLazy,
	isMemo: isMemo,
	isPortal: isPortal,
	isProfiler: isProfiler,
	isStrictMode: isStrictMode,
	isSuspense: isSuspense,
	isValidElementType: isValidElementType,
	typeOf: typeOf
};

var reactIs_development = createCommonjsModule(function (module, exports) {



if (process.env.NODE_ENV !== "production") {
  (function() {

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

function isValidElementType(type) {
  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
}

function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    var $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = object.type;

        switch (type) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return type;

          default:
            var $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;

              default:
                return $$typeof;
            }

        }

      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
} // AsyncMode is deprecated along with isAsyncMode

var AsyncMode = REACT_ASYNC_MODE_TYPE;
var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
var ContextConsumer = REACT_CONTEXT_TYPE;
var ContextProvider = REACT_PROVIDER_TYPE;
var Element = REACT_ELEMENT_TYPE;
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Fragment = REACT_FRAGMENT_TYPE;
var Lazy = REACT_LAZY_TYPE;
var Memo = REACT_MEMO_TYPE;
var Portal = REACT_PORTAL_TYPE;
var Profiler = REACT_PROFILER_TYPE;
var StrictMode = REACT_STRICT_MODE_TYPE;
var Suspense = REACT_SUSPENSE_TYPE;
var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

function isAsyncMode(object) {
  {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
    }
  }

  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}
function isPortal(object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
function isProfiler(object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
function isStrictMode(object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
function isSuspense(object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}

exports.AsyncMode = AsyncMode;
exports.ConcurrentMode = ConcurrentMode;
exports.ContextConsumer = ContextConsumer;
exports.ContextProvider = ContextProvider;
exports.Element = Element;
exports.ForwardRef = ForwardRef;
exports.Fragment = Fragment;
exports.Lazy = Lazy;
exports.Memo = Memo;
exports.Portal = Portal;
exports.Profiler = Profiler;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.isAsyncMode = isAsyncMode;
exports.isConcurrentMode = isConcurrentMode;
exports.isContextConsumer = isContextConsumer;
exports.isContextProvider = isContextProvider;
exports.isElement = isElement;
exports.isForwardRef = isForwardRef;
exports.isFragment = isFragment;
exports.isLazy = isLazy;
exports.isMemo = isMemo;
exports.isPortal = isPortal;
exports.isProfiler = isProfiler;
exports.isStrictMode = isStrictMode;
exports.isSuspense = isSuspense;
exports.isValidElementType = isValidElementType;
exports.typeOf = typeOf;
  })();
}
});

var reactIs = createCommonjsModule(function (module) {

if (process.env.NODE_ENV === 'production') {
  module.exports = reactIs_production_min;
} else {
  module.exports = reactIs_development;
}
});

var ReactElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;

var ReactIs = _interopRequireWildcard(reactIs);



function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Given element.props.children, or subtree during recursive traversal,
// return flattened array of children.
const getChildren = (arg, children = []) => {
  if (Array.isArray(arg)) {
    arg.forEach(item => {
      getChildren(item, children);
    });
  } else if (arg != null && arg !== false) {
    children.push(arg);
  }

  return children;
};

const getType = element => {
  const type = element.type;

  if (typeof type === 'string') {
    return type;
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || 'Unknown';
  }

  if (ReactIs.isFragment(element)) {
    return 'React.Fragment';
  }

  if (ReactIs.isSuspense(element)) {
    return 'React.Suspense';
  }

  if (typeof type === 'object' && type !== null) {
    if (ReactIs.isContextProvider(element)) {
      return 'Context.Provider';
    }

    if (ReactIs.isContextConsumer(element)) {
      return 'Context.Consumer';
    }

    if (ReactIs.isForwardRef(element)) {
      if (type.displayName) {
        return type.displayName;
      }

      const functionName = type.render.displayName || type.render.name || '';
      return functionName !== ''
        ? 'ForwardRef(' + functionName + ')'
        : 'ForwardRef';
    }

    if (ReactIs.isMemo(element)) {
      const functionName =
        type.displayName || type.type.displayName || type.type.name || '';
      return functionName !== '' ? 'Memo(' + functionName + ')' : 'Memo';
    }
  }

  return 'UNDEFINED';
};

const getPropKeys = element => {
  const {props} = element;
  return Object.keys(props)
    .filter(key => key !== 'children' && props[key] !== undefined)
    .sort();
};

const serialize = (element, config, indentation, depth, refs, printer) =>
  ++depth > config.maxDepth
    ? (0, markup.printElementAsLeaf)(getType(element), config)
    : (0, markup.printElement)(
        getType(element),
        (0, markup.printProps)(
          getPropKeys(element),
          element.props,
          config,
          indentation + config.indent,
          depth,
          refs,
          printer
        ),
        (0, markup.printChildren)(
          getChildren(element.props.children),
          config,
          indentation + config.indent,
          depth,
          refs,
          printer
        ),
        config,
        indentation
      );

exports.serialize = serialize;

const test = val => val && ReactIs.isElement(val);

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var ReactTestComponent = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



var Symbol = commonjsGlobal['jest-symbol-do-not-touch'] || commonjsGlobal.Symbol;
const testSymbol =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('react.test.json')
    : 0xea71357;

const getPropKeys = object => {
  const {props} = object;
  return props
    ? Object.keys(props)
        .filter(key => props[key] !== undefined)
        .sort()
    : [];
};

const serialize = (object, config, indentation, depth, refs, printer) =>
  ++depth > config.maxDepth
    ? (0, markup.printElementAsLeaf)(object.type, config)
    : (0, markup.printElement)(
        object.type,
        object.props
          ? (0, markup.printProps)(
              getPropKeys(object),
              object.props,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer
            )
          : '',
        object.children
          ? (0, markup.printChildren)(
              object.children,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer
            )
          : '',
        config,
        indentation
      );

exports.serialize = serialize;

const test = val => val && val.$$typeof === testSymbol;

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var build = createCommonjsModule(function (module) {

var _ansiStyles = _interopRequireDefault(ansiStyles);



var _AsymmetricMatcher = _interopRequireDefault(
  AsymmetricMatcher
);

var _ConvertAnsi = _interopRequireDefault(ConvertAnsi);

var _DOMCollection = _interopRequireDefault(DOMCollection);

var _DOMElement = _interopRequireDefault(DOMElement);

var _Immutable = _interopRequireDefault(Immutable);

var _ReactElement = _interopRequireDefault(ReactElement);

var _ReactTestComponent = _interopRequireDefault(
  ReactTestComponent
);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
/**
 * Explicitly comparing typeof constructor to function avoids undefined as name
 * when mock identity-obj-proxy returns the key as the value for any key.
 */

const getConstructorName = val =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';
/* global window */

/** Is val is equal to global window object? Works even if it does not exist :) */

const isWindow = val => typeof window !== 'undefined' && val === window;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
const NEWLINE_REGEXP = /\n/gi;

class PrettyFormatPluginError extends Error {
  constructor(message, stack) {
    super(message);
    this.stack = stack;
    this.name = this.constructor.name;
  }
}

function isToStringedArrayType(toStringed) {
  return (
    toStringed === '[object Array]' ||
    toStringed === '[object ArrayBuffer]' ||
    toStringed === '[object DataView]' ||
    toStringed === '[object Float32Array]' ||
    toStringed === '[object Float64Array]' ||
    toStringed === '[object Int8Array]' ||
    toStringed === '[object Int16Array]' ||
    toStringed === '[object Int32Array]' ||
    toStringed === '[object Uint8Array]' ||
    toStringed === '[object Uint8ClampedArray]' ||
    toStringed === '[object Uint16Array]' ||
    toStringed === '[object Uint32Array]'
  );
}

function printNumber(val) {
  return Object.is(val, -0) ? '-0' : String(val);
}

function printBigInt(val) {
  return String(`${val}n`);
}

function printFunction(val, printFunctionName) {
  if (!printFunctionName) {
    return '[Function]';
  }

  return '[Function ' + (val.name || 'anonymous') + ']';
}

function printSymbol(val) {
  return String(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val) {
  return '[' + errorToString.call(val) + ']';
}
/**
 * The first port of call for printing an object, handles most of the
 * data-types in JS.
 */

function printBasicValue(val, printFunctionName, escapeRegex, escapeString) {
  if (val === true || val === false) {
    return '' + val;
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (val === null) {
    return 'null';
  }

  const typeOf = typeof val;

  if (typeOf === 'number') {
    return printNumber(val);
  }

  if (typeOf === 'bigint') {
    return printBigInt(val);
  }

  if (typeOf === 'string') {
    if (escapeString) {
      return '"' + val.replace(/"|\\/g, '\\$&') + '"';
    }

    return '"' + val + '"';
  }

  if (typeOf === 'function') {
    return printFunction(val, printFunctionName);
  }

  if (typeOf === 'symbol') {
    return printSymbol(val);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object WeakMap]') {
    return 'WeakMap {}';
  }

  if (toStringed === '[object WeakSet]') {
    return 'WeakSet {}';
  }

  if (
    toStringed === '[object Function]' ||
    toStringed === '[object GeneratorFunction]'
  ) {
    return printFunction(val, printFunctionName);
  }

  if (toStringed === '[object Symbol]') {
    return printSymbol(val);
  }

  if (toStringed === '[object Date]') {
    return isNaN(+val) ? 'Date { NaN }' : toISOString.call(val);
  }

  if (toStringed === '[object Error]') {
    return printError(val);
  }

  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      // https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
      return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    return regExpToString.call(val);
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}
/**
 * Handles more complex objects ( such as objects with circular references.
 * maps and sets etc )
 */

function printComplexValue(
  val,
  config,
  indentation,
  depth,
  refs,
  hasCalledToJSON
) {
  if (refs.indexOf(val) !== -1) {
    return '[Circular]';
  }

  refs = refs.slice();
  refs.push(val);
  const hitMaxDepth = ++depth > config.maxDepth;
  const min = config.min;

  if (
    config.callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function' &&
    !hasCalledToJSON
  ) {
    return printer(val.toJSON(), config, indentation, depth, refs, true);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : (min ? '' : 'Arguments ') +
          '[' +
          (0, collections.printListItems)(
            val,
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          ']';
  }

  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? '[' + val.constructor.name + ']'
      : (min ? '' : val.constructor.name + ' ') +
          '[' +
          (0, collections.printListItems)(
            val,
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          ']';
  }

  if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : 'Map {' +
          (0, collections.printIteratorEntries)(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer,
            ' => '
          ) +
          '}';
  }

  if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : 'Set {' +
          (0, collections.printIteratorValues)(
            val.values(),
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          '}';
  } // Avoid failure to serialize global window object in jsdom test environment.
  // For example, not even relevant if window is prop of React element.

  return hitMaxDepth || isWindow(val)
    ? '[' + getConstructorName(val) + ']'
    : (min ? '' : getConstructorName(val) + ' ') +
        '{' +
        (0, collections.printObjectProperties)(
          val,
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}';
}

function isNewPlugin(plugin) {
  return plugin.serialize != null;
}

function printPlugin(plugin, val, config, indentation, depth, refs) {
  let printed;

  try {
    printed = isNewPlugin(plugin)
      ? plugin.serialize(val, config, indentation, depth, refs, printer)
      : plugin.print(
          val,
          valChild => printer(valChild, config, indentation, depth, refs),
          str => {
            const indentationNext = indentation + config.indent;
            return (
              indentationNext +
              str.replace(NEWLINE_REGEXP, '\n' + indentationNext)
            );
          },
          {
            edgeSpacing: config.spacingOuter,
            min: config.min,
            spacing: config.spacingInner
          },
          config.colors
        );
  } catch (error) {
    throw new PrettyFormatPluginError(error.message, error.stack);
  }

  if (typeof printed !== 'string') {
    throw new Error(
      `pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`
    );
  }

  return printed;
}

function findPlugin(plugins, val) {
  for (let p = 0; p < plugins.length; p++) {
    try {
      if (plugins[p].test(val)) {
        return plugins[p];
      }
    } catch (error) {
      throw new PrettyFormatPluginError(error.message, error.stack);
    }
  }

  return null;
}

function printer(val, config, indentation, depth, refs, hasCalledToJSON) {
  const plugin = findPlugin(config.plugins, val);

  if (plugin !== null) {
    return printPlugin(plugin, val, config, indentation, depth, refs);
  }

  const basicResult = printBasicValue(
    val,
    config.printFunctionName,
    config.escapeRegex,
    config.escapeString
  );

  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(
    val,
    config,
    indentation,
    depth,
    refs,
    hasCalledToJSON
  );
}

const DEFAULT_THEME = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green'
};
const DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);
const DEFAULT_OPTIONS = {
  callToJSON: true,
  escapeRegex: false,
  escapeString: true,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  theme: DEFAULT_THEME
};

function validateOptions(options) {
  Object.keys(options).forEach(key => {
    if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });

  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error(
      'pretty-format: Options "min" and "indent" cannot be used together.'
    );
  }

  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error(`pretty-format: Option "theme" must not be null.`);
    }

    if (typeof options.theme !== 'object') {
      throw new Error(
        `pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`
      );
    }
  }
}

const getColorsHighlight = options =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    const value =
      options.theme && options.theme[key] !== undefined
        ? options.theme[key]
        : DEFAULT_THEME[key];
    const color = value && _ansiStyles.default[value];

    if (
      color &&
      typeof color.close === 'string' &&
      typeof color.open === 'string'
    ) {
      colors[key] = color;
    } else {
      throw new Error(
        `pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`
      );
    }

    return colors;
  }, Object.create(null));

const getColorsEmpty = () =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    colors[key] = {
      close: '',
      open: ''
    };
    return colors;
  }, Object.create(null));

const getPrintFunctionName = options =>
  options && options.printFunctionName !== undefined
    ? options.printFunctionName
    : DEFAULT_OPTIONS.printFunctionName;

const getEscapeRegex = options =>
  options && options.escapeRegex !== undefined
    ? options.escapeRegex
    : DEFAULT_OPTIONS.escapeRegex;

const getEscapeString = options =>
  options && options.escapeString !== undefined
    ? options.escapeString
    : DEFAULT_OPTIONS.escapeString;

const getConfig = options => ({
  callToJSON:
    options && options.callToJSON !== undefined
      ? options.callToJSON
      : DEFAULT_OPTIONS.callToJSON,
  colors:
    options && options.highlight
      ? getColorsHighlight(options)
      : getColorsEmpty(),
  escapeRegex: getEscapeRegex(options),
  escapeString: getEscapeString(options),
  indent:
    options && options.min
      ? ''
      : createIndent(
          options && options.indent !== undefined
            ? options.indent
            : DEFAULT_OPTIONS.indent
        ),
  maxDepth:
    options && options.maxDepth !== undefined
      ? options.maxDepth
      : DEFAULT_OPTIONS.maxDepth,
  min: options && options.min !== undefined ? options.min : DEFAULT_OPTIONS.min,
  plugins:
    options && options.plugins !== undefined
      ? options.plugins
      : DEFAULT_OPTIONS.plugins,
  printFunctionName: getPrintFunctionName(options),
  spacingInner: options && options.min ? ' ' : '\n',
  spacingOuter: options && options.min ? '' : '\n'
});

function createIndent(indent) {
  return new Array(indent + 1).join(' ');
}
/**
 * Returns a presentation string of your `val` object
 * @param val any potential JavaScript object
 * @param options Custom settings
 */

function prettyFormat(val, options) {
  if (options) {
    validateOptions(options);

    if (options.plugins) {
      const plugin = findPlugin(options.plugins, val);

      if (plugin !== null) {
        return printPlugin(plugin, val, getConfig(options), '', 0, []);
      }
    }
  }

  const basicResult = printBasicValue(
    val,
    getPrintFunctionName(options),
    getEscapeRegex(options),
    getEscapeString(options)
  );

  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(options), '', 0, []);
}

prettyFormat.plugins = {
  AsymmetricMatcher: _AsymmetricMatcher.default,
  ConvertAnsi: _ConvertAnsi.default,
  DOMCollection: _DOMCollection.default,
  DOMElement: _DOMElement.default,
  Immutable: _Immutable.default,
  ReactElement: _ReactElement.default,
  ReactTestComponent: _ReactTestComponent.default
}; // eslint-disable-next-line no-redeclare

module.exports = prettyFormat;
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// get the type of a value with handling the edge cases like `typeof []`
// and `typeof null`
function getType(value) {
  if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (typeof value === 'function') {
    return 'function';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'bigint') {
    return 'bigint';
  } else if (typeof value === 'object') {
    if (value != null) {
      if (value.constructor === RegExp) {
        return 'regexp';
      } else if (value.constructor === Map) {
        return 'map';
      } else if (value.constructor === Set) {
        return 'set';
      } else if (value.constructor === Date) {
        return 'date';
      }
    }

    return 'object';
  } else if (typeof value === 'symbol') {
    return 'symbol';
  }

  throw new Error(`value of unknown type: ${value}`);
}

getType.isPrimitive = value => Object(value) !== value;

var build$1 = getType;

var build$2 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _v() {
  const data = v8;

  _v = function () {
    return data;
  };

  return data;
}

function _vm() {
  const data = vm;

  _vm = function () {
    return data;
  };

  return data;
}

function _prettyFormat() {
  const data = _interopRequireDefault(build);

  _prettyFormat = function () {
    return data;
  };

  return data;
}

function _jestGetType() {
  const data = build$1;

  _jestGetType = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

class _default {
  constructor(value) {
    _defineProperty(this, '_isReferenceBeingHeld', void 0);

    if ((0, _jestGetType().isPrimitive)(value)) {
      throw new TypeError(
        [
          'Primitives cannot leak memory.',
          'You passed a ' +
            typeof value +
            ': <' +
            (0, _prettyFormat().default)(value) +
            '>'
        ].join(' ')
      );
    }

    let weak;

    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      weak = weakNapi;
    } catch (err) {
      if (!err || err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }

      throw new Error(
        'The leaking detection mechanism requires the "weak-napi" package to be installed and work. ' +
          'Please install it as a dependency on your main project'
      );
    }

    weak(value, () => (this._isReferenceBeingHeld = false));
    this._isReferenceBeingHeld = true; // Ensure value is not leaked by the closure created by the "weak" callback.

    value = null;
  }

  isLeaking() {
    this._runGarbageCollector();

    return new Promise(resolve =>
      setImmediate(() => resolve(this._isReferenceBeingHeld))
    );
  }

  _runGarbageCollector() {
    const isGarbageCollectorHidden = !commonjsGlobal.gc; // GC is usually hidden, so we have to expose it before running.

    (0, _v().setFlagsFromString)('--expose-gc');
    (0, _vm().runInNewContext)('gc')(); // The GC was not initially exposed, so let's hide it again.

    if (isGarbageCollectorHidden) {
      (0, _v().setFlagsFromString)('--no-expose-gc');
    }
  }
}

exports.default = _default;
});

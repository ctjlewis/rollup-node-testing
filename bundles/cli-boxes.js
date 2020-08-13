var single = {
	topLeft: "┌",
	topRight: "┐",
	bottomRight: "┘",
	bottomLeft: "└",
	vertical: "│",
	horizontal: "─"
};
var double = {
	topLeft: "╔",
	topRight: "╗",
	bottomRight: "╝",
	bottomLeft: "╚",
	vertical: "║",
	horizontal: "═"
};
var round = {
	topLeft: "╭",
	topRight: "╮",
	bottomRight: "╯",
	bottomLeft: "╰",
	vertical: "│",
	horizontal: "─"
};
var bold = {
	topLeft: "┏",
	topRight: "┓",
	bottomRight: "┛",
	bottomLeft: "┗",
	vertical: "┃",
	horizontal: "━"
};
var singleDouble = {
	topLeft: "╓",
	topRight: "╖",
	bottomRight: "╜",
	bottomLeft: "╙",
	vertical: "║",
	horizontal: "─"
};
var doubleSingle = {
	topLeft: "╒",
	topRight: "╕",
	bottomRight: "╛",
	bottomLeft: "╘",
	vertical: "│",
	horizontal: "═"
};
var classic = {
	topLeft: "+",
	topRight: "+",
	bottomRight: "+",
	bottomLeft: "+",
	vertical: "|",
	horizontal: "-"
};
var boxes = {
	single: single,
	double: double,
	round: round,
	bold: bold,
	singleDouble: singleDouble,
	doubleSingle: doubleSingle,
	classic: classic
};

var boxes$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	single: single,
	double: double,
	round: round,
	bold: bold,
	singleDouble: singleDouble,
	doubleSingle: doubleSingle,
	classic: classic,
	'default': boxes
});

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

var cliBoxes = getCjsExportFromNamespace(boxes$1);

var cliBoxes_1 = cliBoxes;
// TODO: Remove this for the next major release
var _default = cliBoxes;
cliBoxes_1.default = _default;

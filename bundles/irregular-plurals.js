function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var addendum = "addenda";
var aircraft = "aircraft";
var alga = "algae";
var alumna = "alumnae";
var alumnus = "alumni";
var amoeba = "amoebae";
var analysis = "analyses";
var antenna = "antennae";
var antithesis = "antitheses";
var apex = "apices";
var appendix = "appendices";
var automaton = "automata";
var axis = "axes";
var bacillus = "bacilli";
var bacterium = "bacteria";
var barracks = "barracks";
var basis = "bases";
var beau = "beaux";
var bison = "bison";
var buffalo = "buffalo";
var bureau = "bureaus";
var cactus = "cacti";
var calf = "calves";
var carp = "carp";
var census = "censuses";
var chassis = "chassis";
var cherub = "cherubim";
var child = "children";
var cod = "cod";
var codex = "codices";
var concerto = "concerti";
var corpus = "corpora";
var crisis = "crises";
var criterion = "criteria";
var curriculum = "curricula";
var datum = "data";
var deer = "deer";
var diagnosis = "diagnoses";
var die = "dice";
var dwarf = "dwarfs";
var echo = "echoes";
var elf = "elves";
var elk = "elk";
var ellipsis = "ellipses";
var embargo = "embargoes";
var emphasis = "emphases";
var erratum = "errata";
var fez = "fezes";
var firmware = "firmware";
var fish = "fish";
var focus = "foci";
var foot = "feet";
var formula = "formulae";
var fungus = "fungi";
var gallows = "gallows";
var genus = "genera";
var goose = "geese";
var graffito = "graffiti";
var grouse = "grouse";
var half = "halves";
var hero = "heroes";
var hoof = "hooves";
var hovercraft = "hovercraft";
var hypothesis = "hypotheses";
var index = "indices";
var kakapo = "kakapo";
var knife = "knives";
var larva = "larvae";
var leaf = "leaves";
var libretto = "libretti";
var life = "lives";
var loaf = "loaves";
var locus = "loci";
var louse = "lice";
var man = "men";
var matrix = "matrices";
var means = "means";
var medium = "media";
var media = "media";
var memorandum = "memoranda";
var millennium = "millennia";
var minutia = "minutiae";
var moose = "moose";
var mouse = "mice";
var nebula = "nebulae";
var nemesis = "nemeses";
var neurosis = "neuroses";
var news = "news";
var nucleus = "nuclei";
var oasis = "oases";
var offspring = "offspring";
var opus = "opera";
var ovum = "ova";
var ox = "oxen";
var paralysis = "paralyses";
var parenthesis = "parentheses";
var person = "people";
var phenomenon = "phenomena";
var phylum = "phyla";
var pike = "pike";
var polyhedron = "polyhedra";
var potato = "potatoes";
var prognosis = "prognoses";
var quiz = "quizzes";
var radius = "radii";
var referendum = "referenda";
var salmon = "salmon";
var scarf = "scarves";
var self = "selves";
var series = "series";
var sheep = "sheep";
var shelf = "shelves";
var shrimp = "shrimp";
var spacecraft = "spacecraft";
var species = "species";
var spectrum = "spectra";
var squid = "squid";
var stimulus = "stimuli";
var stratum = "strata";
var swine = "swine";
var syllabus = "syllabi";
var symposium = "symposia";
var synopsis = "synopses";
var synthesis = "syntheses";
var tableau = "tableaus";
var that = "those";
var thesis = "theses";
var thief = "thieves";
var tomato = "tomatoes";
var tooth = "teeth";
var trout = "trout";
var tuna = "tuna";
var vertebra = "vertebrae";
var vertex = "vertices";
var veto = "vetoes";
var vita = "vitae";
var vortex = "vortices";
var watercraft = "watercraft";
var wharf = "wharves";
var wife = "wives";
var wolf = "wolves";
var woman = "women";
var irregularPlurals = {
	addendum: addendum,
	aircraft: aircraft,
	alga: alga,
	alumna: alumna,
	alumnus: alumnus,
	amoeba: amoeba,
	analysis: analysis,
	antenna: antenna,
	antithesis: antithesis,
	apex: apex,
	appendix: appendix,
	automaton: automaton,
	axis: axis,
	bacillus: bacillus,
	bacterium: bacterium,
	barracks: barracks,
	basis: basis,
	beau: beau,
	bison: bison,
	buffalo: buffalo,
	bureau: bureau,
	cactus: cactus,
	calf: calf,
	carp: carp,
	census: census,
	chassis: chassis,
	cherub: cherub,
	child: child,
	"château": "châteaus",
	cod: cod,
	codex: codex,
	concerto: concerto,
	corpus: corpus,
	crisis: crisis,
	criterion: criterion,
	curriculum: curriculum,
	datum: datum,
	deer: deer,
	diagnosis: diagnosis,
	die: die,
	dwarf: dwarf,
	echo: echo,
	elf: elf,
	elk: elk,
	ellipsis: ellipsis,
	embargo: embargo,
	emphasis: emphasis,
	erratum: erratum,
	"faux pas": "faux pas",
	fez: fez,
	firmware: firmware,
	fish: fish,
	focus: focus,
	foot: foot,
	formula: formula,
	fungus: fungus,
	gallows: gallows,
	genus: genus,
	goose: goose,
	graffito: graffito,
	grouse: grouse,
	half: half,
	hero: hero,
	hoof: hoof,
	hovercraft: hovercraft,
	hypothesis: hypothesis,
	index: index,
	kakapo: kakapo,
	knife: knife,
	larva: larva,
	leaf: leaf,
	libretto: libretto,
	life: life,
	loaf: loaf,
	locus: locus,
	louse: louse,
	man: man,
	matrix: matrix,
	means: means,
	medium: medium,
	media: media,
	memorandum: memorandum,
	millennium: millennium,
	minutia: minutia,
	moose: moose,
	mouse: mouse,
	nebula: nebula,
	nemesis: nemesis,
	neurosis: neurosis,
	news: news,
	nucleus: nucleus,
	oasis: oasis,
	offspring: offspring,
	opus: opus,
	ovum: ovum,
	ox: ox,
	paralysis: paralysis,
	parenthesis: parenthesis,
	person: person,
	phenomenon: phenomenon,
	phylum: phylum,
	pike: pike,
	polyhedron: polyhedron,
	potato: potato,
	prognosis: prognosis,
	quiz: quiz,
	radius: radius,
	referendum: referendum,
	salmon: salmon,
	scarf: scarf,
	self: self,
	series: series,
	sheep: sheep,
	shelf: shelf,
	shrimp: shrimp,
	spacecraft: spacecraft,
	species: species,
	spectrum: spectrum,
	squid: squid,
	stimulus: stimulus,
	stratum: stratum,
	swine: swine,
	syllabus: syllabus,
	symposium: symposium,
	synopsis: synopsis,
	synthesis: synthesis,
	tableau: tableau,
	that: that,
	thesis: thesis,
	thief: thief,
	"this": "these",
	tomato: tomato,
	tooth: tooth,
	trout: trout,
	tuna: tuna,
	vertebra: vertebra,
	vertex: vertex,
	veto: veto,
	vita: vita,
	vortex: vortex,
	watercraft: watercraft,
	wharf: wharf,
	wife: wife,
	wolf: wolf,
	woman: woman
};

var irregularPlurals$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	addendum: addendum,
	aircraft: aircraft,
	alga: alga,
	alumna: alumna,
	alumnus: alumnus,
	amoeba: amoeba,
	analysis: analysis,
	antenna: antenna,
	antithesis: antithesis,
	apex: apex,
	appendix: appendix,
	automaton: automaton,
	axis: axis,
	bacillus: bacillus,
	bacterium: bacterium,
	barracks: barracks,
	basis: basis,
	beau: beau,
	bison: bison,
	buffalo: buffalo,
	bureau: bureau,
	cactus: cactus,
	calf: calf,
	carp: carp,
	census: census,
	chassis: chassis,
	cherub: cherub,
	child: child,
	cod: cod,
	codex: codex,
	concerto: concerto,
	corpus: corpus,
	crisis: crisis,
	criterion: criterion,
	curriculum: curriculum,
	datum: datum,
	deer: deer,
	diagnosis: diagnosis,
	die: die,
	dwarf: dwarf,
	echo: echo,
	elf: elf,
	elk: elk,
	ellipsis: ellipsis,
	embargo: embargo,
	emphasis: emphasis,
	erratum: erratum,
	fez: fez,
	firmware: firmware,
	fish: fish,
	focus: focus,
	foot: foot,
	formula: formula,
	fungus: fungus,
	gallows: gallows,
	genus: genus,
	goose: goose,
	graffito: graffito,
	grouse: grouse,
	half: half,
	hero: hero,
	hoof: hoof,
	hovercraft: hovercraft,
	hypothesis: hypothesis,
	index: index,
	kakapo: kakapo,
	knife: knife,
	larva: larva,
	leaf: leaf,
	libretto: libretto,
	life: life,
	loaf: loaf,
	locus: locus,
	louse: louse,
	man: man,
	matrix: matrix,
	means: means,
	medium: medium,
	media: media,
	memorandum: memorandum,
	millennium: millennium,
	minutia: minutia,
	moose: moose,
	mouse: mouse,
	nebula: nebula,
	nemesis: nemesis,
	neurosis: neurosis,
	news: news,
	nucleus: nucleus,
	oasis: oasis,
	offspring: offspring,
	opus: opus,
	ovum: ovum,
	ox: ox,
	paralysis: paralysis,
	parenthesis: parenthesis,
	person: person,
	phenomenon: phenomenon,
	phylum: phylum,
	pike: pike,
	polyhedron: polyhedron,
	potato: potato,
	prognosis: prognosis,
	quiz: quiz,
	radius: radius,
	referendum: referendum,
	salmon: salmon,
	scarf: scarf,
	self: self,
	series: series,
	sheep: sheep,
	shelf: shelf,
	shrimp: shrimp,
	spacecraft: spacecraft,
	species: species,
	spectrum: spectrum,
	squid: squid,
	stimulus: stimulus,
	stratum: stratum,
	swine: swine,
	syllabus: syllabus,
	symposium: symposium,
	synopsis: synopsis,
	synthesis: synthesis,
	tableau: tableau,
	that: that,
	thesis: thesis,
	thief: thief,
	tomato: tomato,
	tooth: tooth,
	trout: trout,
	tuna: tuna,
	vertebra: vertebra,
	vertex: vertex,
	veto: veto,
	vita: vita,
	vortex: vortex,
	watercraft: watercraft,
	wharf: wharf,
	wife: wife,
	wolf: wolf,
	woman: woman,
	'default': irregularPlurals
});

var irregularPlurals$2 = getCjsExportFromNamespace(irregularPlurals$1);

var irregularPlurals_1 = createCommonjsModule(function (module) {


// Ensure nobody can modify each others Map
Object.defineProperty(module, 'exports', {
	get() {
		return new Map(Object.entries(irregularPlurals$2));
	}
});
});

var $id = "afterRequest.json#";
var $schema = "http://json-schema.org/draft-06/schema#";
var type = "object";
var optional = true;
var required = [
	"lastAccess",
	"eTag",
	"hitCount"
];
var properties = {
	expires: {
		type: "string",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))?"
	},
	lastAccess: {
		type: "string",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))?"
	},
	eTag: {
		type: "string"
	},
	hitCount: {
		type: "integer"
	},
	comment: {
		type: "string"
	}
};
var afterRequest = {
	$id: $id,
	$schema: $schema,
	type: type,
	optional: optional,
	required: required,
	properties: properties
};

var afterRequest$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id,
  $schema: $schema,
  type: type,
  optional: optional,
  required: required,
  properties: properties,
  'default': afterRequest
});

var $id$1 = "beforeRequest.json#";
var $schema$1 = "http://json-schema.org/draft-06/schema#";
var type$1 = "object";
var optional$1 = true;
var required$1 = [
	"lastAccess",
	"eTag",
	"hitCount"
];
var properties$1 = {
	expires: {
		type: "string",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))?"
	},
	lastAccess: {
		type: "string",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))?"
	},
	eTag: {
		type: "string"
	},
	hitCount: {
		type: "integer"
	},
	comment: {
		type: "string"
	}
};
var beforeRequest = {
	$id: $id$1,
	$schema: $schema$1,
	type: type$1,
	optional: optional$1,
	required: required$1,
	properties: properties$1
};

var beforeRequest$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$1,
  $schema: $schema$1,
  type: type$1,
  optional: optional$1,
  required: required$1,
  properties: properties$1,
  'default': beforeRequest
});

var $id$2 = "browser.json#";
var $schema$2 = "http://json-schema.org/draft-06/schema#";
var type$2 = "object";
var required$2 = [
	"name",
	"version"
];
var properties$2 = {
	name: {
		type: "string"
	},
	version: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var browser = {
	$id: $id$2,
	$schema: $schema$2,
	type: type$2,
	required: required$2,
	properties: properties$2
};

var browser$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$2,
  $schema: $schema$2,
  type: type$2,
  required: required$2,
  properties: properties$2,
  'default': browser
});

var $id$3 = "cache.json#";
var $schema$3 = "http://json-schema.org/draft-06/schema#";
var properties$3 = {
	beforeRequest: {
		oneOf: [
			{
				type: "null"
			},
			{
				$ref: "beforeRequest.json#"
			}
		]
	},
	afterRequest: {
		oneOf: [
			{
				type: "null"
			},
			{
				$ref: "afterRequest.json#"
			}
		]
	},
	comment: {
		type: "string"
	}
};
var cache = {
	$id: $id$3,
	$schema: $schema$3,
	properties: properties$3
};

var cache$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$3,
  $schema: $schema$3,
  properties: properties$3,
  'default': cache
});

var $id$4 = "content.json#";
var $schema$4 = "http://json-schema.org/draft-06/schema#";
var type$3 = "object";
var required$3 = [
	"size",
	"mimeType"
];
var properties$4 = {
	size: {
		type: "integer"
	},
	compression: {
		type: "integer"
	},
	mimeType: {
		type: "string"
	},
	text: {
		type: "string"
	},
	encoding: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var content = {
	$id: $id$4,
	$schema: $schema$4,
	type: type$3,
	required: required$3,
	properties: properties$4
};

var content$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$4,
  $schema: $schema$4,
  type: type$3,
  required: required$3,
  properties: properties$4,
  'default': content
});

var $id$5 = "cookie.json#";
var $schema$5 = "http://json-schema.org/draft-06/schema#";
var type$4 = "object";
var required$4 = [
	"name",
	"value"
];
var properties$5 = {
	name: {
		type: "string"
	},
	value: {
		type: "string"
	},
	path: {
		type: "string"
	},
	domain: {
		type: "string"
	},
	expires: {
		type: [
			"string",
			"null"
		],
		format: "date-time"
	},
	httpOnly: {
		type: "boolean"
	},
	secure: {
		type: "boolean"
	},
	comment: {
		type: "string"
	}
};
var cookie = {
	$id: $id$5,
	$schema: $schema$5,
	type: type$4,
	required: required$4,
	properties: properties$5
};

var cookie$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$5,
  $schema: $schema$5,
  type: type$4,
  required: required$4,
  properties: properties$5,
  'default': cookie
});

var $id$6 = "creator.json#";
var $schema$6 = "http://json-schema.org/draft-06/schema#";
var type$5 = "object";
var required$5 = [
	"name",
	"version"
];
var properties$6 = {
	name: {
		type: "string"
	},
	version: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var creator = {
	$id: $id$6,
	$schema: $schema$6,
	type: type$5,
	required: required$5,
	properties: properties$6
};

var creator$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$6,
  $schema: $schema$6,
  type: type$5,
  required: required$5,
  properties: properties$6,
  'default': creator
});

var $id$7 = "entry.json#";
var $schema$7 = "http://json-schema.org/draft-06/schema#";
var type$6 = "object";
var optional$2 = true;
var required$6 = [
	"startedDateTime",
	"time",
	"request",
	"response",
	"cache",
	"timings"
];
var properties$7 = {
	pageref: {
		type: "string"
	},
	startedDateTime: {
		type: "string",
		format: "date-time",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))"
	},
	time: {
		type: "number",
		min: 0
	},
	request: {
		$ref: "request.json#"
	},
	response: {
		$ref: "response.json#"
	},
	cache: {
		$ref: "cache.json#"
	},
	timings: {
		$ref: "timings.json#"
	},
	serverIPAddress: {
		type: "string",
		oneOf: [
			{
				format: "ipv4"
			},
			{
				format: "ipv6"
			}
		]
	},
	connection: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var entry = {
	$id: $id$7,
	$schema: $schema$7,
	type: type$6,
	optional: optional$2,
	required: required$6,
	properties: properties$7
};

var entry$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$7,
  $schema: $schema$7,
  type: type$6,
  optional: optional$2,
  required: required$6,
  properties: properties$7,
  'default': entry
});

var $id$8 = "har.json#";
var $schema$8 = "http://json-schema.org/draft-06/schema#";
var type$7 = "object";
var required$7 = [
	"log"
];
var properties$8 = {
	log: {
		$ref: "log.json#"
	}
};
var har = {
	$id: $id$8,
	$schema: $schema$8,
	type: type$7,
	required: required$7,
	properties: properties$8
};

var har$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$8,
  $schema: $schema$8,
  type: type$7,
  required: required$7,
  properties: properties$8,
  'default': har
});

var $id$9 = "header.json#";
var $schema$9 = "http://json-schema.org/draft-06/schema#";
var type$8 = "object";
var required$8 = [
	"name",
	"value"
];
var properties$9 = {
	name: {
		type: "string"
	},
	value: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var header = {
	$id: $id$9,
	$schema: $schema$9,
	type: type$8,
	required: required$8,
	properties: properties$9
};

var header$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$9,
  $schema: $schema$9,
  type: type$8,
  required: required$8,
  properties: properties$9,
  'default': header
});

var $id$a = "log.json#";
var $schema$a = "http://json-schema.org/draft-06/schema#";
var type$9 = "object";
var required$9 = [
	"version",
	"creator",
	"entries"
];
var properties$a = {
	version: {
		type: "string"
	},
	creator: {
		$ref: "creator.json#"
	},
	browser: {
		$ref: "browser.json#"
	},
	pages: {
		type: "array",
		items: {
			$ref: "page.json#"
		}
	},
	entries: {
		type: "array",
		items: {
			$ref: "entry.json#"
		}
	},
	comment: {
		type: "string"
	}
};
var log = {
	$id: $id$a,
	$schema: $schema$a,
	type: type$9,
	required: required$9,
	properties: properties$a
};

var log$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$a,
  $schema: $schema$a,
  type: type$9,
  required: required$9,
  properties: properties$a,
  'default': log
});

var $id$b = "page.json#";
var $schema$b = "http://json-schema.org/draft-06/schema#";
var type$a = "object";
var optional$3 = true;
var required$a = [
	"startedDateTime",
	"id",
	"title",
	"pageTimings"
];
var properties$b = {
	startedDateTime: {
		type: "string",
		format: "date-time",
		pattern: "^(\\d{4})(-)?(\\d\\d)(-)?(\\d\\d)(T)?(\\d\\d)(:)?(\\d\\d)(:)?(\\d\\d)(\\.\\d+)?(Z|([+-])(\\d\\d)(:)?(\\d\\d))"
	},
	id: {
		type: "string",
		unique: true
	},
	title: {
		type: "string"
	},
	pageTimings: {
		$ref: "pageTimings.json#"
	},
	comment: {
		type: "string"
	}
};
var page = {
	$id: $id$b,
	$schema: $schema$b,
	type: type$a,
	optional: optional$3,
	required: required$a,
	properties: properties$b
};

var page$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$b,
  $schema: $schema$b,
  type: type$a,
  optional: optional$3,
  required: required$a,
  properties: properties$b,
  'default': page
});

var $id$c = "pageTimings.json#";
var $schema$c = "http://json-schema.org/draft-06/schema#";
var type$b = "object";
var properties$c = {
	onContentLoad: {
		type: "number",
		min: -1
	},
	onLoad: {
		type: "number",
		min: -1
	},
	comment: {
		type: "string"
	}
};
var pageTimings = {
	$id: $id$c,
	$schema: $schema$c,
	type: type$b,
	properties: properties$c
};

var pageTimings$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$c,
  $schema: $schema$c,
  type: type$b,
  properties: properties$c,
  'default': pageTimings
});

var $id$d = "postData.json#";
var $schema$d = "http://json-schema.org/draft-06/schema#";
var type$c = "object";
var optional$4 = true;
var required$b = [
	"mimeType"
];
var properties$d = {
	mimeType: {
		type: "string"
	},
	text: {
		type: "string"
	},
	params: {
		type: "array",
		required: [
			"name"
		],
		properties: {
			name: {
				type: "string"
			},
			value: {
				type: "string"
			},
			fileName: {
				type: "string"
			},
			contentType: {
				type: "string"
			},
			comment: {
				type: "string"
			}
		}
	},
	comment: {
		type: "string"
	}
};
var postData = {
	$id: $id$d,
	$schema: $schema$d,
	type: type$c,
	optional: optional$4,
	required: required$b,
	properties: properties$d
};

var postData$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$d,
  $schema: $schema$d,
  type: type$c,
  optional: optional$4,
  required: required$b,
  properties: properties$d,
  'default': postData
});

var $id$e = "query.json#";
var $schema$e = "http://json-schema.org/draft-06/schema#";
var type$d = "object";
var required$c = [
	"name",
	"value"
];
var properties$e = {
	name: {
		type: "string"
	},
	value: {
		type: "string"
	},
	comment: {
		type: "string"
	}
};
var query = {
	$id: $id$e,
	$schema: $schema$e,
	type: type$d,
	required: required$c,
	properties: properties$e
};

var query$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$e,
  $schema: $schema$e,
  type: type$d,
  required: required$c,
  properties: properties$e,
  'default': query
});

var $id$f = "request.json#";
var $schema$f = "http://json-schema.org/draft-06/schema#";
var type$e = "object";
var required$d = [
	"method",
	"url",
	"httpVersion",
	"cookies",
	"headers",
	"queryString",
	"headersSize",
	"bodySize"
];
var properties$f = {
	method: {
		type: "string"
	},
	url: {
		type: "string",
		format: "uri"
	},
	httpVersion: {
		type: "string"
	},
	cookies: {
		type: "array",
		items: {
			$ref: "cookie.json#"
		}
	},
	headers: {
		type: "array",
		items: {
			$ref: "header.json#"
		}
	},
	queryString: {
		type: "array",
		items: {
			$ref: "query.json#"
		}
	},
	postData: {
		$ref: "postData.json#"
	},
	headersSize: {
		type: "integer"
	},
	bodySize: {
		type: "integer"
	},
	comment: {
		type: "string"
	}
};
var request = {
	$id: $id$f,
	$schema: $schema$f,
	type: type$e,
	required: required$d,
	properties: properties$f
};

var request$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$f,
  $schema: $schema$f,
  type: type$e,
  required: required$d,
  properties: properties$f,
  'default': request
});

var $id$g = "response.json#";
var $schema$g = "http://json-schema.org/draft-06/schema#";
var type$f = "object";
var required$e = [
	"status",
	"statusText",
	"httpVersion",
	"cookies",
	"headers",
	"content",
	"redirectURL",
	"headersSize",
	"bodySize"
];
var properties$g = {
	status: {
		type: "integer"
	},
	statusText: {
		type: "string"
	},
	httpVersion: {
		type: "string"
	},
	cookies: {
		type: "array",
		items: {
			$ref: "cookie.json#"
		}
	},
	headers: {
		type: "array",
		items: {
			$ref: "header.json#"
		}
	},
	content: {
		$ref: "content.json#"
	},
	redirectURL: {
		type: "string"
	},
	headersSize: {
		type: "integer"
	},
	bodySize: {
		type: "integer"
	},
	comment: {
		type: "string"
	}
};
var response = {
	$id: $id$g,
	$schema: $schema$g,
	type: type$f,
	required: required$e,
	properties: properties$g
};

var response$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$g,
  $schema: $schema$g,
  type: type$f,
  required: required$e,
  properties: properties$g,
  'default': response
});

var $id$h = "timings.json#";
var $schema$h = "http://json-schema.org/draft-06/schema#";
var required$f = [
	"send",
	"wait",
	"receive"
];
var properties$h = {
	dns: {
		type: "number",
		min: -1
	},
	connect: {
		type: "number",
		min: -1
	},
	blocked: {
		type: "number",
		min: -1
	},
	send: {
		type: "number",
		min: -1
	},
	wait: {
		type: "number",
		min: -1
	},
	receive: {
		type: "number",
		min: -1
	},
	ssl: {
		type: "number",
		min: -1
	},
	comment: {
		type: "string"
	}
};
var timings = {
	$id: $id$h,
	$schema: $schema$h,
	required: required$f,
	properties: properties$h
};

var timings$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $id: $id$h,
  $schema: $schema$h,
  required: required$f,
  properties: properties$h,
  'default': timings
});

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

getCjsExportFromNamespace(afterRequest$1);

getCjsExportFromNamespace(beforeRequest$1);

getCjsExportFromNamespace(browser$1);

getCjsExportFromNamespace(cache$1);

getCjsExportFromNamespace(content$1);

getCjsExportFromNamespace(cookie$1);

getCjsExportFromNamespace(creator$1);

getCjsExportFromNamespace(entry$1);

getCjsExportFromNamespace(har$1);

getCjsExportFromNamespace(header$1);

getCjsExportFromNamespace(log$1);

getCjsExportFromNamespace(page$1);

getCjsExportFromNamespace(pageTimings$1);

getCjsExportFromNamespace(postData$1);

getCjsExportFromNamespace(query$1);

getCjsExportFromNamespace(request$1);

getCjsExportFromNamespace(response$1);

getCjsExportFromNamespace(timings$1);

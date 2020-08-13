import fs from 'fs';
import stream from 'stream';

function skipws (str) {
  let i = 0;
  do {
    if (str[i] !== ' ' && str[i] !== '\t') { return i }
  } while (++i < str.length)
  return i
}

/* ------- default parsers ------- */

const PARSERS = {};

PARSERS.parse_tag = function parse_tag (str) {
  const match = str.match(/^\s*@(\S+)/);
  if (!match) { throw new SyntaxError('Invalid `@tag`, missing @ symbol') }

  return {
    source: match[0],
    data: { tag: match[1] }
  }
};

PARSERS.parse_type = function parse_type (str, data) {
  if (data.errors && data.errors.length) { return null }

  let pos = skipws(str);
  let res = '';
  let curlies = 0;

  if (str[pos] !== '{') { return null }

  while (pos < str.length) {
    curlies += (str[pos] === '{' ? 1 : (str[pos] === '}' ? -1 : 0));
    res += str[pos];
    pos++;
    if (curlies === 0) { break }
  }

  if (curlies !== 0) { throw new SyntaxError('Invalid `{type}`, unpaired curlies') }

  return {
    source: str.slice(0, pos),
    data: { type: res.slice(1, -1) }
  }
};

PARSERS.parse_name = function parse_name (str, data) {
  if (data.errors && data.errors.length) { return null }

  let pos = skipws(str);
  let name = '';
  let brackets = 0;
  let res = { optional: false };

  // if it starts with quoted group assume it is a literal
  const quotedGroups = str.slice(pos).split('"');
  if (quotedGroups.length > 1 && quotedGroups[0] === '' && quotedGroups.length % 2 === 1) {
    name = quotedGroups[1];
    pos += name.length + 2;
  // assume name is non-space string or anything wrapped into brackets
  } else {
    while (pos < str.length) {
      brackets += (str[pos] === '[' ? 1 : (str[pos] === ']' ? -1 : 0));
      name += str[pos];
      pos++;
      if (brackets === 0 && /\s/.test(str[pos])) { break }
    }

    if (brackets !== 0) { throw new SyntaxError('Invalid `name`, unpaired brackets') }

    res = { name, optional: false };

    if (name[0] === '[' && name[name.length - 1] === ']') {
      res.optional = true;
      name = name.slice(1, -1);

      const match = name.match(
        /^\s*([^=]+?)(?:\s*=\s*(.+?))?\s*(?=$)/
      );

      if (!match) throw new SyntaxError('Invalid `name`, bad syntax')

      name = match[1];
      if (match[2]) res.default = match[2];
    }
  }

  res.name = name;

  return {
    source: str.slice(0, pos),
    data: res
  }
};

PARSERS.parse_description = function parse_description (str, data) {
  if (data.errors && data.errors.length) { return null }

  const match = str.match(/^\s+((.|\s)+)?/);

  if (match) {
    return {
      source: match[0],
      data: { description: match[1] === undefined ? '' : match[1] }
    }
  }

  return null
};

var parsers = PARSERS;

const MARKER_START = '/**';
const MARKER_START_SKIP = '/***';
const MARKER_END = '*/';

/* ------- util functions ------- */

function find (list, filter) {
  let i = list.length;
  let matchs = true;

  while (i--) {
    for (const k in filter) {
      if ({}.hasOwnProperty.call(filter, k)) {
        matchs = (filter[k] === list[i][k]) && matchs;
      }
    }
    if (matchs) { return list[i] }
  }
  return null
}

/* ------- parsing ------- */

/**
 * Parses "@tag {type} name description"
 * @param {string} str Raw doc string
 * @param {Array<function>} parsers Array of parsers to be applied to the source
 * @returns {object} parsed tag node
 */
function parse_tag (str, parsers) {
  const data = parsers.reduce(function (state, parser) {
    let result;

    try {
      result = parser(state.source, Object.assign({}, state.data));
    } catch (err) {
      state.data.errors = (state.data.errors || [])
        .concat(parser.name + ': ' + err.message);
    }

    if (result) {
      state.source = state.source.slice(result.source.length);
      state.data = Object.assign(state.data, result.data);
    }

    return state
  }, {
    source: str,
    data: {}
  }).data;

  data.optional = !!data.optional;
  data.type = data.type === undefined ? '' : data.type;
  data.name = data.name === undefined ? '' : data.name;
  data.description = data.description === undefined ? '' : data.description;

  return data
}

/**
 * Parses comment block (array of String lines)
 */
function parse_block (source, opts) {
  const trim = opts.trim
    ? s => s.trim()
    : s => s;

  const toggleFence = (typeof opts.fence === 'function')
    ? opts.fence
    : line => line.split(opts.fence).length % 2 === 0;

  let source_str = source
    .map((line) => { return trim(line.source) })
    .join('\n');

  source_str = trim(source_str);

  const start = source[0].number;

  // merge source lines into tags
  // we assume tag starts with "@"
  source = source
    .reduce(function (state, line) {
      line.source = trim(line.source);

      // start of a new tag detected
      if (line.source.match(/^\s*@(\S+)/) && !state.isFenced) {
        state.tags.push({
          source: [line.source],
          line: line.number
        });
      // keep appending source to the current tag
      } else {
        const tag = state.tags[state.tags.length - 1];
        if (opts.join !== undefined && opts.join !== false && opts.join !== 0 &&
            !line.startWithStar && tag.source.length > 0) {
          let source;
          if (typeof opts.join === 'string') {
            source = opts.join + line.source.replace(/^\s+/, '');
          } else if (typeof opts.join === 'number') {
            source = line.source;
          } else {
            source = ' ' + line.source.replace(/^\s+/, '');
          }
          tag.source[tag.source.length - 1] += source;
        } else {
          tag.source.push(line.source);
        }
      }

      if (toggleFence(line.source)) {
        state.isFenced = !state.isFenced;
      }
      return state
    }, {
      tags: [{ source: [] }],
      isFenced: false
    })
    .tags
    .map((tag) => {
      tag.source = trim(tag.source.join('\n'));
      return tag
    });

  // Block description
  const description = source.shift();

  // skip if no descriptions and no tags
  if (description.source === '' && source.length === 0) {
    return null
  }

  const tags = source.reduce(function (tags, tag) {
    const tag_node = parse_tag(tag.source, opts.parsers);

    tag_node.line = tag.line;
    tag_node.source = tag.source;

    if (opts.dotted_names && tag_node.name.includes('.')) {
      let parent_name;
      let parent_tag;
      let parent_tags = tags;
      const parts = tag_node.name.split('.');

      while (parts.length > 1) {
        parent_name = parts.shift();
        parent_tag = find(parent_tags, {
          tag: tag_node.tag,
          name: parent_name
        });

        if (!parent_tag) {
          parent_tag = {
            tag: tag_node.tag,
            line: Number(tag_node.line),
            name: parent_name,
            type: '',
            description: ''
          };
          parent_tags.push(parent_tag);
        }

        parent_tag.tags = parent_tag.tags || [];
        parent_tags = parent_tag.tags;
      }

      tag_node.name = parts[0];
      parent_tags.push(tag_node);
      return tags
    }

    return tags.concat(tag_node)
  }, []);

  return {
    tags,
    line: start,
    description: description.source,
    source: source_str
  }
}

/**
 * Produces `extract` function with internal state initialized
 */
function mkextract (opts) {
  let chunk = null;
  let indent = 0;
  let number = 0;

  opts = Object.assign({}, {
    trim: true,
    dotted_names: false,
    fence: '```',
    parsers: [
      parsers.parse_tag,
      parsers.parse_type,
      parsers.parse_name,
      parsers.parse_description
    ]
  }, opts || {});

  /**
   * Read lines until they make a block
   * Return parsed block once fullfilled or null otherwise
   */
  return function extract (line) {
    let result = null;
    const startPos = line.indexOf(MARKER_START);
    const endPos = line.indexOf(MARKER_END);

    // if open marker detected and it's not, skip one
    if (startPos !== -1 && line.indexOf(MARKER_START_SKIP) !== startPos) {
      chunk = [];
      indent = startPos + MARKER_START.length;
    }

    // if we are on middle of comment block
    if (chunk) {
      let lineStart = indent;
      let startWithStar = false;

      // figure out if we slice from opening marker pos
      // or line start is shifted to the left
      const nonSpaceChar = line.match(/\S/);

      // skip for the first line starting with /** (fresh chunk)
      // it always has the right indentation
      if (chunk.length > 0 && nonSpaceChar) {
        if (nonSpaceChar[0] === '*') {
          const afterNonSpaceCharIdx = nonSpaceChar.index + 1;
          const extraCharIsSpace = line.charAt(afterNonSpaceCharIdx) === ' ';
          lineStart = afterNonSpaceCharIdx + (extraCharIsSpace ? 1 : 0);
          startWithStar = true;
        } else if (nonSpaceChar.index < indent) {
          lineStart = nonSpaceChar.index;
        }
      }

      // slice the line until end or until closing marker start
      chunk.push({
        number,
        startWithStar,
        source: line.slice(lineStart, endPos === -1 ? line.length : endPos)
      });

      // finalize block if end marker detected
      if (endPos !== -1) {
        result = parse_block(chunk, opts);
        chunk = null;
        indent = 0;
      }
    }

    number += 1;
    return result
  }
}

/* ------- Public API ------- */

var parser = function parse (source, opts) {
  const blocks = [];
  const extract = mkextract(opts);
  const lines = source.split(/\n/);

  lines.forEach((line) => {
    const block = extract(line);
    if (block) {
      blocks.push(block);
    }
  });

  return blocks
};

var PARSERS_1 = parsers;
var mkextract_1 = mkextract;
parser.PARSERS = PARSERS_1;
parser.mkextract = mkextract_1;

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

var stringifier = createCommonjsModule(function (module, exports) {

const getIndent = (indent) => {
  return typeof indent === 'number' ? ' '.repeat(indent) : indent
};

module.exports = exports = function stringify (arg, opts) {
  if (Array.isArray(arg)) {
    return stringifyBlocks(arg, opts)
  }
  if (arg && typeof arg === 'object') {
    if ('tag' in arg) {
      return stringifyTag(arg, opts)
    }
    if ('tags' in arg) {
      return stringifyBlock(arg, opts)
    }
  }
  throw new TypeError('Unexpected argument passed to `stringify`.')
};

const stringifyBlocks = exports.stringifyBlocks = function stringifyBlocks (
  blocks, { indent = '' } = {}
) {
  const indnt = getIndent(indent);
  return blocks.reduce((s, block) => {
    return s + stringifyBlock(block, { indent })
  }, (indnt ? indnt.slice(0, -1) : '') + '/**\n') + indnt + '*/'
};

const stringifyBlock = exports.stringifyBlock = function stringifyBlock (
  block, { indent = '' } = {}
) {
  // block.line
  const indnt = getIndent(indent);

  return (
    block.description
      ? block.description.replace(/^\n/, '').replace(/^(.*)\n?/gm, (n0, descLine) => {
        return `${indnt}*${descLine ? ` ${descLine}` : ''}\n`
      })
      : ''
  ) + block.tags.reduce((s, tag) => {
    return s + stringifyTag(tag, { indent })
  }, '')
};

const stringifyTag = exports.stringifyTag = function stringifyTag (
  tag, { indent = '' } = {}
) {
  const indnt = getIndent(indent);
  const {
    type, name, optional, description, tag: tagName, default: deflt //, line , source
  } = tag;

  return indnt + `* @${tagName}` +
    (type ? ` {${type}}` : '') +
    (name.trim() ? ` ${
      optional ? '[' : ''
    }${name.trimRight()}${deflt ? `=${deflt}` : ''}${
      optional ? ']' : ''
    }` : '') +
    (description ? ` ${description.replace(/\n/g, '\n' + indnt + '* ')}` : '') + '\n'
};
});

var commentParser = parser;

var stringify_1 = stringifier;

/* ------- Transform stream ------- */

class Parser extends stream.Transform {
  constructor (opts) {
    opts = opts || {};
    super({ objectMode: true });
    this._extract = parser.mkextract(opts);
  }

  _transform (data, encoding, done) {
    let block;
    const lines = data.toString().split(/\n/);

    while (lines.length) {
      block = this._extract(lines.shift());
      if (block) {
        this.push(block);
      }
    }

    done();
  }
}

var stream_1 = function stream (opts) {
  return new Parser(opts)
};

/* ------- File parser ------- */

var file = function file (file_path, done) {
  let opts = {};
  const collected = [];

  if (arguments.length === 3) {
    opts = done;
    done = arguments[2];
  }

  return fs.createReadStream(file_path, { encoding: 'utf8' })
    .on('error', done)
    .pipe(new Parser(opts))
    .on('error', done)
    .on('data', function (data) {
      collected.push(data);
    })
    .on('finish', function () {
      done(null, collected);
    })
};
commentParser.stringify = stringify_1;
commentParser.stream = stream_1;
commentParser.file = file;

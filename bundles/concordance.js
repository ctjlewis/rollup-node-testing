import 'crypto';

const AMBIGUOUS = Symbol('AMBIGUOUS');
const DEEP_EQUAL = Symbol('DEEP_EQUAL');
const SHALLOW_EQUAL = Symbol('SHALLOW_EQUAL');
const UNEQUAL = Symbol('UNEQUAL');

var constants = {
  AMBIGUOUS,
  DEEP_EQUAL,
  SHALLOW_EQUAL,
  UNEQUAL,
};

const ACTUAL = Symbol('lineBuilder.gutters.ACTUAL');
const EXPECTED = Symbol('lineBuilder.gutters.EXPECTED');

function translateGutter (theme, invert, gutter) {
  if (invert) {
    if (gutter === ACTUAL) return theme.diffGutters.expected
    if (gutter === EXPECTED) return theme.diffGutters.actual
  } else {
    if (gutter === ACTUAL) return theme.diffGutters.actual
    if (gutter === EXPECTED) return theme.diffGutters.expected
  }
  return theme.diffGutters.padding
}

class Line {
  constructor (isFirst, isLast, gutter, stringValue) {
    this.isFirst = isFirst;
    this.isLast = isLast;
    this.gutter = gutter;
    this.stringValue = stringValue;
  }

  * [Symbol.iterator] () {
    yield this;
  }

  get isEmpty () {
    return false
  }

  get hasGutter () {
    return this.gutter !== null
  }

  get isSingle () {
    return this.isFirst && this.isLast
  }

  append (other) {
    return this.concat(other)
  }

  concat (other) {
    return new Collection()
      .append(this)
      .append(other)
  }

  toString (options) {
    if (options.diff === false) return this.stringValue

    return translateGutter(options.theme, options.invert, this.gutter) + this.stringValue
  }

  mergeWithInfix (infix, other) {
    if (other.isLine !== true) {
      return new Collection()
        .append(this)
        .mergeWithInfix(infix, other)
    }

    return new Line(this.isFirst, other.isLast, other.gutter, this.stringValue + infix + other.stringValue)
  }

  withFirstPrefixed (prefix) {
    if (!this.isFirst) return this

    return new Line(true, this.isLast, this.gutter, prefix + this.stringValue)
  }

  withLastPostfixed (postfix) {
    if (!this.isLast) return this

    return new Line(this.isFirst, true, this.gutter, this.stringValue + postfix)
  }

  stripFlags () {
    return new Line(false, false, this.gutter, this.stringValue)
  }

  decompose () {
    return new Collection()
      .append(this)
      .decompose()
  }
}
Object.defineProperty(Line.prototype, 'isLine', { value: true });

class Collection {
  constructor () {
    this.buffer = [];
  }

  * [Symbol.iterator] () {
    for (const appended of this.buffer) {
      for (const line of appended) yield line;
    }
  }

  get isEmpty () {
    return this.buffer.length === 0
  }

  get hasGutter () {
    for (const line of this) {
      if (line.hasGutter) return true
    }
    return false
  }

  get isSingle () {
    const iterator = this[Symbol.iterator]();
    iterator.next();
    return iterator.next().done === true
  }

  append (lineOrLines) {
    if (!lineOrLines.isEmpty) this.buffer.push(lineOrLines);
    return this
  }

  concat (other) {
    return new Collection()
      .append(this)
      .append(other)
  }

  toString (options) {
    let lines = this;

    if (options.invert) {
      lines = new Collection();
      let buffer = new Collection();

      let prev = null;
      for (const line of this) {
        if (line.gutter === ACTUAL) {
          if (prev !== null && prev.gutter !== ACTUAL && !buffer.isEmpty) {
            lines.append(buffer);
            buffer = new Collection();
          }

          buffer.append(line);
        } else if (line.gutter === EXPECTED) {
          lines.append(line);
        } else {
          if (!buffer.isEmpty) {
            lines.append(buffer);
            buffer = new Collection();
          }

          lines.append(line);
        }

        prev = line;
      }
      lines.append(buffer);
    }

    return Array.from(lines, line => line.toString(options)).join('\n')
  }

  mergeWithInfix (infix, from) {
    if (from.isEmpty) throw new Error('Cannot merge, `from` is empty.')

    const otherLines = Array.from(from);
    if (!otherLines[0].isFirst) throw new Error('Cannot merge, `from` has no first line.')

    const merged = new Collection();
    let seenLast = false;
    for (const line of this) {
      if (seenLast) throw new Error('Cannot merge line, the last line has already been seen.')

      if (!line.isLast) {
        merged.append(line);
        continue
      }

      seenLast = true;
      for (const other of otherLines) {
        if (other.isFirst) {
          merged.append(line.mergeWithInfix(infix, other));
        } else {
          merged.append(other);
        }
      }
    }
    return merged
  }

  withFirstPrefixed (prefix) {
    return new Collection()
      .append(Array.from(this, line => line.withFirstPrefixed(prefix)))
  }

  withLastPostfixed (postfix) {
    return new Collection()
      .append(Array.from(this, line => line.withLastPostfixed(postfix)))
  }

  stripFlags () {
    return new Collection()
      .append(Array.from(this, line => line.stripFlags()))
  }

  decompose () {
    const first = { actual: new Collection(), expected: new Collection() };
    const last = { actual: new Collection(), expected: new Collection() };
    const remaining = new Collection();

    for (const line of this) {
      if (line.isFirst && line.gutter === ACTUAL) {
        first.actual.append(line);
      } else if (line.isFirst && line.gutter === EXPECTED) {
        first.expected.append(line);
      } else if (line.isLast && line.gutter === ACTUAL) {
        last.actual.append(line);
      } else if (line.isLast && line.gutter === EXPECTED) {
        last.expected.append(line);
      } else {
        remaining.append(line);
      }
    }

    return { first, last, remaining }
  }
}
Object.defineProperty(Collection.prototype, 'isCollection', { value: true });

function setDefaultGutter (iterable, gutter) {
  return new Collection()
    .append(Array.from(iterable, line => {
      return line.gutter === null
        ? new Line(line.isFirst, line.isLast, gutter, line.stringValue)
        : line
    }))
}

var lineBuilder = {
  buffer () {
    return new Collection()
  },

  first (stringValue) {
    return new Line(true, false, null, stringValue)
  },

  last (stringValue) {
    return new Line(false, true, null, stringValue)
  },

  line (stringValue) {
    return new Line(false, false, null, stringValue)
  },

  single (stringValue) {
    return new Line(true, true, null, stringValue)
  },

  setDefaultGutter (lineOrCollection) {
    return lineOrCollection
  },

  actual: {
    first (stringValue) {
      return new Line(true, false, ACTUAL, stringValue)
    },

    last (stringValue) {
      return new Line(false, true, ACTUAL, stringValue)
    },

    line (stringValue) {
      return new Line(false, false, ACTUAL, stringValue)
    },

    single (stringValue) {
      return new Line(true, true, ACTUAL, stringValue)
    },

    setDefaultGutter (lineOrCollection) {
      return setDefaultGutter(lineOrCollection, ACTUAL)
    },
  },

  expected: {
    first (stringValue) {
      return new Line(true, false, EXPECTED, stringValue)
    },

    last (stringValue) {
      return new Line(false, true, EXPECTED, stringValue)
    },

    line (stringValue) {
      return new Line(false, false, EXPECTED, stringValue)
    },

    single (stringValue) {
      return new Line(true, true, EXPECTED, stringValue)
    },

    setDefaultGutter (lineOrCollection) {
      return setDefaultGutter(lineOrCollection, EXPECTED)
    },
  },
};

function wrap (fromTheme, value) {
  return fromTheme.open + value + fromTheme.close
}
var wrap_1 = wrap;

function formatCtorAndStringTag (theme, object) {
  if (!object.ctor) return wrap(theme.object.stringTag, object.stringTag)

  let retval = wrap(theme.object.ctor, object.ctor);
  if (object.stringTag && object.stringTag !== object.ctor && object.stringTag !== 'Object') {
    retval += ' ' + wrap(theme.object.secondaryStringTag, object.stringTag);
  }
  return retval
}
var formatCtorAndStringTag_1 = formatCtorAndStringTag;

class ObjectFormatter {
  constructor (object, theme, indent) {
    this.object = object;
    this.theme = theme;
    this.indent = indent;

    this.increaseIndent = true;

    this.innerLines = lineBuilder.buffer();
    this.pendingStats = null;
  }

  append (formatted, origin) {
    if (origin.isStats === true) {
      this.pendingStats = formatted;
    } else {
      if (this.pendingStats !== null) {
        if (!this.innerLines.isEmpty) {
          this.innerLines.append(this.pendingStats);
        }
        this.pendingStats = null;
      }
      this.innerLines.append(formatted);
    }
  }

  finalize () {
    const variant = this.object.isList
      ? this.theme.list
      : this.theme.object;

    const ctor = this.object.ctor;
    const stringTag = this.object.stringTag;
    const prefix = (ctor === 'Array' || ctor === 'Object') && ctor === stringTag
      ? ''
      : formatCtorAndStringTag(this.theme, this.object) + ' ';

    if (this.innerLines.isEmpty) {
      return lineBuilder.single(prefix + variant.openBracket + variant.closeBracket)
    }

    return lineBuilder.first(prefix + variant.openBracket)
      .concat(this.innerLines.withFirstPrefixed(this.indent.increase()).stripFlags())
      .append(lineBuilder.last(this.indent + variant.closeBracket))
  }

  maxDepth () {
    const variant = this.object.isList
      ? this.theme.list
      : this.theme.object;

    return lineBuilder.single(
      formatCtorAndStringTag(this.theme, this.object) + ' ' + variant.openBracket +
      ' ' + this.theme.maxDepth + ' ' + variant.closeBracket)
  }

  shouldFormat () {
    return true
  }

  customize (methods) {
    if (methods.finalize) {
      this.finalize = () => methods.finalize(this.innerLines);
    }
    if (methods.maxDepth) {
      this.maxDepth = methods.maxDepth;
    }
    if (methods.shouldFormat) {
      this.shouldFormat = methods.shouldFormat;
    }

    return this
  }
}
var ObjectFormatter_1 = ObjectFormatter;

class SingleValueFormatter {
  constructor (theme, finalizeFn, increaseIndent) {
    this.theme = theme;
    this.finalizeFn = finalizeFn;
    this.hasValue = false;
    this.increaseIndent = increaseIndent === true;
    this.value = null;
  }

  append (formatted) {
    if (this.hasValue) throw new Error('Formatter buffer can only take one formatted value.')

    this.hasValue = true;
    this.value = formatted;
  }

  finalize () {
    if (!this.hasValue) throw new Error('Formatter buffer never received a formatted value.')

    return this.finalizeFn(this.value)
  }

  maxDepth () {
    return this.finalizeFn(lineBuilder.single(this.theme.maxDepth))
  }
}
var SingleValueFormatter_1 = SingleValueFormatter;

var formatUtils = {
	wrap: wrap_1,
	formatCtorAndStringTag: formatCtorAndStringTag_1,
	ObjectFormatter: ObjectFormatter_1,
	SingleValueFormatter: SingleValueFormatter_1
};

function getObjectKeys (obj, excludeListItemAccessorsBelowLength) {
  const keys = [];
  let size = 0;

  // Sort property names, they should never be order-sensitive
  const nameCandidates = Object.getOwnPropertyNames(obj).sort();
  // Comparators should verify symbols in an order-insensitive manner if
  // possible.
  const symbolCandidates = Object.getOwnPropertySymbols(obj);

  for (const name of nameCandidates) {
    let accept = true;
    if (excludeListItemAccessorsBelowLength > 0) {
      const index = Number(name);
      accept = (index % 1 !== 0) || index >= excludeListItemAccessorsBelowLength;
    }

    if (accept && Object.getOwnPropertyDescriptor(obj, name).enumerable) {
      keys[size++] = name;
    }
  }

  for (const symbol of symbolCandidates) {
    if (Object.getOwnPropertyDescriptor(obj, symbol).enumerable) {
      keys[size++] = symbol;
    }
  }

  return { keys, size }
}
var getObjectKeys_1 = getObjectKeys;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

var isLength_1 = isLength;

const hop = Object.prototype.hasOwnProperty;

function hasLength (obj) {
  return (
    Array.isArray(obj) ||
    (hop.call(obj, 'length') &&
      isLength_1(obj.length) &&
      (obj.length === 0 || '0' in obj))
  )
}
var hasLength_1 = hasLength;

const NOOP_RECURSOR = {
  size: 0,
  next () { return null },
};
var NOOP_RECURSOR_1 = NOOP_RECURSOR;

function fork (recursor) {
  const buffer = [];

  return {
    shared () {
      const next = recursor();
      if (next !== null) buffer.push(next);
      return next
    },

    recursor () {
      if (buffer.length > 0) return buffer.shift()
      return recursor()
    },
  }
}
var fork_1 = fork;

function map (recursor, mapFn) {
  return () => {
    const next = recursor();
    if (next === null) return null

    return mapFn(next)
  }
}
var map_1 = map;

function replay (state, create) {
  if (!state) {
    const recursor = create();
    if (recursor === NOOP_RECURSOR) {
      state = recursor;
    } else {
      state = Object.assign({
        buffer: [],
        done: false,
      }, recursor);
    }
  }

  if (state === NOOP_RECURSOR) return { state, recursor: state }

  let done = false;
  let index = 0;
  const next = () => {
    if (done) return null

    let retval = state.buffer[index];
    if (retval === undefined) {
      retval = state.buffer[index] = state.next();
    }

    index++;
    if (retval === null) {
      done = true;
    }
    return retval
  };

  return { state, recursor: { next, size: state.size } }
}
var replay_1 = replay;

function sequence (first, second) {
  let fromFirst = true;
  return () => {
    if (fromFirst) {
      const next = first();
      if (next !== null) return next

      fromFirst = false;
    }

    return second()
  }
}
var sequence_1 = sequence;

function singleValue (value) {
  let done = false;
  return () => {
    if (done) return null

    done = true;
    return value
  }
}
var singleValue_1 = singleValue;

function unshift (recursor, value) {
  return () => {
    if (value !== null) {
      const next = value;
      value = null;
      return next
    }

    return recursor()
  }
}
var unshift_1 = unshift;

var recursorUtils = {
	NOOP_RECURSOR: NOOP_RECURSOR_1,
	fork: fork_1,
	map: map_1,
	replay: replay_1,
	sequence: sequence_1,
	singleValue: singleValue_1,
	unshift: unshift_1
};

const DEEP_EQUAL$1 = constants.DEEP_EQUAL;
const UNEQUAL$1 = constants.UNEQUAL;

function describeIterableRecursor (recursor) {
  return new IterableStats(recursor.size)
}
var describeIterableRecursor_1 = describeIterableRecursor;

function describeListRecursor (recursor) {
  return new ListStats(recursor.size)
}
var describeListRecursor_1 = describeListRecursor;

function describePropertyRecursor (recursor) {
  return new PropertyStats(recursor.size)
}
var describePropertyRecursor_1 = describePropertyRecursor;

function deserializeIterableStats (size) {
  return new IterableStats(size)
}
var deserializeIterableStats_1 = deserializeIterableStats;

function deserializeListStats (size) {
  return new ListStats(size)
}
var deserializeListStats_1 = deserializeListStats;

function deserializePropertyStats (size) {
  return new PropertyStats(size)
}
var deserializePropertyStats_1 = deserializePropertyStats;

const iterableTag = Symbol('IterableStats');
var iterableTag_1 = iterableTag;

const listTag = Symbol('ListStats');
var listTag_1 = listTag;

const propertyTag = Symbol('PropertyStats');
var propertyTag_1 = propertyTag;

class Stats {
  constructor (size) {
    this.size = size;
  }

  formatDeep (theme) {
    return lineBuilder.single(theme.stats.separator)
  }

  prepareDiff (expected, lhsRecursor, rhsRecursor, compareComplexShape) {
    if (expected.isStats !== true || expected.tag === this.tag) return null

    // Try to line up stats descriptors with the same tag.
    const rhsFork = recursorUtils.fork(rhsRecursor);
    const initialExpected = expected;

    const missing = [];
    while (expected !== null && this.tag !== expected.tag) {
      missing.push(expected);
      expected = rhsFork.shared();
    }

    if (expected !== null && missing.length > 0) {
      return {
        multipleAreMissing: true,
        descriptors: missing,
        lhsRecursor: recursorUtils.unshift(lhsRecursor, this),
        // Use original `rhsRecursor`, not `rhsFork`, since the consumed
        // descriptors are returned with the `missing` array.
        rhsRecursor: recursorUtils.unshift(rhsRecursor, expected),
      }
    }

    const lhsFork = recursorUtils.fork(lhsRecursor);
    let actual = this;

    const extraneous = [];
    while (actual !== null && actual.tag !== initialExpected.tag) {
      extraneous.push(actual);
      actual = lhsFork.shared();
    }

    if (actual !== null && extraneous.length > 0) {
      return {
        multipleAreExtraneous: true,
        descriptors: extraneous,
        // Use original `lhsRecursor`, not `lhsFork`, since the consumed
        // descriptors are returned with the `extraneous` array.
        lhsRecursor: recursorUtils.unshift(lhsRecursor, actual),
        rhsRecursor: recursorUtils.unshift(rhsFork.recursor, initialExpected),
      }
    }

    return null
  }

  serialize () {
    return this.size
  }
}
Object.defineProperty(Stats.prototype, 'isStats', { value: true });

class IterableStats extends Stats {
  compare (expected) {
    return expected.tag === iterableTag && this.size === expected.size
      ? DEEP_EQUAL$1
      : UNEQUAL$1
  }
}
Object.defineProperty(IterableStats.prototype, 'tag', { value: iterableTag });

class ListStats extends Stats {
  compare (expected) {
    return expected.tag === listTag && this.size === expected.size
      ? DEEP_EQUAL$1
      : UNEQUAL$1
  }
}
Object.defineProperty(ListStats.prototype, 'tag', { value: listTag });

class PropertyStats extends Stats {
  compare (expected) {
    return expected.tag === propertyTag && this.size === expected.size
      ? DEEP_EQUAL$1
      : UNEQUAL$1
  }
}
Object.defineProperty(PropertyStats.prototype, 'tag', { value: propertyTag });

var stats = {
	describeIterableRecursor: describeIterableRecursor_1,
	describeListRecursor: describeListRecursor_1,
	describePropertyRecursor: describePropertyRecursor_1,
	deserializeIterableStats: deserializeIterableStats_1,
	deserializeListStats: deserializeListStats_1,
	deserializePropertyStats: deserializePropertyStats_1,
	iterableTag: iterableTag_1,
	listTag: listTag_1,
	propertyTag: propertyTag_1
};

const ObjectFormatter$1 = formatUtils.ObjectFormatter;





const DEEP_EQUAL$2 = constants.DEEP_EQUAL;
const SHALLOW_EQUAL$1 = constants.SHALLOW_EQUAL;
const UNEQUAL$2 = constants.UNEQUAL;

function describe (props) {
  const isArray = props.stringTag === 'Array';
  const object = props.value;
  return new DescribedObjectValue(Object.assign({
    isArray,
    isIterable: object[Symbol.iterator] !== undefined,
    isList: isArray || hasLength_1(object),
  }, props))
}
var describe_1 = describe;

function deserialize (state, recursor) {
  return new DeserializedObjectValue(state, recursor)
}
var deserialize_1 = deserialize;

const tag = Symbol('ObjectValue');
var tag_1 = tag;

class ObjectValue {
  constructor (props) {
    this.ctor = props.ctor;
    this.pointer = props.pointer;
    this.stringTag = props.stringTag;

    this.isArray = props.isArray === true;
    this.isIterable = props.isIterable === true;
    this.isList = props.isList === true;
  }

  compare (expected) {
    if (this.tag !== expected.tag) return UNEQUAL$2
    if (this.stringTag !== expected.stringTag || !this.hasSameCtor(expected)) return UNEQUAL$2
    return SHALLOW_EQUAL$1
  }

  hasSameCtor (expected) {
    return this.ctor === expected.ctor
  }

  formatShallow (theme, indent) {
    return new ObjectFormatter$1(this, theme, indent)
  }

  serialize () {
    return [
      this.ctor, this.pointer, this.stringTag,
      this.isArray, this.isIterable, this.isList,
    ]
  }
}
Object.defineProperty(ObjectValue.prototype, 'isComplex', { value: true });
Object.defineProperty(ObjectValue.prototype, 'tag', { value: tag });
var ObjectValue_1 = ObjectValue;

const DescribedObjectValue = DescribedMixin(ObjectValue);
const DeserializedObjectValue = DeserializedMixin(ObjectValue);

function DescribedMixin (base) {
  return class extends base {
    constructor (props) {
      super(props);

      this.value = props.value;
      this.describeAny = props.describeAny;
      this.describeItem = props.describeItem;
      this.describeMapEntry = props.describeMapEntry;
      this.describeProperty = props.describeProperty;

      this.iterableState = null;
      this.listState = null;
      this.propertyState = null;
    }

    compare (expected) {
      return this.value === expected.value
        ? DEEP_EQUAL$2
        : super.compare(expected)
    }

    createPropertyRecursor () {
      const objectKeys = getObjectKeys_1(this.value, this.isList ? this.value.length : 0);
      const size = objectKeys.size;
      if (size === 0) return recursorUtils.NOOP_RECURSOR

      let index = 0;
      const next = () => {
        if (index === size) return null

        const key = objectKeys.keys[index++];
        return this.describeProperty(key, this.describeAny(this.value[key]))
      };

      return { size, next }
    }

    createListRecursor () {
      if (!this.isList) return recursorUtils.NOOP_RECURSOR

      const size = this.value.length;
      if (size === 0) return recursorUtils.NOOP_RECURSOR

      let index = 0;
      const next = () => {
        if (index === size) return null

        const current = index;
        index++;
        return this.describeItem(current, this.describeAny(this.value[current]))
      };

      return { size, next }
    }

    createIterableRecursor () {
      if (this.isArray || !this.isIterable) return recursorUtils.NOOP_RECURSOR

      const iterator = this.value[Symbol.iterator]();
      let first = iterator.next();

      let done = false;
      let size = -1;
      if (first.done) {
        if (first.value === undefined) {
          size = 0;
          done = true;
        } else {
          size = 1;
        }
      }

      let index = 0;
      const next = () => {
        if (done) return null

        while (!done) {
          const current = first || iterator.next();
          if (current === first) {
            first = null;
          }
          if (current.done) {
            done = true;
          }

          const item = current.value;
          if (done && item === undefined) return null

          if (this.isList && this.value[index] === item) {
            index++;
          } else {
            return this.describeItem(index++, this.describeAny(item))
          }
        }
      };

      return { size, next }
    }

    createRecursor () {
      let recursedProperty = false;
      let recursedList = false;
      let recursedIterable = false;

      let recursor = null;
      return () => {
        let retval = null;
        do {
          if (recursor !== null) {
            retval = recursor.next();
            if (retval === null) {
              recursor = null;
            }
          }

          while (recursor === null && (!recursedList || !recursedProperty || !recursedIterable)) {
            // Prioritize recursing lists
            if (!recursedList) {
              const replay = recursorUtils.replay(this.listState, () => this.createListRecursor());
              this.listState = replay.state;
              recursor = replay.recursor;
              recursedList = true;
              if (recursor !== recursorUtils.NOOP_RECURSOR) {
                retval = stats.describeListRecursor(recursor);
              }
            } else if (!recursedProperty) {
              const replay = recursorUtils.replay(this.propertyState, () => this.createPropertyRecursor());
              this.propertyState = replay.state;
              recursor = replay.recursor;
              recursedProperty = true;
              if (recursor !== recursorUtils.NOOP_RECURSOR) {
                retval = stats.describePropertyRecursor(recursor);
              }
            } else if (!recursedIterable) {
              const replay = recursorUtils.replay(this.iterableState, () => this.createIterableRecursor());
              this.iterableState = replay.state;
              recursor = replay.recursor;
              recursedIterable = true;
              if (recursor !== recursorUtils.NOOP_RECURSOR) {
                retval = stats.describeIterableRecursor(recursor);
              }
            }
          }
        } while (recursor !== null && retval === null)

        return retval
      }
    }
  }
}
var DescribedMixin_1 = DescribedMixin;

function DeserializedMixin (base) {
  return class extends base {
    constructor (state, recursor) {
      super({
        ctor: state[0],
        pointer: state[1],
        stringTag: state[2],
        isArray: state[3],
        isIterable: state[4],
        isList: state[5],
      });

      this.deserializedRecursor = recursor;
      this.replayState = null;
    }

    createRecursor () {
      if (!this.deserializedRecursor) return () => null

      const replay = recursorUtils.replay(this.replayState, () => ({ size: -1, next: this.deserializedRecursor }));
      this.replayState = replay.state;
      return replay.recursor.next
    }

    hasSameCtor (expected) {
      return this.ctor === expected.ctor
    }
  }
}
var DeserializedMixin_1 = DeserializedMixin;

var object = {
	describe: describe_1,
	deserialize: deserialize_1,
	tag: tag_1,
	ObjectValue: ObjectValue_1,
	DescribedMixin: DescribedMixin_1,
	DeserializedMixin: DeserializedMixin_1
};

const AMBIGUOUS$1 = constants.AMBIGUOUS;
const UNEQUAL$3 = constants.UNEQUAL;

function describe$1 (props) {
  return new DescribedArgumentsValue(Object.assign({
    // Treat as an array, to allow comparisons with arrays
    isArray: true,
    isList: true,
  }, props, { ctor: 'Arguments' }))
}
var describe_1$1 = describe$1;

function deserialize$1 (state, recursor) {
  return new DeserializedArgumentsValue(state, recursor)
}
var deserialize_1$1 = deserialize$1;

const tag$1 = Symbol('ArgumentsValue');
var tag_1$1 = tag$1;

class ArgumentsValue extends object.ObjectValue {
  compare (expected) {
    if (expected.isComplex !== true) return UNEQUAL$3

    // When used on the left-hand side of a comparison, argument values may be
    // compared to arrays.
    if (expected.stringTag === 'Array') return AMBIGUOUS$1

    return super.compare(expected)
  }
}
Object.defineProperty(ArgumentsValue.prototype, 'tag', { value: tag$1 });

const DescribedArgumentsValue = object.DescribedMixin(ArgumentsValue);

class DeserializedArgumentsValue extends object.DeserializedMixin(ArgumentsValue) {
  compare (expected) {
    // Deserialized argument values may only be compared to argument values.
    return expected.isComplex === true && expected.stringTag === 'Array'
      ? UNEQUAL$3
      : super.compare(expected)
  }
}

var _arguments = {
	describe: describe_1$1,
	deserialize: deserialize_1$1,
	tag: tag_1$1
};

const propertyStatsTag = stats.propertyTag;



const DEEP_EQUAL$3 = constants.DEEP_EQUAL;
const UNEQUAL$4 = constants.UNEQUAL;

function getBuffer (value) {
  const buffer = Buffer.from(value.buffer);
  return value.byteLength !== value.buffer.byteLength
    ? buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
    : buffer
}
var getBuffer_1 = getBuffer;

function describe$2 (props) {
  return new DescribedTypedArrayValue(Object.assign({
    buffer: getBuffer(props.value),
    // Set isArray and isList so the property recursor excludes the byte accessors
    isArray: true,
    isList: true,
  }, props))
}
var describe_1$2 = describe$2;

function deserialize$2 (state, recursor) {
  return new DeserializedTypedArrayValue(state, recursor)
}
var deserialize_1$2 = deserialize$2;

function deserializeBytes (buffer) {
  return new Bytes(buffer)
}
var deserializeBytes_1 = deserializeBytes;

const bytesTag = Symbol('Bytes');
var bytesTag_1 = bytesTag;

const tag$2 = Symbol('TypedArrayValue');
var tag_1$2 = tag$2;

class Bytes {
  constructor (buffer) {
    this.buffer = buffer;
  }

  compare (expected) {
    return expected.tag === bytesTag && this.buffer.equals(expected.buffer)
      ? DEEP_EQUAL$3
      : UNEQUAL$4
  }

  formatDeep (theme, indent) {
    const indentation = indent;
    const lines = lineBuilder.buffer();

    // Display 4-byte words, 8 per line
    let string = '';
    let isFirst = true;
    for (let offset = 0; offset < this.buffer.length; offset += 4) {
      if (offset > 0) {
        if (offset % 32 === 0) {
          if (isFirst) {
            lines.append(lineBuilder.first(string));
            isFirst = false;
          } else {
            lines.append(lineBuilder.line(string));
          }
          string = String(indentation);
        } else {
          string += ' ';
        }
      }
      string += formatUtils.wrap(theme.typedArray.bytes, this.buffer.toString('hex', offset, offset + 4));
    }

    return isFirst
      ? lineBuilder.single(string)
      : lines.append(lineBuilder.last(string))
  }

  serialize () {
    return this.buffer
  }
}
Object.defineProperty(Bytes.prototype, 'tag', { value: bytesTag });

class TypedArrayValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.buffer = props.buffer;
  }

  formatShallow (theme, indent) {
    return super.formatShallow(theme, indent).customize({
      shouldFormat (subject) {
        if (subject.tag === propertyStatsTag) return subject.size > 1
        if (subject.isProperty === true) return subject.key.value !== 'byteLength'
        if (subject.tag === bytesTag) return subject.buffer.byteLength > 0
        return true
      },
    })
  }
}
Object.defineProperty(TypedArrayValue.prototype, 'tag', { value: tag$2 });
var TypedArrayValue_1 = TypedArrayValue;

function DescribedMixin$1 (base) {
  return class extends object.DescribedMixin(base) {
    // The list isn't recursed. Instead a Bytes instance is returned by the main
    // recursor.
    createListRecursor () {
      return recursorUtils.NOOP_RECURSOR
    }

    createPropertyRecursor () {
      const recursor = super.createPropertyRecursor();
      const size = recursor.size + 1;

      let done = false;
      const next = () => {
        if (done) return null

        const property = recursor.next();
        if (property) return property

        done = true;
        return this.describeProperty('byteLength', this.describeAny(this.buffer.byteLength))
      };

      return { size, next }
    }

    createRecursor () {
      return recursorUtils.unshift(super.createRecursor(), new Bytes(this.buffer))
    }
  }
}
var DescribedMixin_1$1 = DescribedMixin$1;

const DescribedTypedArrayValue = DescribedMixin$1(TypedArrayValue);

function DeserializedMixin$1 (base) {
  return class extends object.DeserializedMixin(base) {
    constructor (state, recursor) {
      super(state, recursor);

      // Get the Bytes descriptor from the recursor. It contains the buffer.
      const bytesDescriptor = this.createRecursor()();
      this.buffer = bytesDescriptor.buffer;
    }
  }
}
var DeserializedMixin_1$1 = DeserializedMixin$1;

const DeserializedTypedArrayValue = DeserializedMixin$1(TypedArrayValue);

var typedArray = {
	getBuffer: getBuffer_1,
	describe: describe_1$2,
	deserialize: deserialize_1$2,
	deserializeBytes: deserializeBytes_1,
	bytesTag: bytesTag_1,
	tag: tag_1$2,
	TypedArrayValue: TypedArrayValue_1,
	DescribedMixin: DescribedMixin_1$1,
	DeserializedMixin: DeserializedMixin_1$1
};

function describe$3 (props) {
  return new DescribedArrayBufferValue(Object.assign({
    buffer: Buffer.from(props.value),
    // Set isArray and isList so the property recursor excludes the byte accessors
    isArray: true,
    isList: true,
  }, props))
}
var describe_1$3 = describe$3;

function deserialize$3 (state, recursor) {
  return new DeserializedArrayBufferValue(state, recursor)
}
var deserialize_1$3 = deserialize$3;

const tag$3 = Symbol('ArrayBufferValue');
var tag_1$3 = tag$3;

// ArrayBuffers can be represented as regular Buffers, allowing them to be
// treated as TypedArrays for the purposes of this package.
class ArrayBufferValue extends typedArray.TypedArrayValue {}
Object.defineProperty(ArrayBufferValue.prototype, 'tag', { value: tag$3 });

const DescribedArrayBufferValue = typedArray.DescribedMixin(ArrayBufferValue);
const DeserializedArrayBufferValue = typedArray.DeserializedMixin(ArrayBufferValue);

var arrayBuffer = {
	describe: describe_1$3,
	deserialize: deserialize_1$3,
	tag: tag_1$3
};

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

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var ast = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var code = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v9.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v9.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v9.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v9.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var keyword = createCommonjsModule(function (module) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {

    var code$1 = code;

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code$1.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code$1.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code$1.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code$1.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

var utils = createCommonjsModule(function (module, exports) {
/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {

    exports.ast = ast;
    exports.code = code;
    exports.keyword = keyword;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

/**
 * This library modifies the diff-patch-match library by Neil Fraser
 * by removing the patch and match functionality and certain advanced
 * options in the diff function. The original license is as follows:
 *
 * ===
 *
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {Int|Object} [cursor_pos] Edit position in text1 or object with more info
 * @return {Array} Array of diff tuples.
 */
function diff_main(text1, text2, cursor_pos, _fix_unicode) {
  // Check for equality
  if (text1 === text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }
    return [];
  }

  if (cursor_pos != null) {
    var editdiff = find_cursor_edit_diff(text1, text2, cursor_pos);
    if (editdiff) {
      return editdiff;
    }
  }

  // Trim off common prefix (speedup).
  var commonlength = diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = diff_compute_(text1, text2);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  diff_cleanupMerge(diffs, _fix_unicode);
  return diffs;
}

/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 */
function diff_compute_(text1, text2) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i !== -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [
      [DIFF_INSERT, longtext.substring(0, i)],
      [DIFF_EQUAL, shorttext],
      [DIFF_INSERT, longtext.substring(i + shorttext.length)]
    ];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length === 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  // Check to see if the problem can be split in two.
  var hm = diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = diff_main(text1_a, text2_a);
    var diffs_b = diff_main(text1_b, text2_b);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  return diff_bisect_(text1, text2);
}

/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array} Array of diff tuples.
 * @private
 */
function diff_bisect_(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (delta % 2 !== 0);
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;
  for (var d = 0; d < max_d; d++) {
    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;
      if (k1 === -d || (k1 !== d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }
      var y1 = x1 - k1;
      while (
        x1 < text1_length && y1 < text2_length &&
        text1.charAt(x1) === text2.charAt(y1)
      ) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] !== -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 === -d || (k2 !== d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }
      var y2 = x2 - k2;
      while (
        x2 < text1_length && y2 < text2_length &&
        text1.charAt(text1_length - x2 - 1) === text2.charAt(text2_length - y2 - 1)
      ) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] !== -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return diff_bisectSplit_(text1, text2, x1, y1);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
}

/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @return {Array} Array of diff tuples.
 */
function diff_bisectSplit_(text1, text2, x, y) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = diff_main(text1a, text2a);
  var diffsb = diff_main(text1b, text2b);

  return diffs.concat(diffsb);
}

/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
function diff_commonPrefix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) !== text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(pointerstart, pointermid) ==
      text2.substring(pointerstart, pointermid)
    ) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  if (is_surrogate_pair_start(text1.charCodeAt(pointermid - 1))) {
    pointermid--;
  }

  return pointermid;
}

/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
function diff_commonSuffix(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.slice(-1) !== text2.slice(-1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (
      text1.substring(text1.length - pointermid, text1.length - pointerend) ==
      text2.substring(text2.length - pointermid, text2.length - pointerend)
    ) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }

  if (is_surrogate_pair_end(text1.charCodeAt(text1.length - pointermid))) {
    pointermid--;
  }

  return pointermid;
}

/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 */
function diff_halfMatch_(text1, text2) {
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null;  // Pointless.
  }

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) !== -1) {
      var prefixLength = diff_commonPrefix(
        longtext.substring(i), shorttext.substring(j));
      var suffixLength = diff_commonSuffix(
        longtext.substring(0, i), shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(
          j - suffixLength, j) + shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [
        best_longtext_a, best_longtext_b,
        best_shorttext_a, best_shorttext_b, best_common
      ];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
}

/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {Array} diffs Array of diff tuples.
 * @param {boolean} fix_unicode Whether to normalize to a unicode-correct diff
 */
function diff_cleanupMerge(diffs, fix_unicode) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;
  while (pointer < diffs.length) {
    if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
      diffs.splice(pointer, 1);
      continue;
    }
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:

        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        var previous_equality = pointer - count_insert - count_delete - 1;
        if (fix_unicode) {
          // prevent splitting of unicode surrogate pairs.  when fix_unicode is true,
          // we assume that the old and new text in the diff are complete and correct
          // unicode-encoded JS strings, but the tuple boundaries may fall between
          // surrogate pairs.  we fix this by shaving off stray surrogates from the end
          // of the previous equality and the beginning of this equality.  this may create
          // empty equalities or a common prefix or suffix.  for example, if AB and AC are
          // emojis, `[[0, 'A'], [-1, 'BA'], [0, 'C']]` would turn into deleting 'ABAC' and
          // inserting 'AC', and then the common suffix 'AC' will be eliminated.  in this
          // particular case, both equalities go away, we absorb any previous inequalities,
          // and we keep scanning for the next equality before rewriting the tuples.
          if (previous_equality >= 0 && ends_with_pair_start(diffs[previous_equality][1])) {
            var stray = diffs[previous_equality][1].slice(-1);
            diffs[previous_equality][1] = diffs[previous_equality][1].slice(0, -1);
            text_delete = stray + text_delete;
            text_insert = stray + text_insert;
            if (!diffs[previous_equality][1]) {
              // emptied out previous equality, so delete it and include previous delete/insert
              diffs.splice(previous_equality, 1);
              pointer--;
              var k = previous_equality - 1;
              if (diffs[k] && diffs[k][0] === DIFF_INSERT) {
                count_insert++;
                text_insert = diffs[k][1] + text_insert;
                k--;
              }
              if (diffs[k] && diffs[k][0] === DIFF_DELETE) {
                count_delete++;
                text_delete = diffs[k][1] + text_delete;
                k--;
              }
              previous_equality = k;
            }
          }
          if (starts_with_pair_end(diffs[pointer][1])) {
            var stray = diffs[pointer][1].charAt(0);
            diffs[pointer][1] = diffs[pointer][1].slice(1);
            text_delete += stray;
            text_insert += stray;
          }
        }
        if (pointer < diffs.length - 1 && !diffs[pointer][1]) {
          // for empty equality not at end, wait for next equality
          diffs.splice(pointer, 1);
          break;
        }
        if (text_delete.length > 0 || text_insert.length > 0) {
          // note that diff_commonPrefix and diff_commonSuffix are unicode-aware
          if (text_delete.length > 0 && text_insert.length > 0) {
            // Factor out any common prefixes.
            commonlength = diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if (previous_equality >= 0) {
                diffs[previous_equality][1] += text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL, text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixes.
            commonlength = diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] =
                text_insert.substring(text_insert.length - commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length - commonlength);
              text_delete = text_delete.substring(0, text_delete.length - commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          var n = count_insert + count_delete;
          if (text_delete.length === 0 && text_insert.length === 0) {
            diffs.splice(pointer - n, n);
            pointer = pointer - n;
          } else if (text_delete.length === 0) {
            diffs.splice(pointer - n, n, [DIFF_INSERT, text_insert]);
            pointer = pointer - n + 1;
          } else if (text_insert.length === 0) {
            diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete]);
            pointer = pointer - n + 1;
          } else {
            diffs.splice(pointer - n, n, [DIFF_DELETE, text_delete], [DIFF_INSERT, text_insert]);
            pointer = pointer - n + 2;
          }
        }
        if (pointer !== 0 && diffs[pointer - 1][0] === DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] === DIFF_EQUAL &&
      diffs[pointer + 1][0] === DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
        diffs[pointer - 1][1].length) === diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
          diffs[pointer][1].substring(0, diffs[pointer][1].length -
            diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
        diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
          diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
          diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    diff_cleanupMerge(diffs, fix_unicode);
  }
}
function is_surrogate_pair_start(charCode) {
  return charCode >= 0xD800 && charCode <= 0xDBFF;
}

function is_surrogate_pair_end(charCode) {
  return charCode >= 0xDC00 && charCode <= 0xDFFF;
}

function starts_with_pair_end(str) {
  return is_surrogate_pair_end(str.charCodeAt(0));
}

function ends_with_pair_start(str) {
  return is_surrogate_pair_start(str.charCodeAt(str.length - 1));
}

function remove_empty_tuples(tuples) {
  var ret = [];
  for (var i = 0; i < tuples.length; i++) {
    if (tuples[i][1].length > 0) {
      ret.push(tuples[i]);
    }
  }
  return ret;
}

function make_edit_splice(before, oldMiddle, newMiddle, after) {
  if (ends_with_pair_start(before) || starts_with_pair_end(after)) {
    return null;
  }
  return remove_empty_tuples([
    [DIFF_EQUAL, before],
    [DIFF_DELETE, oldMiddle],
    [DIFF_INSERT, newMiddle],
    [DIFF_EQUAL, after]
  ]);
}

function find_cursor_edit_diff(oldText, newText, cursor_pos) {
  // note: this runs after equality check has ruled out exact equality
  var oldRange = typeof cursor_pos === 'number' ?
    { index: cursor_pos, length: 0 } : cursor_pos.oldRange;
  var newRange = typeof cursor_pos === 'number' ?
    null : cursor_pos.newRange;
  // take into account the old and new selection to generate the best diff
  // possible for a text edit.  for example, a text change from "xxx" to "xx"
  // could be a delete or forwards-delete of any one of the x's, or the
  // result of selecting two of the x's and typing "x".
  var oldLength = oldText.length;
  var newLength = newText.length;
  if (oldRange.length === 0 && (newRange === null || newRange.length === 0)) {
    // see if we have an insert or delete before or after cursor
    var oldCursor = oldRange.index;
    var oldBefore = oldText.slice(0, oldCursor);
    var oldAfter = oldText.slice(oldCursor);
    var maybeNewCursor = newRange ? newRange.index : null;
    editBefore: {
      // is this an insert or delete right before oldCursor?
      var newCursor = oldCursor + newLength - oldLength;
      if (maybeNewCursor !== null && maybeNewCursor !== newCursor) {
        break editBefore;
      }
      if (newCursor < 0 || newCursor > newLength) {
        break editBefore;
      }
      var newBefore = newText.slice(0, newCursor);
      var newAfter = newText.slice(newCursor);
      if (newAfter !== oldAfter) {
        break editBefore;
      }
      var prefixLength = Math.min(oldCursor, newCursor);
      var oldPrefix = oldBefore.slice(0, prefixLength);
      var newPrefix = newBefore.slice(0, prefixLength);
      if (oldPrefix !== newPrefix) {
        break editBefore;
      }
      var oldMiddle = oldBefore.slice(prefixLength);
      var newMiddle = newBefore.slice(prefixLength);
      return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldAfter);
    }
    editAfter: {
      // is this an insert or delete right after oldCursor?
      if (maybeNewCursor !== null && maybeNewCursor !== oldCursor) {
        break editAfter;
      }
      var cursor = oldCursor;
      var newBefore = newText.slice(0, cursor);
      var newAfter = newText.slice(cursor);
      if (newBefore !== oldBefore) {
        break editAfter;
      }
      var suffixLength = Math.min(oldLength - cursor, newLength - cursor);
      var oldSuffix = oldAfter.slice(oldAfter.length - suffixLength);
      var newSuffix = newAfter.slice(newAfter.length - suffixLength);
      if (oldSuffix !== newSuffix) {
        break editAfter;
      }
      var oldMiddle = oldAfter.slice(0, oldAfter.length - suffixLength);
      var newMiddle = newAfter.slice(0, newAfter.length - suffixLength);
      return make_edit_splice(oldBefore, oldMiddle, newMiddle, oldSuffix);
    }
  }
  if (oldRange.length > 0 && newRange && newRange.length === 0) {
    replaceRange: {
      // see if diff could be a splice of the old selection range
      var oldPrefix = oldText.slice(0, oldRange.index);
      var oldSuffix = oldText.slice(oldRange.index + oldRange.length);
      var prefixLength = oldPrefix.length;
      var suffixLength = oldSuffix.length;
      if (newLength < prefixLength + suffixLength) {
        break replaceRange;
      }
      var newPrefix = newText.slice(0, prefixLength);
      var newSuffix = newText.slice(newLength - suffixLength);
      if (oldPrefix !== newPrefix || oldSuffix !== newSuffix) {
        break replaceRange;
      }
      var oldMiddle = oldText.slice(prefixLength, oldLength - suffixLength);
      var newMiddle = newText.slice(prefixLength, newLength - suffixLength);
      return make_edit_splice(oldPrefix, oldMiddle, newMiddle, oldSuffix);
    }
  }

  return null;
}

function diff(text1, text2, cursor_pos) {
  // only pass fix_unicode=true at the top level, not when diff_main is
  // recursively invoked
  return diff_main(text1, text2, cursor_pos, true);
}

diff.INSERT = DIFF_INSERT;
diff.DELETE = DIFF_DELETE;
diff.EQUAL = DIFF_EQUAL;

var diff_1 = diff;

const keyword$1 = utils.keyword;






const DEEP_EQUAL$4 = constants.DEEP_EQUAL;
const UNEQUAL$5 = constants.UNEQUAL;

function describe$4 (value) {
  return new StringValue(value)
}
var describe_1$4 = describe$4;

var deserialize$4 = describe$4;

const tag$4 = Symbol('StringValue');
var tag_1$4 = tag$4;

// TODO: Escape invisible characters (e.g. zero-width joiner, non-breaking space),
// ambiguous characters (other kinds of spaces, combining characters). Use
// http://graphemica.com/blocks/control-pictures where applicable.
function basicEscape (string) {
  return string.replace(/\\/g, '\\\\')
}

const CRLF_CONTROL_PICTURE = '\u240D\u240A';
const LF_CONTROL_PICTURE = '\u240A';
const CR_CONTROL_PICTURE = '\u240D';

const MATCH_CONTROL_PICTURES = new RegExp(`${CR_CONTROL_PICTURE}|${LF_CONTROL_PICTURE}|${CR_CONTROL_PICTURE}`, 'g');

function escapeLinebreak (string) {
  if (string === '\r\n') return CRLF_CONTROL_PICTURE
  if (string === '\n') return LF_CONTROL_PICTURE
  if (string === '\r') return CR_CONTROL_PICTURE
  return string
}

function themeControlPictures (theme, resetWrap, str) {
  return str.replace(MATCH_CONTROL_PICTURES, picture => {
    return resetWrap.close + formatUtils.wrap(theme.string.controlPicture, picture) + resetWrap.open
  })
}

const MATCH_SINGLE_QUOTE = /'/g;
const MATCH_DOUBLE_QUOTE = /"/g;
const MATCH_BACKTICKS = /`/g;
function escapeQuotes (line, string) {
  const quote = line.escapeQuote;
  if (quote === '\'') return string.replace(MATCH_SINGLE_QUOTE, "\\'")
  if (quote === '"') return string.replace(MATCH_DOUBLE_QUOTE, '\\"')
  if (quote === '`') return string.replace(MATCH_BACKTICKS, '\\`')
  return string
}

function includesLinebreaks (string) {
  return string.includes('\r') || string.includes('\n')
}

function diffLine (theme, actual, expected) {
  const outcome = diff_1(actual, expected);

  // TODO: Compute when line is mostly unequal (80%? 90%?) and treat it as being
  // completely unequal.
  const isPartiallyEqual = !(
    (outcome.length === 2 && outcome[0][1] === actual && outcome[1][1] === expected) ||
    // Discount line ending control pictures, which will be equal even when the
    // rest of the line isn't.
    (
      outcome.length === 3 &&
      outcome[2][0] === diff_1.EQUAL &&
      MATCH_CONTROL_PICTURES.test(outcome[2][1]) &&
      outcome[0][1] + outcome[2][1] === actual &&
      outcome[1][1] + outcome[2][1] === expected
    )
  );

  let stringActual = '';
  let stringExpected = '';

  const noopWrap = { open: '', close: '' };
  const deleteWrap = isPartiallyEqual ? theme.string.diff.delete : noopWrap;
  const insertWrap = isPartiallyEqual ? theme.string.diff.insert : noopWrap;
  const equalWrap = isPartiallyEqual ? theme.string.diff.equal : noopWrap;
  for (const diff of outcome) {
    if (diff[0] === diff_1.DELETE) {
      stringActual += formatUtils.wrap(deleteWrap, diff[1]);
    } else if (diff[0] === diff_1.INSERT) {
      stringExpected += formatUtils.wrap(insertWrap, diff[1]);
    } else {
      const string = formatUtils.wrap(equalWrap, themeControlPictures(theme, equalWrap, diff[1]));
      stringActual += string;
      stringExpected += string;
    }
  }

  if (!isPartiallyEqual) {
    stringActual = formatUtils.wrap(theme.string.diff.deleteLine, stringActual);
    stringExpected = formatUtils.wrap(theme.string.diff.insertLine, stringExpected);
  }

  return [stringActual, stringExpected]
}

const LINEBREAKS = /\r\n|\r|\n/g;

function gatherLines (string) {
  const lines = [];
  let prevIndex = 0;
  for (let match; (match = LINEBREAKS.exec(string)); prevIndex = match.index + match[0].length) {
    lines.push(string.slice(prevIndex, match.index) + escapeLinebreak(match[0]));
  }
  lines.push(string.slice(prevIndex));
  return lines
}

class StringValue {
  constructor (value) {
    this.value = value;
  }

  compare (expected) {
    return expected.tag === tag$4 && this.value === expected.value
      ? DEEP_EQUAL$4
      : UNEQUAL$5
  }

  get includesLinebreaks () {
    return includesLinebreaks(this.value)
  }

  formatDeep (theme, indent) {
    // Escape backslashes
    let escaped = basicEscape(this.value);

    if (!this.includesLinebreaks) {
      escaped = escapeQuotes(theme.string.line, escaped);
      return lineBuilder.single(formatUtils.wrap(theme.string.line, formatUtils.wrap(theme.string, escaped)))
    }

    escaped = escapeQuotes(theme.string.multiline, escaped);
    const lineStrings = gatherLines(escaped).map(string => {
      return formatUtils.wrap(theme.string, themeControlPictures(theme, theme.string, string))
    });
    const lastIndex = lineStrings.length - 1;
    const indentation = indent;
    return lineBuilder.buffer()
      .append(
        lineStrings.map((string, index) => {
          if (index === 0) return lineBuilder.first(theme.string.multiline.start + string)
          if (index === lastIndex) return lineBuilder.last(indentation + string + theme.string.multiline.end)
          return lineBuilder.line(indentation + string)
        }))
  }

  formatAsKey (theme) {
    const key = this.value;
    if (keyword$1.isIdentifierNameES6(key, true) || String(parseInt(key, 10)) === key) {
      return key
    }

    const escaped = basicEscape(key)
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/'/g, "\\'");
    return formatUtils.wrap(theme.string.line, formatUtils.wrap(theme.string, escaped))
  }

  diffDeep (expected, theme, indent) {
    if (expected.tag !== tag$4) return null

    const escapedActual = basicEscape(this.value);
    const escapedExpected = basicEscape(expected.value);

    if (!includesLinebreaks(escapedActual) && !includesLinebreaks(escapedExpected)) {
      const result = diffLine(theme,
        escapeQuotes(theme.string.line, escapedActual),
        escapeQuotes(theme.string.line, escapedExpected));

      return lineBuilder.actual.single(formatUtils.wrap(theme.string.line, result[0]))
        .concat(lineBuilder.expected.single(formatUtils.wrap(theme.string.line, result[1])))
    }

    const actualLines = gatherLines(escapeQuotes(theme.string.multiline, escapedActual));
    const expectedLines = gatherLines(escapeQuotes(theme.string.multiline, escapedExpected));

    const indentation = indent;
    const lines = lineBuilder.buffer();
    const lastActualIndex = actualLines.length - 1;
    const lastExpectedIndex = expectedLines.length - 1;

    let actualBuffer = [];
    let expectedBuffer = [];
    let mustOpenNextExpected = false;
    for (let actualIndex = 0, expectedIndex = 0, extraneousOffset = 0; actualIndex < actualLines.length;) {
      if (actualLines[actualIndex] === expectedLines[expectedIndex]) {
        lines.append(actualBuffer);
        lines.append(expectedBuffer);
        actualBuffer = [];
        expectedBuffer = [];

        let string = actualLines[actualIndex];
        string = themeControlPictures(theme, theme.string.diff.equal, string);
        string = formatUtils.wrap(theme.string.diff.equal, string);

        if (actualIndex === 0) {
          lines.append(lineBuilder.first(theme.string.multiline.start + string));
        } else if (actualIndex === lastActualIndex && expectedIndex === lastExpectedIndex) {
          lines.append(lineBuilder.last(indentation + string + theme.string.multiline.end));
        } else {
          lines.append(lineBuilder.line(indentation + string));
        }

        actualIndex++;
        expectedIndex++;
        continue
      }

      let expectedIsMissing = false;
      {
        const compare = actualLines[actualIndex];
        for (let index = expectedIndex; !expectedIsMissing && index < expectedLines.length; index++) {
          expectedIsMissing = compare === expectedLines[index];
        }
      }

      let actualIsExtraneous = (actualIndex - extraneousOffset) > lastExpectedIndex || expectedIndex > lastExpectedIndex;
      if (!actualIsExtraneous) {
        const compare = expectedLines[expectedIndex];
        for (let index = actualIndex; !actualIsExtraneous && index < actualLines.length; index++) {
          actualIsExtraneous = compare === actualLines[index];
        }

        if (!actualIsExtraneous && (actualIndex - extraneousOffset) === lastExpectedIndex && actualIndex < lastActualIndex) {
          actualIsExtraneous = true;
        }
      }

      if (actualIsExtraneous && !expectedIsMissing) {
        const string = formatUtils.wrap(theme.string.diff.deleteLine, actualLines[actualIndex]);

        if (actualIndex === 0) {
          actualBuffer.push(lineBuilder.actual.first(theme.string.multiline.start + string));
          mustOpenNextExpected = true;
        } else if (actualIndex === lastActualIndex) {
          actualBuffer.push(lineBuilder.actual.last(indentation + string + theme.string.multiline.end));
        } else {
          actualBuffer.push(lineBuilder.actual.line(indentation + string));
        }

        actualIndex++;
        extraneousOffset++;
      } else if (expectedIsMissing && !actualIsExtraneous) {
        const string = formatUtils.wrap(theme.string.diff.insertLine, expectedLines[expectedIndex]);

        if (mustOpenNextExpected) {
          expectedBuffer.push(lineBuilder.expected.first(theme.string.multiline.start + string));
          mustOpenNextExpected = false;
        } else if (expectedIndex === lastExpectedIndex) {
          expectedBuffer.push(lineBuilder.expected.last(indentation + string + theme.string.multiline.end));
        } else {
          expectedBuffer.push(lineBuilder.expected.line(indentation + string));
        }

        expectedIndex++;
      } else {
        const result = diffLine(theme, actualLines[actualIndex], expectedLines[expectedIndex]);

        if (actualIndex === 0) {
          actualBuffer.push(lineBuilder.actual.first(theme.string.multiline.start + result[0]));
          mustOpenNextExpected = true;
        } else if (actualIndex === lastActualIndex) {
          actualBuffer.push(lineBuilder.actual.last(indentation + result[0] + theme.string.multiline.end));
        } else {
          actualBuffer.push(lineBuilder.actual.line(indentation + result[0]));
        }

        if (mustOpenNextExpected) {
          expectedBuffer.push(lineBuilder.expected.first(theme.string.multiline.start + result[1]));
          mustOpenNextExpected = false;
        } else if (expectedIndex === lastExpectedIndex) {
          expectedBuffer.push(lineBuilder.expected.last(indentation + result[1] + theme.string.multiline.end));
        } else {
          expectedBuffer.push(lineBuilder.expected.line(indentation + result[1]));
        }

        actualIndex++;
        expectedIndex++;
      }
    }

    lines.append(actualBuffer);
    lines.append(expectedBuffer);
    return lines
  }

  serialize () {
    return this.value
  }
}
Object.defineProperty(StringValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(StringValue.prototype, 'tag', { value: tag$4 });

var string = {
	describe: describe_1$4,
	deserialize: deserialize$4,
	tag: tag_1$4
};

const stringPrimitive = string.tag;



function describe$5 (props) {
  return new DescribedBoxedValue(props)
}
var describe_1$5 = describe$5;

function deserialize$5 (state, recursor) {
  return new DeserializedBoxedValue(state, recursor)
}
var deserialize_1$4 = deserialize$5;

const tag$5 = Symbol('BoxedValue');
var tag_1$5 = tag$5;

class BoxedValue extends object.ObjectValue {}
Object.defineProperty(BoxedValue.prototype, 'tag', { value: tag$5 });

class DescribedBoxedValue extends object.DescribedMixin(BoxedValue) {
  constructor (props) {
    super(props);
    this.unboxed = props.unboxed;
  }

  createListRecursor () {
    return recursorUtils.NOOP_RECURSOR
  }

  createPropertyRecursor () {
    if (this.unboxed.tag !== stringPrimitive) return super.createPropertyRecursor()

    // Just so that createPropertyRecursor() skips the index-based character
    // properties.
    try {
      this.isList = true;
      return super.createPropertyRecursor()
    } finally {
      this.isList = false;
    }
  }

  createRecursor () {
    return recursorUtils.unshift(super.createRecursor(), this.unboxed)
  }
}

const DeserializedBoxedValue = object.DeserializedMixin(BoxedValue);

var boxed = {
	describe: describe_1$5,
	deserialize: deserialize_1$4,
	tag: tag_1$5
};

function describe$6 (props) {
  return new DescribedDataViewValue(Object.assign({
    buffer: typedArray.getBuffer(props.value),
    // Set isArray and isList so the property recursor excludes the byte accessors
    isArray: true,
    isList: true,
  }, props))
}
var describe_1$6 = describe$6;

function deserialize$6 (state, recursor) {
  return new DeserializedDataViewValue(state, recursor)
}
var deserialize_1$5 = deserialize$6;

const tag$6 = Symbol('DataViewValue');
var tag_1$6 = tag$6;

// DataViews can be represented as regular Buffers, allowing them to be treated
// as TypedArrays for the purposes of this package.
class DataViewValue extends typedArray.TypedArrayValue {}
Object.defineProperty(DataViewValue.prototype, 'tag', { value: tag$6 });

const DescribedDataViewValue = typedArray.DescribedMixin(DataViewValue);
const DeserializedDataViewValue = typedArray.DeserializedMixin(DataViewValue);

var dataView = {
	describe: describe_1$6,
	deserialize: deserialize_1$5,
	tag: tag_1$6
};

var timeZone = date => {
	const offset = (date || new Date()).getTimezoneOffset();
	const absOffset = Math.abs(offset);
	const hours = Math.floor(absOffset / 60);
	const minutes = absOffset % 60;
	const minutesOut = minutes > 0 ? ':' + ('0' + minutes).slice(-2) : '';

	return (offset < 0 ? '+' : '-') + hours + minutesOut;
};

const dateTime = options => {
	options = Object.assign({
		date: new Date(),
		local: true,
		showTimeZone: false,
		showMilliseconds: false
	}, options);

	let {date} = options;

	if (options.local) {
		// Offset the date so it will return the correct value when getting the ISO string
		date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
	}

	let end = '';

	if (options.showTimeZone) {
		end = ' UTC' + (options.local ? timeZone(date) : '');
	}

	if (options.showMilliseconds && date.getUTCMilliseconds() > 0) {
		end = ` ${date.getUTCMilliseconds()}ms${end}`;
	}

	return date
		.toISOString()
		.replace(/T/, ' ')
		.replace(/\..+/, end);
};

var dateTime_1 = dateTime;
// TODO: Remove this for the next major release
var _default = dateTime;
dateTime_1.default = _default;

const SHALLOW_EQUAL$2 = constants.SHALLOW_EQUAL;
const UNEQUAL$6 = constants.UNEQUAL;

function describe$7 (props) {
  const date = props.value;
  const invalid = isNaN(date.valueOf());
  return new DescribedDateValue(Object.assign({}, props, { invalid }))
}
var describe_1$7 = describe$7;

function deserialize$7 (state, recursor) {
  return new DeserializedDateValue(state, recursor)
}
var deserialize_1$6 = deserialize$7;

const tag$7 = Symbol('DateValue');
var tag_1$7 = tag$7;

function formatDate (date) {
  // Always format in UTC. The local timezone shouldn't be used since it's most
  // likely different from that of CI servers.
  return dateTime_1({
    date,
    local: false,
    showTimeZone: true,
    showMilliseconds: true,
  })
}

class DateValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.invalid = props.invalid;
  }

  compare (expected) {
    const result = super.compare(expected);
    if (result !== SHALLOW_EQUAL$2) return result

    return (this.invalid && expected.invalid) || Object.is(this.value.getTime(), expected.value.getTime())
      ? SHALLOW_EQUAL$2
      : UNEQUAL$6
  }

  formatShallow (theme, indent) {
    const string = formatUtils.formatCtorAndStringTag(theme, this) + ' ' +
      (this.invalid ? theme.date.invalid : formatUtils.wrap(theme.date.value, formatDate(this.value))) + ' ' +
      theme.object.openBracket;

    return super.formatShallow(theme, indent).customize({
      finalize (innerLines) {
        return innerLines.isEmpty
          ? lineBuilder.single(string + theme.object.closeBracket)
          : lineBuilder.first(string)
            .concat(innerLines.withFirstPrefixed(indent.increase()).stripFlags())
            .append(lineBuilder.last(indent + theme.object.closeBracket))
      },

      maxDepth () {
        return lineBuilder.single(string + ' ' + theme.maxDepth + ' ' + theme.object.closeBracket)
      },
    })
  }

  serialize () {
    const iso = this.invalid ? null : this.value.toISOString();
    return [this.invalid, iso, super.serialize()]
  }
}
Object.defineProperty(DateValue.prototype, 'tag', { value: tag$7 });

const DescribedDateValue = object.DescribedMixin(DateValue);

class DeserializedDateValue extends object.DeserializedMixin(DateValue) {
  constructor (state, recursor) {
    super(state[2], recursor);
    this.invalid = state[0];
    this.value = new Date(this.invalid ? NaN : state[1]);
  }
}

var date = {
	describe: describe_1$7,
	deserialize: deserialize_1$6,
	tag: tag_1$7
};

function isEnumerable (obj, key) {
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc && desc.enumerable
}
var isEnumerable_1 = isEnumerable;

const NOOP_RECURSOR$1 = recursorUtils.NOOP_RECURSOR;


const UNEQUAL$7 = constants.UNEQUAL;

function describe$8 (props) {
  const error = props.value;
  return new DescribedErrorValue(Object.assign({
    nameIsEnumerable: isEnumerable_1(error, 'name'),
    name: error.name,
    messageIsEnumerable: isEnumerable_1(error, 'message'),
    message: error.message,
  }, props))
}
var describe_1$8 = describe$8;

function deserialize$8 (state, recursor) {
  return new DeserializedErrorValue(state, recursor)
}
var deserialize_1$7 = deserialize$8;

const tag$8 = Symbol('ErrorValue');
var tag_1$8 = tag$8;

class ErrorValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.name = props.name;
  }

  compare (expected) {
    return this.tag === expected.tag && this.name === expected.name
      ? super.compare(expected)
      : UNEQUAL$7
  }

  formatShallow (theme, indent) {
    const name = this.name || this.ctor;

    let string = name
      ? formatUtils.wrap(theme.error.name, name)
      : formatUtils.wrap(theme.object.stringTag, this.stringTag);
    if (this.ctor && this.ctor !== name) {
      string += ' ' + formatUtils.wrap(theme.error.ctor, this.ctor);
    }
    if (this.stringTag && this.stringTag !== this.ctor && this.name && !this.name.includes(this.stringTag)) {
      string += ' ' + formatUtils.wrap(theme.object.secondaryStringTag, this.stringTag);
    }
    string += ' ' + theme.object.openBracket;

    return super.formatShallow(theme, indent).customize({
      finalize (innerLines) {
        return innerLines.isEmpty
          ? lineBuilder.single(string + theme.object.closeBracket)
          : lineBuilder.first(string)
            .concat(innerLines.withFirstPrefixed(indent.increase()).stripFlags())
            .append(lineBuilder.last(indent + theme.object.closeBracket))
      },

      maxDepth () {
        return lineBuilder.single(string + ' ' + theme.maxDepth + ' ' + theme.object.closeBracket)
      },
    })
  }

  serialize () {
    return [this.name, super.serialize()]
  }
}
Object.defineProperty(ErrorValue.prototype, 'tag', { value: tag$8 });

class DescribedErrorValue extends object.DescribedMixin(ErrorValue) {
  constructor (props) {
    super(props);
    this.nameIsEnumerable = props.nameIsEnumerable;
    this.messageIsEnumerable = props.messageIsEnumerable;
    this.message = props.message;
  }

  createPropertyRecursor () {
    const recursor = super.createPropertyRecursor();

    let skipName = this.nameIsEnumerable;
    let emitMessage = !this.messageIsEnumerable;

    let size = recursor.size;
    if (skipName && size > 0) {
      size -= 1;
    }
    if (emitMessage) {
      size += 1;
    }

    if (size === 0) return NOOP_RECURSOR$1

    let done = false;
    const next = () => {
      if (done) return null

      const property = recursor.next();
      if (property) {
        if (skipName && property.key.value === 'name') {
          skipName = false;
          return next()
        }
        return property
      }

      if (emitMessage) {
        emitMessage = false;
        return this.describeProperty('message', this.describeAny(this.message))
      }

      done = true;
      return null
    };

    return { size, next }
  }
}

class DeserializedErrorValue extends object.DeserializedMixin(ErrorValue) {
  constructor (state, recursor) {
    super(state[1], recursor);
    this.name = state[0];
  }
}

var error = {
	describe: describe_1$8,
	deserialize: deserialize_1$7,
	tag: tag_1$8
};

const NOOP_RECURSOR$2 = recursorUtils.NOOP_RECURSOR;


const UNEQUAL$8 = constants.UNEQUAL;
const SHALLOW_EQUAL$3 = constants.SHALLOW_EQUAL;

function describe$9 (props) {
  const fn = props.value;
  return new DescribedFunctionValue(Object.assign({
    nameIsEnumerable: isEnumerable_1(fn, 'name'),
    name: typeof fn.name === 'string' ? fn.name : null,
  }, props))
}
var describe_1$9 = describe$9;

function deserialize$9 (state, recursor) {
  return new DeserializedFunctionValue(state, recursor)
}
var deserialize_1$8 = deserialize$9;

const tag$9 = Symbol('FunctionValue');
var tag_1$9 = tag$9;

class FunctionValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.name = props.name;
  }

  formatShallow (theme, indent) {
    const string = formatUtils.wrap(theme.function.stringTag, this.stringTag) +
      (this.name ? ' ' + formatUtils.wrap(theme.function.name, this.name) : '') +
      ' ' + theme.object.openBracket;

    return super.formatShallow(theme, indent).customize({
      finalize (innerLines) {
        return innerLines.isEmpty
          ? lineBuilder.single(string + theme.object.closeBracket)
          : lineBuilder.first(string)
            .concat(innerLines.withFirstPrefixed(indent.increase()).stripFlags())
            .append(lineBuilder.last(indent + theme.object.closeBracket))
      },

      maxDepth () {
        return lineBuilder.single(string + ' ' + theme.maxDepth + ' ' + theme.object.closeBracket)
      },
    })
  }
}
Object.defineProperty(FunctionValue.prototype, 'tag', { value: tag$9 });

class DescribedFunctionValue extends object.DescribedMixin(FunctionValue) {
  constructor (props) {
    super(props);
    this.nameIsEnumerable = props.nameIsEnumerable;
  }

  compare (expected) {
    if (this.tag !== expected.tag) return UNEQUAL$8
    if (this.name !== expected.name) return UNEQUAL$8
    if (this.value && expected.value && this.value !== expected.value) return UNEQUAL$8

    return super.compare(expected)
  }

  createPropertyRecursor () {
    const recursor = super.createPropertyRecursor();

    const skipName = this.nameIsEnumerable;
    if (!skipName) return recursor

    let size = recursor.size;
    if (skipName) {
      size -= 1;
    }

    if (size === 0) return NOOP_RECURSOR$2

    const next = () => {
      const property = recursor.next();
      if (property) {
        if (skipName && property.key.value === 'name') {
          return next()
        }
        return property
      }

      return null
    };

    return { size, next }
  }

  serialize () {
    return [this.name, super.serialize()]
  }
}

class DeserializedFunctionValue extends object.DeserializedMixin(FunctionValue) {
  constructor (state, recursor) {
    super(state[1], recursor);
    this.name = state[0];
  }

  compare (expected) {
    if (this.tag !== expected.tag) return UNEQUAL$8
    if (this.name !== expected.name) return UNEQUAL$8
    if (this.stringTag !== expected.stringTag) return UNEQUAL$8

    return SHALLOW_EQUAL$3
  }

  serialize () {
    return [this.name, super.serialize()]
  }
}

var _function = {
	describe: describe_1$9,
	deserialize: deserialize_1$8,
	tag: tag_1$9
};

const DEEP_EQUAL$5 = constants.DEEP_EQUAL;
const UNEQUAL$9 = constants.UNEQUAL;

function describe$a () {
  return new GlobalValue()
}
var describe_1$a = describe$a;

var deserialize$a = describe$a;

const tag$a = Symbol('GlobalValue');
var tag_1$a = tag$a;

class GlobalValue {
  compare (expected) {
    return this.tag === expected.tag
      ? DEEP_EQUAL$5
      : UNEQUAL$9
  }

  formatDeep (theme) {
    return lineBuilder.single(
      formatUtils.wrap(theme.global, 'Global') + ' ' + theme.object.openBracket + theme.object.closeBracket)
  }
}
Object.defineProperty(GlobalValue.prototype, 'isComplex', { value: true });
Object.defineProperty(GlobalValue.prototype, 'tag', { value: tag$a });

var global$1 = {
	describe: describe_1$a,
	deserialize: deserialize$a,
	tag: tag_1$a
};

const SHALLOW_EQUAL$4 = constants.SHALLOW_EQUAL;
const UNEQUAL$a = constants.UNEQUAL;

function describe$b (props) {
  return new DescribedMapValue(Object.assign({
    size: props.value.size,
  }, props))
}
var describe_1$b = describe$b;

function deserialize$b (state, recursor) {
  return new DeserializedMapValue(state, recursor)
}
var deserialize_1$9 = deserialize$b;

const tag$b = Symbol('MapValue');
var tag_1$b = tag$b;

class MapValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.size = props.size;
  }

  compare (expected) {
    const result = super.compare(expected);
    if (result !== SHALLOW_EQUAL$4) return result

    return this.size === expected.size
      ? SHALLOW_EQUAL$4
      : UNEQUAL$a
  }

  prepareDiff (expected) {
    // Maps should be compared, even if they have a different number of entries.
    return { compareResult: super.compare(expected) }
  }

  serialize () {
    return [this.size, super.serialize()]
  }
}
Object.defineProperty(MapValue.prototype, 'tag', { value: tag$b });

class DescribedMapValue extends object.DescribedMixin(MapValue) {
  createIterableRecursor () {
    const size = this.size;
    if (size === 0) return recursorUtils.NOOP_RECURSOR

    let index = 0;
    let entries;
    const next = () => {
      if (index === size) return null

      if (!entries) {
        entries = Array.from(this.value);
      }

      const entry = entries[index++];
      return this.describeMapEntry(this.describeAny(entry[0]), this.describeAny(entry[1]))
    };

    return { size, next }
  }
}

class DeserializedMapValue extends object.DeserializedMixin(MapValue) {
  constructor (state, recursor) {
    super(state[1], recursor);
    this.size = state[0];
  }
}

var map$1 = {
	describe: describe_1$b,
	deserialize: deserialize_1$9,
	tag: tag_1$b
};

const DEEP_EQUAL$6 = constants.DEEP_EQUAL;
const UNEQUAL$b = constants.UNEQUAL;

function describe$c (props) {
  return new DescribedPromiseValue(props)
}
var describe_1$c = describe$c;

function deserialize$c (props) {
  return new DeserializedPromiseValue(props)
}
var deserialize_1$a = deserialize$c;

const tag$c = Symbol('PromiseValue');
var tag_1$c = tag$c;

class PromiseValue extends object.ObjectValue {}
Object.defineProperty(PromiseValue.prototype, 'tag', { value: tag$c });

class DescribedPromiseValue extends object.DescribedMixin(PromiseValue) {
  compare (expected) {
    // When comparing described promises, require them to be the exact same
    // object.
    return super.compare(expected) === DEEP_EQUAL$6
      ? DEEP_EQUAL$6
      : UNEQUAL$b
  }
}

class DeserializedPromiseValue extends object.DeserializedMixin(PromiseValue) {
  compare (expected) {
    // Deserialized promises can never be compared using object references.
    return super.compare(expected)
  }
}

var promise = {
	describe: describe_1$c,
	deserialize: deserialize_1$a,
	tag: tag_1$c
};

const UNEQUAL$c = constants.UNEQUAL;

function describe$d (props) {
  const regexp = props.value;
  return new DescribedRegexpValue(Object.assign({
    flags: getSortedFlags(regexp),
    source: regexp.source,
  }, props))
}
var describe_1$d = describe$d;

function deserialize$d (state, recursor) {
  return new DeserializedRegexpValue(state, recursor)
}
var deserialize_1$b = deserialize$d;

const tag$d = Symbol('RegexpValue');
var tag_1$d = tag$d;

function getSortedFlags (regexp) {
  const flags = regexp.flags || String(regexp).slice(regexp.source.length + 2);
  return flags.split('').sort().join('')
}

class RegexpValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.flags = props.flags;
    this.source = props.source;
  }

  compare (expected) {
    return this.tag === expected.tag && this.flags === expected.flags && this.source === expected.source
      ? super.compare(expected)
      : UNEQUAL$c
  }

  formatShallow (theme, indent) {
    const ctor = this.ctor || this.stringTag;
    const regexp = formatUtils.wrap(theme.regexp.source, this.source) + formatUtils.wrap(theme.regexp.flags, this.flags);

    return super.formatShallow(theme, indent).customize({
      finalize: innerLines => {
        if (ctor === 'RegExp' && innerLines.isEmpty) return lineBuilder.single(regexp)

        const innerIndentation = indent.increase();
        const header = lineBuilder.first(formatUtils.formatCtorAndStringTag(theme, this) + ' ' + theme.object.openBracket)
          .concat(lineBuilder.line(innerIndentation + regexp));

        if (!innerLines.isEmpty) {
          header.append(lineBuilder.line(innerIndentation + theme.regexp.separator));
          header.append(innerLines.withFirstPrefixed(innerIndentation).stripFlags());
        }

        return header.append(lineBuilder.last(indent + theme.object.closeBracket))
      },

      maxDepth: () => {
        return lineBuilder.single(
          formatUtils.formatCtorAndStringTag(theme, this) + ' ' +
          theme.object.openBracket + ' ' +
          regexp + ' ' +
          theme.maxDepth + ' ' +
          theme.object.closeBracket)
      },
    })
  }

  serialize () {
    return [this.flags, this.source, super.serialize()]
  }
}
Object.defineProperty(RegexpValue.prototype, 'tag', { value: tag$d });

const DescribedRegexpValue = object.DescribedMixin(RegexpValue);

class DeserializedRegexpValue extends object.DeserializedMixin(RegexpValue) {
  constructor (state, recursor) {
    super(state[2], recursor);
    this.flags = state[0];
    this.source = state[1];
  }
}

var regexp = {
	describe: describe_1$d,
	deserialize: deserialize_1$b,
	tag: tag_1$d
};

const SHALLOW_EQUAL$5 = constants.SHALLOW_EQUAL;
const UNEQUAL$d = constants.UNEQUAL;

function describe$e (props) {
  return new DescribedSetValue(Object.assign({
    size: props.value.size,
  }, props))
}
var describe_1$e = describe$e;

function deserialize$e (state, recursor) {
  return new DeserializedSetValue(state, recursor)
}
var deserialize_1$c = deserialize$e;

const tag$e = Symbol('SetValue');
var tag_1$e = tag$e;

class SetValue extends object.ObjectValue {
  constructor (props) {
    super(props);
    this.size = props.size;
  }

  compare (expected) {
    const result = super.compare(expected);
    if (result !== SHALLOW_EQUAL$5) return result

    return this.size === expected.size
      ? SHALLOW_EQUAL$5
      : UNEQUAL$d
  }

  prepareDiff (expected) {
    // Sets should be compared, even if they have a different number of items.
    return { compareResult: super.compare(expected) }
  }

  serialize () {
    return [this.size, super.serialize()]
  }
}
Object.defineProperty(SetValue.prototype, 'tag', { value: tag$e });

class DescribedSetValue extends object.DescribedMixin(SetValue) {
  createIterableRecursor () {
    const size = this.size;
    if (size === 0) return recursorUtils.NOOP_RECURSOR

    let index = 0;
    let members;
    const next = () => {
      if (index === size) return null

      if (!members) {
        members = Array.from(this.value);
      }

      const value = members[index];
      return this.describeItem(index++, this.describeAny(value))
    };

    return { size, next }
  }
}

class DeserializedSetValue extends object.DeserializedMixin(SetValue) {
  constructor (state, recursor) {
    super(state[1], recursor);
    this.size = state[0];
  }
}

var set = {
	describe: describe_1$e,
	deserialize: deserialize_1$c,
	tag: tag_1$e
};

var getStringTag_1 = createCommonjsModule(function (module) {

const ts = Object.prototype.toString;
function getStringTag (value) {
  return ts.call(value).slice(8, -1)
}

const fts = Function.prototype.toString;
const promiseCtorString = fts.call(Promise);
const isPromise = value => {
  if (!value.constructor) return false

  try {
    return fts.call(value.constructor) === promiseCtorString
  } catch {
    return false
  }
};

if (getStringTag(Promise.resolve()) === 'Promise') {
  module.exports = getStringTag;
} else {
  const getStringTagWithPromiseWorkaround = value => {
    const stringTag = getStringTag(value);
    return stringTag === 'Object' && isPromise(value)
      ? 'Promise'
      : stringTag
  };
  module.exports = getStringTagWithPromiseWorkaround;
}
});

const DEEP_EQUAL$7 = constants.DEEP_EQUAL;
const UNEQUAL$e = constants.UNEQUAL;

function describeComplex (index, value) {
  return new ComplexItem(index, value)
}
var describeComplex_1 = describeComplex;

function deserializeComplex (index, recursor) {
  const value = recursor();
  return new ComplexItem(index, value)
}
var deserializeComplex_1 = deserializeComplex;

function describePrimitive (index, value) {
  return new PrimitiveItem(index, value)
}
var describePrimitive_1 = describePrimitive;

function deserializePrimitive (state) {
  const index = state[0];
  const value = state[1];
  return new PrimitiveItem(index, value)
}
var deserializePrimitive_1 = deserializePrimitive;

const complexTag = Symbol('ComplexItem');
var complexTag_1 = complexTag;

const primitiveTag = Symbol('PrimitiveItem');
var primitiveTag_1 = primitiveTag;

class ComplexItem {
  constructor (index, value) {
    this.index = index;
    this.value = value;
  }

  createRecursor () {
    return recursorUtils.singleValue(this.value)
  }

  compare (expected) {
    return expected.tag === complexTag && this.index === expected.index
      ? this.value.compare(expected.value)
      : UNEQUAL$e
  }

  formatShallow (theme, indent) {
    const increaseValueIndent = theme.item.increaseValueIndent === true;
    return new formatUtils.SingleValueFormatter(theme, value => {
      if (typeof theme.item.customFormat === 'function') {
        return theme.item.customFormat(theme, indent, value)
      }

      return value.withLastPostfixed(theme.item.after)
    }, increaseValueIndent)
  }

  prepareDiff (expected, lhsRecursor, rhsRecursor, compareComplexShape, isCircular) {
    // Circular values cannot be compared. They must be treated as being unequal when diffing.
    if (isCircular(this.value) || isCircular(expected.value)) return { compareResult: UNEQUAL$e }

    // Try to line up this or remaining items with the expected items.
    const lhsFork = recursorUtils.fork(lhsRecursor);
    const rhsFork = recursorUtils.fork(rhsRecursor);
    const initialExpected = expected;

    let expectedIsMissing = false;
    while (!expectedIsMissing && expected !== null && expected.isItem === true) {
      if (expected.tag === complexTag) {
        expectedIsMissing = compareComplexShape(this.value, expected.value) !== UNEQUAL$e;
      }

      expected = rhsFork.shared();
    }

    let actualIsExtraneous = false;
    if (initialExpected.tag === complexTag) {
      let actual = this;
      while (!actualIsExtraneous && actual !== null && actual.isItem === true) {
        if (actual.tag === complexTag) {
          actualIsExtraneous = compareComplexShape(actual.value, initialExpected.value) !== UNEQUAL$e;
        }

        actual = lhsFork.shared();
      }
    } else if (initialExpected.tag === primitiveTag) {
      let actual = this;
      while (!actualIsExtraneous && actual !== null && actual.isItem === true) {
        if (actual.tag === primitiveTag) {
          actualIsExtraneous = initialExpected.value.compare(actual.value) === DEEP_EQUAL$7;
        }

        actual = lhsFork.shared();
      }
    }

    if (actualIsExtraneous && !expectedIsMissing) {
      return {
        actualIsExtraneous: true,
        lhsRecursor: lhsFork.recursor,
        rhsRecursor: recursorUtils.map(
          recursorUtils.unshift(rhsFork.recursor, initialExpected),
          next => {
            if (next.isItem !== true) return next

            next.index++;
            return next
          }),
      }
    }

    if (expectedIsMissing && !actualIsExtraneous) {
      return {
        expectedIsMissing: true,
        lhsRecursor: recursorUtils.map(
          recursorUtils.unshift(lhsFork.recursor, this),
          next => {
            if (next.isItem !== true) return next

            next.index++;
            return next
          }),
        rhsRecursor: rhsFork.recursor,
      }
    }

    const mustRecurse = this.tag === complexTag && initialExpected.tag === complexTag &&
      this.value.compare(initialExpected.value) !== UNEQUAL$e;
    return {
      mustRecurse,
      isUnequal: !mustRecurse,
      lhsRecursor: lhsFork.recursor,
      rhsRecursor: rhsFork.recursor,
    }
  }

  serialize () {
    return this.index
  }
}
Object.defineProperty(ComplexItem.prototype, 'isItem', { value: true });
Object.defineProperty(ComplexItem.prototype, 'tag', { value: complexTag });

class PrimitiveItem {
  constructor (index, value) {
    this.index = index;
    this.value = value;
  }

  compare (expected) {
    return expected.tag === primitiveTag && this.index === expected.index
      ? this.value.compare(expected.value)
      : UNEQUAL$e
  }

  formatDeep (theme, indent) {
    const increaseValueIndent = theme.item.increaseValueIndent === true;
    const valueIndent = increaseValueIndent ? indent.increase() : indent;

    // Since the value is formatted directly, modifiers are not applied. Apply
    // modifiers to the item descriptor instead.
    const formatted = this.value.formatDeep(theme, valueIndent);

    if (typeof theme.item.customFormat === 'function') {
      return theme.item.customFormat(theme, indent, formatted)
    }

    return formatted.withLastPostfixed(theme.item.after)
  }

  prepareDiff (expected, lhsRecursor, rhsRecursor, compareComplexShape, isCircular) {
    const compareResult = this.compare(expected);
    // Short-circuit when values are deeply equal.
    if (compareResult === DEEP_EQUAL$7) return { compareResult }

    // Short-circut when values can be diffed directly.
    if (
      expected.tag === primitiveTag &&
      this.value.tag === expected.value.tag && typeof this.value.diffDeep === 'function'
    ) {
      return { compareResult }
    }

    // Try to line up this or remaining items with the expected items.
    const rhsFork = recursorUtils.fork(rhsRecursor);
    const initialExpected = expected;

    do {
      if (expected === null || expected.isItem !== true) {
        return {
          actualIsExtraneous: true,
          rhsRecursor: recursorUtils.map(
            recursorUtils.unshift(rhsFork.recursor, initialExpected),
            next => {
              if (next.isItem !== true) return next

              next.index++;
              return next
            }),
        }
      }

      if (this.value.compare(expected.value) === DEEP_EQUAL$7) {
        return {
          expectedIsMissing: true,
          lhsRecursor: recursorUtils.map(
            recursorUtils.unshift(lhsRecursor, this),
            next => {
              if (next.isItem !== true) return next

              next.index++;
              return next
            }),
          rhsRecursor: rhsFork.recursor,
        }
      }

      expected = rhsFork.shared();
    } while (true)
  }

  diffDeep (expected, theme, indent) {
    // Verify a diff can be returned.
    if (this.tag !== expected.tag || typeof this.value.diffDeep !== 'function') return null

    const increaseValueIndent = theme.property.increaseValueIndent === true;
    const valueIndent = increaseValueIndent ? indent.increase() : indent;

    // Since the value is diffed directly, modifiers are not applied. Apply
    // modifiers to the item descriptor instead.
    const diff = this.value.diffDeep(expected.value, theme, valueIndent);
    if (diff === null) return null

    if (typeof theme.item.customFormat === 'function') {
      return theme.item.customFormat(theme, indent, diff)
    }

    return diff.withLastPostfixed(theme.item.after)
  }

  serialize () {
    return [this.index, this.value]
  }
}
Object.defineProperty(PrimitiveItem.prototype, 'isItem', { value: true });
Object.defineProperty(PrimitiveItem.prototype, 'tag', { value: primitiveTag });

var item = {
	describeComplex: describeComplex_1,
	deserializeComplex: deserializeComplex_1,
	describePrimitive: describePrimitive_1,
	deserializePrimitive: deserializePrimitive_1,
	complexTag: complexTag_1,
	primitiveTag: primitiveTag_1
};

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

var _listCacheClear = listCacheClear;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

var eq_1 = eq;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq_1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

var _assocIndexOf = assocIndexOf;

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

var _listCacheDelete = listCacheDelete;

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

var _listCacheGet = listCacheGet;

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

var _listCacheHas = listCacheHas;

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

var _listCacheSet = listCacheSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;

var _ListCache = ListCache;

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new _ListCache;
  this.size = 0;
}

var _stackClear = stackClear;

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

var _stackDelete = stackDelete;

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

var _stackGet = stackGet;

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

var _stackHas = stackHas;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol$1 = _root.Symbol;

var _Symbol = Symbol$1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

/* Built-in method references that are verified to be native. */
var Map$1 = _getNative(_root, 'Map');

var _Map = Map$1;

/* Built-in method references that are verified to be native. */
var nativeCreate = _getNative(Object, 'create');

var _nativeCreate = nativeCreate;

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

var _hashClear = hashClear;

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

var _hashDelete = hashDelete;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
}

var _hashGet = hashGet;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
}

var _hashHas = hashHas;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
  return this;
}

var _hashSet = hashSet;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;

var _Hash = Hash;

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash,
    'map': new (_Map || _ListCache),
    'string': new _Hash
  };
}

var _mapCacheClear = mapCacheClear;

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

var _isKeyable = isKeyable;

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

var _getMapData = getMapData;

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

var _mapCacheDelete = mapCacheDelete;

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

var _mapCacheGet = mapCacheGet;

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

var _mapCacheHas = mapCacheHas;

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

var _mapCacheSet = mapCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;

var _MapCache = MapCache;

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof _ListCache) {
    var pairs = data.__data__;
    if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new _MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

var _stackSet = stackSet;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new _ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = _stackClear;
Stack.prototype['delete'] = _stackDelete;
Stack.prototype.get = _stackGet;
Stack.prototype.has = _stackHas;
Stack.prototype.set = _stackSet;

var _Stack = Stack;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

var _arrayEach = arrayEach;

var defineProperty = (function() {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

var _defineProperty = defineProperty;

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && _defineProperty) {
    _defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

var _baseAssignValue = baseAssignValue;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$4.call(object, key) && eq_1(objValue, value)) ||
      (value === undefined && !(key in object))) {
    _baseAssignValue(object, key, value);
  }
}

var _assignValue = assignValue;

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      _baseAssignValue(object, key, newValue);
    } else {
      _assignValue(object, key, newValue);
    }
  }
  return object;
}

var _copyObject = copyObject;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

var _baseTimes = baseTimes;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

var isArray_1 = isArray;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;

  return !!length &&
    (type == 'number' ||
      (type != 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length);
}

var _isIndex = isIndex;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag$1 = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$6.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           _isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$8;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$9 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$7.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && _copyObject(source, keys_1(source), object);
}

var _baseAssign = baseAssign;

/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

var _nativeKeysIn = nativeKeysIn;

/** Used for built-in method references. */
var objectProto$a = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject_1(object)) {
    return _nativeKeysIn(object);
  }
  var isProto = _isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty$8.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

var _baseKeysIn = baseKeysIn;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn$1(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object, true) : _baseKeysIn(object);
}

var keysIn_1 = keysIn$1;

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && _copyObject(source, keysIn_1(source), object);
}

var _baseAssignIn = baseAssignIn;

var _cloneBuffer = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;
});

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

var _copyArray = copyArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

var _arrayFilter = arrayFilter;

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

var stubArray_1 = stubArray;

/** Used for built-in method references. */
var objectProto$b = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$b.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return _arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable$1.call(object, symbol);
  });
};

var _getSymbols = getSymbols;

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return _copyObject(source, _getSymbols(source), object);
}

var _copySymbols = copySymbols;

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

var _arrayPush = arrayPush;

/** Built-in value references. */
var getPrototype = _overArg(Object.getPrototypeOf, Object);

var _getPrototype = getPrototype;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols$1 = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols$1 ? stubArray_1 : function(object) {
  var result = [];
  while (object) {
    _arrayPush(result, _getSymbols(object));
    object = _getPrototype(object);
  }
  return result;
};

var _getSymbolsIn = getSymbolsIn;

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return _copyObject(source, _getSymbolsIn(source), object);
}

var _copySymbolsIn = copySymbolsIn;

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
}

var _baseGetAllKeys = baseGetAllKeys;

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return _baseGetAllKeys(object, keys_1, _getSymbols);
}

var _getAllKeys = getAllKeys;

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return _baseGetAllKeys(object, keysIn_1, _getSymbolsIn);
}

var _getAllKeysIn = getAllKeysIn;

/* Built-in method references that are verified to be native. */
var DataView = _getNative(_root, 'DataView');

var _DataView = DataView;

/* Built-in method references that are verified to be native. */
var Promise$1 = _getNative(_root, 'Promise');

var _Promise = Promise$1;

/* Built-in method references that are verified to be native. */
var Set$1 = _getNative(_root, 'Set');

var _Set = Set$1;

/* Built-in method references that are verified to be native. */
var WeakMap$1 = _getNative(_root, 'WeakMap');

var _WeakMap = WeakMap$1;

/** `Object#toString` result references. */
var mapTag$1 = '[object Map]',
    objectTag$1 = '[object Object]',
    promiseTag = '[object Promise]',
    setTag$1 = '[object Set]',
    weakMapTag$1 = '[object WeakMap]';

var dataViewTag$1 = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = _toSource(_DataView),
    mapCtorString = _toSource(_Map),
    promiseCtorString = _toSource(_Promise),
    setCtorString = _toSource(_Set),
    weakMapCtorString = _toSource(_WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = _baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$1) ||
    (_Map && getTag(new _Map) != mapTag$1) ||
    (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
    (_Set && getTag(new _Set) != setTag$1) ||
    (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
  getTag = function(value) {
    var result = _baseGetTag(value),
        Ctor = result == objectTag$1 ? value.constructor : undefined,
        ctorString = Ctor ? _toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag$1;
        case mapCtorString: return mapTag$1;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag$1;
        case weakMapCtorString: return weakMapTag$1;
      }
    }
    return result;
  };
}

var _getTag = getTag;

/** Used for built-in method references. */
var objectProto$c = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty$9.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

var _initCloneArray = initCloneArray;

/** Built-in value references. */
var Uint8Array = _root.Uint8Array;

var _Uint8Array = Uint8Array;

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new _Uint8Array(result).set(new _Uint8Array(arrayBuffer));
  return result;
}

var _cloneArrayBuffer = cloneArrayBuffer;

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

var _cloneDataView = cloneDataView;

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

var _cloneRegExp = cloneRegExp;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

var _cloneSymbol = cloneSymbol;

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? _cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

var _cloneTypedArray = cloneTypedArray;

/** `Object#toString` result references. */
var boolTag$1 = '[object Boolean]',
    dateTag$1 = '[object Date]',
    mapTag$2 = '[object Map]',
    numberTag$1 = '[object Number]',
    regexpTag$1 = '[object RegExp]',
    setTag$2 = '[object Set]',
    stringTag$1 = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag$1 = '[object ArrayBuffer]',
    dataViewTag$2 = '[object DataView]',
    float32Tag$1 = '[object Float32Array]',
    float64Tag$1 = '[object Float64Array]',
    int8Tag$1 = '[object Int8Array]',
    int16Tag$1 = '[object Int16Array]',
    int32Tag$1 = '[object Int32Array]',
    uint8Tag$1 = '[object Uint8Array]',
    uint8ClampedTag$1 = '[object Uint8ClampedArray]',
    uint16Tag$1 = '[object Uint16Array]',
    uint32Tag$1 = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$1:
      return _cloneArrayBuffer(object);

    case boolTag$1:
    case dateTag$1:
      return new Ctor(+object);

    case dataViewTag$2:
      return _cloneDataView(object, isDeep);

    case float32Tag$1: case float64Tag$1:
    case int8Tag$1: case int16Tag$1: case int32Tag$1:
    case uint8Tag$1: case uint8ClampedTag$1: case uint16Tag$1: case uint32Tag$1:
      return _cloneTypedArray(object, isDeep);

    case mapTag$2:
      return new Ctor;

    case numberTag$1:
    case stringTag$1:
      return new Ctor(object);

    case regexpTag$1:
      return _cloneRegExp(object);

    case setTag$2:
      return new Ctor;

    case symbolTag:
      return _cloneSymbol(object);
  }
}

var _initCloneByTag = initCloneByTag;

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject_1(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

var _baseCreate = baseCreate;

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !_isPrototype(object))
    ? _baseCreate(_getPrototype(object))
    : {};
}

var _initCloneObject = initCloneObject;

/** `Object#toString` result references. */
var mapTag$3 = '[object Map]';

/**
 * The base implementation of `_.isMap` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 */
function baseIsMap(value) {
  return isObjectLike_1(value) && _getTag(value) == mapTag$3;
}

var _baseIsMap = baseIsMap;

/* Node.js helper references. */
var nodeIsMap = _nodeUtil && _nodeUtil.isMap;

/**
 * Checks if `value` is classified as a `Map` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a map, else `false`.
 * @example
 *
 * _.isMap(new Map);
 * // => true
 *
 * _.isMap(new WeakMap);
 * // => false
 */
var isMap = nodeIsMap ? _baseUnary(nodeIsMap) : _baseIsMap;

var isMap_1 = isMap;

/** `Object#toString` result references. */
var setTag$3 = '[object Set]';

/**
 * The base implementation of `_.isSet` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 */
function baseIsSet(value) {
  return isObjectLike_1(value) && _getTag(value) == setTag$3;
}

var _baseIsSet = baseIsSet;

/* Node.js helper references. */
var nodeIsSet = _nodeUtil && _nodeUtil.isSet;

/**
 * Checks if `value` is classified as a `Set` object.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a set, else `false`.
 * @example
 *
 * _.isSet(new Set);
 * // => true
 *
 * _.isSet(new WeakSet);
 * // => false
 */
var isSet = nodeIsSet ? _baseUnary(nodeIsSet) : _baseIsSet;

var isSet_1 = isSet;

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]',
    arrayTag$1 = '[object Array]',
    boolTag$2 = '[object Boolean]',
    dateTag$2 = '[object Date]',
    errorTag$1 = '[object Error]',
    funcTag$2 = '[object Function]',
    genTag$1 = '[object GeneratorFunction]',
    mapTag$4 = '[object Map]',
    numberTag$2 = '[object Number]',
    objectTag$2 = '[object Object]',
    regexpTag$2 = '[object RegExp]',
    setTag$4 = '[object Set]',
    stringTag$2 = '[object String]',
    symbolTag$1 = '[object Symbol]',
    weakMapTag$2 = '[object WeakMap]';

var arrayBufferTag$2 = '[object ArrayBuffer]',
    dataViewTag$3 = '[object DataView]',
    float32Tag$2 = '[object Float32Array]',
    float64Tag$2 = '[object Float64Array]',
    int8Tag$2 = '[object Int8Array]',
    int16Tag$2 = '[object Int16Array]',
    int32Tag$2 = '[object Int32Array]',
    uint8Tag$2 = '[object Uint8Array]',
    uint8ClampedTag$2 = '[object Uint8ClampedArray]',
    uint16Tag$2 = '[object Uint16Array]',
    uint32Tag$2 = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag$2] = cloneableTags[arrayTag$1] =
cloneableTags[arrayBufferTag$2] = cloneableTags[dataViewTag$3] =
cloneableTags[boolTag$2] = cloneableTags[dateTag$2] =
cloneableTags[float32Tag$2] = cloneableTags[float64Tag$2] =
cloneableTags[int8Tag$2] = cloneableTags[int16Tag$2] =
cloneableTags[int32Tag$2] = cloneableTags[mapTag$4] =
cloneableTags[numberTag$2] = cloneableTags[objectTag$2] =
cloneableTags[regexpTag$2] = cloneableTags[setTag$4] =
cloneableTags[stringTag$2] = cloneableTags[symbolTag$1] =
cloneableTags[uint8Tag$2] = cloneableTags[uint8ClampedTag$2] =
cloneableTags[uint16Tag$2] = cloneableTags[uint32Tag$2] = true;
cloneableTags[errorTag$1] = cloneableTags[funcTag$2] =
cloneableTags[weakMapTag$2] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject_1(value)) {
    return value;
  }
  var isArr = isArray_1(value);
  if (isArr) {
    result = _initCloneArray(value);
    if (!isDeep) {
      return _copyArray(value, result);
    }
  } else {
    var tag = _getTag(value),
        isFunc = tag == funcTag$2 || tag == genTag$1;

    if (isBuffer_1(value)) {
      return _cloneBuffer(value, isDeep);
    }
    if (tag == objectTag$2 || tag == argsTag$2 || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : _initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? _copySymbolsIn(value, _baseAssignIn(result, value))
          : _copySymbols(value, _baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = _initCloneByTag(value, tag, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new _Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  if (isSet_1(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap_1(value)) {
    value.forEach(function(subValue, key) {
      result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
  }

  var keysFunc = isFull
    ? (isFlat ? _getAllKeysIn : _getAllKeys)
    : (isFlat ? keysIn : keys_1);

  var props = isArr ? undefined : keysFunc(value);
  _arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    _assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

var _baseClone = baseClone;

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG$1 = 1,
    CLONE_SYMBOLS_FLAG$1 = 4;

/**
 * This method is like `_.clone` except that it recursively clones `value`.
 *
 * @static
 * @memberOf _
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see _.clone
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var deep = _.cloneDeep(objects);
 * console.log(deep[0] === objects[0]);
 * // => false
 */
function cloneDeep(value) {
  return _baseClone(value, CLONE_DEEP_FLAG$1 | CLONE_SYMBOLS_FLAG$1);
}

var cloneDeep_1 = cloneDeep;

/**
 * This function is like `assignValue` except that it doesn't assign
 * `undefined` values.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignMergeValue(object, key, value) {
  if ((value !== undefined && !eq_1(object[key], value)) ||
      (value === undefined && !(key in object))) {
    _baseAssignValue(object, key, value);
  }
}

var _assignMergeValue = assignMergeValue;

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

var _createBaseFor = createBaseFor;

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = _createBaseFor();

var _baseFor = baseFor;

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike_1(value) && isArrayLike_1(value);
}

var isArrayLikeObject_1 = isArrayLikeObject;

/** `Object#toString` result references. */
var objectTag$3 = '[object Object]';

/** Used for built-in method references. */
var funcProto$2 = Function.prototype,
    objectProto$d = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$2 = funcProto$2.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$a = objectProto$d.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString$2.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!isObjectLike_1(value) || _baseGetTag(value) != objectTag$3) {
    return false;
  }
  var proto = _getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$a.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString$2.call(Ctor) == objectCtorString;
}

var isPlainObject_1 = isPlainObject;

/**
 * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function safeGet(object, key) {
  if (key === 'constructor' && typeof object[key] === 'function') {
    return;
  }

  if (key == '__proto__') {
    return;
  }

  return object[key];
}

var _safeGet = safeGet;

/**
 * Converts `value` to a plain object flattening inherited enumerable string
 * keyed properties of `value` to own properties of the plain object.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Object} Returns the converted plain object.
 * @example
 *
 * function Foo() {
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.assign({ 'a': 1 }, new Foo);
 * // => { 'a': 1, 'b': 2 }
 *
 * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
 * // => { 'a': 1, 'b': 2, 'c': 3 }
 */
function toPlainObject(value) {
  return _copyObject(value, keysIn_1(value));
}

var toPlainObject_1 = toPlainObject;

/**
 * A specialized version of `baseMerge` for arrays and objects which performs
 * deep merges and tracks traversed objects enabling objects with circular
 * references to be merged.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {string} key The key of the value to merge.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} mergeFunc The function to merge values.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
  var objValue = _safeGet(object, key),
      srcValue = _safeGet(source, key),
      stacked = stack.get(srcValue);

  if (stacked) {
    _assignMergeValue(object, key, stacked);
    return;
  }
  var newValue = customizer
    ? customizer(objValue, srcValue, (key + ''), object, source, stack)
    : undefined;

  var isCommon = newValue === undefined;

  if (isCommon) {
    var isArr = isArray_1(srcValue),
        isBuff = !isArr && isBuffer_1(srcValue),
        isTyped = !isArr && !isBuff && isTypedArray_1(srcValue);

    newValue = srcValue;
    if (isArr || isBuff || isTyped) {
      if (isArray_1(objValue)) {
        newValue = objValue;
      }
      else if (isArrayLikeObject_1(objValue)) {
        newValue = _copyArray(objValue);
      }
      else if (isBuff) {
        isCommon = false;
        newValue = _cloneBuffer(srcValue, true);
      }
      else if (isTyped) {
        isCommon = false;
        newValue = _cloneTypedArray(srcValue, true);
      }
      else {
        newValue = [];
      }
    }
    else if (isPlainObject_1(srcValue) || isArguments_1(srcValue)) {
      newValue = objValue;
      if (isArguments_1(objValue)) {
        newValue = toPlainObject_1(objValue);
      }
      else if (!isObject_1(objValue) || isFunction_1(objValue)) {
        newValue = _initCloneObject(srcValue);
      }
    }
    else {
      isCommon = false;
    }
  }
  if (isCommon) {
    // Recursively merge objects and arrays (susceptible to call stack limits).
    stack.set(srcValue, newValue);
    mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
    stack['delete'](srcValue);
  }
  _assignMergeValue(object, key, newValue);
}

var _baseMergeDeep = baseMergeDeep;

/**
 * The base implementation of `_.merge` without support for multiple sources.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {number} srcIndex The index of `source`.
 * @param {Function} [customizer] The function to customize merged values.
 * @param {Object} [stack] Tracks traversed source values and their merged
 *  counterparts.
 */
function baseMerge(object, source, srcIndex, customizer, stack) {
  if (object === source) {
    return;
  }
  _baseFor(source, function(srcValue, key) {
    stack || (stack = new _Stack);
    if (isObject_1(srcValue)) {
      _baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
    }
    else {
      var newValue = customizer
        ? customizer(_safeGet(object, key), srcValue, (key + ''), object, source, stack)
        : undefined;

      if (newValue === undefined) {
        newValue = srcValue;
      }
      _assignMergeValue(object, key, newValue);
    }
  }, keysIn_1);
}

var _baseMerge = baseMerge;

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var identity_1 = identity;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

var _apply = apply;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

var _overRest = overRest;

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

var constant_1 = constant;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant_1(string),
    'writable': true
  });
};

var _baseSetToString = baseSetToString;

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

var _shortOut = shortOut;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = _shortOut(_baseSetToString);

var _setToString = setToString;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return _setToString(_overRest(func, start, identity_1), func + '');
}

var _baseRest = baseRest;

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject_1(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike_1(object) && _isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq_1(object[index], value);
  }
  return false;
}

var _isIterateeCall = isIterateeCall;

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return _baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

var _createAssigner = createAssigner;

/**
 * This method is like `_.assign` except that it recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 0.5.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @example
 *
 * var object = {
 *   'a': [{ 'b': 2 }, { 'd': 4 }]
 * };
 *
 * var other = {
 *   'a': [{ 'c': 3 }, { 'e': 5 }]
 * };
 *
 * _.merge(object, other);
 * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
 */
var merge = _createAssigner(function(object, source, srcIndex) {
  _baseMerge(object, source, srcIndex);
});

var merge_1 = merge;

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER$2 = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

var constants$1 = {
  SEMVER_SPEC_VERSION,
  MAX_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$2,
  MAX_SAFE_COMPONENT_LENGTH
};

const debug = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug;

var re_1 = createCommonjsModule(function (module, exports) {
const { MAX_SAFE_COMPONENT_LENGTH } = constants$1;

exports = module.exports = {};

// The actual regexps go on exports.re
const re = exports.re = [];
const src = exports.src = [];
const t = exports.t = {};
let R = 0;

const createToken = (name, value, isGlobal) => {
  const index = R++;
  debug_1(index, value);
  t[name] = index;
  src[index] = value;
  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
};

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+');

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*');

// ## Main Version
// Three dot-separated numeric identifiers.

createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})`);

createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
}|${src[t.NONNUMERICIDENTIFIER]})`);

createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
}|${src[t.NONNUMERICIDENTIFIER]})`);

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+');

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
}${src[t.PRERELEASE]}?${
  src[t.BUILD]}?`);

createToken('FULL', `^${src[t.FULLPLAIN]}$`);

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
}${src[t.PRERELEASELOOSE]}?${
  src[t.BUILD]}?`);

createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

createToken('GTLT', '((?:<|>)?=?)');

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:${src[t.PRERELEASE]})?${
                     src[t.BUILD]}?` +
                   `)?)?`);

createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:${src[t.PRERELEASELOOSE]})?${
                          src[t.BUILD]}?` +
                        `)?)?`);

createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
createToken('COERCE', `${'(^|[^\\d])' +
              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:$|[^\\d])`);
createToken('COERCERTL', src[t.COERCE], true);

// Tilde ranges.
// Meaning is "reasonably at or greater than"
createToken('LONETILDE', '(?:~>?)');

createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
exports.tildeTrimReplace = '$1~';

createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

// Caret ranges.
// Meaning is "at least and backwards compatible with"
createToken('LONECARET', '(?:\\^)');

createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
exports.caretTrimReplace = '$1^';

createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

// A simple gt/lt/eq thing, or just "" to indicate "any version"
createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
exports.comparatorTrimReplace = '$1$2$3';

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
                   `\\s+-\\s+` +
                   `(${src[t.XRANGEPLAIN]})` +
                   `\\s*$`);

createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s+-\\s+` +
                        `(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s*$`);

// Star ranges basically just allow anything at all.
createToken('STAR', '(<|>)?=?\\s*\\*');
// >=0.0.0 is like a star
createToken('GTE0', '^\\s*>=\\s*0\.0\.0\\s*$');
createToken('GTE0PRE', '^\\s*>=\\s*0\.0\.0-0\\s*$');
});

const numeric = /^[0-9]+$/;
const compareIdentifiers = (a, b) => {
  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);

var identifiers = {
  compareIdentifiers,
  rcompareIdentifiers
};

const { MAX_LENGTH: MAX_LENGTH$1, MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$3 } = constants$1;
const { re, t } = re_1;

const { compareIdentifiers: compareIdentifiers$1 } = identifiers;
class SemVer {
  constructor (version, options) {
    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      };
    }
    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    if (version.length > MAX_LENGTH$1) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH$1} characters`
      )
    }

    debug_1('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER$3 || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER$3 || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER$3 || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER$3) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug_1('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    return (
      compareIdentifiers$1(this.major, other.major) ||
      compareIdentifiers$1(this.minor, other.minor) ||
      compareIdentifiers$1(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug_1('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers$1(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug_1('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers$1(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier);
        break
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier);
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier);
        this.inc('pre', identifier);
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier);
        }
        this.inc('pre', identifier);
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre':
        if (this.prerelease.length === 0) {
          this.prerelease = [0];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            this.prerelease.push(0);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          if (this.prerelease[0] === identifier) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = [identifier, 0];
            }
          } else {
            this.prerelease = [identifier, 0];
          }
        }
        break

      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.format();
    this.raw = this.version;
    return this
  }
}

var semver = SemVer;

const {MAX_LENGTH: MAX_LENGTH$2} = constants$1;
const { re: re$1, t: t$1 } = re_1;


const parse = (version, options) => {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (version instanceof semver) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH$2) {
    return null
  }

  const r = options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL];
  if (!r.test(version)) {
    return null
  }

  try {
    return new semver(version, options)
  } catch (er) {
    return null
  }
};

var parse_1 = parse;

const valid = (version, options) => {
  const v = parse_1(version, options);
  return v ? v.version : null
};
var valid_1 = valid;

const clean = (version, options) => {
  const s = parse_1(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
};
var clean_1 = clean;

const inc = (version, release, options, identifier) => {
  if (typeof (options) === 'string') {
    identifier = options;
    options = undefined;
  }

  try {
    return new semver(version, options).inc(release, identifier).version
  } catch (er) {
    return null
  }
};
var inc_1 = inc;

const compare = (a, b, loose) =>
  new semver(a, loose).compare(new semver(b, loose));

var compare_1 = compare;

const eq$1 = (a, b, loose) => compare_1(a, b, loose) === 0;
var eq_1$1 = eq$1;

const diff$1 = (version1, version2) => {
  if (eq_1$1(version1, version2)) {
    return null
  } else {
    const v1 = parse_1(version1);
    const v2 = parse_1(version2);
    const hasPre = v1.prerelease.length || v2.prerelease.length;
    const prefix = hasPre ? 'pre' : '';
    const defaultResult = hasPre ? 'prerelease' : '';
    for (const key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return prefix + key
        }
      }
    }
    return defaultResult // may be undefined
  }
};
var diff_1$1 = diff$1;

const major = (a, loose) => new semver(a, loose).major;
var major_1 = major;

const minor = (a, loose) => new semver(a, loose).minor;
var minor_1 = minor;

const patch = (a, loose) => new semver(a, loose).patch;
var patch_1 = patch;

const prerelease = (version, options) => {
  const parsed = parse_1(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
};
var prerelease_1 = prerelease;

const rcompare = (a, b, loose) => compare_1(b, a, loose);
var rcompare_1 = rcompare;

const compareLoose = (a, b) => compare_1(a, b, true);
var compareLoose_1 = compareLoose;

const compareBuild = (a, b, loose) => {
  const versionA = new semver(a, loose);
  const versionB = new semver(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
};
var compareBuild_1 = compareBuild;

const sort = (list, loose) => list.sort((a, b) => compareBuild_1(a, b, loose));
var sort_1 = sort;

const rsort = (list, loose) => list.sort((a, b) => compareBuild_1(b, a, loose));
var rsort_1 = rsort;

const gt = (a, b, loose) => compare_1(a, b, loose) > 0;
var gt_1 = gt;

const lt = (a, b, loose) => compare_1(a, b, loose) < 0;
var lt_1 = lt;

const neq = (a, b, loose) => compare_1(a, b, loose) !== 0;
var neq_1 = neq;

const gte = (a, b, loose) => compare_1(a, b, loose) >= 0;
var gte_1 = gte;

const lte = (a, b, loose) => compare_1(a, b, loose) <= 0;
var lte_1 = lte;

const cmp = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a === b

    case '!==':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a !== b

    case '':
    case '=':
    case '==':
      return eq_1$1(a, b, loose)

    case '!=':
      return neq_1(a, b, loose)

    case '>':
      return gt_1(a, b, loose)

    case '>=':
      return gte_1(a, b, loose)

    case '<':
      return lt_1(a, b, loose)

    case '<=':
      return lte_1(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp;

const {re: re$2, t: t$2} = re_1;

const coerce = (version, options) => {
  if (version instanceof semver) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  let match = null;
  if (!options.rtl) {
    match = version.match(re$2[t$2.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    let next;
    while ((next = re$2[t$2.COERCERTL].exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      re$2[t$2.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    re$2[t$2.COERCERTL].lastIndex = -1;
  }

  if (match === null)
    return null

  return parse_1(`${match[2]}.${match[3] || '0'}.${match[4] || '0'}`, options)
};
var coerce_1 = coerce;

// hoisted class for cyclic dependency
class Range {
  constructor (range, options) {
    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      };
    }

    if (range instanceof Range) {
      if (
        range.loose === !!options.loose &&
        range.includePrerelease === !!options.includePrerelease
      ) {
        return range
      } else {
        return new Range(range.raw, options)
      }
    }

    if (range instanceof comparator) {
      // just put it in the set and return
      this.raw = range.value;
      this.set = [[range]];
      this.format();
      return this
    }

    this.options = options;
    this.loose = !!options.loose;
    this.includePrerelease = !!options.includePrerelease;

    // First, split based on boolean or ||
    this.raw = range;
    this.set = range
      .split(/\s*\|\|\s*/)
      // map the range to a 2d array of comparators
      .map(range => this.parseRange(range.trim()))
      // throw out any comparator lists that are empty
      // this generally means that it was not a valid range, which is allowed
      // in loose mode, but will still throw if the WHOLE range is invalid.
      .filter(c => c.length);

    if (!this.set.length) {
      throw new TypeError(`Invalid SemVer Range: ${range}`)
    }

    this.format();
  }

  format () {
    this.range = this.set
      .map((comps) => {
        return comps.join(' ').trim()
      })
      .join('||')
      .trim();
    return this.range
  }

  toString () {
    return this.range
  }

  parseRange (range) {
    const loose = this.options.loose;
    range = range.trim();
    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
    const hr = loose ? re$3[t$3.HYPHENRANGELOOSE] : re$3[t$3.HYPHENRANGE];
    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
    debug_1('hyphen replace', range);
    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
    range = range.replace(re$3[t$3.COMPARATORTRIM], comparatorTrimReplace);
    debug_1('comparator trim', range, re$3[t$3.COMPARATORTRIM]);

    // `~ 1.2.3` => `~1.2.3`
    range = range.replace(re$3[t$3.TILDETRIM], tildeTrimReplace);

    // `^ 1.2.3` => `^1.2.3`
    range = range.replace(re$3[t$3.CARETTRIM], caretTrimReplace);

    // normalize spaces
    range = range.split(/\s+/).join(' ');

    // At this point, the range is completely trimmed and
    // ready to be split into comparators.

    const compRe = loose ? re$3[t$3.COMPARATORLOOSE] : re$3[t$3.COMPARATOR];
    return range
      .split(' ')
      .map(comp => parseComparator(comp, this.options))
      .join(' ')
      .split(/\s+/)
      .map(comp => replaceGTE0(comp, this.options))
      // in loose mode, throw out any that are not valid comparators
      .filter(this.options.loose ? comp => !!comp.match(compRe) : () => true)
      .map(comp => new comparator(comp, this.options))
  }

  intersects (range, options) {
    if (!(range instanceof Range)) {
      throw new TypeError('a Range is required')
    }

    return this.set.some((thisComparators) => {
      return (
        isSatisfiable(thisComparators, options) &&
        range.set.some((rangeComparators) => {
          return (
            isSatisfiable(rangeComparators, options) &&
            thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options)
              })
            })
          )
        })
      )
    })
  }

  // if ANY of the sets match ALL of its comparators, then pass
  test (version) {
    if (!version) {
      return false
    }

    if (typeof version === 'string') {
      try {
        version = new semver(version, this.options);
      } catch (er) {
        return false
      }
    }

    for (let i = 0; i < this.set.length; i++) {
      if (testSet(this.set[i], version, this.options)) {
        return true
      }
    }
    return false
  }
}
var range = Range;




const {
  re: re$3,
  t: t$3,
  comparatorTrimReplace,
  tildeTrimReplace,
  caretTrimReplace
} = re_1;

// take a set of comparators and determine whether there
// exists a version which can satisfy it
const isSatisfiable = (comparators, options) => {
  let result = true;
  const remainingComparators = comparators.slice();
  let testComparator = remainingComparators.pop();

  while (result && remainingComparators.length) {
    result = remainingComparators.every((otherComparator) => {
      return testComparator.intersects(otherComparator, options)
    });

    testComparator = remainingComparators.pop();
  }

  return result
};

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
const parseComparator = (comp, options) => {
  debug_1('comp', comp, options);
  comp = replaceCarets(comp, options);
  debug_1('caret', comp);
  comp = replaceTildes(comp, options);
  debug_1('tildes', comp);
  comp = replaceXRanges(comp, options);
  debug_1('xrange', comp);
  comp = replaceStars(comp, options);
  debug_1('stars', comp);
  return comp
};

const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
const replaceTildes = (comp, options) =>
  comp.trim().split(/\s+/).map((comp) => {
    return replaceTilde(comp, options)
  }).join(' ');

const replaceTilde = (comp, options) => {
  const r = options.loose ? re$3[t$3.TILDELOOSE] : re$3[t$3.TILDE];
  return comp.replace(r, (_, M, m, p, pr) => {
    debug_1('tilde', comp, _, M, m, p, pr);
    let ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0-0
      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
    } else if (pr) {
      debug_1('replaceTilde pr', pr);
      ret = `>=${M}.${m}.${p}-${pr
      } <${M}.${+m + 1}.0-0`;
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0-0
      ret = `>=${M}.${m}.${p
      } <${M}.${+m + 1}.0-0`;
    }

    debug_1('tilde return', ret);
    return ret
  })
};

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
// ^1.2.3 --> >=1.2.3 <2.0.0-0
// ^1.2.0 --> >=1.2.0 <2.0.0-0
const replaceCarets = (comp, options) =>
  comp.trim().split(/\s+/).map((comp) => {
    return replaceCaret(comp, options)
  }).join(' ');

const replaceCaret = (comp, options) => {
  debug_1('caret', comp, options);
  const r = options.loose ? re$3[t$3.CARETLOOSE] : re$3[t$3.CARET];
  const z = options.includePrerelease ? '-0' : '';
  return comp.replace(r, (_, M, m, p, pr) => {
    debug_1('caret', comp, _, M, m, p, pr);
    let ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
    } else if (isX(p)) {
      if (M === '0') {
        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
      }
    } else if (pr) {
      debug_1('replaceCaret pr', pr);
      if (M === '0') {
        if (m === '0') {
          ret = `>=${M}.${m}.${p}-${pr
          } <${M}.${m}.${+p + 1}-0`;
        } else {
          ret = `>=${M}.${m}.${p}-${pr
          } <${M}.${+m + 1}.0-0`;
        }
      } else {
        ret = `>=${M}.${m}.${p}-${pr
        } <${+M + 1}.0.0-0`;
      }
    } else {
      debug_1('no pr');
      if (M === '0') {
        if (m === '0') {
          ret = `>=${M}.${m}.${p
          }${z} <${M}.${m}.${+p + 1}-0`;
        } else {
          ret = `>=${M}.${m}.${p
          }${z} <${M}.${+m + 1}.0-0`;
        }
      } else {
        ret = `>=${M}.${m}.${p
        } <${+M + 1}.0.0-0`;
      }
    }

    debug_1('caret return', ret);
    return ret
  })
};

const replaceXRanges = (comp, options) => {
  debug_1('replaceXRanges', comp, options);
  return comp.split(/\s+/).map((comp) => {
    return replaceXRange(comp, options)
  }).join(' ')
};

const replaceXRange = (comp, options) => {
  comp = comp.trim();
  const r = options.loose ? re$3[t$3.XRANGELOOSE] : re$3[t$3.XRANGE];
  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
    debug_1('xRange', comp, ret, gtlt, M, m, p, pr);
    const xM = isX(M);
    const xm = xM || isX(m);
    const xp = xm || isX(p);
    const anyX = xp;

    if (gtlt === '=' && anyX) {
      gtlt = '';
    }

    // if we're including prereleases in the match, then we need
    // to fix this to -0, the lowest possible prerelease value
    pr = options.includePrerelease ? '-0' : '';

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0-0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0;
      }
      p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<';
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }

      if (gtlt === '<')
        pr = '-0';

      ret = `${gtlt + M}.${m}.${p}${pr}`;
    } else if (xm) {
      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
    } else if (xp) {
      ret = `>=${M}.${m}.0${pr
      } <${M}.${+m + 1}.0-0`;
    }

    debug_1('xRange return', ret);

    return ret
  })
};

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
const replaceStars = (comp, options) => {
  debug_1('replaceStars', comp, options);
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re$3[t$3.STAR], '')
};

const replaceGTE0 = (comp, options) => {
  debug_1('replaceGTE0', comp, options);
  return comp.trim()
    .replace(re$3[options.includePrerelease ? t$3.GTE0PRE : t$3.GTE0], '')
};

// This function is passed to string.replace(re[t.HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
const hyphenReplace = incPr => ($0,
  from, fM, fm, fp, fpr, fb,
  to, tM, tm, tp, tpr, tb) => {
  if (isX(fM)) {
    from = '';
  } else if (isX(fm)) {
    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
  } else if (isX(fp)) {
    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
  } else if (fpr) {
    from = `>=${from}`;
  } else {
    from = `>=${from}${incPr ? '-0' : ''}`;
  }

  if (isX(tM)) {
    to = '';
  } else if (isX(tm)) {
    to = `<${+tM + 1}.0.0-0`;
  } else if (isX(tp)) {
    to = `<${tM}.${+tm + 1}.0-0`;
  } else if (tpr) {
    to = `<=${tM}.${tm}.${tp}-${tpr}`;
  } else if (incPr) {
    to = `<${tM}.${tm}.${+tp + 1}-0`;
  } else {
    to = `<=${to}`;
  }

  return (`${from} ${to}`).trim()
};

const testSet = (set, version, options) => {
  for (let i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false
    }
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (let i = 0; i < set.length; i++) {
      debug_1(set[i].semver);
      if (set[i].semver === comparator.ANY) {
        continue
      }

      if (set[i].semver.prerelease.length > 0) {
        const allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch) {
          return true
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false
  }

  return true
};

const ANY = Symbol('SemVer ANY');
// hoisted class for cyclic dependency
class Comparator {
  static get ANY () {
    return ANY
  }
  constructor (comp, options) {
    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      };
    }

    if (comp instanceof Comparator) {
      if (comp.loose === !!options.loose) {
        return comp
      } else {
        comp = comp.value;
      }
    }

    debug_1('comparator', comp, options);
    this.options = options;
    this.loose = !!options.loose;
    this.parse(comp);

    if (this.semver === ANY) {
      this.value = '';
    } else {
      this.value = this.operator + this.semver.version;
    }

    debug_1('comp', this);
  }

  parse (comp) {
    const r = this.options.loose ? re$4[t$4.COMPARATORLOOSE] : re$4[t$4.COMPARATOR];
    const m = comp.match(r);

    if (!m) {
      throw new TypeError(`Invalid comparator: ${comp}`)
    }

    this.operator = m[1] !== undefined ? m[1] : '';
    if (this.operator === '=') {
      this.operator = '';
    }

    // if it literally is just '>' or '' then allow anything.
    if (!m[2]) {
      this.semver = ANY;
    } else {
      this.semver = new semver(m[2], this.options.loose);
    }
  }

  toString () {
    return this.value
  }

  test (version) {
    debug_1('Comparator.test', version, this.options.loose);

    if (this.semver === ANY || version === ANY) {
      return true
    }

    if (typeof version === 'string') {
      try {
        version = new semver(version, this.options);
      } catch (er) {
        return false
      }
    }

    return cmp_1(version, this.operator, this.semver, this.options)
  }

  intersects (comp, options) {
    if (!(comp instanceof Comparator)) {
      throw new TypeError('a Comparator is required')
    }

    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      };
    }

    if (this.operator === '') {
      if (this.value === '') {
        return true
      }
      return new range(comp.value, options).test(this.value)
    } else if (comp.operator === '') {
      if (comp.value === '') {
        return true
      }
      return new range(this.value, options).test(comp.semver)
    }

    const sameDirectionIncreasing =
      (this.operator === '>=' || this.operator === '>') &&
      (comp.operator === '>=' || comp.operator === '>');
    const sameDirectionDecreasing =
      (this.operator === '<=' || this.operator === '<') &&
      (comp.operator === '<=' || comp.operator === '<');
    const sameSemVer = this.semver.version === comp.semver.version;
    const differentDirectionsInclusive =
      (this.operator === '>=' || this.operator === '<=') &&
      (comp.operator === '>=' || comp.operator === '<=');
    const oppositeDirectionsLessThan =
      cmp_1(this.semver, '<', comp.semver, options) &&
      (this.operator === '>=' || this.operator === '>') &&
        (comp.operator === '<=' || comp.operator === '<');
    const oppositeDirectionsGreaterThan =
      cmp_1(this.semver, '>', comp.semver, options) &&
      (this.operator === '<=' || this.operator === '<') &&
        (comp.operator === '>=' || comp.operator === '>');

    return (
      sameDirectionIncreasing ||
      sameDirectionDecreasing ||
      (sameSemVer && differentDirectionsInclusive) ||
      oppositeDirectionsLessThan ||
      oppositeDirectionsGreaterThan
    )
  }
}

var comparator = Comparator;

const {re: re$4, t: t$4} = re_1;

const satisfies = (version, range$1, options) => {
  try {
    range$1 = new range(range$1, options);
  } catch (er) {
    return false
  }
  return range$1.test(version)
};
var satisfies_1 = satisfies;

// Mostly just for testing and legacy API reasons
const toComparators = (range$1, options) =>
  new range(range$1, options).set
    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '));

var toComparators_1 = toComparators;

const maxSatisfying = (versions, range$1, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new range(range$1, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new semver(max, options);
      }
    }
  });
  return max
};
var maxSatisfying_1 = maxSatisfying;

const minSatisfying = (versions, range$1, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new range(range$1, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new semver(min, options);
      }
    }
  });
  return min
};
var minSatisfying_1 = minSatisfying;

const minVersion = (range$1, loose) => {
  range$1 = new range(range$1, loose);

  let minver = new semver('0.0.0');
  if (range$1.test(minver)) {
    return minver
  }

  minver = new semver('0.0.0-0');
  if (range$1.test(minver)) {
    return minver
  }

  minver = null;
  for (let i = 0; i < range$1.set.length; ++i) {
    const comparators = range$1.set[i];

    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new semver(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!minver || gt_1(minver, compver)) {
            minver = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    });
  }

  if (minver && range$1.test(minver)) {
    return minver
  }

  return null
};
var minVersion_1 = minVersion;

const validRange = (range$1, options) => {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new range(range$1, options).range || '*'
  } catch (er) {
    return null
  }
};
var valid$1 = validRange;

const {ANY: ANY$1} = comparator;







const outside = (version, range$1, hilo, options) => {
  version = new semver(version, options);
  range$1 = new range(range$1, options);

  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt_1;
      ltefn = lte_1;
      ltfn = lt_1;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt_1;
      ltefn = gte_1;
      ltfn = gt_1;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisifes the range it is not outside
  if (satisfies_1(version, range$1, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (let i = 0; i < range$1.set.length; ++i) {
    const comparators = range$1.set[i];

    let high = null;
    let low = null;

    comparators.forEach((comparator$1) => {
      if (comparator$1.semver === ANY$1) {
        comparator$1 = new comparator('>=0.0.0');
      }
      high = high || comparator$1;
      low = low || comparator$1;
      if (gtfn(comparator$1.semver, high.semver, options)) {
        high = comparator$1;
      } else if (ltfn(comparator$1.semver, low.semver, options)) {
        low = comparator$1;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
};

var outside_1 = outside;

// Determine if version is greater than all the versions possible in the range.

const gtr = (version, range, options) => outside_1(version, range, '>', options);
var gtr_1 = gtr;

// Determine if version is less than all the versions possible in the range
const ltr = (version, range, options) => outside_1(version, range, '<', options);
var ltr_1 = ltr;

const intersects = (r1, r2, options) => {
  r1 = new range(r1, options);
  r2 = new range(r2, options);
  return r1.intersects(r2)
};
var intersects_1 = intersects;

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.


var simplify = (versions, range, options) => {
  const set = [];
  let min = null;
  let prev = null;
  const v = versions.sort((a, b) => compare_1(a, b, options));
  for (const version of v) {
    const included = satisfies_1(version, range, options);
    if (included) {
      prev = version;
      if (!min)
        min = version;
    } else {
      if (prev) {
        set.push([min, prev]);
      }
      prev = null;
      min = null;
    }
  }
  if (min)
    set.push([min, null]);

  const ranges = [];
  for (const [min, max] of set) {
    if (min === max)
      ranges.push(min);
    else if (!max && min === v[0])
      ranges.push('*');
    else if (!max)
      ranges.push(`>=${min}`);
    else if (min === v[0])
      ranges.push(`<=${max}`);
    else
      ranges.push(`${min} - ${max}`);
  }
  const simplified = ranges.join(' || ');
  const original = typeof range.raw === 'string' ? range.raw : String(range);
  return simplified.length < original.length ? simplified : range
};

const { ANY: ANY$2 } = comparator;



// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a subset of some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else return false
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
// - If LT
//   - If LT.semver is greater than that of any > comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
// - If any C is a = range, and GT or LT are set, return false
// - Else return true

const subset = (sub, dom, options) => {
  sub = new range(sub, options);
  dom = new range(dom, options);
  let sawNonNull = false;

  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub)
        continue OUTER
    }
    // the null set is a subset of everything, but null simple ranges in
    // a complex range should be ignored.  so if we saw a non-null range,
    // then we know this isn't a subset, but if EVERY simple range was null,
    // then it is a subset.
    if (sawNonNull)
      return false
  }
  return true
};

const simpleSubset = (sub, dom, options) => {
  if (sub.length === 1 && sub[0].semver === ANY$2)
    return dom.length === 1 && dom[0].semver === ANY$2

  const eqSet = new Set();
  let gt, lt;
  for (const c of sub) {
    if (c.operator === '>' || c.operator === '>=')
      gt = higherGT(gt, c, options);
    else if (c.operator === '<' || c.operator === '<=')
      lt = lowerLT(lt, c, options);
    else
      eqSet.add(c.semver);
  }

  if (eqSet.size > 1)
    return null

  let gtltComp;
  if (gt && lt) {
    gtltComp = compare_1(gt.semver, lt.semver, options);
    if (gtltComp > 0)
      return null
    else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<='))
      return null
  }

  // will iterate one or zero times
  for (const eq of eqSet) {
    if (gt && !satisfies_1(eq, String(gt), options))
      return null

    if (lt && !satisfies_1(eq, String(lt), options))
      return null

    for (const c of dom) {
      if (!satisfies_1(eq, String(c), options))
        return false
    }
    return true
  }

  let higher, lower;
  let hasDomLT, hasDomGT;
  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
    if (gt) {
      if (c.operator === '>' || c.operator === '>=') {
        higher = higherGT(gt, c, options);
        if (higher === c)
          return false
      } else if (gt.operator === '>=' && !satisfies_1(gt.semver, String(c), options))
        return false
    }
    if (lt) {
      if (c.operator === '<' || c.operator === '<=') {
        lower = lowerLT(lt, c, options);
        if (lower === c)
          return false
      } else if (lt.operator === '<=' && !satisfies_1(lt.semver, String(c), options))
        return false
    }
    if (!c.operator && (lt || gt) && gtltComp !== 0)
      return false
  }

  // if there was a < or >, and nothing in the dom, then must be false
  // UNLESS it was limited by another range in the other direction.
  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
  if (gt && hasDomLT && !lt && gtltComp !== 0)
    return false

  if (lt && hasDomGT && !gt && gtltComp !== 0)
    return false

  return true
};

// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options) => {
  if (!a)
    return b
  const comp = compare_1(a.semver, b.semver, options);
  return comp > 0 ? a
    : comp < 0 ? b
    : b.operator === '>' && a.operator === '>=' ? b
    : a
};

// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options) => {
  if (!a)
    return b
  const comp = compare_1(a.semver, b.semver, options);
  return comp < 0 ? a
    : comp > 0 ? b
    : b.operator === '<' && a.operator === '<=' ? b
    : a
};

var subset_1 = subset;

// just pre-load all the stuff that index.js lazily exports

var semver$1 = {
  re: re_1.re,
  src: re_1.src,
  tokens: re_1.t,
  SEMVER_SPEC_VERSION: constants$1.SEMVER_SPEC_VERSION,
  SemVer: semver,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers,
  parse: parse_1,
  valid: valid_1,
  clean: clean_1,
  inc: inc_1,
  diff: diff_1$1,
  major: major_1,
  minor: minor_1,
  patch: patch_1,
  prerelease: prerelease_1,
  compare: compare_1,
  rcompare: rcompare_1,
  compareLoose: compareLoose_1,
  compareBuild: compareBuild_1,
  sort: sort_1,
  rsort: rsort_1,
  gt: gt_1,
  lt: lt_1,
  eq: eq_1$1,
  neq: neq_1,
  gte: gte_1,
  lte: lte_1,
  cmp: cmp_1,
  coerce: coerce_1,
  Comparator: comparator,
  Range: range,
  satisfies: satisfies_1,
  toComparators: toComparators_1,
  maxSatisfying: maxSatisfying_1,
  minSatisfying: minSatisfying_1,
  minVersion: minVersion_1,
  validRange: valid$1,
  outside: outside_1,
  gtr: gtr_1,
  ltr: ltr_1,
  intersects: intersects_1,
  simplifyRange: simplify,
  subset: subset_1,
};

var name = "concordance";
var version = "5.0.0";
var description = "Compare, format, diff and serialize any JavaScript value";
var main = "index.js";
var files = [
	"lib",
	"index.js"
];
var engines = {
	node: ">=10.18.0 <11 || >=12.14.0 <13 || >=13.5.0"
};
var scripts = {
	test: "as-i-preach && c8 ava"
};
var repository = {
	type: "git",
	url: "git+https://github.com/concordancejs/concordance.git"
};
var author = "Mark Wubben (https://novemberborn.net/)";
var license = "ISC";
var bugs = {
	url: "https://github.com/concordancejs/concordance/issues"
};
var homepage = "https://github.com/concordancejs/concordance#readme";
var dependencies = {
	"date-time": "^3.1.0",
	esutils: "^2.0.3",
	"fast-diff": "^1.2.0",
	"js-string-escape": "^1.0.1",
	lodash: "^4.17.15",
	"md5-hex": "^3.0.1",
	semver: "^7.3.2",
	"well-known-symbols": "^2.0.0"
};
var devDependencies = {
	"@novemberborn/eslint-plugin-as-i-preach": "^12.0.0",
	ava: "^3.8.2",
	c8: "^7.1.2",
	eslint: "^6.8.0",
	"eslint-plugin-ava": "^10.3.0",
	"eslint-plugin-import": "^2.20.2",
	"eslint-plugin-node": "^11.1.0",
	"eslint-plugin-promise": "^4.2.1",
	"eslint-plugin-security": "^1.4.0",
	"eslint-plugin-standard": "^4.0.1",
	"eslint-plugin-unicorn": "^17.2.0",
	proxyquire: "^2.1.3"
};
var _package = {
	name: name,
	version: version,
	description: description,
	main: main,
	files: files,
	engines: engines,
	scripts: scripts,
	repository: repository,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies,
	devDependencies: devDependencies
};

var _package$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  name: name,
  version: version,
  description: description,
  main: main,
  files: files,
  engines: engines,
  scripts: scripts,
  repository: repository,
  author: author,
  license: license,
  bugs: bugs,
  homepage: homepage,
  dependencies: dependencies,
  devDependencies: devDependencies,
  'default': _package
});

var jsStringEscape = function (string) {
  return ('' + string).replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
    // Escape all characters not included in SingleStringCharacters and
    // DoubleStringCharacters on
    // http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return '\\' + character
      // Four possible LineTerminator characters need to be escaped:
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
    }
  })
};

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Well-known_symbols
const WELL_KNOWN = new Map([
  [Symbol.iterator, 'Symbol.iterator'],
  [Symbol.asyncIterator, 'Symbol.asyncIterator'],
  [Symbol.match, 'Symbol.match'],
  [Symbol.replace, 'Symbol.replace'],
  [Symbol.search, 'Symbol.search'],
  [Symbol.split, 'Symbol.split'],
  [Symbol.hasInstance, 'Symbol.hasInstance'],
  [Symbol.isConcatSpreadable, 'Symbol.isConcatSpreadable'],
  [Symbol.unscopables, 'Symbol.unscopables'],
  [Symbol.species, 'Symbol.species'],
  [Symbol.toPrimitive, 'Symbol.toPrimitive'],
  [Symbol.toStringTag, 'Symbol.toStringTag']
].filter(entry => entry[0]));

var isWellKnown = symbol => WELL_KNOWN.has(symbol);
var getLabel = symbol => WELL_KNOWN.get(symbol);

var wellKnownSymbols = {
	isWellKnown: isWellKnown,
	getLabel: getLabel
};

const DEEP_EQUAL$8 = constants.DEEP_EQUAL;
const UNEQUAL$f = constants.UNEQUAL;

function describe$f (value) {
  let stringCompare = null;

  const key = Symbol.keyFor(value);
  if (key !== undefined) {
    stringCompare = `Symbol.for(${jsStringEscape(key)})`;
  } else if (wellKnownSymbols.isWellKnown(value)) {
    stringCompare = wellKnownSymbols.getLabel(value);
  }

  return new SymbolValue({
    stringCompare,
    value,
  })
}
var describe_1$f = describe$f;

function deserialize$f (state) {
  const stringCompare = state[0];
  const string = state[1] || state[0];

  return new DeserializedSymbolValue({
    string,
    stringCompare,
    value: null,
  })
}
var deserialize_1$d = deserialize$f;

const tag$f = Symbol('SymbolValue');
var tag_1$f = tag$f;

class SymbolValue {
  constructor (props) {
    this.stringCompare = props.stringCompare;
    this.value = props.value;
  }

  compare (expected) {
    if (expected.tag !== tag$f) return UNEQUAL$f

    if (this.stringCompare !== null) {
      return this.stringCompare === expected.stringCompare
        ? DEEP_EQUAL$8
        : UNEQUAL$f
    }

    return this.value === expected.value
      ? DEEP_EQUAL$8
      : UNEQUAL$f
  }

  formatString () {
    if (this.stringCompare !== null) return this.stringCompare
    return jsStringEscape(this.value.toString())
  }

  formatDeep (theme) {
    return lineBuilder.single(formatUtils.wrap(theme.symbol, this.formatString()))
  }

  formatAsKey (theme) {
    return formatUtils.wrap(theme.property.keyBracket, formatUtils.wrap(theme.symbol, this.formatString()))
  }

  serialize () {
    const string = this.formatString();
    return this.stringCompare === string
      ? [this.stringCompare]
      : [this.stringCompare, string]
  }
}
Object.defineProperty(SymbolValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(SymbolValue.prototype, 'tag', { value: tag$f });

class DeserializedSymbolValue extends SymbolValue {
  constructor (props) {
    super(props);
    this.string = props.string;
  }

  compare (expected) {
    if (expected.tag !== tag$f) return UNEQUAL$f

    if (this.stringCompare !== null) {
      return this.stringCompare === expected.stringCompare
        ? DEEP_EQUAL$8
        : UNEQUAL$f
    }

    // Symbols that are not in the global symbol registry, and are not
    // well-known, cannot be compared when deserialized. Treat symbols
    // as equal if they are formatted the same.
    return this.string === expected.formatString()
      ? DEEP_EQUAL$8
      : UNEQUAL$f
  }

  formatString () {
    return this.string
  }
}

var symbol = {
	describe: describe_1$f,
	deserialize: deserialize_1$d,
	tag: tag_1$f
};

const symbolPrimitive = symbol.tag;


const AMBIGUOUS$2 = constants.AMBIGUOUS;
const DEEP_EQUAL$9 = constants.DEEP_EQUAL;
const UNEQUAL$g = constants.UNEQUAL;

function describeComplex$1 (key, value) {
  return new ComplexProperty(key, value)
}
var describeComplex_1$1 = describeComplex$1;

function deserializeComplex$1 (key, recursor) {
  const value = recursor();
  return new ComplexProperty(key, value)
}
var deserializeComplex_1$1 = deserializeComplex$1;

function describePrimitive$1 (key, value) {
  return new PrimitiveProperty(key, value)
}
var describePrimitive_1$1 = describePrimitive$1;

function deserializePrimitive$1 (state) {
  const key = state[0];
  const value = state[1];
  return new PrimitiveProperty(key, value)
}
var deserializePrimitive_1$1 = deserializePrimitive$1;

const complexTag$1 = Symbol('ComplexProperty');
var complexTag_1$1 = complexTag$1;

const primitiveTag$1 = Symbol('PrimitiveProperty');
var primitiveTag_1$1 = primitiveTag$1;

class Property {
  constructor (key) {
    this.key = key;
  }

  compareKeys (expected) {
    const result = this.key.compare(expected.key);
    // Return AMBIGUOUS if symbol keys are unequal. It's likely that properties
    // are compared in order of declaration, which is not the desired strategy.
    // Returning AMBIGUOUS allows compare() and diff() to recognize this
    // situation and sort the symbol properties before comparing them.
    return result === UNEQUAL$g && this.key.tag === symbolPrimitive && expected.key.tag === symbolPrimitive
      ? AMBIGUOUS$2
      : result
  }

  prepareDiff (expected, lhsRecursor, rhsRecursor, compareComplexShape, isCircular) {
    // Circular values cannot be compared. They must be treated as being unequal when diffing.
    if (isCircular(this.value) || isCircular(expected.value)) return { compareResult: UNEQUAL$g }

    // Try to line up this or remaining properties with the expected properties.
    const rhsFork = recursorUtils.fork(rhsRecursor);
    const initialExpected = expected;

    do {
      if (expected === null || expected.isProperty !== true) {
        return {
          actualIsExtraneous: true,
          rhsRecursor: recursorUtils.unshift(rhsFork.recursor, initialExpected),
        }
      } else if (this.key.compare(expected.key) === DEEP_EQUAL$9) {
        if (expected === initialExpected) {
          return null
        } else {
          return {
            expectedIsMissing: true,
            lhsRecursor: recursorUtils.unshift(lhsRecursor, this),
            rhsRecursor: rhsFork.recursor,
          }
        }
      }

      expected = rhsFork.shared();
    } while (true)
  }
}
Object.defineProperty(Property.prototype, 'isProperty', { value: true });

class ComplexProperty extends Property {
  constructor (key, value) {
    super(key);
    this.value = value;
  }

  createRecursor () {
    return recursorUtils.singleValue(this.value)
  }

  compare (expected) {
    if (expected.isProperty !== true) return UNEQUAL$g

    const keyResult = this.compareKeys(expected);
    if (keyResult !== DEEP_EQUAL$9) return keyResult

    return this.tag === expected.tag
      ? this.value.compare(expected.value)
      : UNEQUAL$g
  }

  formatShallow (theme, indent) {
    const increaseValueIndent = theme.property.increaseValueIndent === true;
    return new formatUtils.SingleValueFormatter(theme, value => {
      if (typeof theme.property.customFormat === 'function') {
        return theme.property.customFormat(theme, indent, this.key, value)
      }

      return value
        .withFirstPrefixed(this.key.formatAsKey(theme) + theme.property.separator)
        .withLastPostfixed(theme.property.after)
    }, increaseValueIndent)
  }

  serialize () {
    return this.key
  }
}
Object.defineProperty(ComplexProperty.prototype, 'tag', { value: complexTag$1 });

class PrimitiveProperty extends Property {
  constructor (key, value) {
    super(key);
    this.value = value;
  }

  compare (expected) {
    if (expected.isProperty !== true) return UNEQUAL$g

    const keyResult = this.compareKeys(expected);
    if (keyResult !== DEEP_EQUAL$9) return keyResult

    return this.tag !== expected.tag
      ? UNEQUAL$g
      : this.value.compare(expected.value)
  }

  formatDeep (theme, indent) {
    const increaseValueIndent = theme.property.increaseValueIndent === true;
    const valueIndent = increaseValueIndent ? indent.increase() : indent;

    // Since the key and value are formatted directly, modifiers are not
    // applied. Apply modifiers to the property descriptor instead.
    const formatted = this.value.formatDeep(theme, valueIndent);

    if (typeof theme.property.customFormat === 'function') {
      return theme.property.customFormat(theme, indent, this.key, formatted)
    }

    return formatted
      .withFirstPrefixed(this.key.formatAsKey(theme) + theme.property.separator)
      .withLastPostfixed(theme.property.after)
  }

  diffDeep (expected, theme, indent) {
    // Verify a diff can be returned.
    if (this.tag !== expected.tag || typeof this.value.diffDeep !== 'function') return null
    // Only use this logic to diff values when the keys are the same.
    if (this.key.compare(expected.key) !== DEEP_EQUAL$9) return null

    const increaseValueIndent = theme.property.increaseValueIndent === true;
    const valueIndent = increaseValueIndent ? indent.increase() : indent;

    // Since the key and value are diffed directly, modifiers are not
    // applied. Apply modifiers to the property descriptor instead.
    const diff = this.value.diffDeep(expected.value, theme, valueIndent);
    if (diff === null) return null

    if (typeof theme.property.customFormat === 'function') {
      return theme.property.customFormat(theme, indent, this.key, diff)
    }

    return diff
      .withFirstPrefixed(this.key.formatAsKey(theme) + theme.property.separator)
      .withLastPostfixed(theme.property.after)
  }

  serialize () {
    return [this.key, this.value]
  }
}
Object.defineProperty(PrimitiveProperty.prototype, 'tag', { value: primitiveTag$1 });

var property = {
	describeComplex: describeComplex_1$1,
	deserializeComplex: deserializeComplex_1$1,
	describePrimitive: describePrimitive_1$1,
	deserializePrimitive: deserializePrimitive_1$1,
	complexTag: complexTag_1$1,
	primitiveTag: primitiveTag_1$1
};

var pkg = getCjsExportFromNamespace(_package$1);

const API_VERSION = 1;
const CONCORDANCE_VERSION = pkg.version;

const descriptorRegistry = new Map();
const registry = new Map();

class PluginError extends Error {
  constructor (message, plugin) {
    super(message);
    this.name = 'PluginError';
    this.plugin = plugin;
  }
}

class PluginTypeError extends TypeError {
  constructor (message, plugin) {
    super(message);
    this.name = 'PluginTypeError';
    this.plugin = plugin;
  }
}

class UnsupportedApiError extends PluginError {
  constructor (plugin) {
    super('Plugin requires an unsupported API version', plugin);
    this.name = 'UnsupportedApiError';
  }
}

class UnsupportedError extends PluginError {
  constructor (plugin) {
    super('Plugin does not support this version of Concordance', plugin);
    this.name = 'UnsupportedError';
  }
}

class DuplicateDescriptorTagError extends PluginError {
  constructor (tag, plugin) {
    super(`Could not add descriptor: tag ${String(tag)} has already been registered`, plugin);
    this.name = 'DuplicateDescriptorTagError';
    this.tag = tag;
  }
}

class DuplicateDescriptorIdError extends PluginError {
  constructor (id, plugin) {
    const printed = typeof id === 'number'
      ? `0x${id.toString(16).toUpperCase()}`
      : String(id);
    super(`Could not add descriptor: id ${printed} has already been registered`, plugin);
    this.name = 'DuplicateDescriptorIdError';
    this.id = id;
  }
}

function verify (plugin) {
  if (typeof plugin.name !== 'string' || !plugin.name) {
    throw new PluginTypeError('Plugin must have a `name`', plugin)
  }

  if (plugin.apiVersion !== API_VERSION) {
    throw new UnsupportedApiError(plugin)
  }

  if ('minimalConcordanceVersion' in plugin) {
    if (!semver$1.valid(plugin.minimalConcordanceVersion)) {
      throw new PluginTypeError('If specified, `minimalConcordanceVersion` must be a valid SemVer version', plugin)
    }

    const range = `>=${plugin.minimalConcordanceVersion}`;
    if (!semver$1.satisfies(CONCORDANCE_VERSION, range)) {
      throw new UnsupportedError(plugin)
    }
  }
}

// Selectively expose descriptor tags.
const publicDescriptorTags = Object.freeze({
  complexItem: item.complexTag,
  primitiveItem: item.primitiveTag,
  primitiveProperty: property.primitiveTag,
  string: string.tag,
});

// Don't expose `setDefaultGutter()`.
const publicLineBuilder = Object.freeze({
  buffer: lineBuilder.buffer,
  first: lineBuilder.first,
  last: lineBuilder.last,
  line: lineBuilder.line,
  single: lineBuilder.single,
  actual: Object.freeze({
    buffer: lineBuilder.actual.buffer,
    first: lineBuilder.actual.first,
    last: lineBuilder.actual.last,
    line: lineBuilder.actual.line,
    single: lineBuilder.actual.single,
  }),
  expected: Object.freeze({
    buffer: lineBuilder.expected.buffer,
    first: lineBuilder.expected.first,
    last: lineBuilder.expected.last,
    line: lineBuilder.expected.line,
    single: lineBuilder.expected.single,
  }),
});

function modifyTheme (descriptor, modifier) {
  themeUtils.addModifier(descriptor, modifier);
  return descriptor
}

function add (plugin) {
  verify(plugin);

  const name = plugin.name;
  if (registry.has(name)) return registry.get(name)

  const id2deserialize = new Map();
  const tag2id = new Map();
  const addDescriptor = (id, tag, deserialize) => {
    if (id2deserialize.has(id)) throw new DuplicateDescriptorIdError(id, plugin)
    if (descriptorRegistry.has(tag) || tag2id.has(tag)) throw new DuplicateDescriptorTagError(tag, plugin)

    id2deserialize.set(id, deserialize);
    tag2id.set(tag, id);
  };

  const tryDescribeValue = plugin.register({
    // Concordance makes assumptions about when AMBIGUOUS occurs. Do not expose
    // it to plugins.
    UNEQUAL: constants.UNEQUAL,
    SHALLOW_EQUAL: constants.SHALLOW_EQUAL,
    DEEP_EQUAL: constants.DEEP_EQUAL,

    ObjectValue: object.ObjectValue,
    DescribedMixin: object.DescribedMixin,
    DeserializedMixin: object.DeserializedMixin,

    addDescriptor,
    applyThemeModifiers: themeUtils.applyModifiers,
    descriptorTags: publicDescriptorTags,
    lineBuilder: publicLineBuilder,
    mapRecursor: recursorUtils.map,
    modifyTheme,
    wrapFromTheme: formatUtils.wrap,
  });

  const registered = {
    id2deserialize,
    serializerVersion: plugin.serializerVersion,
    name,
    tag2id,
    theme: plugin.theme || {},
    tryDescribeValue,
  };

  registry.set(name, registered);
  for (const tag of tag2id.keys()) {
    descriptorRegistry.set(tag, registered);
  }

  return registered
}
var add_1 = add;

function getDeserializers (plugins) {
  return plugins.map(plugin => {
    const registered = add(plugin);
    return {
      id2deserialize: registered.id2deserialize,
      name: registered.name,
      serializerVersion: registered.serializerVersion,
    }
  })
}
var getDeserializers_1 = getDeserializers;

function getThemes (plugins) {
  return plugins.map(plugin => {
    const registered = add(plugin);
    return {
      name: registered.name,
      theme: registered.theme,
    }
  })
}
var getThemes_1 = getThemes;

function getTryDescribeValues (plugins) {
  return plugins.map(plugin => add(plugin).tryDescribeValue)
}
var getTryDescribeValues_1 = getTryDescribeValues;

function resolveDescriptorRef (tag) {
  if (!descriptorRegistry.has(tag)) return null

  const registered = descriptorRegistry.get(tag);
  return {
    id: registered.tag2id.get(tag),
    name: registered.name,
    serialization: {
      serializerVersion: registered.serializerVersion,
    },
  }
}
var resolveDescriptorRef_1 = resolveDescriptorRef;

var pluginRegistry = {
	add: add_1,
	getDeserializers: getDeserializers_1,
	getThemes: getThemes_1,
	getTryDescribeValues: getTryDescribeValues_1,
	resolveDescriptorRef: resolveDescriptorRef_1
};

function freezeTheme (theme) {
  const queue = [theme];
  while (queue.length > 0) {
    const object = queue.shift();
    Object.freeze(object);

    for (const key of Object.keys(object)) {
      const value = object[key];
      if (value !== null && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return theme
}

const defaultTheme = freezeTheme({
  bigInt: { open: '', close: '' },
  boolean: { open: '', close: '' },
  circular: '[Circular]',
  date: {
    invalid: 'invalid',
    value: { open: '', close: '' },
  },
  diffGutters: {
    actual: '- ',
    expected: '+ ',
    padding: '  ',
  },
  error: {
    ctor: { open: '(', close: ')' },
    name: { open: '', close: '' },
  },
  function: {
    name: { open: '', close: '' },
    stringTag: { open: '', close: '' },
  },
  global: { open: '', close: '' },
  item: {
    after: ',',
    customFormat: null,
    increaseValueIndent: false,
  },
  list: { openBracket: '[', closeBracket: ']' },
  mapEntry: {
    after: ',',
    separator: ' => ',
  },
  maxDepth: '…',
  null: { open: '', close: '' },
  number: { open: '', close: '' },
  object: {
    openBracket: '{',
    closeBracket: '}',
    ctor: { open: '', close: '' },
    stringTag: { open: '@', close: '' },
    secondaryStringTag: { open: '@', close: '' },
  },
  property: {
    after: ',',
    customFormat: null,
    keyBracket: { open: '[', close: ']' },
    separator: ': ',
    increaseValueIndent: false,
  },
  regexp: {
    source: { open: '/', close: '/' },
    flags: { open: '', close: '' },
    separator: '---',
  },
  stats: { separator: '---' },
  string: {
    open: '',
    close: '',
    line: { open: "'", close: "'", escapeQuote: "'" },
    multiline: { start: '`', end: '`', escapeQuote: '``' },
    controlPicture: { open: '', close: '' },
    diff: {
      insert: { open: '', close: '' },
      delete: { open: '', close: '' },
      equal: { open: '', close: '' },
      insertLine: { open: '', close: '' },
      deleteLine: { open: '', close: '' },
    },
  },
  symbol: { open: '', close: '' },
  typedArray: {
    bytes: { open: '', close: '' },
  },
  undefined: { open: '', close: '' },
});

const pluginRefs = new Map();
pluginRefs.count = 0;
const normalizedPluginThemes = new Map();
function normalizePlugins (plugins) {
  if (!Array.isArray(plugins) || plugins.length === 0) return null

  const refs = [];
  const themes = [];
  for (const fromPlugin of pluginRegistry.getThemes(plugins)) {
    if (!pluginRefs.has(fromPlugin.name)) {
      pluginRefs.set(fromPlugin.name, pluginRefs.count++);
    }

    refs.push(pluginRefs.get(fromPlugin.name));
    themes.push(fromPlugin.theme);
  }

  const ref = refs.join('.');
  if (normalizedPluginThemes.has(ref)) {
    return {
      ref,
      theme: normalizedPluginThemes.get(ref),
    }
  }

  const theme = freezeTheme(themes.reduce((acc, pluginTheme) => {
    return merge_1(acc, pluginTheme)
  }, cloneDeep_1(defaultTheme)));
  normalizedPluginThemes.set(ref, theme);
  return { ref, theme }
}

const normalizedCache = new WeakMap();
function normalize (options) {
  options = Object.assign({ plugins: [], theme: null }, options);

  const normalizedPlugins = normalizePlugins(options.plugins);
  if (!options.theme) {
    return normalizedPlugins ? normalizedPlugins.theme : defaultTheme
  }

  const entry = normalizedCache.get(options.theme) || { theme: null, withPlugins: new Map() };
  if (!normalizedCache.has(options.theme)) normalizedCache.set(options.theme, entry);

  if (normalizedPlugins) {
    if (entry.withPlugins.has(normalizedPlugins.ref)) {
      return entry.withPlugins.get(normalizedPlugins.ref)
    }

    const theme = freezeTheme(merge_1(cloneDeep_1(normalizedPlugins.theme), options.theme));
    entry.withPlugins.set(normalizedPlugins.ref, theme);
    return theme
  }

  if (!entry.theme) {
    entry.theme = freezeTheme(merge_1(cloneDeep_1(defaultTheme), options.theme));
  }
  return entry.theme
}
var normalize_1 = normalize;

const modifiers = new WeakMap();
function addModifier (descriptor, modifier) {
  if (modifiers.has(descriptor)) {
    modifiers.get(descriptor).add(modifier);
  } else {
    modifiers.set(descriptor, new Set([modifier]));
  }
}
var addModifier_1 = addModifier;

const modifierCache = new WeakMap();
const originalCache = new WeakMap();
function applyModifiers (descriptor, theme) {
  if (!modifiers.has(descriptor)) return theme

  return Array.from(modifiers.get(descriptor)).reduce((prev, modifier) => {
    const cache = modifierCache.get(modifier) || new WeakMap();
    if (!modifierCache.has(modifier)) modifierCache.set(modifier, cache);

    if (cache.has(prev)) return cache.get(prev)

    const modifiedTheme = cloneDeep_1(prev);
    modifier(modifiedTheme);
    freezeTheme(modifiedTheme);
    cache.set(prev, modifiedTheme);
    originalCache.set(modifiedTheme, theme);
    return modifiedTheme
  }, theme)
}
var applyModifiers_1 = applyModifiers;

function applyModifiersToOriginal (descriptor, theme) {
  return applyModifiers(descriptor, originalCache.get(theme) || theme)
}
var applyModifiersToOriginal_1 = applyModifiersToOriginal;

var themeUtils = {
	normalize: normalize_1,
	addModifier: addModifier_1,
	applyModifiers: applyModifiers_1,
	applyModifiersToOriginal: applyModifiersToOriginal_1
};

const DEEP_EQUAL$a = constants.DEEP_EQUAL;
const UNEQUAL$h = constants.UNEQUAL;
const SHALLOW_EQUAL$6 = constants.SHALLOW_EQUAL;

function describe$g (keyDescriptor, valueDescriptor) {
  const keyIsPrimitive = keyDescriptor.isPrimitive === true;
  const valueIsPrimitive = valueDescriptor.isPrimitive === true;

  return new MapEntry(keyDescriptor, valueDescriptor, keyIsPrimitive, valueIsPrimitive)
}
var describe_1$g = describe$g;

function deserialize$g (state, recursor) {
  const keyIsPrimitive = state[0];
  const valueIsPrimitive = state[1];
  const keyDescriptor = recursor();
  const valueDescriptor = recursor();

  return new MapEntry(keyDescriptor, valueDescriptor, keyIsPrimitive, valueIsPrimitive)
}
var deserialize_1$e = deserialize$g;

const tag$g = Symbol('MapEntry');
var tag_1$g = tag$g;

function mergeWithKey (theme, key, values) {
  const lines = lineBuilder.buffer();
  const keyRemainder = lineBuilder.buffer();
  for (const line of key) {
    if (!line.isLast && !line.hasGutter) {
      lines.append(line);
    } else {
      keyRemainder.append(line);
    }
  }
  for (const value of values) {
    lines.append(keyRemainder.mergeWithInfix(theme.mapEntry.separator, value).withLastPostfixed(theme.mapEntry.after));
  }
  return lines
}

class MapEntry {
  constructor (key, value, keyIsPrimitive, valueIsPrimitive) {
    this.key = key;
    this.value = value;
    this.keyIsPrimitive = keyIsPrimitive;
    this.valueIsPrimitive = valueIsPrimitive;
  }

  createRecursor () {
    let emitKey = true;
    let emitValue = true;

    return () => {
      if (emitKey) {
        emitKey = false;
        return this.key
      }

      if (emitValue) {
        emitValue = false;
        return this.value
      }

      return null
    }
  }

  compare (expected) {
    if (this.tag !== expected.tag) return UNEQUAL$h
    if (this.keyIsPrimitive !== expected.keyIsPrimitive) return UNEQUAL$h
    if (this.valueIsPrimitive !== expected.valueIsPrimitive) return UNEQUAL$h

    if (!this.keyIsPrimitive) return SHALLOW_EQUAL$6

    const keyResult = this.key.compare(expected.key);
    if (keyResult !== DEEP_EQUAL$a) return keyResult

    if (!this.valueIsPrimitive) return SHALLOW_EQUAL$6
    return this.value.compare(expected.value)
  }

  formatDeep (theme, indent) {
    // Verify the map entry can be formatted directly.
    if (!this.keyIsPrimitive || typeof this.value.formatDeep !== 'function') return null

    // Since formatShallow() would result in theme modifiers being applied
    // before the key and value are formatted, do the same here.
    const value = this.value.formatDeep(themeUtils.applyModifiersToOriginal(this.value, theme), indent);
    if (value === null) return null

    const key = this.key.formatDeep(themeUtils.applyModifiersToOriginal(this.key, theme), indent);
    return mergeWithKey(theme, key, [value])
  }

  formatShallow (theme, indent) {
    let key = null;
    const values = [];
    return {
      append: (formatted, origin) => {
        if (this.key === origin) {
          key = formatted;
        } else {
          values.push(formatted);
        }
      },
      finalize () {
        return mergeWithKey(theme, key, values)
      },
    }
  }

  diffDeep (expected, theme, indent) {
    // Verify a diff can be returned.
    if (this.tag !== expected.tag || typeof this.value.diffDeep !== 'function') return null
    // Only use this logic to format value diffs when the keys are primitive and equal.
    if (!this.keyIsPrimitive || !expected.keyIsPrimitive || this.key.compare(expected.key) !== DEEP_EQUAL$a) {
      return null
    }

    // Since formatShallow() would result in theme modifiers being applied
    // before the key and value are formatted, do the same here.
    const diff = this.value.diffDeep(expected.value, themeUtils.applyModifiersToOriginal(this.value, theme), indent);
    if (diff === null) return null

    const key = this.key.formatDeep(themeUtils.applyModifiersToOriginal(this.key, theme), indent, '');
    return mergeWithKey(theme, key, [diff])
  }

  prepareDiff (expected, lhsRecursor, rhsRecursor, compareComplexShape, isCircular) {
    // Circular values cannot be compared. They must be treated as being unequal when diffing.
    if (isCircular(this.value) || isCircular(expected.value)) return { compareResult: UNEQUAL$h }

    const compareResult = this.compare(expected);
    const keysAreEqual = this.tag === expected.tag && this.key.compare(expected.key) === DEEP_EQUAL$a;
    // Short-circuit when keys and/or values are deeply equal.
    if (compareResult === DEEP_EQUAL$a || keysAreEqual) return { compareResult }

    // Try to line up this or remaining map entries with the expected entries.
    const lhsFork = recursorUtils.fork(lhsRecursor);
    const rhsFork = recursorUtils.fork(rhsRecursor);
    const initialExpected = expected;

    let expectedIsMissing = false;
    while (!expectedIsMissing && expected !== null && this.tag === expected.tag) {
      if (expected.keyIsPrimitive) {
        expectedIsMissing = this.key.compare(expected.key) !== UNEQUAL$h;
      } else {
        expectedIsMissing = compareComplexShape(this.key, expected.key) !== UNEQUAL$h;
      }

      expected = rhsFork.shared();
    }

    let actualIsExtraneous = false;
    if (this.tag === initialExpected.tag) {
      if (initialExpected.keyIsPrimitive) {
        let actual = this;
        while (!actualIsExtraneous && actual !== null && this.tag === actual.tag) {
          if (actual.keyIsPrimitive) {
            actualIsExtraneous = initialExpected.key.compare(actual.key) === DEEP_EQUAL$a;
          }

          actual = lhsFork.shared();
        }
      } else {
        let actual = this;
        while (!actualIsExtraneous && actual !== null && this.tag === actual.tag) {
          if (!actual.keyIsPrimitive) {
            actualIsExtraneous = compareComplexShape(actual.key, initialExpected.key) !== UNEQUAL$h;
          }

          actual = lhsFork.shared();
        }
      }
    }

    if (actualIsExtraneous && !expectedIsMissing) {
      return {
        actualIsExtraneous: true,
        lhsRecursor: lhsFork.recursor,
        rhsRecursor: recursorUtils.unshift(rhsFork.recursor, initialExpected),
      }
    }

    if (expectedIsMissing && !actualIsExtraneous) {
      return {
        expectedIsMissing: true,
        lhsRecursor: recursorUtils.unshift(lhsFork.recursor, this),
        rhsRecursor: rhsFork.recursor,
      }
    }

    let mustRecurse = false;
    if (!this.keyIsPrimitive && !initialExpected.keyIsPrimitive) {
      if (this.valueIsPrimitive || initialExpected.valueIsPrimitive) {
        mustRecurse = this.value.compare(initialExpected.value) !== UNEQUAL$h;
      } else {
        mustRecurse = compareComplexShape(this.value, initialExpected.value) !== UNEQUAL$h;
      }
    }

    return {
      mustRecurse,
      isUnequal: !mustRecurse,
      lhsRecursor: lhsFork.recursor,
      rhsRecursor: rhsFork.recursor,
    }
  }

  serialize () {
    return [this.keyIsPrimitive, this.valueIsPrimitive]
  }
}
Object.defineProperty(MapEntry.prototype, 'isMapEntry', { value: true });
Object.defineProperty(MapEntry.prototype, 'tag', { value: tag$g });

var mapEntry = {
	describe: describe_1$g,
	deserialize: deserialize_1$e,
	tag: tag_1$g
};

const DEEP_EQUAL$b = constants.DEEP_EQUAL;
const UNEQUAL$i = constants.UNEQUAL;

function describe$h (value) {
  return new BigIntValue(value)
}
var describe_1$h = describe$h;

var deserialize$h = describe$h;

const tag$h = Symbol('BigIntValue');
var tag_1$h = tag$h;

class BigIntValue {
  constructor (value) {
    this.value = value;
  }

  compare (expected) {
    return expected.tag === tag$h && Object.is(this.value, expected.value)
      ? DEEP_EQUAL$b
      : UNEQUAL$i
  }

  formatDeep (theme) {
    return lineBuilder.single(formatUtils.wrap(theme.bigInt, `${this.value}n`))
  }

  serialize () {
    return this.value
  }
}
Object.defineProperty(BigIntValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(BigIntValue.prototype, 'tag', { value: tag$h });

var bigInt = {
	describe: describe_1$h,
	deserialize: deserialize$h,
	tag: tag_1$h
};

const DEEP_EQUAL$c = constants.DEEP_EQUAL;
const UNEQUAL$j = constants.UNEQUAL;

function describe$i (value) {
  return new BooleanValue(value)
}
var describe_1$i = describe$i;

var deserialize$i = describe$i;

const tag$i = Symbol('BooleanValue');
var tag_1$i = tag$i;

class BooleanValue {
  constructor (value) {
    this.value = value;
  }

  compare (expected) {
    return this.tag === expected.tag && this.value === expected.value
      ? DEEP_EQUAL$c
      : UNEQUAL$j
  }

  formatDeep (theme) {
    return lineBuilder.single(formatUtils.wrap(theme.boolean, this.value === true ? 'true' : 'false'))
  }

  serialize () {
    return this.value
  }
}
Object.defineProperty(BooleanValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(BooleanValue.prototype, 'tag', { value: tag$i });

var boolean_1 = {
	describe: describe_1$i,
	deserialize: deserialize$i,
	tag: tag_1$i
};

const DEEP_EQUAL$d = constants.DEEP_EQUAL;
const UNEQUAL$k = constants.UNEQUAL;

function describe$j () {
  return new NullValue()
}
var describe_1$j = describe$j;

var deserialize$j = describe$j;

const tag$j = Symbol('NullValue');
var tag_1$j = tag$j;

class NullValue {
  compare (expected) {
    return expected.tag === tag$j
      ? DEEP_EQUAL$d
      : UNEQUAL$k
  }

  formatDeep (theme) {
    return lineBuilder.single(formatUtils.wrap(theme.null, 'null'))
  }
}
Object.defineProperty(NullValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(NullValue.prototype, 'tag', { value: tag$j });

var _null = {
	describe: describe_1$j,
	deserialize: deserialize$j,
	tag: tag_1$j
};

const DEEP_EQUAL$e = constants.DEEP_EQUAL;
const UNEQUAL$l = constants.UNEQUAL;

function describe$k (value) {
  return new NumberValue(value)
}
var describe_1$k = describe$k;

var deserialize$k = describe$k;

const tag$k = Symbol('NumberValue');
var tag_1$k = tag$k;

class NumberValue {
  constructor (value) {
    this.value = value;
  }

  compare (expected) {
    return expected.tag === tag$k && Object.is(this.value, expected.value)
      ? DEEP_EQUAL$e
      : UNEQUAL$l
  }

  formatDeep (theme) {
    const string = Object.is(this.value, -0) ? '-0' : String(this.value);
    return lineBuilder.single(formatUtils.wrap(theme.number, string))
  }

  serialize () {
    return this.value
  }
}
Object.defineProperty(NumberValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(NumberValue.prototype, 'tag', { value: tag$k });

var number = {
	describe: describe_1$k,
	deserialize: deserialize$k,
	tag: tag_1$k
};

const DEEP_EQUAL$f = constants.DEEP_EQUAL;
const UNEQUAL$m = constants.UNEQUAL;

function describe$l () {
  return new UndefinedValue()
}
var describe_1$l = describe$l;

var deserialize$l = describe$l;

const tag$l = Symbol('UndefinedValue');
var tag_1$l = tag$l;

class UndefinedValue {
  compare (expected) {
    return expected.tag === tag$l
      ? DEEP_EQUAL$f
      : UNEQUAL$m
  }

  formatDeep (theme) {
    return lineBuilder.single(formatUtils.wrap(theme.undefined, 'undefined'))
  }
}
Object.defineProperty(UndefinedValue.prototype, 'isPrimitive', { value: true });
Object.defineProperty(UndefinedValue.prototype, 'tag', { value: tag$l });

var _undefined = {
	describe: describe_1$l,
	deserialize: deserialize$l,
	tag: tag_1$l
};

const DEEP_EQUAL$g = constants.DEEP_EQUAL;
const SHALLOW_EQUAL$7 = constants.SHALLOW_EQUAL;
const UNEQUAL$n = constants.UNEQUAL;

class Comparable {
  constructor (properties) {
    this.properties = properties;
    this.ordered = properties.slice();
  }

  createRecursor () {
    const length = this.ordered.length;
    let index = 0;
    return () => {
      if (index === length) return null

      return this.ordered[index++]
    }
  }

  compare (expected) {
    if (this.properties.length !== expected.properties.length) return UNEQUAL$n

    // Compare property keys, reordering the expected properties in the process
    // so values can be compared if all keys are equal.
    const ordered = [];
    const processed = new Set();
    for (const property of this.properties) {
      let extraneous = true;
      for (const other of expected.properties) {
        if (processed.has(other.key)) continue

        if (property.key.compare(other.key) === DEEP_EQUAL$g) {
          extraneous = false;
          processed.add(other.key);
          ordered.push(other);
          break
        }
      }

      if (extraneous) return UNEQUAL$n
    }
    expected.ordered = ordered;

    return SHALLOW_EQUAL$7
  }

  prepareDiff (expected) {
    // Reorder the expected properties before recursion starts.
    const missingProperties = [];
    const ordered = [];
    const processed = new Set();
    for (const other of expected.properties) {
      let missing = true;
      for (const property of this.properties) {
        if (processed.has(property.key)) continue

        if (property.key.compare(other.key) === DEEP_EQUAL$g) {
          missing = false;
          processed.add(property.key);
          ordered.push(other);
          break
        }
      }

      if (missing) {
        missingProperties.push(other);
      }
    }
    expected.ordered = ordered.concat(missingProperties);

    return { mustRecurse: true }
  }
}
Object.defineProperty(Comparable.prototype, 'isSymbolPropertiesComparable', { value: true });

class Collector {
  constructor (firstProperty, recursor) {
    this.properties = [firstProperty];
    this.recursor = recursor;
    this.remainder = null;
  }

  collectAll () {
    do {
      const next = this.recursor();
      if (next && next.isProperty === true) { // All properties will have symbol keys
        this.properties.push(next);
      } else {
        return next
      }
    } while (true)
  }

  createRecursor () {
    return recursorUtils.singleValue(new Comparable(this.properties))
  }
}
Object.defineProperty(Collector.prototype, 'isSymbolPropertiesCollector', { value: true });

class Indenter {
  constructor (level, step) {
    this.level = level;
    this.step = step;
    this.value = step.repeat(level);
  }

  increase () {
    return new Indenter(this.level + 1, this.step)
  }

  decrease () {
    return new Indenter(this.level - 1, this.step)
  }

  toString () {
    return this.value
  }
}
var Indenter_1 = Indenter;

const fixedIndent = new Indenter_1(0, '  ');

/** Built-in value references. */
var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

const UNEQUAL$o = constants.UNEQUAL;

function describe$m (index) {
  return new Pointer(index)
}
var describe_1$m = describe$m;

var deserialize$m = describe$m;

const tag$m = Symbol('Pointer');
var tag_1$m = tag$m;

class Pointer {
  constructor (index) {
    this.index = index;
  }

  // Pointers cannot be compared, and are not expected to be part of the
  // comparisons.
  compare (expected) {
    return UNEQUAL$o
  }

  serialize () {
    return this.index
  }
}
Object.defineProperty(Pointer.prototype, 'isPointer', { value: true });
Object.defineProperty(Pointer.prototype, 'tag', { value: tag$m });

var pointer = {
	describe: describe_1$m,
	deserialize: deserialize$m,
	tag: tag_1$m
};

// Adding or removing mappings or changing an index requires the version in
// encoder.js to be bumped, which necessitates a major version bump of
// Concordance itself. Indexes are hexadecimal to make reading the binary
// output easier.
const mappings = [
  [0x01, bigInt.tag, bigInt.deserialize],
  [0x02, boolean_1.tag, boolean_1.deserialize],
  [0x03, _null.tag, _null.deserialize],
  [0x04, number.tag, number.deserialize],
  [0x05, string.tag, string.deserialize],
  [0x06, symbol.tag, symbol.deserialize],
  [0x07, _undefined.tag, _undefined.deserialize],

  [0x08, object.tag, object.deserialize],
  [0x09, stats.iterableTag, stats.deserializeIterableStats],
  [0x0A, stats.listTag, stats.deserializeListStats],
  [0x0B, item.complexTag, item.deserializeComplex],
  [0x0C, item.primitiveTag, item.deserializePrimitive],
  [0x0D, stats.propertyTag, stats.deserializePropertyStats],
  [0x0E, property.complexTag, property.deserializeComplex],
  [0x0F, property.primitiveTag, property.deserializePrimitive],
  [0x10, pointer.tag, pointer.deserialize],

  [0x11, map$1.tag, map$1.deserialize],
  [0x12, mapEntry.tag, mapEntry.deserialize],

  [0x13, _arguments.tag, _arguments.deserialize],
  [0x14, arrayBuffer.tag, arrayBuffer.deserialize],
  [0x15, boxed.tag, boxed.deserialize],
  [0x16, dataView.tag, dataView.deserialize],
  [0x17, date.tag, date.deserialize],
  [0x18, error.tag, error.deserialize],
  [0x19, _function.tag, _function.deserialize],
  [0x1A, global$1.tag, global$1.deserialize],
  [0x1B, promise.tag, promise.deserialize],
  [0x1C, regexp.tag, regexp.deserialize],
  [0x1D, set.tag, set.deserialize],
  [0x1E, typedArray.tag, typedArray.deserialize],
  [0x1F, typedArray.bytesTag, typedArray.deserializeBytes],
];
const tag2id = new Map(mappings.map(mapping => [mapping[1], mapping[0]]));
const id2deserialize = new Map(mappings.map(mapping => [mapping[0], mapping[2]]));

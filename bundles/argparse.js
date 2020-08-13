import util from 'util';
import path from 'path';
import fs from 'fs';

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

var sprintf = createCommonjsModule(function (module, exports) {
(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache;
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key);
        }
        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = "";
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i]);
            if (node_type === "string") {
                output[output.length] = parse_tree[i];
            }
            else if (node_type === "array") {
                match = parse_tree[i]; // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]];
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]];
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (get_type(arg) == "function") {
                    arg = arg();
                }

                if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0;
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2);
                    break
                    case "c":
                        arg = String.fromCharCode(arg);
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10);
                    break
                    case "j":
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0);
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                    break
                    case "g":
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg);
                    break
                    case "o":
                        arg = arg.toString(8);
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
                    break
                    case "u":
                        arg = arg >>> 0;
                    break
                    case "x":
                        arg = arg.toString(16);
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase();
                    break
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg;
                }
                else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? "+" : "-";
                        arg = arg.toString().replace(re.sign, "");
                    }
                    else {
                        sign = "";
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " ";
                    pad_length = match[6] - (sign + arg).length;
                    pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : "";
                    output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output.join("")
    };

    sprintf.cache = {};

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0];
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%";
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [], replacement_field = match[2], field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1];
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list;
                }
                else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match;
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return parse_tree
    };

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0);
        _argv.splice(0, 0, fmt);
        return sprintf.apply(null, _argv)
    };

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    {
        exports.sprintf = sprintf;
        exports.vsprintf = vsprintf;
    }
})();
});

//

var EOL = '\n';

var SUPPRESS = '==SUPPRESS==';

var OPTIONAL = '?';

var ZERO_OR_MORE = '*';

var ONE_OR_MORE = '+';

var PARSER = 'A...';

var REMAINDER = '...';

var _UNRECOGNIZED_ARGS_ATTR = '_unrecognized_args';

var _const = {
	EOL: EOL,
	SUPPRESS: SUPPRESS,
	OPTIONAL: OPTIONAL,
	ZERO_OR_MORE: ZERO_OR_MORE,
	ONE_OR_MORE: ONE_OR_MORE,
	PARSER: PARSER,
	REMAINDER: REMAINDER,
	_UNRECOGNIZED_ARGS_ATTR: _UNRECOGNIZED_ARGS_ATTR
};

var repeat = function (str, num) {
  var result = '';
  for (var i = 0; i < num; i++) { result += str; }
  return result;
};

var arrayEqual = function (a, b) {
  if (a.length !== b.length) { return false; }
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { return false; }
  }
  return true;
};

var trimChars = function (str, chars) {
  var start = 0;
  var end = str.length - 1;
  while (chars.indexOf(str.charAt(start)) >= 0) { start++; }
  while (chars.indexOf(str.charAt(end)) >= 0) { end--; }
  return str.slice(start, end + 1);
};

var capitalize = function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

var arrayUnion = function () {
  var result = [];
  for (var i = 0, values = {}; i < arguments.length; i++) {
    var arr = arguments[i];
    for (var j = 0; j < arr.length; j++) {
      if (!values[arr[j]]) {
        values[arr[j]] = true;
        result.push(arr[j]);
      }
    }
  }
  return result;
};

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

var has_1 = has;

var extend = function (dest, src) {
  for (var i in src) {
    if (has(src, i)) { dest[i] = src[i]; }
  }
};

var trimEnd = function (str) {
  return str.replace(/\s+$/g, '');
};

var utils = {
	repeat: repeat,
	arrayEqual: arrayEqual,
	trimChars: trimChars,
	capitalize: capitalize,
	arrayUnion: arrayUnion,
	has: has_1,
	extend: extend,
	trimEnd: trimEnd
};

var action = createCommonjsModule(function (module) {


// Constants



/**
 * new Action(options)
 *
 * Base class for all actions. Used only for inherits
 *
 *
 * ##### Options:
 *
 * - `optionStrings`  A list of command-line option strings for the action.
 * - `dest`  Attribute to hold the created object(s)
 * - `nargs`  The number of command-line arguments that should be consumed.
 * By default, one argument will be consumed and a single value will be
 * produced.
 * - `constant`  Default value for an action with no value.
 * - `defaultValue`  The value to be produced if the option is not specified.
 * - `type`  Cast to 'string'|'int'|'float'|'complex'|function (string). If
 * None, 'string'.
 * - `choices`  The choices available.
 * - `required`  True if the action must always be specified at the command
 * line.
 * - `help`  The help describing the argument.
 * - `metavar`  The name to be used for the option's argument with the help
 * string. If None, the 'dest' value will be used as the name.
 *
 * ##### nargs supported values:
 *
 * - `N` (an integer) consumes N arguments (and produces a list)
 * - `?`  consumes zero or one arguments
 * - `*` consumes zero or more arguments (and produces a list)
 * - `+` consumes one or more arguments (and produces a list)
 *
 * Note: that the difference between the default and nargs=1 is that with the
 * default, a single value will be produced, while with nargs=1, a list
 * containing a single value will be produced.
 **/
var Action = module.exports = function Action(options) {
  options = options || {};
  this.optionStrings = options.optionStrings || [];
  this.dest = options.dest;
  this.nargs = typeof options.nargs !== 'undefined' ? options.nargs : null;
  this.constant = typeof options.constant !== 'undefined' ? options.constant : null;
  this.defaultValue = options.defaultValue;
  this.type = typeof options.type !== 'undefined' ? options.type : null;
  this.choices = typeof options.choices !== 'undefined' ? options.choices : null;
  this.required = typeof options.required !== 'undefined' ? options.required : false;
  this.help = typeof options.help !== 'undefined' ? options.help : null;
  this.metavar = typeof options.metavar !== 'undefined' ? options.metavar : null;

  if (!(this.optionStrings instanceof Array)) {
    throw new Error('optionStrings should be an array');
  }
  if (typeof this.required !== 'undefined' && typeof this.required !== 'boolean') {
    throw new Error('required should be a boolean');
  }
};

/**
 * Action#getName -> String
 *
 * Tells action name
 **/
Action.prototype.getName = function () {
  if (this.optionStrings.length > 0) {
    return this.optionStrings.join('/');
  } else if (this.metavar !== null && this.metavar !== _const.SUPPRESS) {
    return this.metavar;
  } else if (typeof this.dest !== 'undefined' && this.dest !== _const.SUPPRESS) {
    return this.dest;
  }
  return null;
};

/**
 * Action#isOptional -> Boolean
 *
 * Return true if optional
 **/
Action.prototype.isOptional = function () {
  return !this.isPositional();
};

/**
 * Action#isPositional -> Boolean
 *
 * Return true if positional
 **/
Action.prototype.isPositional = function () {
  return (this.optionStrings.length === 0);
};

/**
 * Action#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Should be implemented in inherited classes
 *
 * ##### Example
 *
 *      ActionCount.prototype.call = function (parser, namespace, values, optionString) {
 *        namespace.set(this.dest, (namespace[this.dest] || 0) + 1);
 *      };
 *
 **/
Action.prototype.call = function () {
  throw new Error('.call() not defined');// Not Implemented error
};
});

var help = createCommonjsModule(function (module) {





// Constants


/*:nodoc:*
 * new ActionHelp(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionHelp = module.exports = function ActionHelp(options) {
  options = options || {};
  if (options.defaultValue !== null) {
    options.defaultValue = options.defaultValue;
  } else {
    options.defaultValue = _const.SUPPRESS;
  }
  options.dest = (options.dest !== null ? options.dest : _const.SUPPRESS);
  options.nargs = 0;
  action.call(this, options);

};
util.inherits(ActionHelp, action);

/*:nodoc:*
 * ActionHelp#call(parser, namespace, values, optionString)
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Print help and exit
 **/
ActionHelp.prototype.call = function (parser) {
  parser.printHelp();
  parser.exit();
};
});

var append = createCommonjsModule(function (module) {





// Constants


/*:nodoc:*
 * new ActionAppend(options)
 * - options (object): options hash see [[Action.new]]
 *
 * Note: options.nargs should be optional for constants
 * and more then zero for other
 **/
var ActionAppend = module.exports = function ActionAppend(options) {
  options = options || {};
  if (this.nargs <= 0) {
    throw new Error('nargs for append actions must be > 0; if arg ' +
        'strings are not supplying the value to append, ' +
        'the append const action may be more appropriate');
  }
  if (!!this.constant && this.nargs !== _const.OPTIONAL) {
    throw new Error('nargs must be OPTIONAL to supply const');
  }
  action.call(this, options);
};
util.inherits(ActionAppend, action);

/*:nodoc:*
 * ActionAppend#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Save result in namespace object
 **/
ActionAppend.prototype.call = function (parser, namespace, values) {
  var items = (namespace[this.dest] || []).slice();
  items.push(values);
  namespace.set(this.dest, items);
};
});

var constant = createCommonjsModule(function (module) {





/*:nodoc:*
 * new ActionAppendConstant(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionAppendConstant = module.exports = function ActionAppendConstant(options) {
  options = options || {};
  options.nargs = 0;
  if (typeof options.constant === 'undefined') {
    throw new Error('constant option is required for appendAction');
  }
  action.call(this, options);
};
util.inherits(ActionAppendConstant, action);

/*:nodoc:*
 * ActionAppendConstant#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Save result in namespace object
 **/
ActionAppendConstant.prototype.call = function (parser, namespace) {
  var items = [].concat(namespace[this.dest] || []);
  items.push(this.constant);
  namespace.set(this.dest, items);
};
});

var count = createCommonjsModule(function (module) {





/*:nodoc:*
 * new ActionCount(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionCount = module.exports = function ActionCount(options) {
  options = options || {};
  options.nargs = 0;

  action.call(this, options);
};
util.inherits(ActionCount, action);

/*:nodoc:*
 * ActionCount#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Save result in namespace object
 **/
ActionCount.prototype.call = function (parser, namespace) {
  namespace.set(this.dest, (namespace[this.dest] || 0) + 1);
};
});

var store = createCommonjsModule(function (module) {





// Constants



/*:nodoc:*
 * new ActionStore(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionStore = module.exports = function ActionStore(options) {
  options = options || {};
  if (this.nargs <= 0) {
    throw new Error('nargs for store actions must be > 0; if you ' +
        'have nothing to store, actions such as store ' +
        'true or store const may be more appropriate');

  }
  if (typeof this.constant !== 'undefined' && this.nargs !== _const.OPTIONAL) {
    throw new Error('nargs must be OPTIONAL to supply const');
  }
  action.call(this, options);
};
util.inherits(ActionStore, action);

/*:nodoc:*
 * ActionStore#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Save result in namespace object
 **/
ActionStore.prototype.call = function (parser, namespace, values) {
  namespace.set(this.dest, values);
};
});

var constant$1 = createCommonjsModule(function (module) {





/*:nodoc:*
 * new ActionStoreConstant(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionStoreConstant = module.exports = function ActionStoreConstant(options) {
  options = options || {};
  options.nargs = 0;
  if (typeof options.constant === 'undefined') {
    throw new Error('constant option is required for storeAction');
  }
  action.call(this, options);
};
util.inherits(ActionStoreConstant, action);

/*:nodoc:*
 * ActionStoreConstant#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Save result in namespace object
 **/
ActionStoreConstant.prototype.call = function (parser, namespace) {
  namespace.set(this.dest, this.constant);
};
});

var _true = createCommonjsModule(function (module) {





/*:nodoc:*
 * new ActionStoreTrue(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionStoreTrue = module.exports = function ActionStoreTrue(options) {
  options = options || {};
  options.constant = true;
  options.defaultValue = options.defaultValue !== null ? options.defaultValue : false;
  constant$1.call(this, options);
};
util.inherits(ActionStoreTrue, constant$1);
});

var _false = createCommonjsModule(function (module) {





/*:nodoc:*
 * new ActionStoreFalse(options)
 * - options (object): hash of options see [[Action.new]]
 *
 **/
var ActionStoreFalse = module.exports = function ActionStoreFalse(options) {
  options = options || {};
  options.constant = false;
  options.defaultValue = options.defaultValue !== null ? options.defaultValue : true;
  constant$1.call(this, options);
};
util.inherits(ActionStoreFalse, constant$1);
});

var version = createCommonjsModule(function (module) {





//
// Constants
//


/*:nodoc:*
 * new ActionVersion(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
var ActionVersion = module.exports = function ActionVersion(options) {
  options = options || {};
  options.defaultValue = (options.defaultValue ? options.defaultValue : _const.SUPPRESS);
  options.dest = (options.dest || _const.SUPPRESS);
  options.nargs = 0;
  this.version = options.version;
  action.call(this, options);
};
util.inherits(ActionVersion, action);

/*:nodoc:*
 * ActionVersion#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Print version and exit
 **/
ActionVersion.prototype.call = function (parser) {
  var version = this.version || parser.version;
  var formatter = parser._getFormatter();
  formatter.addText(version);
  parser.exit(0, formatter.formatHelp());
};
});

var format  = util.format;


var ERR_CODE = 'ARGError';

/*:nodoc:*
 * argumentError(argument, message) -> TypeError
 * - argument (Object): action with broken argument
 * - message (String): error message
 *
 * Error format helper. An error from creating or using an argument
 * (optional or positional). The string value of this exception
 * is the message, augmented with information
 * about the argument that caused it.
 *
 * #####Example
 *
 *      var argumentErrorHelper = require('./argument/error');
 *      if (conflictOptionals.length > 0) {
 *        throw argumentErrorHelper(
 *          action,
 *          format('Conflicting option string(s): %s', conflictOptionals.join(', '))
 *        );
 *      }
 *
 **/
var error = function (argument, message) {
  var argumentName = null;
  var errMessage;
  var err;

  if (argument.getName) {
    argumentName = argument.getName();
  } else {
    argumentName = '' + argument;
  }

  if (!argumentName) {
    errMessage = message;
  } else {
    errMessage = format('argument "%s": %s', argumentName, message);
  }

  err = new TypeError(errMessage);
  err.code = ERR_CODE;
  return err;
};

var format$1  = util.format;




// Constants


// Errors



/*:nodoc:*
 * new ChoicesPseudoAction(name, help)
 *
 * Create pseudo action for correct help text
 *
 **/
function ChoicesPseudoAction(name, help) {
  var options = {
    optionStrings: [],
    dest: name,
    help: help
  };

  action.call(this, options);
}

util.inherits(ChoicesPseudoAction, action);

/**
 * new ActionSubparsers(options)
 * - options (object): options hash see [[Action.new]]
 *
 **/
function ActionSubparsers(options) {
  options = options || {};
  options.dest = options.dest || _const.SUPPRESS;
  options.nargs = _const.PARSER;

  this.debug = (options.debug === true);

  this._progPrefix = options.prog;
  this._parserClass = options.parserClass;
  this._nameParserMap = {};
  this._choicesActions = [];

  options.choices = this._nameParserMap;
  action.call(this, options);
}

util.inherits(ActionSubparsers, action);

/*:nodoc:*
 * ActionSubparsers#addParser(name, options) -> ArgumentParser
 * - name (string): sub-command name
 * - options (object): see [[ArgumentParser.new]]
 *
 *  Note:
 *  addParser supports an additional aliases option,
 *  which allows multiple strings to refer to the same subparser.
 *  This example, like svn, aliases co as a shorthand for checkout
 *
 **/
ActionSubparsers.prototype.addParser = function (name, options) {
  var parser;

  var self = this;

  options = options || {};

  options.debug = (this.debug === true);

  // set program from the existing prefix
  if (!options.prog) {
    options.prog = this._progPrefix + ' ' + name;
  }

  var aliases = options.aliases || [];

  // create a pseudo-action to hold the choice help
  if (!!options.help || typeof options.help === 'string') {
    var help = options.help;
    delete options.help;

    var choiceAction = new ChoicesPseudoAction(name, help);
    this._choicesActions.push(choiceAction);
  }

  // create the parser and add it to the map
  parser = new this._parserClass(options);
  this._nameParserMap[name] = parser;

  // make parser available under aliases also
  aliases.forEach(function (alias) {
    self._nameParserMap[alias] = parser;
  });

  return parser;
};

ActionSubparsers.prototype._getSubactions = function () {
  return this._choicesActions;
};

/*:nodoc:*
 * ActionSubparsers#call(parser, namespace, values, optionString) -> Void
 * - parser (ArgumentParser): current parser
 * - namespace (Namespace): namespace for output data
 * - values (Array): parsed values
 * - optionString (Array): input option string(not parsed)
 *
 * Call the action. Parse input aguments
 **/
ActionSubparsers.prototype.call = function (parser, namespace, values) {
  var parserName = values[0];
  var argStrings = values.slice(1);

  // set the parser name if requested
  if (this.dest !== _const.SUPPRESS) {
    namespace[this.dest] = parserName;
  }

  // select the parser
  if (this._nameParserMap[parserName]) {
    parser = this._nameParserMap[parserName];
  } else {
    throw error(format$1(
      'Unknown parser "%s" (choices: [%s]).',
        parserName,
        Object.keys(this._nameParserMap).join(', ')
    ));
  }

  // parse all the remaining options into the namespace
  parser.parseArgs(argStrings, namespace);
};

var subparsers = ActionSubparsers;

var group = createCommonjsModule(function (module) {






/**
 * new ArgumentGroup(container, options)
 * - container (object): main container
 * - options (object): hash of group options
 *
 * #### options
 * - **prefixChars**  group name prefix
 * - **argumentDefault**  default argument value
 * - **title**  group title
 * - **description** group description
 *
 **/
var ArgumentGroup = module.exports = function ArgumentGroup(container, options) {

  options = options || {};

  // add any missing keyword arguments by checking the container
  options.conflictHandler = (options.conflictHandler || container.conflictHandler);
  options.prefixChars = (options.prefixChars || container.prefixChars);
  options.argumentDefault = (options.argumentDefault || container.argumentDefault);

  action_container.call(this, options);

  // group attributes
  this.title = options.title;
  this._groupActions = [];

  // share most attributes with the container
  this._container = container;
  this._registries = container._registries;
  this._actions = container._actions;
  this._optionStringActions = container._optionStringActions;
  this._defaults = container._defaults;
  this._hasNegativeNumberOptionals = container._hasNegativeNumberOptionals;
  this._mutuallyExclusiveGroups = container._mutuallyExclusiveGroups;
};
util.inherits(ArgumentGroup, action_container);


ArgumentGroup.prototype._addAction = function (action) {
  // Parent add action
  action = action_container.prototype._addAction.call(this, action);
  this._groupActions.push(action);
  return action;
};


ArgumentGroup.prototype._removeAction = function (action) {
  // Parent remove action
  action_container.prototype._removeAction.call(this, action);
  var actionIndex = this._groupActions.indexOf(action);
  if (actionIndex >= 0) {
    this._groupActions.splice(actionIndex, 1);
  }
};
});

var exclusive = createCommonjsModule(function (module) {





/**
 * new MutuallyExclusiveGroup(container, options)
 * - container (object): main container
 * - options (object): options.required -> true/false
 *
 * `required` could be an argument itself, but making it a property of
 * the options argument is more consistent with the JS adaptation of the Python)
 **/
var MutuallyExclusiveGroup = module.exports = function MutuallyExclusiveGroup(container, options) {
  var required;
  options = options || {};
  required = options.required || false;
  group.call(this, container);
  this.required = required;

};
util.inherits(MutuallyExclusiveGroup, group);


MutuallyExclusiveGroup.prototype._addAction = function (action) {
  var msg;
  if (action.required) {
    msg = 'mutually exclusive arguments must be optional';
    throw new Error(msg);
  }
  action = this._container._addAction(action);
  this._groupActions.push(action);
  return action;
};


MutuallyExclusiveGroup.prototype._removeAction = function (action) {
  this._container._removeAction(action);
  this._groupActions.remove(action);
};
});

var action_container = createCommonjsModule(function (module) {

var format = util.format;

// Constants




//Actions











// Errors


/**
 * new ActionContainer(options)
 *
 * Action container. Parent for [[ArgumentParser]] and [[ArgumentGroup]]
 *
 * ##### Options:
 *
 * - `description` -- A description of what the program does
 * - `prefixChars`  -- Characters that prefix optional arguments
 * - `argumentDefault`  -- The default value for all arguments
 * - `conflictHandler` -- The conflict handler to use for duplicate arguments
 **/
var ActionContainer = module.exports = function ActionContainer(options) {
  options = options || {};

  this.description = options.description;
  this.argumentDefault = options.argumentDefault;
  this.prefixChars = options.prefixChars || '';
  this.conflictHandler = options.conflictHandler;

  // set up registries
  this._registries = {};

  // register actions
  this.register('action', null, store);
  this.register('action', 'store', store);
  this.register('action', 'storeConst', constant$1);
  this.register('action', 'storeTrue', _true);
  this.register('action', 'storeFalse', _false);
  this.register('action', 'append', append);
  this.register('action', 'appendConst', constant);
  this.register('action', 'count', count);
  this.register('action', 'help', help);
  this.register('action', 'version', version);
  this.register('action', 'parsers', subparsers);

  // raise an exception if the conflict handler is invalid
  this._getHandler();

  // action storage
  this._actions = [];
  this._optionStringActions = {};

  // groups
  this._actionGroups = [];
  this._mutuallyExclusiveGroups = [];

  // defaults storage
  this._defaults = {};

  // determines whether an "option" looks like a negative number
  // -1, -1.5 -5e+4
  this._regexpNegativeNumber = new RegExp('^[-]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$');

  // whether or not there are any optionals that look like negative
  // numbers -- uses a list so it can be shared and edited
  this._hasNegativeNumberOptionals = [];
};

// Groups must be required, then ActionContainer already defined



//
// Registration methods
//

/**
 * ActionContainer#register(registryName, value, object) -> Void
 * - registryName (String) : object type action|type
 * - value (string) : keyword
 * - object (Object|Function) : handler
 *
 *  Register handlers
 **/
ActionContainer.prototype.register = function (registryName, value, object) {
  this._registries[registryName] = this._registries[registryName] || {};
  this._registries[registryName][value] = object;
};

ActionContainer.prototype._registryGet = function (registryName, value, defaultValue) {
  if (arguments.length < 3) {
    defaultValue = null;
  }
  return this._registries[registryName][value] || defaultValue;
};

//
// Namespace default accessor methods
//

/**
 * ActionContainer#setDefaults(options) -> Void
 * - options (object):hash of options see [[Action.new]]
 *
 * Set defaults
 **/
ActionContainer.prototype.setDefaults = function (options) {
  options = options || {};
  for (var property in options) {
    if (utils.has(options, property)) {
      this._defaults[property] = options[property];
    }
  }

  // if these defaults match any existing arguments, replace the previous
  // default on the object with the new one
  this._actions.forEach(function (action) {
    if (utils.has(options, action.dest)) {
      action.defaultValue = options[action.dest];
    }
  });
};

/**
 * ActionContainer#getDefault(dest) -> Mixed
 * - dest (string): action destination
 *
 * Return action default value
 **/
ActionContainer.prototype.getDefault = function (dest) {
  var result = utils.has(this._defaults, dest) ? this._defaults[dest] : null;

  this._actions.forEach(function (action) {
    if (action.dest === dest && utils.has(action, 'defaultValue')) {
      result = action.defaultValue;
    }
  });

  return result;
};
//
// Adding argument actions
//

/**
 * ActionContainer#addArgument(args, options) -> Object
 * - args (String|Array): argument key, or array of argument keys
 * - options (Object): action objects see [[Action.new]]
 *
 * #### Examples
 * - addArgument([ '-f', '--foo' ], { action: 'store', defaultValue: 1, ... })
 * - addArgument([ 'bar' ], { action: 'store', nargs: 1, ... })
 * - addArgument('--baz', { action: 'store', nargs: 1, ... })
 **/
ActionContainer.prototype.addArgument = function (args, options) {
  args = args;
  options = options || {};

  if (typeof args === 'string') {
    args = [ args ];
  }
  if (!Array.isArray(args)) {
    throw new TypeError('addArgument first argument should be a string or an array');
  }
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('addArgument second argument should be a hash');
  }

  // if no positional args are supplied or only one is supplied and
  // it doesn't look like an option string, parse a positional argument
  if (!args || args.length === 1 && this.prefixChars.indexOf(args[0][0]) < 0) {
    if (args && !!options.dest) {
      throw new Error('dest supplied twice for positional argument');
    }
    options = this._getPositional(args, options);

    // otherwise, we're adding an optional argument
  } else {
    options = this._getOptional(args, options);
  }

  // if no default was supplied, use the parser-level default
  if (typeof options.defaultValue === 'undefined') {
    var dest = options.dest;
    if (utils.has(this._defaults, dest)) {
      options.defaultValue = this._defaults[dest];
    } else if (typeof this.argumentDefault !== 'undefined') {
      options.defaultValue = this.argumentDefault;
    }
  }

  // create the action object, and add it to the parser
  var ActionClass = this._popActionClass(options);
  if (typeof ActionClass !== 'function') {
    throw new Error(format('Unknown action "%s".', ActionClass));
  }
  var action = new ActionClass(options);

  // throw an error if the action type is not callable
  var typeFunction = this._registryGet('type', action.type, action.type);
  if (typeof typeFunction !== 'function') {
    throw new Error(format('"%s" is not callable', typeFunction));
  }

  return this._addAction(action);
};

/**
 * ActionContainer#addArgumentGroup(options) -> ArgumentGroup
 * - options (Object): hash of options see [[ArgumentGroup.new]]
 *
 * Create new arguments groups
 **/
ActionContainer.prototype.addArgumentGroup = function (options) {
  var group$1 = new group(this, options);
  this._actionGroups.push(group$1);
  return group$1;
};

/**
 * ActionContainer#addMutuallyExclusiveGroup(options) -> ArgumentGroup
 * - options (Object): {required: false}
 *
 * Create new mutual exclusive groups
 **/
ActionContainer.prototype.addMutuallyExclusiveGroup = function (options) {
  var group = new exclusive(this, options);
  this._mutuallyExclusiveGroups.push(group);
  return group;
};

ActionContainer.prototype._addAction = function (action) {
  var self = this;

  // resolve any conflicts
  this._checkConflict(action);

  // add to actions list
  this._actions.push(action);
  action.container = this;

  // index the action by any option strings it has
  action.optionStrings.forEach(function (optionString) {
    self._optionStringActions[optionString] = action;
  });

  // set the flag if any option strings look like negative numbers
  action.optionStrings.forEach(function (optionString) {
    if (optionString.match(self._regexpNegativeNumber)) {
      if (!self._hasNegativeNumberOptionals.some(Boolean)) {
        self._hasNegativeNumberOptionals.push(true);
      }
    }
  });

  // return the created action
  return action;
};

ActionContainer.prototype._removeAction = function (action) {
  var actionIndex = this._actions.indexOf(action);
  if (actionIndex >= 0) {
    this._actions.splice(actionIndex, 1);
  }
};

ActionContainer.prototype._addContainerActions = function (container) {
  // collect groups by titles
  var titleGroupMap = {};
  this._actionGroups.forEach(function (group) {
    if (titleGroupMap[group.title]) {
      throw new Error(format('Cannot merge actions - two groups are named "%s".', group.title));
    }
    titleGroupMap[group.title] = group;
  });

  // map each action to its group
  var groupMap = {};
  function actionHash(action) {
    // unique (hopefully?) string suitable as dictionary key
    return action.getName();
  }
  container._actionGroups.forEach(function (group) {
    // if a group with the title exists, use that, otherwise
    // create a new group matching the container's group
    if (!titleGroupMap[group.title]) {
      titleGroupMap[group.title] = this.addArgumentGroup({
        title: group.title,
        description: group.description
      });
    }

    // map the actions to their new group
    group._groupActions.forEach(function (action) {
      groupMap[actionHash(action)] = titleGroupMap[group.title];
    });
  }, this);

  // add container's mutually exclusive groups
  // NOTE: if add_mutually_exclusive_group ever gains title= and
  // description= then this code will need to be expanded as above
  var mutexGroup;
  container._mutuallyExclusiveGroups.forEach(function (group) {
    mutexGroup = this.addMutuallyExclusiveGroup({
      required: group.required
    });
    // map the actions to their new mutex group
    group._groupActions.forEach(function (action) {
      groupMap[actionHash(action)] = mutexGroup;
    });
  }, this);  // forEach takes a 'this' argument

  // add all actions to this container or their group
  container._actions.forEach(function (action) {
    var key = actionHash(action);
    if (groupMap[key]) {
      groupMap[key]._addAction(action);
    } else {
      this._addAction(action);
    }
  });
};

ActionContainer.prototype._getPositional = function (dest, options) {
  if (Array.isArray(dest)) {
    dest = dest[0];
  }
  // make sure required is not specified
  if (options.required) {
    throw new Error('"required" is an invalid argument for positionals.');
  }

  // mark positional arguments as required if at least one is
  // always required
  if (options.nargs !== _const.OPTIONAL && options.nargs !== _const.ZERO_OR_MORE) {
    options.required = true;
  }
  if (options.nargs === _const.ZERO_OR_MORE && typeof options.defaultValue === 'undefined') {
    options.required = true;
  }

  // return the keyword arguments with no option strings
  options.dest = dest;
  options.optionStrings = [];
  return options;
};

ActionContainer.prototype._getOptional = function (args, options) {
  var prefixChars = this.prefixChars;
  var optionStrings = [];
  var optionStringsLong = [];

  // determine short and long option strings
  args.forEach(function (optionString) {
    // error on strings that don't start with an appropriate prefix
    if (prefixChars.indexOf(optionString[0]) < 0) {
      throw new Error(format('Invalid option string "%s": must start with a "%s".',
        optionString,
        prefixChars
      ));
    }

    // strings starting with two prefix characters are long options
    optionStrings.push(optionString);
    if (optionString.length > 1 && prefixChars.indexOf(optionString[1]) >= 0) {
      optionStringsLong.push(optionString);
    }
  });

  // infer dest, '--foo-bar' -> 'foo_bar' and '-x' -> 'x'
  var dest = options.dest || null;
  delete options.dest;

  if (!dest) {
    var optionStringDest = optionStringsLong.length ? optionStringsLong[0] : optionStrings[0];
    dest = utils.trimChars(optionStringDest, this.prefixChars);

    if (dest.length === 0) {
      throw new Error(
        format('dest= is required for options like "%s"', optionStrings.join(', '))
      );
    }
    dest = dest.replace(/-/g, '_');
  }

  // return the updated keyword arguments
  options.dest = dest;
  options.optionStrings = optionStrings;

  return options;
};

ActionContainer.prototype._popActionClass = function (options, defaultValue) {
  defaultValue = defaultValue || null;

  var action = (options.action || defaultValue);
  delete options.action;

  var actionClass = this._registryGet('action', action, action);
  return actionClass;
};

ActionContainer.prototype._getHandler = function () {
  var handlerString = this.conflictHandler;
  var handlerFuncName = '_handleConflict' + utils.capitalize(handlerString);
  var func = this[handlerFuncName];
  if (typeof func === 'undefined') {
    var msg = 'invalid conflict resolution value: ' + handlerString;
    throw new Error(msg);
  } else {
    return func;
  }
};

ActionContainer.prototype._checkConflict = function (action) {
  var optionStringActions = this._optionStringActions;
  var conflictOptionals = [];

  // find all options that conflict with this option
  // collect pairs, the string, and an existing action that it conflicts with
  action.optionStrings.forEach(function (optionString) {
    var conflOptional = optionStringActions[optionString];
    if (typeof conflOptional !== 'undefined') {
      conflictOptionals.push([ optionString, conflOptional ]);
    }
  });

  if (conflictOptionals.length > 0) {
    var conflictHandler = this._getHandler();
    conflictHandler.call(this, action, conflictOptionals);
  }
};

ActionContainer.prototype._handleConflictError = function (action, conflOptionals) {
  var conflicts = conflOptionals.map(function (pair) { return pair[0]; });
  conflicts = conflicts.join(', ');
  throw error(
    action,
    format('Conflicting option string(s): %s', conflicts)
  );
};

ActionContainer.prototype._handleConflictResolve = function (action, conflOptionals) {
  // remove all conflicting options
  var self = this;
  conflOptionals.forEach(function (pair) {
    var optionString = pair[0];
    var conflictingAction = pair[1];
    // remove the conflicting option string
    var i = conflictingAction.optionStrings.indexOf(optionString);
    if (i >= 0) {
      conflictingAction.optionStrings.splice(i, 1);
    }
    delete self._optionStringActions[optionString];
    // if the option now has no option string, remove it from the
    // container holding it
    if (conflictingAction.optionStrings.length === 0) {
      conflictingAction.container._removeAction(conflictingAction);
    }
  });
};
});

var formatter = createCommonjsModule(function (module) {

var sprintf$1 = sprintf.sprintf;

// Constants





/*:nodoc:* internal
 * new Support(parent, heding)
 * - parent (object): parent section
 * - heading (string): header string
 *
 **/
function Section(parent, heading) {
  this._parent = parent;
  this._heading = heading;
  this._items = [];
}

/*:nodoc:* internal
 * Section#addItem(callback) -> Void
 * - callback (array): tuple with function and args
 *
 * Add function for single element
 **/
Section.prototype.addItem = function (callback) {
  this._items.push(callback);
};

/*:nodoc:* internal
 * Section#formatHelp(formatter) -> string
 * - formatter (HelpFormatter): current formatter
 *
 * Form help section string
 *
 **/
Section.prototype.formatHelp = function (formatter) {
  var itemHelp, heading;

  // format the indented section
  if (this._parent) {
    formatter._indent();
  }

  itemHelp = this._items.map(function (item) {
    var obj, func, args;

    obj = formatter;
    func = item[0];
    args = item[1];
    return func.apply(obj, args);
  });
  itemHelp = formatter._joinParts(itemHelp);

  if (this._parent) {
    formatter._dedent();
  }

  // return nothing if the section was empty
  if (!itemHelp) {
    return '';
  }

  // add the heading if the section was non-empty
  heading = '';
  if (this._heading && this._heading !== _const.SUPPRESS) {
    var currentIndent = formatter.currentIndent;
    heading = utils.repeat(' ', currentIndent) + this._heading + ':' + _const.EOL;
  }

  // join the section-initialize newline, the heading and the help
  return formatter._joinParts([ _const.EOL, heading, itemHelp, _const.EOL ]);
};

/**
 * new HelpFormatter(options)
 *
 * #### Options:
 * - `prog`: program name
 * - `indentIncriment`: indent step, default value 2
 * - `maxHelpPosition`: max help position, default value = 24
 * - `width`: line width
 *
 **/
var HelpFormatter = module.exports = function HelpFormatter(options) {
  options = options || {};

  this._prog = options.prog;

  this._maxHelpPosition = options.maxHelpPosition || 24;
  this._width = (options.width || ((process.env.COLUMNS || 80) - 2));

  this._currentIndent = 0;
  this._indentIncriment = options.indentIncriment || 2;
  this._level = 0;
  this._actionMaxLength = 0;

  this._rootSection = new Section(null);
  this._currentSection = this._rootSection;

  this._whitespaceMatcher = new RegExp('\\s+', 'g');
  this._longBreakMatcher = new RegExp(_const.EOL + _const.EOL + _const.EOL + '+', 'g');
};

HelpFormatter.prototype._indent = function () {
  this._currentIndent += this._indentIncriment;
  this._level += 1;
};

HelpFormatter.prototype._dedent = function () {
  this._currentIndent -= this._indentIncriment;
  this._level -= 1;
  if (this._currentIndent < 0) {
    throw new Error('Indent decreased below 0.');
  }
};

HelpFormatter.prototype._addItem = function (func, args) {
  this._currentSection.addItem([ func, args ]);
};

//
// Message building methods
//

/**
 * HelpFormatter#startSection(heading) -> Void
 * - heading (string): header string
 *
 * Start new help section
 *
 * See alse [code example][1]
 *
 * ##### Example
 *
 *      formatter.startSection(actionGroup.title);
 *      formatter.addText(actionGroup.description);
 *      formatter.addArguments(actionGroup._groupActions);
 *      formatter.endSection();
 *
 **/
HelpFormatter.prototype.startSection = function (heading) {
  this._indent();
  var section = new Section(this._currentSection, heading);
  var func = section.formatHelp.bind(section);
  this._addItem(func, [ this ]);
  this._currentSection = section;
};

/**
 * HelpFormatter#endSection -> Void
 *
 * End help section
 *
 * ##### Example
 *
 *      formatter.startSection(actionGroup.title);
 *      formatter.addText(actionGroup.description);
 *      formatter.addArguments(actionGroup._groupActions);
 *      formatter.endSection();
 **/
HelpFormatter.prototype.endSection = function () {
  this._currentSection = this._currentSection._parent;
  this._dedent();
};

/**
 * HelpFormatter#addText(text) -> Void
 * - text (string): plain text
 *
 * Add plain text into current section
 *
 * ##### Example
 *
 *      formatter.startSection(actionGroup.title);
 *      formatter.addText(actionGroup.description);
 *      formatter.addArguments(actionGroup._groupActions);
 *      formatter.endSection();
 *
 **/
HelpFormatter.prototype.addText = function (text) {
  if (text && text !== _const.SUPPRESS) {
    this._addItem(this._formatText, [ text ]);
  }
};

/**
 * HelpFormatter#addUsage(usage, actions, groups, prefix) -> Void
 * - usage (string): usage text
 * - actions (array): actions list
 * - groups (array): groups list
 * - prefix (string): usage prefix
 *
 * Add usage data into current section
 *
 * ##### Example
 *
 *      formatter.addUsage(this.usage, this._actions, []);
 *      return formatter.formatHelp();
 *
 **/
HelpFormatter.prototype.addUsage = function (usage, actions, groups, prefix) {
  if (usage !== _const.SUPPRESS) {
    this._addItem(this._formatUsage, [ usage, actions, groups, prefix ]);
  }
};

/**
 * HelpFormatter#addArgument(action) -> Void
 * - action (object): action
 *
 * Add argument into current section
 *
 * Single variant of [[HelpFormatter#addArguments]]
 **/
HelpFormatter.prototype.addArgument = function (action) {
  if (action.help !== _const.SUPPRESS) {
    var self = this;

    // find all invocations
    var invocations = [ this._formatActionInvocation(action) ];
    var invocationLength = invocations[0].length;

    var actionLength;

    if (action._getSubactions) {
      this._indent();
      action._getSubactions().forEach(function (subaction) {

        var invocationNew = self._formatActionInvocation(subaction);
        invocations.push(invocationNew);
        invocationLength = Math.max(invocationLength, invocationNew.length);

      });
      this._dedent();
    }

    // update the maximum item length
    actionLength = invocationLength + this._currentIndent;
    this._actionMaxLength = Math.max(this._actionMaxLength, actionLength);

    // add the item to the list
    this._addItem(this._formatAction, [ action ]);
  }
};

/**
 * HelpFormatter#addArguments(actions) -> Void
 * - actions (array): actions list
 *
 * Mass add arguments into current section
 *
 * ##### Example
 *
 *      formatter.startSection(actionGroup.title);
 *      formatter.addText(actionGroup.description);
 *      formatter.addArguments(actionGroup._groupActions);
 *      formatter.endSection();
 *
 **/
HelpFormatter.prototype.addArguments = function (actions) {
  var self = this;
  actions.forEach(function (action) {
    self.addArgument(action);
  });
};

//
// Help-formatting methods
//

/**
 * HelpFormatter#formatHelp -> string
 *
 * Format help
 *
 * ##### Example
 *
 *      formatter.addText(this.epilog);
 *      return formatter.formatHelp();
 *
 **/
HelpFormatter.prototype.formatHelp = function () {
  var help = this._rootSection.formatHelp(this);
  if (help) {
    help = help.replace(this._longBreakMatcher, _const.EOL + _const.EOL);
    help = utils.trimChars(help, _const.EOL) + _const.EOL;
  }
  return help;
};

HelpFormatter.prototype._joinParts = function (partStrings) {
  return partStrings.filter(function (part) {
    return (part && part !== _const.SUPPRESS);
  }).join('');
};

HelpFormatter.prototype._formatUsage = function (usage, actions, groups, prefix) {
  if (!prefix && typeof prefix !== 'string') {
    prefix = 'usage: ';
  }

  actions = actions || [];
  groups = groups || [];


  // if usage is specified, use that
  if (usage) {
    usage = sprintf$1(usage, { prog: this._prog });

    // if no optionals or positionals are available, usage is just prog
  } else if (!usage && actions.length === 0) {
    usage = this._prog;

    // if optionals and positionals are available, calculate usage
  } else if (!usage) {
    var prog = this._prog;
    var optionals = [];
    var positionals = [];
    var actionUsage;
    var textWidth;

    // split optionals from positionals
    actions.forEach(function (action) {
      if (action.isOptional()) {
        optionals.push(action);
      } else {
        positionals.push(action);
      }
    });

    // build full usage string
    actionUsage = this._formatActionsUsage([].concat(optionals, positionals), groups);
    usage = [ prog, actionUsage ].join(' ');

    // wrap the usage parts if it's too long
    textWidth = this._width - this._currentIndent;
    if ((prefix.length + usage.length) > textWidth) {

      // break usage into wrappable parts
      var regexpPart = new RegExp('\\(.*?\\)+|\\[.*?\\]+|\\S+', 'g');
      var optionalUsage = this._formatActionsUsage(optionals, groups);
      var positionalUsage = this._formatActionsUsage(positionals, groups);


      var optionalParts = optionalUsage.match(regexpPart);
      var positionalParts = positionalUsage.match(regexpPart) || [];

      if (optionalParts.join(' ') !== optionalUsage) {
        throw new Error('assert "optionalParts.join(\' \') === optionalUsage"');
      }
      if (positionalParts.join(' ') !== positionalUsage) {
        throw new Error('assert "positionalParts.join(\' \') === positionalUsage"');
      }

      // helper for wrapping lines
      /*eslint-disable func-style*/ // node 0.10 compat
      var _getLines = function (parts, indent, prefix) {
        var lines = [];
        var line = [];

        var lineLength = prefix ? prefix.length - 1 : indent.length - 1;

        parts.forEach(function (part) {
          if (lineLength + 1 + part.length > textWidth) {
            lines.push(indent + line.join(' '));
            line = [];
            lineLength = indent.length - 1;
          }
          line.push(part);
          lineLength += part.length + 1;
        });

        if (line) {
          lines.push(indent + line.join(' '));
        }
        if (prefix) {
          lines[0] = lines[0].substr(indent.length);
        }
        return lines;
      };

      var lines, indent, parts;
      // if prog is short, follow it with optionals or positionals
      if (prefix.length + prog.length <= 0.75 * textWidth) {
        indent = utils.repeat(' ', (prefix.length + prog.length + 1));
        if (optionalParts) {
          lines = [].concat(
            _getLines([ prog ].concat(optionalParts), indent, prefix),
            _getLines(positionalParts, indent)
          );
        } else if (positionalParts) {
          lines = _getLines([ prog ].concat(positionalParts), indent, prefix);
        } else {
          lines = [ prog ];
        }

        // if prog is long, put it on its own line
      } else {
        indent = utils.repeat(' ', prefix.length);
        parts = optionalParts.concat(positionalParts);
        lines = _getLines(parts, indent);
        if (lines.length > 1) {
          lines = [].concat(
            _getLines(optionalParts, indent),
            _getLines(positionalParts, indent)
          );
        }
        lines = [ prog ].concat(lines);
      }
      // join lines into usage
      usage = lines.join(_const.EOL);
    }
  }

  // prefix with 'usage:'
  return prefix + usage + _const.EOL + _const.EOL;
};

HelpFormatter.prototype._formatActionsUsage = function (actions, groups) {
  // find group indices and identify actions in groups
  var groupActions = [];
  var inserts = [];
  var self = this;

  groups.forEach(function (group) {
    var end;
    var i;

    var start = actions.indexOf(group._groupActions[0]);
    if (start >= 0) {
      end = start + group._groupActions.length;

      //if (actions.slice(start, end) === group._groupActions) {
      if (utils.arrayEqual(actions.slice(start, end), group._groupActions)) {
        group._groupActions.forEach(function (action) {
          groupActions.push(action);
        });

        if (!group.required) {
          if (inserts[start]) {
            inserts[start] += ' [';
          } else {
            inserts[start] = '[';
          }
          inserts[end] = ']';
        } else {
          if (inserts[start]) {
            inserts[start] += ' (';
          } else {
            inserts[start] = '(';
          }
          inserts[end] = ')';
        }
        for (i = start + 1; i < end; i += 1) {
          inserts[i] = '|';
        }
      }
    }
  });

  // collect all actions format strings
  var parts = [];

  actions.forEach(function (action, actionIndex) {
    var part;
    var optionString;
    var argsDefault;
    var argsString;

    // suppressed arguments are marked with None
    // remove | separators for suppressed arguments
    if (action.help === _const.SUPPRESS) {
      parts.push(null);
      if (inserts[actionIndex] === '|') {
        inserts.splice(actionIndex, actionIndex);
      } else if (inserts[actionIndex + 1] === '|') {
        inserts.splice(actionIndex + 1, actionIndex + 1);
      }

      // produce all arg strings
    } else if (!action.isOptional()) {
      part = self._formatArgs(action, action.dest);

      // if it's in a group, strip the outer []
      if (groupActions.indexOf(action) >= 0) {
        if (part[0] === '[' && part[part.length - 1] === ']') {
          part = part.slice(1, -1);
        }
      }
      // add the action string to the list
      parts.push(part);

    // produce the first way to invoke the option in brackets
    } else {
      optionString = action.optionStrings[0];

      // if the Optional doesn't take a value, format is: -s or --long
      if (action.nargs === 0) {
        part = '' + optionString;

      // if the Optional takes a value, format is: -s ARGS or --long ARGS
      } else {
        argsDefault = action.dest.toUpperCase();
        argsString = self._formatArgs(action, argsDefault);
        part = optionString + ' ' + argsString;
      }
      // make it look optional if it's not required or in a group
      if (!action.required && groupActions.indexOf(action) < 0) {
        part = '[' + part + ']';
      }
      // add the action string to the list
      parts.push(part);
    }
  });

  // insert things at the necessary indices
  for (var i = inserts.length - 1; i >= 0; --i) {
    if (inserts[i] !== null) {
      parts.splice(i, 0, inserts[i]);
    }
  }

  // join all the action items with spaces
  var text = parts.filter(function (part) {
    return !!part;
  }).join(' ');

  // clean up separators for mutually exclusive groups
  text = text.replace(/([\[(]) /g, '$1'); // remove spaces
  text = text.replace(/ ([\])])/g, '$1');
  text = text.replace(/\[ *\]/g, ''); // remove empty groups
  text = text.replace(/\( *\)/g, '');
  text = text.replace(/\(([^|]*)\)/g, '$1'); // remove () from single action groups

  text = text.trim();

  // return the text
  return text;
};

HelpFormatter.prototype._formatText = function (text) {
  text = sprintf$1(text, { prog: this._prog });
  var textWidth = this._width - this._currentIndent;
  var indentIncriment = utils.repeat(' ', this._currentIndent);
  return this._fillText(text, textWidth, indentIncriment) + _const.EOL + _const.EOL;
};

HelpFormatter.prototype._formatAction = function (action) {
  var self = this;

  var helpText;
  var helpLines;
  var parts;
  var indentFirst;

  // determine the required width and the entry label
  var helpPosition = Math.min(this._actionMaxLength + 2, this._maxHelpPosition);
  var helpWidth = this._width - helpPosition;
  var actionWidth = helpPosition - this._currentIndent - 2;
  var actionHeader = this._formatActionInvocation(action);

  // no help; start on same line and add a final newline
  if (!action.help) {
    actionHeader = utils.repeat(' ', this._currentIndent) + actionHeader + _const.EOL;

  // short action name; start on the same line and pad two spaces
  } else if (actionHeader.length <= actionWidth) {
    actionHeader = utils.repeat(' ', this._currentIndent) +
        actionHeader +
        '  ' +
        utils.repeat(' ', actionWidth - actionHeader.length);
    indentFirst = 0;

  // long action name; start on the next line
  } else {
    actionHeader = utils.repeat(' ', this._currentIndent) + actionHeader + _const.EOL;
    indentFirst = helpPosition;
  }

  // collect the pieces of the action help
  parts = [ actionHeader ];

  // if there was help for the action, add lines of help text
  if (action.help) {
    helpText = this._expandHelp(action);
    helpLines = this._splitLines(helpText, helpWidth);
    parts.push(utils.repeat(' ', indentFirst) + helpLines[0] + _const.EOL);
    helpLines.slice(1).forEach(function (line) {
      parts.push(utils.repeat(' ', helpPosition) + line + _const.EOL);
    });

  // or add a newline if the description doesn't end with one
  } else if (actionHeader.charAt(actionHeader.length - 1) !== _const.EOL) {
    parts.push(_const.EOL);
  }
  // if there are any sub-actions, add their help as well
  if (action._getSubactions) {
    this._indent();
    action._getSubactions().forEach(function (subaction) {
      parts.push(self._formatAction(subaction));
    });
    this._dedent();
  }
  // return a single string
  return this._joinParts(parts);
};

HelpFormatter.prototype._formatActionInvocation = function (action) {
  if (!action.isOptional()) {
    var format_func = this._metavarFormatter(action, action.dest);
    var metavars = format_func(1);
    return metavars[0];
  }

  var parts = [];
  var argsDefault;
  var argsString;

  // if the Optional doesn't take a value, format is: -s, --long
  if (action.nargs === 0) {
    parts = parts.concat(action.optionStrings);

  // if the Optional takes a value, format is: -s ARGS, --long ARGS
  } else {
    argsDefault = action.dest.toUpperCase();
    argsString = this._formatArgs(action, argsDefault);
    action.optionStrings.forEach(function (optionString) {
      parts.push(optionString + ' ' + argsString);
    });
  }
  return parts.join(', ');
};

HelpFormatter.prototype._metavarFormatter = function (action, metavarDefault) {
  var result;

  if (action.metavar || action.metavar === '') {
    result = action.metavar;
  } else if (action.choices) {
    var choices = action.choices;

    if (typeof choices === 'string') {
      choices = choices.split('').join(', ');
    } else if (Array.isArray(choices)) {
      choices = choices.join(',');
    } else {
      choices = Object.keys(choices).join(',');
    }
    result = '{' + choices + '}';
  } else {
    result = metavarDefault;
  }

  return function (size) {
    if (Array.isArray(result)) {
      return result;
    }

    var metavars = [];
    for (var i = 0; i < size; i += 1) {
      metavars.push(result);
    }
    return metavars;
  };
};

HelpFormatter.prototype._formatArgs = function (action, metavarDefault) {
  var result;
  var metavars;

  var buildMetavar = this._metavarFormatter(action, metavarDefault);

  switch (action.nargs) {
    /*eslint-disable no-undefined*/
    case undefined:
    case null:
      metavars = buildMetavar(1);
      result = '' + metavars[0];
      break;
    case _const.OPTIONAL:
      metavars = buildMetavar(1);
      result = '[' + metavars[0] + ']';
      break;
    case _const.ZERO_OR_MORE:
      metavars = buildMetavar(2);
      result = '[' + metavars[0] + ' [' + metavars[1] + ' ...]]';
      break;
    case _const.ONE_OR_MORE:
      metavars = buildMetavar(2);
      result = '' + metavars[0] + ' [' + metavars[1] + ' ...]';
      break;
    case _const.REMAINDER:
      result = '...';
      break;
    case _const.PARSER:
      metavars = buildMetavar(1);
      result = metavars[0] + ' ...';
      break;
    default:
      metavars = buildMetavar(action.nargs);
      result = metavars.join(' ');
  }
  return result;
};

HelpFormatter.prototype._expandHelp = function (action) {
  var params = { prog: this._prog };

  Object.keys(action).forEach(function (actionProperty) {
    var actionValue = action[actionProperty];

    if (actionValue !== _const.SUPPRESS) {
      params[actionProperty] = actionValue;
    }
  });

  if (params.choices) {
    if (typeof params.choices === 'string') {
      params.choices = params.choices.split('').join(', ');
    } else if (Array.isArray(params.choices)) {
      params.choices = params.choices.join(', ');
    } else {
      params.choices = Object.keys(params.choices).join(', ');
    }
  }

  return sprintf$1(this._getHelpString(action), params);
};

HelpFormatter.prototype._splitLines = function (text, width) {
  var lines = [];
  var delimiters = [ ' ', '.', ',', '!', '?' ];
  var re = new RegExp('[' + delimiters.join('') + '][^' + delimiters.join('') + ']*$');

  text = text.replace(/[\n\|\t]/g, ' ');

  text = text.trim();
  text = text.replace(this._whitespaceMatcher, ' ');

  // Wraps the single paragraph in text (a string) so every line
  // is at most width characters long.
  text.split(_const.EOL).forEach(function (line) {
    if (width >= line.length) {
      lines.push(line);
      return;
    }

    var wrapStart = 0;
    var wrapEnd = width;
    var delimiterIndex = 0;
    while (wrapEnd <= line.length) {
      if (wrapEnd !== line.length && delimiters.indexOf(line[wrapEnd] < -1)) {
        delimiterIndex = (re.exec(line.substring(wrapStart, wrapEnd)) || {}).index;
        wrapEnd = wrapStart + delimiterIndex + 1;
      }
      lines.push(line.substring(wrapStart, wrapEnd));
      wrapStart = wrapEnd;
      wrapEnd += width;
    }
    if (wrapStart < line.length) {
      lines.push(line.substring(wrapStart, wrapEnd));
    }
  });

  return lines;
};

HelpFormatter.prototype._fillText = function (text, width, indent) {
  var lines = this._splitLines(text, width);
  lines = lines.map(function (line) {
    return indent + line;
  });
  return lines.join(_const.EOL);
};

HelpFormatter.prototype._getHelpString = function (action) {
  return action.help;
};
});

var namespace = createCommonjsModule(function (module) {



/**
 * new Namespace(options)
 * - options(object): predefined propertis for result object
 *
 **/
var Namespace = module.exports = function Namespace(options) {
  utils.extend(this, options);
};

/**
 * Namespace#isset(key) -> Boolean
 * - key (string|number): property name
 *
 * Tells whenever `namespace` contains given `key` or not.
 **/
Namespace.prototype.isset = function (key) {
  return utils.has(this, key);
};

/**
 * Namespace#set(key, value) -> self
 * -key (string|number|object): propery name
 * -value (mixed): new property value
 *
 * Set the property named key with value.
 * If key object then set all key properties to namespace object
 **/
Namespace.prototype.set = function (key, value) {
  if (typeof (key) === 'object') {
    utils.extend(this, key);
  } else {
    this[key] = value;
  }
  return this;
};

/**
 * Namespace#get(key, defaultValue) -> mixed
 * - key (string|number): property name
 * - defaultValue (mixed): default value
 *
 * Return the property key or defaulValue if not set
 **/
Namespace.prototype.get = function (key, defaultValue) {
  return !this[key] ? defaultValue : this[key];
};

/**
 * Namespace#unset(key, defaultValue) -> mixed
 * - key (string|number): property name
 * - defaultValue (mixed): default value
 *
 * Return data[key](and delete it) or defaultValue
 **/
Namespace.prototype.unset = function (key, defaultValue) {
  var value = this[key];
  if (value !== null) {
    delete this[key];
    return value;
  }
  return defaultValue;
};
});

var format$2  = util.format;

var sprintf$1 = sprintf.sprintf;

// Constants






// Errors







/**
 * new ArgumentParser(options)
 *
 * Create a new ArgumentParser object.
 *
 * ##### Options:
 * - `prog`  The name of the program (default: Path.basename(process.argv[1]))
 * - `usage`  A usage message (default: auto-generated from arguments)
 * - `description`  A description of what the program does
 * - `epilog`  Text following the argument descriptions
 * - `parents`  Parsers whose arguments should be copied into this one
 * - `formatterClass`  HelpFormatter class for printing help messages
 * - `prefixChars`  Characters that prefix optional arguments
 * - `fromfilePrefixChars` Characters that prefix files containing additional arguments
 * - `argumentDefault`  The default value for all arguments
 * - `addHelp`  Add a -h/-help option
 * - `conflictHandler`  Specifies how to handle conflicting argument names
 * - `debug`  Enable debug mode. Argument errors throw exception in
 *   debug mode and process.exit in normal. Used for development and
 *   testing (default: false)
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#argumentparser-objects
 **/
function ArgumentParser(options) {
  if (!(this instanceof ArgumentParser)) {
    return new ArgumentParser(options);
  }
  var self = this;
  options = options || {};

  options.description = (options.description || null);
  options.argumentDefault = (options.argumentDefault || null);
  options.prefixChars = (options.prefixChars || '-');
  options.conflictHandler = (options.conflictHandler || 'error');
  action_container.call(this, options);

  options.addHelp = typeof options.addHelp === 'undefined' || !!options.addHelp;
  options.parents = options.parents || [];
  // default program name
  options.prog = (options.prog || path.basename(process.argv[1]));
  this.prog = options.prog;
  this.usage = options.usage;
  this.epilog = options.epilog;
  this.version = options.version;

  this.debug = (options.debug === true);

  this.formatterClass = (options.formatterClass || formatter);
  this.fromfilePrefixChars = options.fromfilePrefixChars || null;
  this._positionals = this.addArgumentGroup({ title: 'Positional arguments' });
  this._optionals = this.addArgumentGroup({ title: 'Optional arguments' });
  this._subparsers = null;

  // register types
  function FUNCTION_IDENTITY(o) {
    return o;
  }
  this.register('type', 'auto', FUNCTION_IDENTITY);
  this.register('type', null, FUNCTION_IDENTITY);
  this.register('type', 'int', function (x) {
    var result = parseInt(x, 10);
    if (isNaN(result)) {
      throw new Error(x + ' is not a valid integer.');
    }
    return result;
  });
  this.register('type', 'float', function (x) {
    var result = parseFloat(x);
    if (isNaN(result)) {
      throw new Error(x + ' is not a valid float.');
    }
    return result;
  });
  this.register('type', 'string', function (x) {
    return '' + x;
  });

  // add help and version arguments if necessary
  var defaultPrefix = (this.prefixChars.indexOf('-') > -1) ? '-' : this.prefixChars[0];
  if (options.addHelp) {
    this.addArgument(
      [ defaultPrefix + 'h', defaultPrefix + defaultPrefix + 'help' ],
      {
        action: 'help',
        defaultValue: _const.SUPPRESS,
        help: 'Show this help message and exit.'
      }
    );
  }
  if (typeof this.version !== 'undefined') {
    this.addArgument(
      [ defaultPrefix + 'v', defaultPrefix + defaultPrefix + 'version' ],
      {
        action: 'version',
        version: this.version,
        defaultValue: _const.SUPPRESS,
        help: "Show program's version number and exit."
      }
    );
  }

  // add parent arguments and defaults
  options.parents.forEach(function (parent) {
    self._addContainerActions(parent);
    if (typeof parent._defaults !== 'undefined') {
      for (var defaultKey in parent._defaults) {
        if (parent._defaults.hasOwnProperty(defaultKey)) {
          self._defaults[defaultKey] = parent._defaults[defaultKey];
        }
      }
    }
  });
}

util.inherits(ArgumentParser, action_container);

/**
 * ArgumentParser#addSubparsers(options) -> [[ActionSubparsers]]
 * - options (object): hash of options see [[ActionSubparsers.new]]
 *
 * See also [subcommands][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#sub-commands
 **/
ArgumentParser.prototype.addSubparsers = function (options) {
  if (this._subparsers) {
    this.error('Cannot have multiple subparser arguments.');
  }

  options = options || {};
  options.debug = (this.debug === true);
  options.optionStrings = [];
  options.parserClass = (options.parserClass || ArgumentParser);


  if (!!options.title || !!options.description) {

    this._subparsers = this.addArgumentGroup({
      title: (options.title || 'subcommands'),
      description: options.description
    });
    delete options.title;
    delete options.description;

  } else {
    this._subparsers = this._positionals;
  }

  // prog defaults to the usage message of this parser, skipping
  // optional arguments and with no "usage:" prefix
  if (!options.prog) {
    var formatter = this._getFormatter();
    var positionals = this._getPositionalActions();
    var groups = this._mutuallyExclusiveGroups;
    formatter.addUsage(this.usage, positionals, groups, '');
    options.prog = formatter.formatHelp().trim();
  }

  // create the parsers action and add it to the positionals list
  var ParsersClass = this._popActionClass(options, 'parsers');
  var action = new ParsersClass(options);
  this._subparsers._addAction(action);

  // return the created parsers action
  return action;
};

ArgumentParser.prototype._addAction = function (action) {
  if (action.isOptional()) {
    this._optionals._addAction(action);
  } else {
    this._positionals._addAction(action);
  }
  return action;
};

ArgumentParser.prototype._getOptionalActions = function () {
  return this._actions.filter(function (action) {
    return action.isOptional();
  });
};

ArgumentParser.prototype._getPositionalActions = function () {
  return this._actions.filter(function (action) {
    return action.isPositional();
  });
};


/**
 * ArgumentParser#parseArgs(args, namespace) -> Namespace|Object
 * - args (array): input elements
 * - namespace (Namespace|Object): result object
 *
 * Parsed args and throws error if some arguments are not recognized
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#the-parse-args-method
 **/
ArgumentParser.prototype.parseArgs = function (args, namespace) {
  var argv;
  var result = this.parseKnownArgs(args, namespace);

  args = result[0];
  argv = result[1];
  if (argv && argv.length > 0) {
    this.error(
      format$2('Unrecognized arguments: %s.', argv.join(' '))
    );
  }
  return args;
};

/**
 * ArgumentParser#parseKnownArgs(args, namespace) -> array
 * - args (array): input options
 * - namespace (Namespace|Object): result object
 *
 * Parse known arguments and return tuple of result object
 * and unknown args
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#partial-parsing
 **/
ArgumentParser.prototype.parseKnownArgs = function (args, namespace$1) {
  var self = this;

  // args default to the system args
  args = args || process.argv.slice(2);

  // default Namespace built from parser defaults
  namespace$1 = namespace$1 || new namespace();

  self._actions.forEach(function (action) {
    if (action.dest !== _const.SUPPRESS) {
      if (!utils.has(namespace$1, action.dest)) {
        if (action.defaultValue !== _const.SUPPRESS) {
          var defaultValue = action.defaultValue;
          if (typeof action.defaultValue === 'string') {
            defaultValue = self._getValue(action, defaultValue);
          }
          namespace$1[action.dest] = defaultValue;
        }
      }
    }
  });

  Object.keys(self._defaults).forEach(function (dest) {
    namespace$1[dest] = self._defaults[dest];
  });

  // parse the arguments and exit if there are any errors
  try {
    var res = this._parseKnownArgs(args, namespace$1);

    namespace$1 = res[0];
    args = res[1];
    if (utils.has(namespace$1, _const._UNRECOGNIZED_ARGS_ATTR)) {
      args = utils.arrayUnion(args, namespace$1[_const._UNRECOGNIZED_ARGS_ATTR]);
      delete namespace$1[_const._UNRECOGNIZED_ARGS_ATTR];
    }
    return [ namespace$1, args ];
  } catch (e) {
    this.error(e);
  }
};

ArgumentParser.prototype._parseKnownArgs = function (argStrings, namespace) {
  var self = this;

  var extras = [];

  // replace arg strings that are file references
  if (this.fromfilePrefixChars !== null) {
    argStrings = this._readArgsFromFiles(argStrings);
  }
  // map all mutually exclusive arguments to the other arguments
  // they can't occur with
  // Python has 'conflicts = action_conflicts.setdefault(mutex_action, [])'
  // though I can't conceive of a way in which an action could be a member
  // of two different mutually exclusive groups.

  function actionHash(action) {
    // some sort of hashable key for this action
    // action itself cannot be a key in actionConflicts
    // I think getName() (join of optionStrings) is unique enough
    return action.getName();
  }

  var conflicts, key;
  var actionConflicts = {};

  this._mutuallyExclusiveGroups.forEach(function (mutexGroup) {
    mutexGroup._groupActions.forEach(function (mutexAction, i, groupActions) {
      key = actionHash(mutexAction);
      if (!utils.has(actionConflicts, key)) {
        actionConflicts[key] = [];
      }
      conflicts = actionConflicts[key];
      conflicts.push.apply(conflicts, groupActions.slice(0, i));
      conflicts.push.apply(conflicts, groupActions.slice(i + 1));
    });
  });

  // find all option indices, and determine the arg_string_pattern
  // which has an 'O' if there is an option at an index,
  // an 'A' if there is an argument, or a '-' if there is a '--'
  var optionStringIndices = {};

  var argStringPatternParts = [];

  argStrings.forEach(function (argString, argStringIndex) {
    if (argString === '--') {
      argStringPatternParts.push('-');
      while (argStringIndex < argStrings.length) {
        argStringPatternParts.push('A');
        argStringIndex++;
      }
    } else {
      // otherwise, add the arg to the arg strings
      // and note the index if it was an option
      var pattern;
      var optionTuple = self._parseOptional(argString);
      if (!optionTuple) {
        pattern = 'A';
      } else {
        optionStringIndices[argStringIndex] = optionTuple;
        pattern = 'O';
      }
      argStringPatternParts.push(pattern);
    }
  });
  var argStringsPattern = argStringPatternParts.join('');

  var seenActions = [];
  var seenNonDefaultActions = [];


  function takeAction(action, argumentStrings, optionString) {
    seenActions.push(action);
    var argumentValues = self._getValues(action, argumentStrings);

    // error if this argument is not allowed with other previously
    // seen arguments, assuming that actions that use the default
    // value don't really count as "present"
    if (argumentValues !== action.defaultValue) {
      seenNonDefaultActions.push(action);
      if (actionConflicts[actionHash(action)]) {
        actionConflicts[actionHash(action)].forEach(function (actionConflict) {
          if (seenNonDefaultActions.indexOf(actionConflict) >= 0) {
            throw error(
              action,
              format$2('Not allowed with argument "%s".', actionConflict.getName())
            );
          }
        });
      }
    }

    if (argumentValues !== _const.SUPPRESS) {
      action.call(self, namespace, argumentValues, optionString);
    }
  }

  function consumeOptional(startIndex) {
    // get the optional identified at this index
    var optionTuple = optionStringIndices[startIndex];
    var action = optionTuple[0];
    var optionString = optionTuple[1];
    var explicitArg = optionTuple[2];

    // identify additional optionals in the same arg string
    // (e.g. -xyz is the same as -x -y -z if no args are required)
    var actionTuples = [];

    var args, argCount, start, stop;

    for (;;) {
      if (!action) {
        extras.push(argStrings[startIndex]);
        return startIndex + 1;
      }
      if (explicitArg) {
        argCount = self._matchArgument(action, 'A');

        // if the action is a single-dash option and takes no
        // arguments, try to parse more single-dash options out
        // of the tail of the option string
        var chars = self.prefixChars;
        if (argCount === 0 && chars.indexOf(optionString[1]) < 0) {
          actionTuples.push([ action, [], optionString ]);
          optionString = optionString[0] + explicitArg[0];
          var newExplicitArg = explicitArg.slice(1) || null;
          var optionalsMap = self._optionStringActions;

          if (Object.keys(optionalsMap).indexOf(optionString) >= 0) {
            action = optionalsMap[optionString];
            explicitArg = newExplicitArg;
          } else {
            throw error(action, sprintf$1('ignored explicit argument %r', explicitArg));
          }
        } else if (argCount === 1) {
          // if the action expect exactly one argument, we've
          // successfully matched the option; exit the loop
          stop = startIndex + 1;
          args = [ explicitArg ];
          actionTuples.push([ action, args, optionString ]);
          break;
        } else {
          // error if a double-dash option did not use the
          // explicit argument
          throw error(action, sprintf$1('ignored explicit argument %r', explicitArg));
        }
      } else {
        // if there is no explicit argument, try to match the
        // optional's string arguments with the following strings
        // if successful, exit the loop

        start = startIndex + 1;
        var selectedPatterns = argStringsPattern.substr(start);

        argCount = self._matchArgument(action, selectedPatterns);
        stop = start + argCount;


        args = argStrings.slice(start, stop);

        actionTuples.push([ action, args, optionString ]);
        break;
      }

    }

    // add the Optional to the list and return the index at which
    // the Optional's string args stopped
    if (actionTuples.length < 1) {
      throw new Error('length should be > 0');
    }
    for (var i = 0; i < actionTuples.length; i++) {
      takeAction.apply(self, actionTuples[i]);
    }
    return stop;
  }

  // the list of Positionals left to be parsed; this is modified
  // by consume_positionals()
  var positionals = self._getPositionalActions();

  function consumePositionals(startIndex) {
    // match as many Positionals as possible
    var selectedPattern = argStringsPattern.substr(startIndex);
    var argCounts = self._matchArgumentsPartial(positionals, selectedPattern);

    // slice off the appropriate arg strings for each Positional
    // and add the Positional and its args to the list
    for (var i = 0; i < positionals.length; i++) {
      var action = positionals[i];
      var argCount = argCounts[i];
      if (typeof argCount === 'undefined') {
        continue;
      }
      var args = argStrings.slice(startIndex, startIndex + argCount);

      startIndex += argCount;
      takeAction(action, args);
    }

    // slice off the Positionals that we just parsed and return the
    // index at which the Positionals' string args stopped
    positionals = positionals.slice(argCounts.length);
    return startIndex;
  }

  // consume Positionals and Optionals alternately, until we have
  // passed the last option string
  var startIndex = 0;
  var position;

  var maxOptionStringIndex = -1;

  Object.keys(optionStringIndices).forEach(function (position) {
    maxOptionStringIndex = Math.max(maxOptionStringIndex, parseInt(position, 10));
  });

  var positionalsEndIndex, nextOptionStringIndex;

  while (startIndex <= maxOptionStringIndex) {
    // consume any Positionals preceding the next option
    nextOptionStringIndex = null;
    for (position in optionStringIndices) {
      if (!optionStringIndices.hasOwnProperty(position)) { continue; }

      position = parseInt(position, 10);
      if (position >= startIndex) {
        if (nextOptionStringIndex !== null) {
          nextOptionStringIndex = Math.min(nextOptionStringIndex, position);
        } else {
          nextOptionStringIndex = position;
        }
      }
    }

    if (startIndex !== nextOptionStringIndex) {
      positionalsEndIndex = consumePositionals(startIndex);
      // only try to parse the next optional if we didn't consume
      // the option string during the positionals parsing
      if (positionalsEndIndex > startIndex) {
        startIndex = positionalsEndIndex;
        continue;
      } else {
        startIndex = positionalsEndIndex;
      }
    }

    // if we consumed all the positionals we could and we're not
    // at the index of an option string, there were extra arguments
    if (!optionStringIndices[startIndex]) {
      var strings = argStrings.slice(startIndex, nextOptionStringIndex);
      extras = extras.concat(strings);
      startIndex = nextOptionStringIndex;
    }
    // consume the next optional and any arguments for it
    startIndex = consumeOptional(startIndex);
  }

  // consume any positionals following the last Optional
  var stopIndex = consumePositionals(startIndex);

  // if we didn't consume all the argument strings, there were extras
  extras = extras.concat(argStrings.slice(stopIndex));

  // if we didn't use all the Positional objects, there were too few
  // arg strings supplied.
  if (positionals.length > 0) {
    self.error('too few arguments');
  }

  // make sure all required actions were present
  self._actions.forEach(function (action) {
    if (action.required) {
      if (seenActions.indexOf(action) < 0) {
        self.error(format$2('Argument "%s" is required', action.getName()));
      }
    }
  });

  // make sure all required groups have one option present
  var actionUsed = false;
  self._mutuallyExclusiveGroups.forEach(function (group) {
    if (group.required) {
      actionUsed = group._groupActions.some(function (action) {
        return seenNonDefaultActions.indexOf(action) !== -1;
      });

      // if no actions were used, report the error
      if (!actionUsed) {
        var names = [];
        group._groupActions.forEach(function (action) {
          if (action.help !== _const.SUPPRESS) {
            names.push(action.getName());
          }
        });
        names = names.join(' ');
        var msg = 'one of the arguments ' + names + ' is required';
        self.error(msg);
      }
    }
  });

  // return the updated namespace and the extra arguments
  return [ namespace, extras ];
};

ArgumentParser.prototype._readArgsFromFiles = function (argStrings) {
  // expand arguments referencing files
  var self = this;
  var fs$1 = fs;
  var newArgStrings = [];
  argStrings.forEach(function (argString) {
    if (self.fromfilePrefixChars.indexOf(argString[0]) < 0) {
      // for regular arguments, just add them back into the list
      newArgStrings.push(argString);
    } else {
      // replace arguments referencing files with the file content
      try {
        var argstrs = [];
        var filename = argString.slice(1);
        var content = fs$1.readFileSync(filename, 'utf8');
        content = content.trim().split('\n');
        content.forEach(function (argLine) {
          self.convertArgLineToArgs(argLine).forEach(function (arg) {
            argstrs.push(arg);
          });
          argstrs = self._readArgsFromFiles(argstrs);
        });
        newArgStrings.push.apply(newArgStrings, argstrs);
      } catch (error) {
        return self.error(error.message);
      }
    }
  });
  return newArgStrings;
};

ArgumentParser.prototype.convertArgLineToArgs = function (argLine) {
  return [ argLine ];
};

ArgumentParser.prototype._matchArgument = function (action, regexpArgStrings) {

  // match the pattern for this action to the arg strings
  var regexpNargs = new RegExp('^' + this._getNargsPattern(action));
  var matches = regexpArgStrings.match(regexpNargs);
  var message;

  // throw an exception if we weren't able to find a match
  if (!matches) {
    switch (action.nargs) {
      /*eslint-disable no-undefined*/
      case undefined:
      case null:
        message = 'Expected one argument.';
        break;
      case _const.OPTIONAL:
        message = 'Expected at most one argument.';
        break;
      case _const.ONE_OR_MORE:
        message = 'Expected at least one argument.';
        break;
      default:
        message = 'Expected %s argument(s)';
    }

    throw error(
      action,
      format$2(message, action.nargs)
    );
  }
  // return the number of arguments matched
  return matches[1].length;
};

ArgumentParser.prototype._matchArgumentsPartial = function (actions, regexpArgStrings) {
  // progressively shorten the actions list by slicing off the
  // final actions until we find a match
  var self = this;
  var result = [];
  var actionSlice, pattern, matches;
  var i, j;

  function getLength(string) {
    return string.length;
  }

  for (i = actions.length; i > 0; i--) {
    pattern = '';
    actionSlice = actions.slice(0, i);
    for (j = 0; j < actionSlice.length; j++) {
      pattern += self._getNargsPattern(actionSlice[j]);
    }

    pattern = new RegExp('^' + pattern);
    matches = regexpArgStrings.match(pattern);

    if (matches && matches.length > 0) {
      // need only groups
      matches = matches.splice(1);
      result = result.concat(matches.map(getLength));
      break;
    }
  }

  // return the list of arg string counts
  return result;
};

ArgumentParser.prototype._parseOptional = function (argString) {
  var action, optionString, argExplicit, optionTuples;

  // if it's an empty string, it was meant to be a positional
  if (!argString) {
    return null;
  }

  // if it doesn't start with a prefix, it was meant to be positional
  if (this.prefixChars.indexOf(argString[0]) < 0) {
    return null;
  }

  // if the option string is present in the parser, return the action
  if (this._optionStringActions[argString]) {
    return [ this._optionStringActions[argString], argString, null ];
  }

  // if it's just a single character, it was meant to be positional
  if (argString.length === 1) {
    return null;
  }

  // if the option string before the "=" is present, return the action
  if (argString.indexOf('=') >= 0) {
    optionString = argString.split('=', 1)[0];
    argExplicit = argString.slice(optionString.length + 1);

    if (this._optionStringActions[optionString]) {
      action = this._optionStringActions[optionString];
      return [ action, optionString, argExplicit ];
    }
  }

  // search through all possible prefixes of the option string
  // and all actions in the parser for possible interpretations
  optionTuples = this._getOptionTuples(argString);

  // if multiple actions match, the option string was ambiguous
  if (optionTuples.length > 1) {
    var optionStrings = optionTuples.map(function (optionTuple) {
      return optionTuple[1];
    });
    this.error(format$2(
          'Ambiguous option: "%s" could match %s.',
          argString, optionStrings.join(', ')
    ));
  // if exactly one action matched, this segmentation is good,
  // so return the parsed action
  } else if (optionTuples.length === 1) {
    return optionTuples[0];
  }

  // if it was not found as an option, but it looks like a negative
  // number, it was meant to be positional
  // unless there are negative-number-like options
  if (argString.match(this._regexpNegativeNumber)) {
    if (!this._hasNegativeNumberOptionals.some(Boolean)) {
      return null;
    }
  }
  // if it contains a space, it was meant to be a positional
  if (argString.search(' ') >= 0) {
    return null;
  }

  // it was meant to be an optional but there is no such option
  // in this parser (though it might be a valid option in a subparser)
  return [ null, argString, null ];
};

ArgumentParser.prototype._getOptionTuples = function (optionString) {
  var result = [];
  var chars = this.prefixChars;
  var optionPrefix;
  var argExplicit;
  var action;
  var actionOptionString;

  // option strings starting with two prefix characters are only split at
  // the '='
  if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) >= 0) {
    if (optionString.indexOf('=') >= 0) {
      var optionStringSplit = optionString.split('=', 1);

      optionPrefix = optionStringSplit[0];
      argExplicit = optionStringSplit[1];
    } else {
      optionPrefix = optionString;
      argExplicit = null;
    }

    for (actionOptionString in this._optionStringActions) {
      if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
        action = this._optionStringActions[actionOptionString];
        result.push([ action, actionOptionString, argExplicit ]);
      }
    }

  // single character options can be concatenated with their arguments
  // but multiple character options always have to have their argument
  // separate
  } else if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) < 0) {
    optionPrefix = optionString;
    argExplicit = null;
    var optionPrefixShort = optionString.substr(0, 2);
    var argExplicitShort = optionString.substr(2);

    for (actionOptionString in this._optionStringActions) {
      if (!utils.has(this._optionStringActions, actionOptionString)) continue;

      action = this._optionStringActions[actionOptionString];
      if (actionOptionString === optionPrefixShort) {
        result.push([ action, actionOptionString, argExplicitShort ]);
      } else if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
        result.push([ action, actionOptionString, argExplicit ]);
      }
    }

  // shouldn't ever get here
  } else {
    throw new Error(format$2('Unexpected option string: %s.', optionString));
  }
  // return the collected option tuples
  return result;
};

ArgumentParser.prototype._getNargsPattern = function (action) {
  // in all examples below, we have to allow for '--' args
  // which are represented as '-' in the pattern
  var regexpNargs;

  switch (action.nargs) {
    // the default (null) is assumed to be a single argument
    case undefined:
    case null:
      regexpNargs = '(-*A-*)';
      break;
    // allow zero or more arguments
    case _const.OPTIONAL:
      regexpNargs = '(-*A?-*)';
      break;
    // allow zero or more arguments
    case _const.ZERO_OR_MORE:
      regexpNargs = '(-*[A-]*)';
      break;
    // allow one or more arguments
    case _const.ONE_OR_MORE:
      regexpNargs = '(-*A[A-]*)';
      break;
    // allow any number of options or arguments
    case _const.REMAINDER:
      regexpNargs = '([-AO]*)';
      break;
    // allow one argument followed by any number of options or arguments
    case _const.PARSER:
      regexpNargs = '(-*A[-AO]*)';
      break;
    // all others should be integers
    default:
      regexpNargs = '(-*' + utils.repeat('-*A', action.nargs) + '-*)';
  }

  // if this is an optional action, -- is not allowed
  if (action.isOptional()) {
    regexpNargs = regexpNargs.replace(/-\*/g, '');
    regexpNargs = regexpNargs.replace(/-/g, '');
  }

  // return the pattern
  return regexpNargs;
};

//
// Value conversion methods
//

ArgumentParser.prototype._getValues = function (action, argStrings) {
  var self = this;

  // for everything but PARSER args, strip out '--'
  if (action.nargs !== _const.PARSER && action.nargs !== _const.REMAINDER) {
    argStrings = argStrings.filter(function (arrayElement) {
      return arrayElement !== '--';
    });
  }

  var value, argString;

  // optional argument produces a default when not present
  if (argStrings.length === 0 && action.nargs === _const.OPTIONAL) {

    value = (action.isOptional()) ? action.constant : action.defaultValue;

    if (typeof (value) === 'string') {
      value = this._getValue(action, value);
      this._checkValue(action, value);
    }

  // when nargs='*' on a positional, if there were no command-line
  // args, use the default if it is anything other than None
  } else if (argStrings.length === 0 && action.nargs === _const.ZERO_OR_MORE &&
    action.optionStrings.length === 0) {

    value = (action.defaultValue || argStrings);
    this._checkValue(action, value);

  // single argument or optional argument produces a single value
  } else if (argStrings.length === 1 &&
        (!action.nargs || action.nargs === _const.OPTIONAL)) {

    argString = argStrings[0];
    value = this._getValue(action, argString);
    this._checkValue(action, value);

  // REMAINDER arguments convert all values, checking none
  } else if (action.nargs === _const.REMAINDER) {
    value = argStrings.map(function (v) {
      return self._getValue(action, v);
    });

  // PARSER arguments convert all values, but check only the first
  } else if (action.nargs === _const.PARSER) {
    value = argStrings.map(function (v) {
      return self._getValue(action, v);
    });
    this._checkValue(action, value[0]);

  // all other types of nargs produce a list
  } else {
    value = argStrings.map(function (v) {
      return self._getValue(action, v);
    });
    value.forEach(function (v) {
      self._checkValue(action, v);
    });
  }

  // return the converted value
  return value;
};

ArgumentParser.prototype._getValue = function (action, argString) {
  var result;

  var typeFunction = this._registryGet('type', action.type, action.type);
  if (typeof typeFunction !== 'function') {
    var message = format$2('%s is not callable', typeFunction);
    throw error(action, message);
  }

  // convert the value to the appropriate type
  try {
    result = typeFunction(argString);

    // ArgumentTypeErrors indicate errors
    // If action.type is not a registered string, it is a function
    // Try to deduce its name for inclusion in the error message
    // Failing that, include the error message it raised.
  } catch (e) {
    var name = null;
    if (typeof action.type === 'string') {
      name = action.type;
    } else {
      name = action.type.name || action.type.displayName || '<function>';
    }
    var msg = format$2('Invalid %s value: %s', name, argString);
    if (name === '<function>') { msg += '\n' + e.message; }
    throw error(action, msg);
  }
  // return the converted value
  return result;
};

ArgumentParser.prototype._checkValue = function (action, value) {
  // converted value must be one of the choices (if specified)
  var choices = action.choices;
  if (choices) {
    // choise for argument can by array or string
    if ((typeof choices === 'string' || Array.isArray(choices)) &&
        choices.indexOf(value) !== -1) {
      return;
    }
    // choise for subparsers can by only hash
    if (typeof choices === 'object' && !Array.isArray(choices) && choices[value]) {
      return;
    }

    if (typeof choices === 'string') {
      choices = choices.split('').join(', ');
    } else if (Array.isArray(choices)) {
      choices =  choices.join(', ');
    } else {
      choices =  Object.keys(choices).join(', ');
    }
    var message = format$2('Invalid choice: %s (choose from [%s])', value, choices);
    throw error(action, message);
  }
};

//
// Help formatting methods
//

/**
 * ArgumentParser#formatUsage -> string
 *
 * Return usage string
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
 **/
ArgumentParser.prototype.formatUsage = function () {
  var formatter = this._getFormatter();
  formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups);
  return formatter.formatHelp();
};

/**
 * ArgumentParser#formatHelp -> string
 *
 * Return help
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
 **/
ArgumentParser.prototype.formatHelp = function () {
  var formatter = this._getFormatter();

  // usage
  formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups);

  // description
  formatter.addText(this.description);

  // positionals, optionals and user-defined groups
  this._actionGroups.forEach(function (actionGroup) {
    formatter.startSection(actionGroup.title);
    formatter.addText(actionGroup.description);
    formatter.addArguments(actionGroup._groupActions);
    formatter.endSection();
  });

  // epilog
  formatter.addText(this.epilog);

  // determine help from format above
  return formatter.formatHelp();
};

ArgumentParser.prototype._getFormatter = function () {
  var FormatterClass = this.formatterClass;
  var formatter = new FormatterClass({ prog: this.prog });
  return formatter;
};

//
//  Print functions
//

/**
 * ArgumentParser#printUsage() -> Void
 *
 * Print usage
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
 **/
ArgumentParser.prototype.printUsage = function () {
  this._printMessage(this.formatUsage());
};

/**
 * ArgumentParser#printHelp() -> Void
 *
 * Print help
 *
 * See also [original guide][1]
 *
 * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
 **/
ArgumentParser.prototype.printHelp = function () {
  this._printMessage(this.formatHelp());
};

ArgumentParser.prototype._printMessage = function (message, stream) {
  if (!stream) {
    stream = process.stdout;
  }
  if (message) {
    stream.write('' + message);
  }
};

//
//  Exit functions
//

/**
 * ArgumentParser#exit(status=0, message) -> Void
 * - status (int): exit status
 * - message (string): message
 *
 * Print message in stderr/stdout and exit program
 **/
ArgumentParser.prototype.exit = function (status, message) {
  if (message) {
    if (status === 0) {
      this._printMessage(message);
    } else {
      this._printMessage(message, process.stderr);
    }
  }

  process.exit(status);
};

/**
 * ArgumentParser#error(message) -> Void
 * - err (Error|string): message
 *
 * Error method Prints a usage message incorporating the message to stderr and
 * exits. If you override this in a subclass,
 * it should not return -- it should
 * either exit or throw an exception.
 *
 **/
ArgumentParser.prototype.error = function (err) {
  var message;
  if (err instanceof Error) {
    if (this.debug === true) {
      throw err;
    }
    message = err.message;
  } else {
    message = err;
  }
  var msg = format$2('%s: error: %s', this.prog, message) + _const.EOL;

  if (this.debug === true) {
    throw new Error(msg);
  }

  this.printUsage(process.stderr);

  return this.exit(2, msg);
};

// Constants





/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which adds default values to argument help.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

function ArgumentDefaultsHelpFormatter(options) {
  formatter.call(this, options);
}

util.inherits(ArgumentDefaultsHelpFormatter, formatter);

ArgumentDefaultsHelpFormatter.prototype._getHelpString = function (action) {
  var help = action.help;
  if (action.help.indexOf('%(defaultValue)s') === -1) {
    if (action.defaultValue !== _const.SUPPRESS) {
      var defaulting_nargs = [ _const.OPTIONAL, _const.ZERO_OR_MORE ];
      if (action.isOptional() || (defaulting_nargs.indexOf(action.nargs) >= 0)) {
        help += ' (default: %(defaultValue)s)';
      }
    }
  }
  return help;
};

/**
 * new RawDescriptionHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
 *
 * Help message formatter which retains any formatting in descriptions.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

function RawDescriptionHelpFormatter(options) {
  formatter.call(this, options);
}

util.inherits(RawDescriptionHelpFormatter, formatter);

RawDescriptionHelpFormatter.prototype._fillText = function (text, width, indent) {
  var lines = text.split('\n');
  lines = lines.map(function (line) {
    return utils.trimEnd(indent + line);
  });
  return lines.join('\n');
};

/**
 * new RawTextHelpFormatter(options)
 * new ArgumentParser({formatterClass: argparse.RawTextHelpFormatter, ...})
 *
 * Help message formatter which retains formatting of all help text.
 *
 * Only the name of this class is considered a public API. All the methods
 * provided by the class are considered an implementation detail.
 **/

function RawTextHelpFormatter(options) {
  RawDescriptionHelpFormatter.call(this, options);
}

util.inherits(RawTextHelpFormatter, RawDescriptionHelpFormatter);

RawTextHelpFormatter.prototype._splitLines = function (text) {
  return text.split('\n');
};

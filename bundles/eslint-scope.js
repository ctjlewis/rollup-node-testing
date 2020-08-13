import assert from 'assert';

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

var name = "estraverse";
var description = "ECMAScript JS AST traversal functions";
var homepage = "https://github.com/estools/estraverse";
var main = "estraverse.js";
var version = "4.3.0";
var engines = {
	node: ">=4.0"
};
var maintainers = [
	{
		name: "Yusuke Suzuki",
		email: "utatane.tea@gmail.com",
		web: "http://github.com/Constellation"
	}
];
var repository = {
	type: "git",
	url: "http://github.com/estools/estraverse.git"
};
var devDependencies = {
	"babel-preset-env": "^1.6.1",
	"babel-register": "^6.3.13",
	chai: "^2.1.1",
	espree: "^1.11.0",
	gulp: "^3.8.10",
	"gulp-bump": "^0.2.2",
	"gulp-filter": "^2.0.0",
	"gulp-git": "^1.0.1",
	"gulp-tag-version": "^1.3.0",
	jshint: "^2.5.6",
	mocha: "^2.1.0"
};
var license = "BSD-2-Clause";
var scripts = {
	test: "npm run-script lint && npm run-script unit-test",
	lint: "jshint estraverse.js",
	"unit-test": "mocha --compilers js:babel-register"
};
var _package = {
	name: name,
	description: description,
	homepage: homepage,
	main: main,
	version: version,
	engines: engines,
	maintainers: maintainers,
	repository: repository,
	devDependencies: devDependencies,
	license: license,
	scripts: scripts
};

var _package$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	name: name,
	description: description,
	homepage: homepage,
	main: main,
	version: version,
	engines: engines,
	maintainers: maintainers,
	repository: repository,
	devDependencies: devDependencies,
	license: license,
	scripts: scripts,
	'default': _package
});

var require$$0 = getCjsExportFromNamespace(_package$1);

var estraverse = createCommonjsModule(function (module, exports) {
/*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

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
/*jslint vars:false, bitwise:true*/
/*jshint indent:4*/
/*global exports:true*/
(function clone(exports) {

    var Syntax,
        VisitorOption,
        VisitorKeys,
        BREAK,
        SKIP,
        REMOVE;

    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                } else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }

    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License

    function upperBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            } else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        AwaitExpression: 'AwaitExpression', // CAUTION: It's deferred to ES7.
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ComprehensionBlock: 'ComprehensionBlock',  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: 'ComprehensionExpression',  // CAUTION: It's deferred to ES7.
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DebuggerStatement: 'DebuggerStatement',
        DirectiveStatement: 'DirectiveStatement',
        DoWhileStatement: 'DoWhileStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        ForOfStatement: 'ForOfStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        GeneratorExpression: 'GeneratorExpression',  // CAUTION: It's deferred to ES7.
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportExpression: 'ImportExpression',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        ModuleSpecifier: 'ModuleSpecifier',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        AssignmentPattern: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'body'],
        AwaitExpression: ['argument'], // CAUTION: It's deferred to ES7.
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'superClass', 'body'],
        ClassExpression: ['id', 'superClass', 'body'],
        ComprehensionBlock: ['left', 'right'],  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExportAllDeclaration: ['source'],
        ExportDefaultDeclaration: ['declaration'],
        ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
        ExportSpecifier: ['exported', 'local'],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        ForOfStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        GeneratorExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        ImportExpression: ['source'],
        ImportDeclaration: ['specifiers', 'source'],
        ImportDefaultSpecifier: ['local'],
        ImportNamespaceSpecifier: ['local'],
        ImportSpecifier: ['imported', 'local'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        MetaProperty: ['meta', 'property'],
        MethodDefinition: ['key', 'value'],
        ModuleSpecifier: [],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        RestElement: [ 'argument' ],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SpreadElement: ['argument'],
        Super: [],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        TaggedTemplateExpression: ['tag', 'quasi'],
        TemplateElement: [],
        TemplateLiteral: ['quasis', 'expressions'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handler', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };

    // unique id
    BREAK = {};
    SKIP = {};
    REMOVE = {};

    VisitorOption = {
        Break: BREAK,
        Skip: SKIP,
        Remove: REMOVE
    };

    function Reference(parent, key) {
        this.parent = parent;
        this.key = key;
    }

    Reference.prototype.replace = function replace(node) {
        this.parent[this.key] = node;
    };

    Reference.prototype.remove = function remove() {
        if (Array.isArray(this.parent)) {
            this.parent.splice(this.key, 1);
            return true;
        } else {
            this.replace(null);
            return false;
        }
    };

    function Element(node, path, wrap, ref) {
        this.node = node;
        this.path = path;
        this.wrap = wrap;
        this.ref = ref;
    }

    function Controller() { }

    // API:
    // return property path array from root to current node
    Controller.prototype.path = function path() {
        var i, iz, j, jz, result, element;

        function addToPath(result, path) {
            if (Array.isArray(path)) {
                for (j = 0, jz = path.length; j < jz; ++j) {
                    result.push(path[j]);
                }
            } else {
                result.push(path);
            }
        }

        // root node
        if (!this.__current.path) {
            return null;
        }

        // first node is sentinel, second node is root element
        result = [];
        for (i = 2, iz = this.__leavelist.length; i < iz; ++i) {
            element = this.__leavelist[i];
            addToPath(result, element.path);
        }
        addToPath(result, this.__current.path);
        return result;
    };

    // API:
    // return type of current node
    Controller.prototype.type = function () {
        var node = this.current();
        return node.type || this.__current.wrap;
    };

    // API:
    // return array of parent elements
    Controller.prototype.parents = function parents() {
        var i, iz, result;

        // first node is sentinel
        result = [];
        for (i = 1, iz = this.__leavelist.length; i < iz; ++i) {
            result.push(this.__leavelist[i].node);
        }

        return result;
    };

    // API:
    // return current node
    Controller.prototype.current = function current() {
        return this.__current.node;
    };

    Controller.prototype.__execute = function __execute(callback, element) {
        var previous, result;

        result = undefined;

        previous  = this.__current;
        this.__current = element;
        this.__state = null;
        if (callback) {
            result = callback.call(this, element.node, this.__leavelist[this.__leavelist.length - 1].node);
        }
        this.__current = previous;

        return result;
    };

    // API:
    // notify control skip / break
    Controller.prototype.notify = function notify(flag) {
        this.__state = flag;
    };

    // API:
    // skip child nodes of current node
    Controller.prototype.skip = function () {
        this.notify(SKIP);
    };

    // API:
    // break traversals
    Controller.prototype['break'] = function () {
        this.notify(BREAK);
    };

    // API:
    // remove node
    Controller.prototype.remove = function () {
        this.notify(REMOVE);
    };

    Controller.prototype.__initialize = function(root, visitor) {
        this.visitor = visitor;
        this.root = root;
        this.__worklist = [];
        this.__leavelist = [];
        this.__current = null;
        this.__state = null;
        this.__fallback = null;
        if (visitor.fallback === 'iteration') {
            this.__fallback = Object.keys;
        } else if (typeof visitor.fallback === 'function') {
            this.__fallback = visitor.fallback;
        }

        this.__keys = VisitorKeys;
        if (visitor.keys) {
            this.__keys = Object.assign(Object.create(this.__keys), visitor.keys);
        }
    };

    function isNode(node) {
        if (node == null) {
            return false;
        }
        return typeof node === 'object' && typeof node.type === 'string';
    }

    function isProperty(nodeType, key) {
        return (nodeType === Syntax.ObjectExpression || nodeType === Syntax.ObjectPattern) && 'properties' === key;
    }

    Controller.prototype.traverse = function traverse(root, visitor) {
        var worklist,
            leavelist,
            element,
            node,
            nodeType,
            ret,
            key,
            current,
            current2,
            candidates,
            candidate,
            sentinel;

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        worklist.push(new Element(root, null, null, null));
        leavelist.push(new Element(null, null, null, null));

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                ret = this.__execute(visitor.leave, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }
                continue;
            }

            if (element.node) {

                ret = this.__execute(visitor.enter, element);

                if (this.__state === BREAK || ret === BREAK) {
                    return;
                }

                worklist.push(sentinel);
                leavelist.push(element);

                if (this.__state === SKIP || ret === SKIP) {
                    continue;
                }

                node = element.node;
                nodeType = node.type || element.wrap;
                candidates = this.__keys[nodeType];
                if (!candidates) {
                    if (this.__fallback) {
                        candidates = this.__fallback(node);
                    } else {
                        throw new Error('Unknown node type ' + nodeType + '.');
                    }
                }

                current = candidates.length;
                while ((current -= 1) >= 0) {
                    key = candidates[current];
                    candidate = node[key];
                    if (!candidate) {
                        continue;
                    }

                    if (Array.isArray(candidate)) {
                        current2 = candidate.length;
                        while ((current2 -= 1) >= 0) {
                            if (!candidate[current2]) {
                                continue;
                            }
                            if (isProperty(nodeType, candidates[current])) {
                                element = new Element(candidate[current2], [key, current2], 'Property', null);
                            } else if (isNode(candidate[current2])) {
                                element = new Element(candidate[current2], [key, current2], null, null);
                            } else {
                                continue;
                            }
                            worklist.push(element);
                        }
                    } else if (isNode(candidate)) {
                        worklist.push(new Element(candidate, key, null, null));
                    }
                }
            }
        }
    };

    Controller.prototype.replace = function replace(root, visitor) {
        var worklist,
            leavelist,
            node,
            nodeType,
            target,
            element,
            current,
            current2,
            candidates,
            candidate,
            sentinel,
            outer,
            key;

        function removeElem(element) {
            var i,
                key,
                nextElem,
                parent;

            if (element.ref.remove()) {
                // When the reference is an element of an array.
                key = element.ref.key;
                parent = element.ref.parent;

                // If removed from array, then decrease following items' keys.
                i = worklist.length;
                while (i--) {
                    nextElem = worklist[i];
                    if (nextElem.ref && nextElem.ref.parent === parent) {
                        if  (nextElem.ref.key < key) {
                            break;
                        }
                        --nextElem.ref.key;
                    }
                }
            }
        }

        this.__initialize(root, visitor);

        sentinel = {};

        // reference
        worklist = this.__worklist;
        leavelist = this.__leavelist;

        // initialize
        outer = {
            root: root
        };
        element = new Element(root, null, null, new Reference(outer, 'root'));
        worklist.push(element);
        leavelist.push(element);

        while (worklist.length) {
            element = worklist.pop();

            if (element === sentinel) {
                element = leavelist.pop();

                target = this.__execute(visitor.leave, element);

                // node may be replaced with null,
                // so distinguish between undefined and null in this place
                if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                    // replace
                    element.ref.replace(target);
                }

                if (this.__state === REMOVE || target === REMOVE) {
                    removeElem(element);
                }

                if (this.__state === BREAK || target === BREAK) {
                    return outer.root;
                }
                continue;
            }

            target = this.__execute(visitor.enter, element);

            // node may be replaced with null,
            // so distinguish between undefined and null in this place
            if (target !== undefined && target !== BREAK && target !== SKIP && target !== REMOVE) {
                // replace
                element.ref.replace(target);
                element.node = target;
            }

            if (this.__state === REMOVE || target === REMOVE) {
                removeElem(element);
                element.node = null;
            }

            if (this.__state === BREAK || target === BREAK) {
                return outer.root;
            }

            // node may be null
            node = element.node;
            if (!node) {
                continue;
            }

            worklist.push(sentinel);
            leavelist.push(element);

            if (this.__state === SKIP || target === SKIP) {
                continue;
            }

            nodeType = node.type || element.wrap;
            candidates = this.__keys[nodeType];
            if (!candidates) {
                if (this.__fallback) {
                    candidates = this.__fallback(node);
                } else {
                    throw new Error('Unknown node type ' + nodeType + '.');
                }
            }

            current = candidates.length;
            while ((current -= 1) >= 0) {
                key = candidates[current];
                candidate = node[key];
                if (!candidate) {
                    continue;
                }

                if (Array.isArray(candidate)) {
                    current2 = candidate.length;
                    while ((current2 -= 1) >= 0) {
                        if (!candidate[current2]) {
                            continue;
                        }
                        if (isProperty(nodeType, candidates[current])) {
                            element = new Element(candidate[current2], [key, current2], 'Property', new Reference(candidate, current2));
                        } else if (isNode(candidate[current2])) {
                            element = new Element(candidate[current2], [key, current2], null, new Reference(candidate, current2));
                        } else {
                            continue;
                        }
                        worklist.push(element);
                    }
                } else if (isNode(candidate)) {
                    worklist.push(new Element(candidate, key, null, new Reference(node, key)));
                }
            }
        }

        return outer.root;
    };

    function traverse(root, visitor) {
        var controller = new Controller();
        return controller.traverse(root, visitor);
    }

    function replace(root, visitor) {
        var controller = new Controller();
        return controller.replace(root, visitor);
    }

    function extendCommentRange(comment, tokens) {
        var target;

        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });

        comment.extendedRange = [comment.range[0], comment.range[1]];

        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }

        target -= 1;
        if (target >= 0) {
            comment.extendedRange[0] = tokens[target].range[1];
        }

        return comment;
    }

    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i, cursor;

        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }

        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }

        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }

        // This is based on John Freeman's implementation.
        cursor = 0;
        traverse(tree, {
            enter: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        cursor = 0;
        traverse(tree, {
            leave: function (node) {
                var comment;

                while (cursor < comments.length) {
                    comment = comments[cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(cursor, 1);
                    } else {
                        cursor += 1;
                    }
                }

                // already out of owned node
                if (cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        return tree;
    }

    exports.version = require$$0.version;
    exports.Syntax = Syntax;
    exports.traverse = traverse;
    exports.replace = replace;
    exports.attachComments = attachComments;
    exports.VisitorKeys = VisitorKeys;
    exports.VisitorOption = VisitorOption;
    exports.Controller = Controller;
    exports.cloneEnvironment = function () { return clone({}); };

    return exports;
}(exports));
/* vim: set sw=4 ts=4 et tw=80 : */
});

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

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

const READ = 0x1;
const WRITE = 0x2;
const RW = READ | WRITE;

/**
 * A Reference represents a single occurrence of an identifier in code.
 * @class Reference
 */
class Reference {
    constructor(ident, scope, flag, writeExpr, maybeImplicitGlobal, partial, init) {

        /**
         * Identifier syntax node.
         * @member {espreeIdentifier} Reference#identifier
         */
        this.identifier = ident;

        /**
         * Reference to the enclosing Scope.
         * @member {Scope} Reference#from
         */
        this.from = scope;

        /**
         * Whether the reference comes from a dynamic scope (such as 'eval',
         * 'with', etc.), and may be trapped by dynamic scopes.
         * @member {boolean} Reference#tainted
         */
        this.tainted = false;

        /**
         * The variable this reference is resolved with.
         * @member {Variable} Reference#resolved
         */
        this.resolved = null;

        /**
         * The read-write mode of the reference. (Value is one of {@link
         * Reference.READ}, {@link Reference.RW}, {@link Reference.WRITE}).
         * @member {number} Reference#flag
         * @private
         */
        this.flag = flag;
        if (this.isWrite()) {

            /**
             * If reference is writeable, this is the tree being written to it.
             * @member {espreeNode} Reference#writeExpr
             */
            this.writeExpr = writeExpr;

            /**
             * Whether the Reference might refer to a partial value of writeExpr.
             * @member {boolean} Reference#partial
             */
            this.partial = partial;

            /**
             * Whether the Reference is to write of initialization.
             * @member {boolean} Reference#init
             */
            this.init = init;
        }
        this.__maybeImplicitGlobal = maybeImplicitGlobal;
    }

    /**
     * Whether the reference is static.
     * @method Reference#isStatic
     * @returns {boolean} static
     */
    isStatic() {
        return !this.tainted && this.resolved && this.resolved.scope.isStatic();
    }

    /**
     * Whether the reference is writeable.
     * @method Reference#isWrite
     * @returns {boolean} write
     */
    isWrite() {
        return !!(this.flag & Reference.WRITE);
    }

    /**
     * Whether the reference is readable.
     * @method Reference#isRead
     * @returns {boolean} read
     */
    isRead() {
        return !!(this.flag & Reference.READ);
    }

    /**
     * Whether the reference is read-only.
     * @method Reference#isReadOnly
     * @returns {boolean} read only
     */
    isReadOnly() {
        return this.flag === Reference.READ;
    }

    /**
     * Whether the reference is write-only.
     * @method Reference#isWriteOnly
     * @returns {boolean} write only
     */
    isWriteOnly() {
        return this.flag === Reference.WRITE;
    }

    /**
     * Whether the reference is read-write.
     * @method Reference#isReadWrite
     * @returns {boolean} read write
     */
    isReadWrite() {
        return this.flag === Reference.RW;
    }
}

/**
 * @constant Reference.READ
 * @private
 */
Reference.READ = READ;

/**
 * @constant Reference.WRITE
 * @private
 */
Reference.WRITE = WRITE;

/**
 * @constant Reference.RW
 * @private
 */
Reference.RW = RW;

var reference = Reference;

/*
  Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>

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

/**
 * A Variable represents a locally scoped identifier. These include arguments to
 * functions.
 * @class Variable
 */
class Variable {
    constructor(name, scope) {

        /**
         * The variable name, as given in the source code.
         * @member {String} Variable#name
         */
        this.name = name;

        /**
         * List of defining occurrences of this variable (like in 'var ...'
         * statements or as parameter), as AST nodes.
         * @member {espree.Identifier[]} Variable#identifiers
         */
        this.identifiers = [];

        /**
         * List of {@link Reference|references} of this variable (excluding parameter entries)
         * in its defining scope and all nested scopes. For defining
         * occurrences only see {@link Variable#defs}.
         * @member {Reference[]} Variable#references
         */
        this.references = [];

        /**
         * List of defining occurrences of this variable (like in 'var ...'
         * statements or as parameter), as custom objects.
         * @member {Definition[]} Variable#defs
         */
        this.defs = [];

        this.tainted = false;

        /**
         * Whether this is a stack variable.
         * @member {boolean} Variable#stack
         */
        this.stack = true;

        /**
         * Reference to the enclosing Scope.
         * @member {Scope} Variable#scope
         */
        this.scope = scope;
    }
}

Variable.CatchClause = "CatchClause";
Variable.Parameter = "Parameter";
Variable.FunctionName = "FunctionName";
Variable.ClassName = "ClassName";
Variable.Variable = "Variable";
Variable.ImportBinding = "ImportBinding";
Variable.ImplicitGlobalVariable = "ImplicitGlobalVariable";

var variable = Variable;

/**
 * @class Definition
 */
class Definition {
    constructor(type, name, node, parent, index, kind) {

        /**
         * @member {String} Definition#type - type of the occurrence (e.g. "Parameter", "Variable", ...).
         */
        this.type = type;

        /**
         * @member {espree.Identifier} Definition#name - the identifier AST node of the occurrence.
         */
        this.name = name;

        /**
         * @member {espree.Node} Definition#node - the enclosing node of the identifier.
         */
        this.node = node;

        /**
         * @member {espree.Node?} Definition#parent - the enclosing statement node of the identifier.
         */
        this.parent = parent;

        /**
         * @member {Number?} Definition#index - the index in the declaration statement.
         */
        this.index = index;

        /**
         * @member {String?} Definition#kind - the kind of the declaration statement.
         */
        this.kind = kind;
    }
}

/**
 * @class ParameterDefinition
 */
class ParameterDefinition extends Definition {
    constructor(name, node, index, rest) {
        super(variable.Parameter, name, node, null, index, null);

        /**
         * Whether the parameter definition is a part of a rest parameter.
         * @member {boolean} ParameterDefinition#rest
         */
        this.rest = rest;
    }
}

var definition = {
    ParameterDefinition,
    Definition
};

/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undefined */

const Syntax = estraverse.Syntax;

var name$1 = "esrecurse";
var description$1 = "ECMAScript AST recursive visitor";
var homepage$1 = "https://github.com/estools/esrecurse";
var main$1 = "esrecurse.js";
var version$1 = "4.2.1";
var engines$1 = {
	node: ">=4.0"
};
var maintainers$1 = [
	{
		name: "Yusuke Suzuki",
		email: "utatane.tea@gmail.com",
		web: "https://github.com/Constellation"
	}
];
var repository$1 = {
	type: "git",
	url: "https://github.com/estools/esrecurse.git"
};
var dependencies = {
	estraverse: "^4.1.0"
};
var devDependencies$1 = {
	"babel-cli": "^6.24.1",
	"babel-eslint": "^7.2.3",
	"babel-preset-es2015": "^6.24.1",
	"babel-register": "^6.24.1",
	chai: "^4.0.2",
	esprima: "^4.0.0",
	gulp: "^3.9.0",
	"gulp-bump": "^2.7.0",
	"gulp-eslint": "^4.0.0",
	"gulp-filter": "^5.0.0",
	"gulp-git": "^2.4.1",
	"gulp-mocha": "^4.3.1",
	"gulp-tag-version": "^1.2.1",
	jsdoc: "^3.3.0-alpha10",
	minimist: "^1.1.0"
};
var license$1 = "BSD-2-Clause";
var scripts$1 = {
	test: "gulp travis",
	"unit-test": "gulp test",
	lint: "gulp lint"
};
var babel = {
	presets: [
		"es2015"
	]
};
var _package$2 = {
	name: name$1,
	description: description$1,
	homepage: homepage$1,
	main: main$1,
	version: version$1,
	engines: engines$1,
	maintainers: maintainers$1,
	repository: repository$1,
	dependencies: dependencies,
	devDependencies: devDependencies$1,
	license: license$1,
	scripts: scripts$1,
	babel: babel
};

var _package$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	name: name$1,
	description: description$1,
	homepage: homepage$1,
	main: main$1,
	version: version$1,
	engines: engines$1,
	maintainers: maintainers$1,
	repository: repository$1,
	dependencies: dependencies,
	devDependencies: devDependencies$1,
	license: license$1,
	scripts: scripts$1,
	babel: babel,
	'default': _package$2
});

var require$$1 = getCjsExportFromNamespace(_package$3);

var esrecurse = createCommonjsModule(function (module, exports) {
/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

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

    var estraverse$1 = estraverse;

    function isNode(node) {
        if (node == null) {
            return false;
        }
        return typeof node === 'object' && typeof node.type === 'string';
    }

    function isProperty(nodeType, key) {
        return (nodeType === estraverse$1.Syntax.ObjectExpression || nodeType === estraverse$1.Syntax.ObjectPattern) && key === 'properties';
    }

    function Visitor(visitor, options) {
        options = options || {};

        this.__visitor = visitor ||  this;
        this.__childVisitorKeys = options.childVisitorKeys
            ? Object.assign({}, estraverse$1.VisitorKeys, options.childVisitorKeys)
            : estraverse$1.VisitorKeys;
        if (options.fallback === 'iteration') {
            this.__fallback = Object.keys;
        } else if (typeof options.fallback === 'function') {
            this.__fallback = options.fallback;
        }
    }

    /* Default method for visiting children.
     * When you need to call default visiting operation inside custom visiting
     * operation, you can use it with `this.visitChildren(node)`.
     */
    Visitor.prototype.visitChildren = function (node) {
        var type, children, i, iz, j, jz, child;

        if (node == null) {
            return;
        }

        type = node.type || estraverse$1.Syntax.Property;

        children = this.__childVisitorKeys[type];
        if (!children) {
            if (this.__fallback) {
                children = this.__fallback(node);
            } else {
                throw new Error('Unknown node type ' + type + '.');
            }
        }

        for (i = 0, iz = children.length; i < iz; ++i) {
            child = node[children[i]];
            if (child) {
                if (Array.isArray(child)) {
                    for (j = 0, jz = child.length; j < jz; ++j) {
                        if (child[j]) {
                            if (isNode(child[j]) || isProperty(type, children[i])) {
                                this.visit(child[j]);
                            }
                        }
                    }
                } else if (isNode(child)) {
                    this.visit(child);
                }
            }
        }
    };

    /* Dispatching node. */
    Visitor.prototype.visit = function (node) {
        var type;

        if (node == null) {
            return;
        }

        type = node.type || estraverse$1.Syntax.Property;
        if (this.__visitor[type]) {
            this.__visitor[type].call(this, node);
            return;
        }
        this.visitChildren(node);
    };

    exports.version = require$$1.version;
    exports.Visitor = Visitor;
    exports.visit = function (node, visitor, options) {
        var v = new Visitor(visitor, options);
        v.visit(node);
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
});

/* eslint-disable no-undefined */

const Syntax$1 = estraverse.Syntax;


/**
 * Get last array element
 * @param {array} xs - array
 * @returns {any} Last elment
 */
function getLast(xs) {
    return xs[xs.length - 1] || null;
}

class PatternVisitor extends esrecurse.Visitor {
    static isPattern(node) {
        const nodeType = node.type;

        return (
            nodeType === Syntax$1.Identifier ||
            nodeType === Syntax$1.ObjectPattern ||
            nodeType === Syntax$1.ArrayPattern ||
            nodeType === Syntax$1.SpreadElement ||
            nodeType === Syntax$1.RestElement ||
            nodeType === Syntax$1.AssignmentPattern
        );
    }

    constructor(options, rootPattern, callback) {
        super(null, options);
        this.rootPattern = rootPattern;
        this.callback = callback;
        this.assignments = [];
        this.rightHandNodes = [];
        this.restElements = [];
    }

    Identifier(pattern) {
        const lastRestElement = getLast(this.restElements);

        this.callback(pattern, {
            topLevel: pattern === this.rootPattern,
            rest: lastRestElement !== null && lastRestElement !== undefined && lastRestElement.argument === pattern,
            assignments: this.assignments
        });
    }

    Property(property) {

        // Computed property's key is a right hand node.
        if (property.computed) {
            this.rightHandNodes.push(property.key);
        }

        // If it's shorthand, its key is same as its value.
        // If it's shorthand and has its default value, its key is same as its value.left (the value is AssignmentPattern).
        // If it's not shorthand, the name of new variable is its value's.
        this.visit(property.value);
    }

    ArrayPattern(pattern) {
        for (let i = 0, iz = pattern.elements.length; i < iz; ++i) {
            const element = pattern.elements[i];

            this.visit(element);
        }
    }

    AssignmentPattern(pattern) {
        this.assignments.push(pattern);
        this.visit(pattern.left);
        this.rightHandNodes.push(pattern.right);
        this.assignments.pop();
    }

    RestElement(pattern) {
        this.restElements.push(pattern);
        this.visit(pattern.argument);
        this.restElements.pop();
    }

    MemberExpression(node) {

        // Computed property's key is a right hand node.
        if (node.computed) {
            this.rightHandNodes.push(node.property);
        }

        // the object is only read, write to its property.
        this.rightHandNodes.push(node.object);
    }

    //
    // ForInStatement.left and AssignmentExpression.left are LeftHandSideExpression.
    // By spec, LeftHandSideExpression is Pattern or MemberExpression.
    //   (see also: https://github.com/estree/estree/pull/20#issuecomment-74584758)
    // But espree 2.0 parses to ArrayExpression, ObjectExpression, etc...
    //

    SpreadElement(node) {
        this.visit(node.argument);
    }

    ArrayExpression(node) {
        node.elements.forEach(this.visit, this);
    }

    AssignmentExpression(node) {
        this.assignments.push(node);
        this.visit(node.left);
        this.rightHandNodes.push(node.right);
        this.assignments.pop();
    }

    CallExpression(node) {

        // arguments are right hand nodes.
        node.arguments.forEach(a => {
            this.rightHandNodes.push(a);
        });
        this.visit(node.callee);
    }
}

var patternVisitor = PatternVisitor;

/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undefined */

const Syntax$2 = estraverse.Syntax;







const ParameterDefinition$1 = definition.ParameterDefinition;
const Definition$1 = definition.Definition;

/**
 * Traverse identifier in pattern
 * @param {Object} options - options
 * @param {pattern} rootPattern - root pattern
 * @param {Refencer} referencer - referencer
 * @param {callback} callback - callback
 * @returns {void}
 */
function traverseIdentifierInPattern(options, rootPattern, referencer, callback) {

    // Call the callback at left hand identifier nodes, and Collect right hand nodes.
    const visitor = new patternVisitor(options, rootPattern, callback);

    visitor.visit(rootPattern);

    // Process the right hand nodes recursively.
    if (referencer !== null && referencer !== undefined) {
        visitor.rightHandNodes.forEach(referencer.visit, referencer);
    }
}

// Importing ImportDeclaration.
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-moduledeclarationinstantiation
// https://github.com/estree/estree/blob/master/es6.md#importdeclaration
// FIXME: Now, we don't create module environment, because the context is
// implementation dependent.

class Importer extends esrecurse.Visitor {
    constructor(declaration, referencer) {
        super(null, referencer.options);
        this.declaration = declaration;
        this.referencer = referencer;
    }

    visitImport(id, specifier) {
        this.referencer.visitPattern(id, pattern => {
            this.referencer.currentScope().__define(pattern,
                new Definition$1(
                    variable.ImportBinding,
                    pattern,
                    specifier,
                    this.declaration,
                    null,
                    null
                    ));
        });
    }

    ImportNamespaceSpecifier(node) {
        const local = (node.local || node.id);

        if (local) {
            this.visitImport(local, node);
        }
    }

    ImportDefaultSpecifier(node) {
        const local = (node.local || node.id);

        this.visitImport(local, node);
    }

    ImportSpecifier(node) {
        const local = (node.local || node.id);

        if (node.name) {
            this.visitImport(node.name, node);
        } else {
            this.visitImport(local, node);
        }
    }
}

// Referencing variables and creating bindings.
class Referencer extends esrecurse.Visitor {
    constructor(options, scopeManager) {
        super(null, options);
        this.options = options;
        this.scopeManager = scopeManager;
        this.parent = null;
        this.isInnerMethodDefinition = false;
    }

    currentScope() {
        return this.scopeManager.__currentScope;
    }

    close(node) {
        while (this.currentScope() && node === this.currentScope().block) {
            this.scopeManager.__currentScope = this.currentScope().__close(this.scopeManager);
        }
    }

    pushInnerMethodDefinition(isInnerMethodDefinition) {
        const previous = this.isInnerMethodDefinition;

        this.isInnerMethodDefinition = isInnerMethodDefinition;
        return previous;
    }

    popInnerMethodDefinition(isInnerMethodDefinition) {
        this.isInnerMethodDefinition = isInnerMethodDefinition;
    }

    referencingDefaultValue(pattern, assignments, maybeImplicitGlobal, init) {
        const scope = this.currentScope();

        assignments.forEach(assignment => {
            scope.__referencing(
                pattern,
                reference.WRITE,
                assignment.right,
                maybeImplicitGlobal,
                pattern !== assignment.left,
                init);
        });
    }

    visitPattern(node, options, callback) {
        if (typeof options === "function") {
            callback = options;
            options = { processRightHandNodes: false };
        }
        traverseIdentifierInPattern(
            this.options,
            node,
            options.processRightHandNodes ? this : null,
            callback);
    }

    visitFunction(node) {
        let i, iz;

        // FunctionDeclaration name is defined in upper scope
        // NOTE: Not referring variableScope. It is intended.
        // Since
        //  in ES5, FunctionDeclaration should be in FunctionBody.
        //  in ES6, FunctionDeclaration should be block scoped.

        if (node.type === Syntax$2.FunctionDeclaration) {

            // id is defined in upper scope
            this.currentScope().__define(node.id,
                    new Definition$1(
                        variable.FunctionName,
                        node.id,
                        node,
                        null,
                        null,
                        null
                    ));
        }

        // FunctionExpression with name creates its special scope;
        // FunctionExpressionNameScope.
        if (node.type === Syntax$2.FunctionExpression && node.id) {
            this.scopeManager.__nestFunctionExpressionNameScope(node);
        }

        // Consider this function is in the MethodDefinition.
        this.scopeManager.__nestFunctionScope(node, this.isInnerMethodDefinition);

        const that = this;

        /**
         * Visit pattern callback
         * @param {pattern} pattern - pattern
         * @param {Object} info - info
         * @returns {void}
         */
        function visitPatternCallback(pattern, info) {
            that.currentScope().__define(pattern,
                new ParameterDefinition$1(
                    pattern,
                    node,
                    i,
                    info.rest
                ));

            that.referencingDefaultValue(pattern, info.assignments, null, true);
        }

        // Process parameter declarations.
        for (i = 0, iz = node.params.length; i < iz; ++i) {
            this.visitPattern(node.params[i], { processRightHandNodes: true }, visitPatternCallback);
        }

        // if there's a rest argument, add that
        if (node.rest) {
            this.visitPattern({
                type: "RestElement",
                argument: node.rest
            }, pattern => {
                this.currentScope().__define(pattern,
                    new ParameterDefinition$1(
                        pattern,
                        node,
                        node.params.length,
                        true
                    ));
            });
        }

        // In TypeScript there are a number of function-like constructs which have no body,
        // so check it exists before traversing
        if (node.body) {

            // Skip BlockStatement to prevent creating BlockStatement scope.
            if (node.body.type === Syntax$2.BlockStatement) {
                this.visitChildren(node.body);
            } else {
                this.visit(node.body);
            }
        }

        this.close(node);
    }

    visitClass(node) {
        if (node.type === Syntax$2.ClassDeclaration) {
            this.currentScope().__define(node.id,
                    new Definition$1(
                        variable.ClassName,
                        node.id,
                        node,
                        null,
                        null,
                        null
                    ));
        }

        this.visit(node.superClass);

        this.scopeManager.__nestClassScope(node);

        if (node.id) {
            this.currentScope().__define(node.id,
                    new Definition$1(
                        variable.ClassName,
                        node.id,
                        node
                    ));
        }
        this.visit(node.body);

        this.close(node);
    }

    visitProperty(node) {
        let previous;

        if (node.computed) {
            this.visit(node.key);
        }

        const isMethodDefinition = node.type === Syntax$2.MethodDefinition;

        if (isMethodDefinition) {
            previous = this.pushInnerMethodDefinition(true);
        }
        this.visit(node.value);
        if (isMethodDefinition) {
            this.popInnerMethodDefinition(previous);
        }
    }

    visitForIn(node) {
        if (node.left.type === Syntax$2.VariableDeclaration && node.left.kind !== "var") {
            this.scopeManager.__nestForScope(node);
        }

        if (node.left.type === Syntax$2.VariableDeclaration) {
            this.visit(node.left);
            this.visitPattern(node.left.declarations[0].id, pattern => {
                this.currentScope().__referencing(pattern, reference.WRITE, node.right, null, true, true);
            });
        } else {
            this.visitPattern(node.left, { processRightHandNodes: true }, (pattern, info) => {
                let maybeImplicitGlobal = null;

                if (!this.currentScope().isStrict) {
                    maybeImplicitGlobal = {
                        pattern,
                        node
                    };
                }
                this.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                this.currentScope().__referencing(pattern, reference.WRITE, node.right, maybeImplicitGlobal, true, false);
            });
        }
        this.visit(node.right);
        this.visit(node.body);

        this.close(node);
    }

    visitVariableDeclaration(variableTargetScope, type, node, index) {

        const decl = node.declarations[index];
        const init = decl.init;

        this.visitPattern(decl.id, { processRightHandNodes: true }, (pattern, info) => {
            variableTargetScope.__define(
                pattern,
                new Definition$1(
                    type,
                    pattern,
                    decl,
                    node,
                    index,
                    node.kind
                )
            );

            this.referencingDefaultValue(pattern, info.assignments, null, true);
            if (init) {
                this.currentScope().__referencing(pattern, reference.WRITE, init, null, !info.topLevel, true);
            }
        });
    }

    AssignmentExpression(node) {
        if (patternVisitor.isPattern(node.left)) {
            if (node.operator === "=") {
                this.visitPattern(node.left, { processRightHandNodes: true }, (pattern, info) => {
                    let maybeImplicitGlobal = null;

                    if (!this.currentScope().isStrict) {
                        maybeImplicitGlobal = {
                            pattern,
                            node
                        };
                    }
                    this.referencingDefaultValue(pattern, info.assignments, maybeImplicitGlobal, false);
                    this.currentScope().__referencing(pattern, reference.WRITE, node.right, maybeImplicitGlobal, !info.topLevel, false);
                });
            } else {
                this.currentScope().__referencing(node.left, reference.RW, node.right);
            }
        } else {
            this.visit(node.left);
        }
        this.visit(node.right);
    }

    CatchClause(node) {
        this.scopeManager.__nestCatchScope(node);

        this.visitPattern(node.param, { processRightHandNodes: true }, (pattern, info) => {
            this.currentScope().__define(pattern,
                new Definition$1(
                    variable.CatchClause,
                    node.param,
                    node,
                    null,
                    null,
                    null
                ));
            this.referencingDefaultValue(pattern, info.assignments, null, true);
        });
        this.visit(node.body);

        this.close(node);
    }

    Program(node) {
        this.scopeManager.__nestGlobalScope(node);

        if (this.scopeManager.__isNodejsScope()) {

            // Force strictness of GlobalScope to false when using node.js scope.
            this.currentScope().isStrict = false;
            this.scopeManager.__nestFunctionScope(node, false);
        }

        if (this.scopeManager.__isES6() && this.scopeManager.isModule()) {
            this.scopeManager.__nestModuleScope(node);
        }

        if (this.scopeManager.isStrictModeSupported() && this.scopeManager.isImpliedStrict()) {
            this.currentScope().isStrict = true;
        }

        this.visitChildren(node);
        this.close(node);
    }

    Identifier(node) {
        this.currentScope().__referencing(node);
    }

    UpdateExpression(node) {
        if (patternVisitor.isPattern(node.argument)) {
            this.currentScope().__referencing(node.argument, reference.RW, null);
        } else {
            this.visitChildren(node);
        }
    }

    MemberExpression(node) {
        this.visit(node.object);
        if (node.computed) {
            this.visit(node.property);
        }
    }

    Property(node) {
        this.visitProperty(node);
    }

    MethodDefinition(node) {
        this.visitProperty(node);
    }

    BreakStatement() {} // eslint-disable-line class-methods-use-this

    ContinueStatement() {} // eslint-disable-line class-methods-use-this

    LabeledStatement(node) {
        this.visit(node.body);
    }

    ForStatement(node) {

        // Create ForStatement declaration.
        // NOTE: In ES6, ForStatement dynamically generates
        // per iteration environment. However, escope is
        // a static analyzer, we only generate one scope for ForStatement.
        if (node.init && node.init.type === Syntax$2.VariableDeclaration && node.init.kind !== "var") {
            this.scopeManager.__nestForScope(node);
        }

        this.visitChildren(node);

        this.close(node);
    }

    ClassExpression(node) {
        this.visitClass(node);
    }

    ClassDeclaration(node) {
        this.visitClass(node);
    }

    CallExpression(node) {

        // Check this is direct call to eval
        if (!this.scopeManager.__ignoreEval() && node.callee.type === Syntax$2.Identifier && node.callee.name === "eval") {

            // NOTE: This should be `variableScope`. Since direct eval call always creates Lexical environment and
            // let / const should be enclosed into it. Only VariableDeclaration affects on the caller's environment.
            this.currentScope().variableScope.__detectEval();
        }
        this.visitChildren(node);
    }

    BlockStatement(node) {
        if (this.scopeManager.__isES6()) {
            this.scopeManager.__nestBlockScope(node);
        }

        this.visitChildren(node);

        this.close(node);
    }

    ThisExpression() {
        this.currentScope().variableScope.__detectThis();
    }

    WithStatement(node) {
        this.visit(node.object);

        // Then nest scope for WithStatement.
        this.scopeManager.__nestWithScope(node);

        this.visit(node.body);

        this.close(node);
    }

    VariableDeclaration(node) {
        const variableTargetScope = (node.kind === "var") ? this.currentScope().variableScope : this.currentScope();

        for (let i = 0, iz = node.declarations.length; i < iz; ++i) {
            const decl = node.declarations[i];

            this.visitVariableDeclaration(variableTargetScope, variable.Variable, node, i);
            if (decl.init) {
                this.visit(decl.init);
            }
        }
    }

    // sec 13.11.8
    SwitchStatement(node) {
        this.visit(node.discriminant);

        if (this.scopeManager.__isES6()) {
            this.scopeManager.__nestSwitchScope(node);
        }

        for (let i = 0, iz = node.cases.length; i < iz; ++i) {
            this.visit(node.cases[i]);
        }

        this.close(node);
    }

    FunctionDeclaration(node) {
        this.visitFunction(node);
    }

    FunctionExpression(node) {
        this.visitFunction(node);
    }

    ForOfStatement(node) {
        this.visitForIn(node);
    }

    ForInStatement(node) {
        this.visitForIn(node);
    }

    ArrowFunctionExpression(node) {
        this.visitFunction(node);
    }

    ImportDeclaration(node) {
        assert(this.scopeManager.__isES6() && this.scopeManager.isModule(), "ImportDeclaration should appear when the mode is ES6 and in the module context.");

        const importer = new Importer(node, this);

        importer.visit(node);
    }

    visitExportDeclaration(node) {
        if (node.source) {
            return;
        }
        if (node.declaration) {
            this.visit(node.declaration);
            return;
        }

        this.visitChildren(node);
    }

    ExportDeclaration(node) {
        this.visitExportDeclaration(node);
    }

    ExportNamedDeclaration(node) {
        this.visitExportDeclaration(node);
    }

    ExportSpecifier(node) {
        const local = (node.id || node.local);

        this.visit(local);
    }

    MetaProperty() { // eslint-disable-line class-methods-use-this

        // do nothing.
    }
}

var name$2 = "eslint-scope";
var description$2 = "ECMAScript scope analyzer for ESLint";
var homepage$2 = "http://github.com/eslint/eslint-scope";
var main$2 = "lib/index.js";
var version$2 = "4.0.3";
var engines$2 = {
	node: ">=4.0.0"
};
var repository$2 = "eslint/eslint-scope";
var bugs = {
	url: "https://github.com/eslint/eslint-scope/issues"
};
var license$2 = "BSD-2-Clause";
var scripts$2 = {
	test: "node Makefile.js test",
	lint: "node Makefile.js lint",
	"generate-release": "eslint-generate-release",
	"generate-alpharelease": "eslint-generate-prerelease alpha",
	"generate-betarelease": "eslint-generate-prerelease beta",
	"generate-rcrelease": "eslint-generate-prerelease rc",
	"publish-release": "eslint-publish-release"
};
var files = [
	"LICENSE",
	"README.md",
	"lib"
];
var dependencies$1 = {
	esrecurse: "^4.1.0",
	estraverse: "^4.1.1"
};
var devDependencies$2 = {
	chai: "^3.4.1",
	eslint: "^3.15.0",
	"eslint-config-eslint": "^4.0.0",
	"eslint-release": "^1.0.0",
	espree: "^3.1.1",
	istanbul: "^0.4.5",
	mocha: "^3.2.0",
	"npm-license": "^0.3.3",
	shelljs: "^0.7.6",
	typescript: "~2.0.10",
	"typescript-eslint-parser": "^1.0.0"
};
var _package$4 = {
	name: name$2,
	description: description$2,
	homepage: homepage$2,
	main: main$2,
	version: version$2,
	engines: engines$2,
	repository: repository$2,
	bugs: bugs,
	license: license$2,
	scripts: scripts$2,
	files: files,
	dependencies: dependencies$1,
	devDependencies: devDependencies$2
};

var _package$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	name: name$2,
	description: description$2,
	homepage: homepage$2,
	main: main$2,
	version: version$2,
	engines: engines$2,
	repository: repository$2,
	bugs: bugs,
	license: license$2,
	scripts: scripts$2,
	files: files,
	dependencies: dependencies$1,
	devDependencies: devDependencies$2,
	'default': _package$4
});

var require$$1$1 = getCjsExportFromNamespace(_package$5);

const version$3 = require$$1$1.version;

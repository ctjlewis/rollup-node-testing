var AssignmentExpression = [
	"left",
	"right"
];
var AssignmentPattern = [
	"left",
	"right"
];
var ArrayExpression = [
	"elements"
];
var ArrayPattern = [
	"elements"
];
var ArrowFunctionExpression = [
	"params",
	"body"
];
var AwaitExpression = [
	"argument"
];
var BlockStatement = [
	"body"
];
var BinaryExpression = [
	"left",
	"right"
];
var BreakStatement = [
	"label"
];
var CallExpression = [
	"callee",
	"arguments"
];
var CatchClause = [
	"param",
	"body"
];
var ChainExpression = [
	"expression"
];
var ClassBody = [
	"body"
];
var ClassDeclaration = [
	"id",
	"superClass",
	"body"
];
var ClassExpression = [
	"id",
	"superClass",
	"body"
];
var ConditionalExpression = [
	"test",
	"consequent",
	"alternate"
];
var ContinueStatement = [
	"label"
];
var DebuggerStatement = [
];
var DoWhileStatement = [
	"body",
	"test"
];
var EmptyStatement = [
];
var ExportAllDeclaration = [
	"exported",
	"source"
];
var ExportDefaultDeclaration = [
	"declaration"
];
var ExportNamedDeclaration = [
	"declaration",
	"specifiers",
	"source"
];
var ExportSpecifier = [
	"exported",
	"local"
];
var ExpressionStatement = [
	"expression"
];
var ExperimentalRestProperty = [
	"argument"
];
var ExperimentalSpreadProperty = [
	"argument"
];
var ForStatement = [
	"init",
	"test",
	"update",
	"body"
];
var ForInStatement = [
	"left",
	"right",
	"body"
];
var ForOfStatement = [
	"left",
	"right",
	"body"
];
var FunctionDeclaration = [
	"id",
	"params",
	"body"
];
var FunctionExpression = [
	"id",
	"params",
	"body"
];
var Identifier = [
];
var IfStatement = [
	"test",
	"consequent",
	"alternate"
];
var ImportDeclaration = [
	"specifiers",
	"source"
];
var ImportDefaultSpecifier = [
	"local"
];
var ImportExpression = [
	"source"
];
var ImportNamespaceSpecifier = [
	"local"
];
var ImportSpecifier = [
	"imported",
	"local"
];
var JSXAttribute = [
	"name",
	"value"
];
var JSXClosingElement = [
	"name"
];
var JSXElement = [
	"openingElement",
	"children",
	"closingElement"
];
var JSXEmptyExpression = [
];
var JSXExpressionContainer = [
	"expression"
];
var JSXIdentifier = [
];
var JSXMemberExpression = [
	"object",
	"property"
];
var JSXNamespacedName = [
	"namespace",
	"name"
];
var JSXOpeningElement = [
	"name",
	"attributes"
];
var JSXSpreadAttribute = [
	"argument"
];
var JSXText = [
];
var JSXFragment = [
	"openingFragment",
	"children",
	"closingFragment"
];
var Literal = [
];
var LabeledStatement = [
	"label",
	"body"
];
var LogicalExpression = [
	"left",
	"right"
];
var MemberExpression = [
	"object",
	"property"
];
var MetaProperty = [
	"meta",
	"property"
];
var MethodDefinition = [
	"key",
	"value"
];
var NewExpression = [
	"callee",
	"arguments"
];
var ObjectExpression = [
	"properties"
];
var ObjectPattern = [
	"properties"
];
var Program = [
	"body"
];
var Property = [
	"key",
	"value"
];
var RestElement = [
	"argument"
];
var ReturnStatement = [
	"argument"
];
var SequenceExpression = [
	"expressions"
];
var SpreadElement = [
	"argument"
];
var Super = [
];
var SwitchStatement = [
	"discriminant",
	"cases"
];
var SwitchCase = [
	"test",
	"consequent"
];
var TaggedTemplateExpression = [
	"tag",
	"quasi"
];
var TemplateElement = [
];
var TemplateLiteral = [
	"quasis",
	"expressions"
];
var ThisExpression = [
];
var ThrowStatement = [
	"argument"
];
var TryStatement = [
	"block",
	"handler",
	"finalizer"
];
var UnaryExpression = [
	"argument"
];
var UpdateExpression = [
	"argument"
];
var VariableDeclaration = [
	"declarations"
];
var VariableDeclarator = [
	"id",
	"init"
];
var WhileStatement = [
	"test",
	"body"
];
var WithStatement = [
	"object",
	"body"
];
var YieldExpression = [
	"argument"
];
var visitorKeys = {
	AssignmentExpression: AssignmentExpression,
	AssignmentPattern: AssignmentPattern,
	ArrayExpression: ArrayExpression,
	ArrayPattern: ArrayPattern,
	ArrowFunctionExpression: ArrowFunctionExpression,
	AwaitExpression: AwaitExpression,
	BlockStatement: BlockStatement,
	BinaryExpression: BinaryExpression,
	BreakStatement: BreakStatement,
	CallExpression: CallExpression,
	CatchClause: CatchClause,
	ChainExpression: ChainExpression,
	ClassBody: ClassBody,
	ClassDeclaration: ClassDeclaration,
	ClassExpression: ClassExpression,
	ConditionalExpression: ConditionalExpression,
	ContinueStatement: ContinueStatement,
	DebuggerStatement: DebuggerStatement,
	DoWhileStatement: DoWhileStatement,
	EmptyStatement: EmptyStatement,
	ExportAllDeclaration: ExportAllDeclaration,
	ExportDefaultDeclaration: ExportDefaultDeclaration,
	ExportNamedDeclaration: ExportNamedDeclaration,
	ExportSpecifier: ExportSpecifier,
	ExpressionStatement: ExpressionStatement,
	ExperimentalRestProperty: ExperimentalRestProperty,
	ExperimentalSpreadProperty: ExperimentalSpreadProperty,
	ForStatement: ForStatement,
	ForInStatement: ForInStatement,
	ForOfStatement: ForOfStatement,
	FunctionDeclaration: FunctionDeclaration,
	FunctionExpression: FunctionExpression,
	Identifier: Identifier,
	IfStatement: IfStatement,
	ImportDeclaration: ImportDeclaration,
	ImportDefaultSpecifier: ImportDefaultSpecifier,
	ImportExpression: ImportExpression,
	ImportNamespaceSpecifier: ImportNamespaceSpecifier,
	ImportSpecifier: ImportSpecifier,
	JSXAttribute: JSXAttribute,
	JSXClosingElement: JSXClosingElement,
	JSXElement: JSXElement,
	JSXEmptyExpression: JSXEmptyExpression,
	JSXExpressionContainer: JSXExpressionContainer,
	JSXIdentifier: JSXIdentifier,
	JSXMemberExpression: JSXMemberExpression,
	JSXNamespacedName: JSXNamespacedName,
	JSXOpeningElement: JSXOpeningElement,
	JSXSpreadAttribute: JSXSpreadAttribute,
	JSXText: JSXText,
	JSXFragment: JSXFragment,
	Literal: Literal,
	LabeledStatement: LabeledStatement,
	LogicalExpression: LogicalExpression,
	MemberExpression: MemberExpression,
	MetaProperty: MetaProperty,
	MethodDefinition: MethodDefinition,
	NewExpression: NewExpression,
	ObjectExpression: ObjectExpression,
	ObjectPattern: ObjectPattern,
	Program: Program,
	Property: Property,
	RestElement: RestElement,
	ReturnStatement: ReturnStatement,
	SequenceExpression: SequenceExpression,
	SpreadElement: SpreadElement,
	Super: Super,
	SwitchStatement: SwitchStatement,
	SwitchCase: SwitchCase,
	TaggedTemplateExpression: TaggedTemplateExpression,
	TemplateElement: TemplateElement,
	TemplateLiteral: TemplateLiteral,
	ThisExpression: ThisExpression,
	ThrowStatement: ThrowStatement,
	TryStatement: TryStatement,
	UnaryExpression: UnaryExpression,
	UpdateExpression: UpdateExpression,
	VariableDeclaration: VariableDeclaration,
	VariableDeclarator: VariableDeclarator,
	WhileStatement: WhileStatement,
	WithStatement: WithStatement,
	YieldExpression: YieldExpression
};

var visitorKeys$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AssignmentExpression: AssignmentExpression,
    AssignmentPattern: AssignmentPattern,
    ArrayExpression: ArrayExpression,
    ArrayPattern: ArrayPattern,
    ArrowFunctionExpression: ArrowFunctionExpression,
    AwaitExpression: AwaitExpression,
    BlockStatement: BlockStatement,
    BinaryExpression: BinaryExpression,
    BreakStatement: BreakStatement,
    CallExpression: CallExpression,
    CatchClause: CatchClause,
    ChainExpression: ChainExpression,
    ClassBody: ClassBody,
    ClassDeclaration: ClassDeclaration,
    ClassExpression: ClassExpression,
    ConditionalExpression: ConditionalExpression,
    ContinueStatement: ContinueStatement,
    DebuggerStatement: DebuggerStatement,
    DoWhileStatement: DoWhileStatement,
    EmptyStatement: EmptyStatement,
    ExportAllDeclaration: ExportAllDeclaration,
    ExportDefaultDeclaration: ExportDefaultDeclaration,
    ExportNamedDeclaration: ExportNamedDeclaration,
    ExportSpecifier: ExportSpecifier,
    ExpressionStatement: ExpressionStatement,
    ExperimentalRestProperty: ExperimentalRestProperty,
    ExperimentalSpreadProperty: ExperimentalSpreadProperty,
    ForStatement: ForStatement,
    ForInStatement: ForInStatement,
    ForOfStatement: ForOfStatement,
    FunctionDeclaration: FunctionDeclaration,
    FunctionExpression: FunctionExpression,
    Identifier: Identifier,
    IfStatement: IfStatement,
    ImportDeclaration: ImportDeclaration,
    ImportDefaultSpecifier: ImportDefaultSpecifier,
    ImportExpression: ImportExpression,
    ImportNamespaceSpecifier: ImportNamespaceSpecifier,
    ImportSpecifier: ImportSpecifier,
    JSXAttribute: JSXAttribute,
    JSXClosingElement: JSXClosingElement,
    JSXElement: JSXElement,
    JSXEmptyExpression: JSXEmptyExpression,
    JSXExpressionContainer: JSXExpressionContainer,
    JSXIdentifier: JSXIdentifier,
    JSXMemberExpression: JSXMemberExpression,
    JSXNamespacedName: JSXNamespacedName,
    JSXOpeningElement: JSXOpeningElement,
    JSXSpreadAttribute: JSXSpreadAttribute,
    JSXText: JSXText,
    JSXFragment: JSXFragment,
    Literal: Literal,
    LabeledStatement: LabeledStatement,
    LogicalExpression: LogicalExpression,
    MemberExpression: MemberExpression,
    MetaProperty: MetaProperty,
    MethodDefinition: MethodDefinition,
    NewExpression: NewExpression,
    ObjectExpression: ObjectExpression,
    ObjectPattern: ObjectPattern,
    Program: Program,
    Property: Property,
    RestElement: RestElement,
    ReturnStatement: ReturnStatement,
    SequenceExpression: SequenceExpression,
    SpreadElement: SpreadElement,
    Super: Super,
    SwitchStatement: SwitchStatement,
    SwitchCase: SwitchCase,
    TaggedTemplateExpression: TaggedTemplateExpression,
    TemplateElement: TemplateElement,
    TemplateLiteral: TemplateLiteral,
    ThisExpression: ThisExpression,
    ThrowStatement: ThrowStatement,
    TryStatement: TryStatement,
    UnaryExpression: UnaryExpression,
    UpdateExpression: UpdateExpression,
    VariableDeclaration: VariableDeclaration,
    VariableDeclarator: VariableDeclarator,
    WhileStatement: WhileStatement,
    WithStatement: WithStatement,
    YieldExpression: YieldExpression,
    'default': visitorKeys
});

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

var KEYS = getCjsExportFromNamespace(visitorKeys$1);

// Types.
const NODE_TYPES = Object.freeze(Object.keys(KEYS));

// Freeze the keys.
for (const type of NODE_TYPES) {
    Object.freeze(KEYS[type]);
}
Object.freeze(KEYS);

// List to ignore keys.
const KEY_BLACKLIST = new Set([
    "parent",
    "leadingComments",
    "trailingComments"
]);

/**
 * Check whether a given key should be used or not.
 * @param {string} key The key to check.
 * @returns {boolean} `true` if the key should be used.
 */
function filterKey(key) {
    return !KEY_BLACKLIST.has(key) && key[0] !== "_";
}

//------------------------------------------------------------------------------
// Public interfaces
//------------------------------------------------------------------------------

var lib = Object.freeze({

    /**
     * Visitor keys.
     * @type {{ [type: string]: string[] | undefined }}
     */
    KEYS,

    /**
     * Get visitor keys of a given node.
     * @param {Object} node The AST node to get keys.
     * @returns {string[]} Visitor keys of the node.
     */
    getKeys(node) {
        return Object.keys(node).filter(filterKey);
    },

    // Disable valid-jsdoc rule because it reports syntax error on the type of @returns.
    // eslint-disable-next-line valid-jsdoc
    /**
     * Make the union set with `KEYS` and given keys.
     * @param {Object} additionalKeys The additional keys.
     * @returns {{ [type: string]: string[] | undefined }} The union set.
     */
    unionWith(additionalKeys) {
        const retv = Object.assign({}, KEYS);

        for (const type of Object.keys(additionalKeys)) {
            if (retv.hasOwnProperty(type)) {
                const keys = new Set(additionalKeys[type]);

                for (const key of retv[type]) {
                    keys.add(key);
                }

                retv[type] = Object.freeze(Array.from(keys));
            } else {
                retv[type] = Object.freeze(Array.from(additionalKeys[type]));
            }
        }

        return Object.freeze(retv);
    }
});

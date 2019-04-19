var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var walker = require('acorn-walk');
/**
 * The BodyScope defines the variables available in current body scope. This
 * body scope can be a function scope or a block scope depending on the node.
 * This is relvant given that the behaviour changes depending if it is a
 * function or a block.
 *
 * If it is a function scope:
 * - The previous local variables are now considered global.
 * - The local and block environment are clear.
 * - Variables declared with var are local and hoisted.
 *
 * If it is a block scope:
 * - The previous local variables are still local.
 * - The previous block variable are now local, block environment is clear.
 *  - Variables declared with var are global and hoisted.
 */
var BodyScope = /** @class */ (function () {
    function BodyScope(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.glob, glob = _c === void 0 ? {} : _c, _d = _b.local, local = _d === void 0 ? {} : _d, _e = _b.block, block = _e === void 0 ? {} : _e;
        this.glob = Object.assign({}, glob);
        this.local = Object.assign({}, local);
        this.block = Object.assign({}, block);
    }
    /**
     *
     *
     * @param {Node} ast: Input node to use to populate the context.
     */
    BodyScope.prototype.populate = function (ast) {
        var self = this;
        walker.simple(ast, {
            FunctionDeclaration: function (node) {
                var id = node.id.name;
                self.local[id] = { node: node, id: id, type: 'function' };
            },
            VariableDeclaration: function (node) {
                var kind = node.kind;
                node.declarations.forEach(function (declarator) {
                    walker.simple(declarator, {
                        Identifier: function (node) {
                            var id = node.name;
                            self.local[id] = { node: node, id: id, type: kind };
                        }
                    });
                    // Filter those nodes whose ancestors contain the right part of
                    // a AssignmentPatter.
                    walker.simple(declarator, {
                        AssignmentPattern: function (node) {
                            var right = node.right;
                            walker.simple(right, {
                                Identifier: function (node) {
                                    var id = node.name;
                                    if (self.local[id]) {
                                        delete self.local[id];
                                    }
                                }
                            });
                        }
                    });
                });
            }
        });
    };
    return BodyScope;
}());
var BlockScope = /** @class */ (function (_super) {
    __extends(BlockScope, _super);
    function BlockScope(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.glob, glob = _c === void 0 ? {} : _c, _d = _b.local, local = _d === void 0 ? {} : _d, _e = _b.block, block = _e === void 0 ? {} : _e;
        var _this = _super.call(this, { glob: glob, local: local, block: block }) || this;
        _this.glob = Object.assign({}, glob);
        _this.local = Object.assign({}, local, block);
        _this.block = {};
        _this.populate.bind(_this);
        return _this;
    }
    return BlockScope;
}(BodyScope));
var FunctionScope = /** @class */ (function (_super) {
    __extends(FunctionScope, _super);
    function FunctionScope(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.glob, glob = _c === void 0 ? {} : _c, _d = _b.local, local = _d === void 0 ? {} : _d, _e = _b.block, block = _e === void 0 ? {} : _e;
        var _this = _super.call(this, { glob: glob, local: local, block: block }) || this;
        _this.glob = Object.assign({}, glob, local);
        _this.local = {};
        _this.block = {};
        _this.populate.bind(_this);
        return _this;
    }
    return FunctionScope;
}(BodyScope));
function createScope(type, _a) {
    if (type === void 0) { type = 'block'; }
    var _b = _a === void 0 ? {} : _a, _c = _b.glob, glob = _c === void 0 ? {} : _c, _d = _b.local, local = _d === void 0 ? {} : _d, _e = _b.block, block = _e === void 0 ? {} : _e;
    if (type === 'block') {
        return new BlockScope({ glob: glob, local: local, block: block });
    }
    else if (type === 'function') {
        return new FunctionScope({ glob: glob, local: local, block: block });
    }
    else {
        throw new Error('invalid parameter');
    }
}
module.exports = {
    createScope: createScope,
    BlockScope: BlockScope,
    FunctionScope: FunctionScope
};

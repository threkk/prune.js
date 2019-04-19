var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var fs = require('fs');
var _a = require('path'), extname = _a.extname, resolve = _a.resolve;
var promisify = require('util').promisify;
var stat = promisify(fs.stat);
var readdir = promisify(fs.readdir);
// Windows? ¯\_(ツ)_/¯
var isHidden = function (file) { return file.charAt(0) === '.'; };
var validExtension = function (extensions) { return function (file) { return extensions.includes(extname(file)); }; };
var ignoreDirs = function (dirs) { return function (file) { return dirs.includes(file); }; };
/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` are always ignored.
 */
function extractFiles(path, ignored, extensions) {
    return __awaiter(this, void 0, void 0, function () {
        var dirs, files, isIgnored, isValidExtension, _loop_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dirs = [path];
                    files = [];
                    isIgnored = ignoreDirs(ignored);
                    isValidExtension = validExtension(extensions);
                    _loop_1 = function () {
                        var dir, items, visibleItems, _i, visibleItems_1, itemPath, stats, e_1, e_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    dir = dirs.pop();
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 9, , 10]);
                                    return [4 /*yield*/, readdir(dir)
                                        // Resolve the paths and filter ignore or hidden elements.
                                    ];
                                case 2:
                                    items = _a.sent();
                                    visibleItems = items
                                        .map(function (item) { return resolve(dir, item); })
                                        .filter(function (item) { return !isIgnored(item) && !isHidden(item); });
                                    _i = 0, visibleItems_1 = visibleItems;
                                    _a.label = 3;
                                case 3:
                                    if (!(_i < visibleItems_1.length)) return [3 /*break*/, 8];
                                    itemPath = visibleItems_1[_i];
                                    _a.label = 4;
                                case 4:
                                    _a.trys.push([4, 6, , 7]);
                                    return [4 /*yield*/, stat(itemPath)];
                                case 5:
                                    stats = _a.sent();
                                    if (stats.isDirectory()) {
                                        dirs.push(itemPath);
                                    }
                                    else if (isValidExtension(itemPath)) {
                                        files.push(itemPath);
                                    }
                                    return [3 /*break*/, 7];
                                case 6:
                                    e_1 = _a.sent();
                                    // TODO: Do smth
                                    console.error(e_1);
                                    return [3 /*break*/, 7];
                                case 7:
                                    _i++;
                                    return [3 /*break*/, 3];
                                case 8: return [3 /*break*/, 10];
                                case 9:
                                    e_2 = _a.sent();
                                    // TODO: Do smth
                                    console.error(e_2);
                                    return [3 /*break*/, 10];
                                case 10: return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(dirs.length > 0)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, files];
            }
        });
    });
}
module.exports = extractFiles;

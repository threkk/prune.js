#!/usr/bin/env node --harmony
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
var _this = this;
var pkg = require('../package.json');
var program = require('commander');
var resolve = require('path').resolve;
var log = require('../lib/project/logger');
var Project = require('../lib/project/project');
// const Deps = require('../lib/dependencies/analyser')
var Files = require('../lib/files/analyser');
// Sets the CLI.
program
    .version(pkg.version)
    .description(pkg.description)
    .usage('[options]')
    .option('-p, --path <root>', 'path to execute prunejs', process.cwd())
    .option('-x, --jsx', 'enables JSX syntax support')
    .option('-i, --ignore <paths>', 'excludes the following folders', function (val) { return val.split(','); }, ['node_modules'])
    .parse(process.argv);
var jsx = program.jsx, path = program.path, ignore = program.ignore;
// Initialise the configuration.
var config = {
    root: path,
    ignore: new Set(['node_modules'].concat(ignore)).slice().map(function (route) { return resolve(path, route); }),
    jsx: !!jsx
};
var run = function () { return __awaiter(_this, void 0, void 0, function () {
    var project;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                project = new Project(config);
                // await project.analyse(Deps)
                return [4 /*yield*/, project.analyse(Files)];
            case 1:
                // await project.analyse(Deps)
                _a.sent();
                return [4 /*yield*/, project.flush()];
            case 2:
                _a.sent();
                log.display();
                return [2 /*return*/];
        }
    });
}); };
try {
    run();
}
catch (e) {
    console.log(e);
}

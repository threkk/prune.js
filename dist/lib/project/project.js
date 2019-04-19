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
var chalk = require('chalk');
var logger = require('./logger');
var Project = /** @class */ (function () {
    function Project(config) {
        this.config = config;
        var bold = chalk.bold, underline = chalk.underline, green = chalk.green, red = chalk.red;
        if (this.config.noColor) {
            bold = underline = green = red = function (str) { return str; };
        }
        // Start message
        var check = green('✔');
        var uncheck = red('✘');
        console.log("Starting " + bold('prunejs') + " on " + this.config.root);
        console.log('');
        console.log(underline('Options:'));
        console.log("  " + (this.config.jsx ? check : uncheck) + " JSX");
        console.log('');
        console.log("The following folders are " + bold('ignored') + ":");
        this.config.ignore.forEach(function (dir) { return console.log("  - " + dir); });
        console.log('');
    }
    Project.prototype.analyse = function (Analyser) {
        return __awaiter(this, void 0, void 0, function () {
            var name, analyser, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        name = Analyser.getName();
                        analyser = new Analyser(this.config);
                        console.log("[\u2022] Starting analyser: " + name + ".");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, analyser.start()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.log(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Project.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!logger.hasErrors()) {
                    console.log('No errors found.');
                }
                logger.display();
                return [2 /*return*/];
            });
        });
    };
    return Project;
}());
module.exports = Project;

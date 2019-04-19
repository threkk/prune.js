var Logger = /** @class */ (function () {
    function Logger(noColor) {
        this.errors = [];
        this.warns = [];
    }
    Logger.prototype.warn = function (message, type) {
        if (type === void 0) { type = 'OTHER'; }
        this.warns.push({ type: type, message: message });
    };
    Logger.prototype.error = function (message, type) {
        if (type === void 0) { type = 'OTHER'; }
        this.errors.push({ type: type, message: message });
    };
    Logger.prototype.hasErrors = function () {
        return this.errors.length > 0;
    };
    Logger.prototype.hasWarnings = function () {
        return this.warns.length > 0;
    };
    Logger.prototype.export = function () {
        var _this = this;
        return {
            errors: function () { return _this.errors; },
            warnings: function () { return _this.warns; }
        };
    };
    Logger.prototype.display = function (warnings) {
        if (warnings === void 0) { warnings = false; }
        var show = function (_a) {
            var type = _a.type, message = _a.message;
            return "[" + type + "] " + message;
        };
        // TODO: Add (and disable) colors.
        // const noColor = Boolean(process.env.NO_COLOR) || false
        this.errors.map(function (tuple) { return show(tuple); }).forEach(function (msg) { return console.log("[ERROR]" + msg); });
        if (warnings) {
            this.warns.map(function (tuple) { return show(tuple); }).forEach(function (msg) { return console.log("[WARN]" + msg); });
        }
    };
    return Logger;
}());
var logger = null;
if (logger == null) {
    logger = new Logger();
}
module.exports = logger;

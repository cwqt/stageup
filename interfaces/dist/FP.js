"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = exports.Y = void 0;
exports.Y = function (f) {
    return (function (m) {
        return f(function () {
            var x = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                x[_i] = arguments[_i];
            }
            return m(m).apply(void 0, x);
        });
    })(function (m) {
        return f(function () {
            var x = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                x[_i] = arguments[_i];
            }
            return m(m).apply(void 0, x);
        });
    });
};
exports.capitalize = function (str) { return str.charAt(0).toUpperCase() + str.slice(1); };
//# sourceMappingURL=FP.js.map
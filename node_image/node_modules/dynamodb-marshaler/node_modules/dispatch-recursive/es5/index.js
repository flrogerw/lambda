'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashLangIsUndefined = require('lodash/lang/isUndefined');

var _lodashLangIsUndefined2 = _interopRequireDefault(_lodashLangIsUndefined);

/**
 * Recursive dispatch, returns a function which iterates a series of commands
 * looking for one to handle the target and return a value. The commands adhere
 * to an interface of (target, fn) where the returned dispatch fn is passed
 * along to each command, where it can be used by the command. If the target
 * cannot be handled by a command the command returns undefined. If none of the
 * supplied commands handle the target, an error is thrown.
 *
 * @param commands
 * @returns {Function}
 */
function dispatch() {
  for (var _len = arguments.length, commands = Array(_len), _key = 0; _key < _len; _key++) {
    commands[_key] = arguments[_key];
  }

  return function fn(target) {
    var result = undefined;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _getIterator(commands), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var command = _step.value;

        result = command(target, fn);

        if (!(0, _lodashLangIsUndefined2['default'])(result)) {
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  };
}

exports['default'] = dispatch;
module.exports = exports['default'];
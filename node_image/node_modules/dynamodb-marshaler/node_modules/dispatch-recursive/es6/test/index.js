import assert from 'assert';
import noop from 'lodash/utility/noop';
import {spy, stub} from 'sinon';
import dispatch from '../index';

describe('dispatch-recursive', () => {
  it('should return a function which loops commands until one returns', () => {
    const myCmd = stub().returnsArg(0);
    const uncalledCmd = spy();
    const fn = dispatch(noop, noop, myCmd, uncalledCmd);
    const result = fn('foo');

    assert.equal(result, 'foo');

    assert(myCmd.calledOnce);
    assert.equal(myCmd.args[0].length, 2);
    assert.equal(myCmd.args[0][0], 'foo');
    assert.equal(myCmd.args[0][1], fn);

    assert(!uncalledCmd.called);
  });
});

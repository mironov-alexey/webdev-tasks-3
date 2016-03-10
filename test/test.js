const flow = require('../lib/flow');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const should = chai.should();
const sinon = require('sinon');
chai.use(sinonChai);

describe('flow', () => {
    describe('serial', () => {
        it('should call callback once if functions array is empty', () => {
            var callback = sinon.spy();
            flow.serial([], callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, null);
        });

        it('should call one function', () => {
            var mockFunc = sinon.spy(next => {
                next(null, 'result');
            });
            var callback = sinon.spy();
            flow.serial([mockFunc], callback);
            mockFunc.should.have.been.calledOnce;
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, 'result');
        });

        it('should pass result of first func to second func', () => {
            var func1 = sinon.spy(next => {
                next(null, 1);
            });
            var func2 = sinon.spy((data, next) => {
                next(null, 2);
            });
            var callback = sinon.spy();
            flow.serial([func1, func2], callback);
            func1.should.have.been.calledOnce;
            func2.should.have.been.calledOnce;
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, 2);
        });

        it('shouldn\'t call second func if first func fails', () => {
            var mockFunc1 = sinon.spy(next => {
                next('error');
            });
            var mockFunc2 = sinon.spy((data, next) => {
                next(null, 2);
            });
            var callback = sinon.spy();
            flow.serial([mockFunc1, mockFunc2], callback);
            mockFunc1.should.be.calledOnce;
            mockFunc2.should.not.have.been.called;
            callback.should.have.been.calledWith('error');
            callback.should.have.been.calledOnce;
        });
    });

    describe('parallel', () => {
        it('should call callback if functions array is empty', () => {
            var callback = sinon.spy();
            flow.parallel([], callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, []);
        });
        it('should call one function', () => {
            var func = sinon.spy((next) => {
                next(null, 1);
            });
            var callback = sinon.spy();
            flow.parallel([func], callback);
            func.should.have.been.calledOnce;
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, [1]);
        });
        it('should call several functions from array', () => {
            var n = 10;
            var funcs = [];
            var result = [];
            var mockCreator = function (index) {
                return sinon.spy(next => next(null, index));
            };
            for (var i = 0; i < n; i++) {
                funcs.push(mockCreator(i));
                result.push(i);
            }
            var callback = sinon.spy();
            flow.parallel(funcs, callback);
            funcs.forEach(f => f.should.have.been.calledOnce);
            callback.should.have.been.calledWith(null, result);
        });
        it('should return error if any func fails', () => {
            var funcs = [];
            funcs.push(sinon.spy((next) => {
                next(null, 1);
            }));
            funcs.push(sinon.spy((next) => {
                next('error');
            }));
            funcs.push(sinon.spy((next) => {
                next(null, 3);
            }));
            var callback = sinon.spy();
            flow.parallel(funcs, callback);
            funcs.forEach(f => f.should.have.been.calledOnce);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith('error', [1, undefined, 3]);
        });
    });
    describe('map', () => {
        it('should call callback if values array is empty', () => {
            var func = sinon.spy();
            var callback = sinon.spy();
            flow.map([], func, callback);
            func.should.not.have.been.called;
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, []);
        });

        it('should apply func to values parallel', () => {
            var func = sinon.spy((value, next) => {
                next(null, value * value);
            });
            var callback = sinon.spy();
            var n = 10;
            var values = [];
            var expected = [];
            for (var i = 0; i < n; i++) {
                values.push(i);
                expected.push(i * i);
            }
            flow.map(values, func, callback);
            func.should.have.been.callCount(n);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, expected);
        });
    });
});

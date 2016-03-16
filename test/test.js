const flow = require('../lib/flow');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const should = chai.should();
const sinon = require('sinon');
const async = require('async');
chai.use(sinonChai);

describe('flow', () => {
    describe('serial', () => {
        it('should call callback once if functions array is empty', () => {
            var callback = sinon.spy();
            flow.serial([], callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, null);
        });

        it('should call one function', done => {
            var mockFunc = sinon.spy(next => {
                setTimeout(() => {
                    next(null, 'result')
                }, 100)
            });
            var callback = sinon.spy(() => {
                mockFunc.should.have.been.calledOnce;
                callback.should.have.been.called;
                callback.should.have.been.calledWith(null, 'result');
                done();
            });
            flow.serial([mockFunc], callback);
        });

        it('should pass result of first func to second func', done => {
            var func1 = sinon.spy(next => {
                setTimeout(() => next(null, 1), 500);
            });
            var func2 = sinon.spy((data, next) => {
                setTimeout(() => next(null, 2), 300);
            });
            var callback = sinon.spy(() => {
                func1.should.have.been.calledOnce;
                func2.should.have.been.calledOnce;
                func2.should.have.been.calledAfter(func1);
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith(null, 2);
                done();
            });
            flow.serial([func1, func2], callback);
        });

        it('shouldn\'t call second func if first func fails', done => {
            var mockFunc1 = sinon.spy(next => setTimeout(() => next('error'), 200));
            var mockFunc2 = sinon.spy((data, next) => setTimeout(() => next(null, 2), 100));
            var callback = sinon.spy(() => {
                mockFunc1.should.be.calledOnce;
                mockFunc2.should.not.be.called;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith('error');
                done();
            });
            flow.serial([mockFunc1, mockFunc2], callback);
        });
    });

    describe('parallel', () => {
        it('should call callback if functions array is empty', () => {
            var callback = sinon.spy();
            flow.parallel([], callback);
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith(null, []);
        });
        it('should call one function', done => {
            var func = sinon.spy(next => {
                setTimeout(() => next(null, 1), 200);
            });
            var callback = sinon.spy(() => {
                func.should.have.been.calledOnce;
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith([], [1]);
                done();
            });
            flow.parallel([func], callback);
        });
        it('should call several functions from array', done => {
            var n = 10;
            var funcs = [];
            var result = [];
            var mockCreator = function (index) {
                return sinon.spy(next => {
                    setTimeout(() => next(null, index), 1000)
                });
            };
            for (var i = 0; i < n; i++) {
                funcs.push(mockCreator(i));
                result.push(i);
            }
            var callback = sinon.spy(() => {
                funcs.forEach(f => f.should.have.been.calledOnce);
                callback.should.have.been.calledWith([], result);
                done();
            });
            flow.parallel(funcs, callback);

        });
        it('should return error if any func fails', done => {
            var funcs = [
                sinon.spy(next => {
                    setTimeout(() => next(null, 1), 600);
                }),
                sinon.spy(next => {
                    setTimeout(() => next('error'), 500);
                }),
                sinon.spy(next => {
                    setTimeout(() => next(null, 3), 200);
                })];
            var callback = sinon.spy(() => {
                funcs.forEach(f => f.should.have.been.calledOnce);
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith([, 'error'], [1, undefined, 3]);
                done();
            });
            flow.parallel(funcs, callback);
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

        it('should apply func to values parallel', done => {
            var func = sinon.spy((value, next) => {
                setTimeout(() => next(null, value * value), 1500);
            });
            var callback = sinon.spy(() => {
                func.should.have.been.callCount(n);
                callback.should.have.been.calledOnce;
                callback.should.have.been.calledWith([], expected);
                done();
            });
            var n = 10;
            var values = [];
            var expected = [];
            for (var i = 1; i <= n; i++) {
                values.push(i);
                expected.push(i * i);
            }
            flow.map(values, func, callback);
        });
    });
});

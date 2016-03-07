const flow = require('../lib/flow');
const chai = require('chai');
const spies = require('chai-spies');
const should= chai.should();
chai.use(spies);

describe('flow', () => {
    describe('serial', () => {
        it('should call callback once if functions array is empty', () => {
            var callback = chai.spy();
            flow.serial([], callback);
            callback.should.have.been.called.once;
            // Либо я не умею в документацию спайса, либо он не может в called.with(args)
            //callback.should.have.been.called.with(null, null);
        });

        it('should call one function', () => {
            var mockFunc = chai.spy(next => {
                next(null, 'result');
            });
            var callback = chai.spy();
            flow.serial([mockFunc], callback);
            mockFunc.should.have.been.called.once;
            callback.should.have.been.called.once;
            //странно, но в этой ситуации он работает почти адекватно
            callback.should.have.been.called.with(null, 'result');
            //хотя это тоже сработает О_о
            //callback.should.have.been.called.with(null);
        });

        it('should pass result of first func to second func', () => {
            var func1 = chai.spy(next => {
                next(null, 1);
            });
            var func2 = chai.spy((data, next) => {
                next(null, 2);
            });
            var callback = chai.spy();
            flow.serial([func1, func2], callback);
            func1.should.have.been.called.once;
            func2.should.have.been.called.once;
            callback.should.have.been.called.once;
            callback.should.have.been.called.with(null, 2);
        });

        it('shouldn\'t call second func if first func fails', () => {
            var mockFunc1 = chai.spy(next => {
                next('error');
            });
            var mockFunc2 = chai.spy((data, next) => {
                next(null, 2);
            });
            var callback = chai.spy();
            flow.serial([mockFunc1, mockFunc2], callback);
            mockFunc1.should.be.called.once;
            mockFunc2.should.not.be.called;
            callback.should.be.called.with('error');
            callback.should.be.called.once;
        });
    });

    describe('parallel', () => {
        it('should call callback if functions array is empty', () => {
            var callback = chai.spy();
            flow.parallel([], callback);
            callback.should.have.been.called.once;
            callback.should.have.been.called.with(null, []);
        });
        it('should call all functions from array', () => {
            var func = chai.spy((next) => {
                next(null, 1);
            });
            var callback = chai.spy();
            flow.parallel([func], callback);
            func.should.be.called.once;
            callback.should.be.called.once;
            callback.should.be.called.with(null, [1]);
        });
        it('Should call all functions', () => {
            var n = 10;
            var funcs = [];
            var result = [];
            var mockCreator = function (index) {
                return chai.spy(next => next(null, index));
            };
            for (var i = 0; i < n; i++) {
                funcs.push(mockCreator(i))
                result.push(i);
            }
            var callback = chai.spy();
            flow.parallel(funcs, callback);
            funcs.forEach(f => f.should.be.called.once);
            callback.should.be.called.with(null, result);
        });
        it('Should return error if any func fails', () => {
            var funcs = [];
            funcs.push(chai.spy((next) => {
                next(null, 1);
            }));
            funcs.push(chai.spy((next) => {
                next('error');
            }));
            funcs.push(chai.spy((next) => {
                next(null, 3);
            }));
            var callback = chai.spy();
            flow.parallel(funcs, callback);
            funcs.forEach(f => f.should.be.called.once);
            callback.should.be.called.once;
            callback.should.be.called.with('error', [1, undefined, 3]);
        });
    });
    describe('map', () => {
        it('should call callback if values array is empty', () => {
            var func = () => {
            };
            var callback = chai.spy();
            flow.map([], func, callback);
            callback.should.have.been.called.once;
            callback.should.have.been.called.with(null, []);
        });

        it('should apply func to values parallel', () => {
            var func = chai.spy((value, next) => {
                next(null, value * value);
            });
            var callback = chai.spy();
            flow.map([1, 2, 3], func, callback);
            func.should.be.called.thrice;
            callback.should.be.called.once;
            callback.should.be.called.with(null, [1, 4, 9]);
        });
    });
});

//TODO use sinon?
'use strict';

module.exports.serial = function (funcs, callback) {
    var localFuncs = funcs.slice();
    if (localFuncs.length === 0) {
        callback(null, null);
        return;
    }
    var cb = (error, data) => {
        if (error) {
            callback(error);
        } else {
            if (localFuncs.length == 0) {
                callback(null, data);
            }
            currentFunc = localFuncs.shift();
            if (localFuncs.length === 0) {
                currentFunc(data, callback);
            } else {
                currentFunc(data, next);
            }
        }
    };
    var currentFunc = localFuncs.shift();
    currentFunc(cb);
};

exports.parallel = function (funcs, callback) {
    var results = [];
    var errors = [];
    if (funcs.length == 0) {
        callback(null, results);
    }
    var createCallback = (index, resolver) => {
        return (error, data) => {
            results[index] = data;
            if (error) {
                errors[index] = error;
            }
            resolver();
        };
    };
    Promise.all(funcs.map((f, i) => {
            return new Promise(resolve => {
                f(createCallback(i, resolve));
            })
        }))
        .then(() => {
            callback(errors, results)
        });
};

exports.map = function (values, func, callback) {
    var functions = [];
    values.forEach(value => {
        functions.push(next => func(value, next));
    });
    this.parallel(functions, callback);
};

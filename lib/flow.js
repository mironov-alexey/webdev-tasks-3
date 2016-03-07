'use strict';

exports.serial = function (funcs, callback) {
    var local_funs = funcs.slice();
    if (local_funs.length === 0) {
        callback(null, null);
        return;
    }
    var cb = (error, data) => {
        if (error) {
            return callback(error, data);
        }
        local_funs.shift();
        if (local_funs.length == 0) {
            return callback(error, data);
        }
        local_funs[0](data, cb);
    };
    local_funs[0](cb);
};

exports.parallel = function (funcs, callback) {
    var result = [];
    if (funcs.length == 0) {
        callback(null, result);
    }
    var hasError = false;
    var createCallback = (index) => {
        return (error, data) => {
            result[index] = data;
            if (hasError) {
                return;
            }
            if (error || index == funcs.length - 1) {
                callback(error, result);
            }
            if (error) {
                hasError = true;
            }
        };
    };
    funcs.forEach((f, i) => f(createCallback(i)));

};

exports.map = function (values, func, callback) {
    var functions = [];
    values.forEach(function (value) {
        functions.push(func.bind(this, value));
    });
    this.parallel(functions, callback);
};



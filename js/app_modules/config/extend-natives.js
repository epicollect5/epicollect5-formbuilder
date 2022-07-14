'use strict';

var extend_natives = function () {

    //from http://www.redips.net/javascript/array-move/
    //move an element within same array and shift other elements
    Array.prototype.move = function (from, to) {
        // local variables
        var i, tmp;
        // cast input parameters to integers
        from = parseInt(from, 10);
        to = parseInt(to, 10);
        // if positions are different and inside array
        if (from !== to && from >= 0 && from <= this.length && to >= 0 && to <= this.length) {
            // save element 'from'
            tmp = this[from];
            // move element down and shift other elements up
            if (from < to) {
                for (i = from; i < to; i++) {
                    this[i] = this[i + 1];
                }
            }
            // move element up and shift other elements down
            else {
                for (i = from; i > to; i--) {
                    this[i] = this[i - 1];
                }
            }
            // put element 'from' to destination
            this[to] = tmp;
        }
    };

    String.prototype.trunc = function (n) {
        return this.substr(0, n - 1) + (this.length >= n ? '...' : '');
    };

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (str) {
            return !this.indexOf(str);
        };
    }

    //indexOf polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {

            var k;

            // 1. Let O be the result of calling ToObject passing
            //    the this value as the argument.
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get
            //    internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If len is 0, return -1.
            if (len === 0) {
                return -1;
            }

            // 5. If argument fromIndex was passed let n be
            //    ToInteger(fromIndex); else let n be 0.
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            // 6. If n >= len, return -1.
            if (n >= len) {
                return -1;
            }

            // 7. If n >= 0, then Let k be n.
            // 8. Else, n<0, Let k be len - abs(n).
            //    If k is less than 0, then let k be 0.
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 9. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the
                //    HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                //    i.  Let elementK be the result of calling the Get
                //        internal method of O with the argument ToString(k).
                //   ii.  Let same be the result of applying the
                //        Strict Equality Comparison Algorithm to
                //        searchElement and elementK.
                //  iii.  If same is true, return k.
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }
};

module.exports = extend_natives;


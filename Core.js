// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: globe-asia;


/**
 * Wrapper function that injects
 * properties and state of classes into another one.
 * 
 * Used to achieve multi-inheritance.
 *
 * @param {List<Object>} bases list of clasess
 * @return {Object} composed class 
 */
function Classes(...bases) {
    class Bases {
        constructor() {
            bases.forEach(base => Object.assign(this, new base()));
        }
    }

    bases.forEach(base => {
        Object.getOwnPropertyNames(base.prototype)
            .filter(prop => prop != 'constructor')
            .forEach(prop => Bases.prototype[prop] = base.prototype[prop])
    });

    return Bases;
}


module.exports = {
    Classes
};
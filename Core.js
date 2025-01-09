// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: globe-asia;

/**
 * Used to hold protected fields of instances
 * that should be accessible by other classes in script..
 *
 * @class ProtectedDataHolder
 */
class ProtectedDataHolder {

    static #stateHolder = new WeakMap();

    /**
     * Used to add whole object with
     * protected fields to state.
     *
     * @static
     * @param {Object} stateOwner instance that is owner of provided state
     * @param {Object} state object with protected data
     * @memberof ProtectedDataHolder
     */
    static addToStateMultiple(stateOwner, state) {
        const currentState = this.getState(stateOwner);
        this.#stateHolder.set(stateOwner, {...currentState, ...state});
    }
    
    /**
     * Used to add single protected field
     * to state.
     *
     * @static
     * @param {Object} stateOwner instance that is owner of provided state
     * @param {String} name name of protected field
     * @param {Object} name value of protected field
     * @memberof ProtectedDataHolder
     */
    static addToState(stateOwner, name, value) {
        const currentState = this.getState(stateOwner);
        this.#stateHolder.set(stateOwner, {...currentState, [name]: value});
    }

    /**
     * Used to get protected field value
     * from state.
     *
     * @static
     * @param {*} stateOwner instance that is owner of provided state
     * @param {*} name name of protected field
     * @param {*} defaultValue value returned when field is not in state
     * @return {*} value of protected field
     * @memberof ProtectedDataHolder
     */
    static getFromState(stateOwner, name, defaultValue) {
        let stateValue = this.getState(stateOwner)[name];

        if (!stateValue) {
            stateValue = defaultValue;
        }

        return stateValue;
    }

    /**
     * Used to get state for the owner.
     * If doesn't exist will create empty state.
     *
     * @param {*} stateOwner instance that is owner state
     * @return {*} state
     * @memberof ProtectedDataHolder
     */
    static getState(stateOwner) {
        let state = this.#stateHolder.get(stateOwner);

        if (!state) {
            state = {};
            this.#stateHolder.set(stateOwner, state);
        }

        return state;
    }
}


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


function addToState(stateOwner, state) {
    ProtectedDataHolder.addToStateMultiple(stateOwner, state);
}


function addOneToState(stateOwner, name, value) {
    ProtectedDataHolder.addToState(stateOwner, name, value);
}


function getFromState(stateOwner, name, defaultValue) {
    return ProtectedDataHolder.getFromState(stateOwner, name, defaultValue);
}


function getState(stateOwner) {
    return ProtectedDataHolder.getState(stateOwner);
}


module.exports = {
    Classes,
    addToState,
    addOneToState,
    getFromState,
    getState
};

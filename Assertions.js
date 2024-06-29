// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: equals;
const root = {
    
    assertEquals: (expected, actual) => {
        if (expected !== actual) {
            let wrappedExpected = root.wrapValueByType(expected)
            let wrappedActual = root.wrapValueByType(actual)
            
            throw new Error('Expected: ' + wrappedExpected + ' Actual: ' + wrappedActual)
        }
    },
    
    wrapValueByType: (value) => {
        if (typeof value === "string") {
            return "'" + value + "'"
        }
        
        return value
    }
}

module.exports.assertEquals = root.assertEquals

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: exclamation-triangle;
const assert = importModule("Assertions")
const test = importModule("Testing Library")
const alertUtil = importModule("Alert Util")


test.describe("Alert Util", () => {
    
    test.it("Should create error modal", () => {
        
        let modal = alertUtil.createErrorModal("Test")
        console.log(modal)
    })
})

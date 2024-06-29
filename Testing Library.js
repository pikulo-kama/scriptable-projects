// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: vial;
const root = {
    
    beforeEachCallback: () => {},
    executionResults: new Map(),
    
    describe: (suiteName, suiteCallback) => {
        
        suiteCallback()
        
        if (config.runsInApp) {
            root.presentTestReport(suiteName)
        }
    },
    
    it: (testName, testFunction) => {
        
        let error
        
        try {
            root.beforeEachCallback()
            testFunction()
        } catch (exception) {
            error = exception
        }
        
        // Store execution results
        root.executionResults.set(testName, !!error)
        
        if (error) {
            console.log("⛔️ " + testName)
            console.error(error)
        }
    },
    
    beforeEach: (callback) => {
        root.beforeEachCallback = callback
    },
    
    presentTestReport: (suiteName) => {
        
        let report = new UITable()
        let headerRow = new UITableRow()
        headerRow.isHeader = true
        
        let results = root.executionResults.values()
        let hasErrors = Array.from(results).includes(true)
        
        headerRow.backgroundColor = hasErrors ? Color.red() : Color.green()
        
        let statusText = headerRow.addText(hasErrors ? "⛔️" : "✅")
        statusText.widthWeight = 40
        
        let suiteNameText = headerRow.addText(suiteName)
        suiteNameText.widthWeight = 400
        
        report.addRow(headerRow)
        
        for (let testName of root.executionResults.keys()) {
            
            let isFailure = root.executionResults.get(testName)
            let testRow = new UITableRow()
            
            let testStatusText = testRow.addText(isFailure ? "⛔️" : "✅")
            testStatusText.widthWeight = 40
            
            let testNameText = testRow.addText(testName)
            testNameText.widthWeight = 400
            
            report.addRow(testRow)
        }
        
        report.present()
    }
}

module.exports.describe = root.describe
module.exports.it = root.it
module.exports.beforeEach = root.beforeEach

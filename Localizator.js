// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: globe;

const fileUtil = importModule("File Util")
const alertUtil = importModule("Alert Util")
const locale = importModule("Localization")

await locale.registerLabels({
    "t_header_label": "Translate '%script_name'",
    "t_label_form_header": "Translate '%label_key'",
    "t_update_action": "Update",
    "select_script": "Select Script",
    "select_locale": "Select Locale"
})

class Main {
    
    static fm = FileManager.iCloud()
    
    constructor() {
        this.table = new UITable()
        this.script = null
        this.locale = null
    }
    
    async main() {
        
        let scriptList = Main.fm.listContents(Main.fm.documentsDirectory())
            .filter(script => script.endsWith(".js"))
            .map(script => {
                let tags = Main.fm.allTags(Main.fm.joinPath(Main.fm.documentsDirectory(), script))
                return new Script(script, tags)
            })
            .filter(script => script.hasLocales() && !script.isLibrary())
        
        this.script = await this.selectScript(scriptList)
        
        if (!this.script) {
            return
        }
        
        this.locale = await this.selectLocale(this.script)
        
        if (!this.locale) {
            return
        }
        
        this.loadLabels()
        this.buildTable()
        
        this.table.present()
    }
    
    loadLabels() {
        this.data = JSON.parse(fileUtil.getExtConfiguration(this.locale.fileName, "{}", this.script.verboseName))
    }
    
    buildTable() {
        let headerRow = new UITableRow()
        
        headerRow.isHeader = true
        headerRow.backgroundColor = Color.darkGray()
        headerRow.cellSpacing = 100
        
        headerRow.addText(locale.getLabel("t_header_label").replace("%script_name", this.script.verboseName))
        this.table.addRow(headerRow)
        
        for (let labelKey of Object.keys(this.data)) {
            
            let labelRow = new UITableRow()
            let labelCell = labelRow.addButton(this.data[labelKey])
            
            labelCell.onTap = this.editFieldAndSaveChanges(labelKey)
            
            this.table.addRow(labelRow)
        }
    }
    
    editFieldAndSaveChanges(key) {
        
        const that = this
        
        return async () => {
            
            let result = await alertUtil.createCancelableAlert({
                title: locale.getLabel("t_label_form_header").replace("%label_key", key),
                fields: [{
                    var: key,
                    label: key,
                    initial: that.data[key]
                }],
                actions: locale.getLabel("t_update_action")
            })
            
            if (!result.isCancelled) {
                
                that.data[key] = result.data[key]
                await that.saveData()
                
                that.table.removeAllRows()
                that.buildTable()
                that.table.reload()
            }
        }
    }
    
    async saveData() {
        await fileUtil.updateExtConfiguration(
            this.locale.fileName,
            JSON.stringify(this.data),
            this.script.verboseName
        )
    }
    
    async selectScript(scriptList) {
            
        let result = await alertUtil.createCancelableAlert({
            title: locale.getLabel("select_script"),
            actions: scriptList.map(script => script.verboseName)
        })
        
        if (!result.isCancelled) {
            return scriptList.find(script => 
                script.verboseName === result.choice
            )
        }
        
        return null
    }
    
    async selectLocale(script) {
        
        if (script.locales.length === 1) {
            return script.locales[0]
        }
        
        let result = await alertUtil.createCancelableAlert({
            title: locale.getLabel("select_locale"),
            actions: script.locales.map(localeObj => localeObj.locale)
        })
        
        if (!result.isCancelled) {
            return script.locales.find(localeObj =>
                localeObj.locale === result.choice
            )
        }
        
        return null
    }
}

class Script {
    
    static localeFileRegex = "locale_\\w+\.json"
    
    constructor(fileName, tags) {
        
        this.fileName = fileName
        this.tags = tags
        this.verboseName = fileName.replace(".js", "")
        this.locales = this.loadLocales(this.verboseName)
    }
    
    loadLocales(scriptName) {
        return fileUtil.findExtConfigurations(Script.localeFileRegex, scriptName)
            .map(localeFile => new Locale(localeFile))
    }
    
    hasLocales() {
        return this.locales.length > 0
    }
    
    isLibrary() {
        return this.tags.includes("Standalone Library")
    }
}

class Locale {
    
    constructor(fileName) {
        
        this.fileName = fileName
        this.locale = fileName.substring("locale_".length, fileName.indexOf(".json"))
    }
}

await new Main().main()

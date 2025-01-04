// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: globe;

const { FileUtil } = importModule("File Util");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");

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
                return new ScriptInfo(script, tags)
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
        this.data = FileUtil.readJson(this.script.verboseName, this.locale.fileName, {});
    }
    
    buildTable() {
        let headerRow = new UITableRow()
        
        headerRow.isHeader = true
        headerRow.backgroundColor = Color.darkGray()
        headerRow.cellSpacing = 100
        
        headerRow.addText(tr("t_header_label", this.script.verboseName));
        this.table.addRow(headerRow)
        
        for (let labelKey of Object.keys(this.data)) {
            
            let labelRow = new UITableRow()
            let labelCell = labelRow.addButton(this.data[labelKey])
            
            labelCell.onTap = this.editFieldAndSaveChanges(labelKey)
            
            this.table.addRow(labelRow)
        }
    }
    
    editFieldAndSaveChanges(key) {
        
        const that = this;
        
        return async () => {
            
            let result = await modal()
                .title(tr("t_label_form_header", key))
                .actions([tr("t_update_action")])
                .field()
                    .name(key)
                    .label(key)
                    .initial(that.data[key])
                    .add()
                .present();
            
            if (!result.isCancelled()) {
                
                that.data[key] = result.get(key);
                await that.saveData();
                
                that.table.removeAllRows();
                that.buildTable();
                that.table.reload();
            }
        }
    }
    
    async saveData() {
        await FileUtil.updateJson(
            this.script.verboseName,
            this.locale.fileName,
            this.data
        );
    }
    
    async selectScript(scriptList) {
            
        const result = await modal()
            .title(tr("select_script"))
            .actions(scriptList.map(script => script.verboseName))
            .present();
        
        if (!result.isCancelled()) {
            return scriptList.find(script => 
                script.verboseName === result.choice()
            );
        }
        
        return null;
    }
    
    async selectLocale(script) {
        
        if (script.locales.length === 1) {
            return script.locales[0]
        }
        
        const result = await modal()
            .title(tr("select_locale"))
            .actions(script.locales.map(localeObj => localeObj.locale))
            .present();
        
        if (!result.isCancelled()) {
            return script.locales.find(localeObj =>
                localeObj.locale === result.choice()
            );
        }
        
        return null;
    }
}

class ScriptInfo {
    
    static localeFileRegex = "locale_\\w+\.json"
    
    constructor(fileName, tags) {
        
        this.fileName = fileName
        this.tags = tags
        this.verboseName = fileName.replace(".js", "")
        this.locales = this.loadLocales(this.verboseName)
    }
    
    loadLocales(scriptName) {
        return FileUtil.findFiles(scriptName, ScriptInfo.localeFileRegex)
            .map(localeFile => new LocaleDto(localeFile))
    }
    
    hasLocales() {
        return this.locales.length > 0
    }
    
    isLibrary() {
        return this.tags.includes("Standalone Library")
    }
}

class LocaleDto {
    
    constructor(fileName) {
        
        this.fileName = fileName
        this.locale = fileName.substring("locale_".length, fileName.indexOf(".json"))
    }
}

await new Main().main()

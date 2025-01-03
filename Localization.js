// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

const { FileUtil } = importModule("File Util");

class Locale {

    static __LOCALE_FILE_TEMPLATE = "locale{}.json";

    static tr(key) {
        return this.__getLocaleFile()[key];
    }

    static async registerLabels(labelsMap) {
        
        let labels = this.__getLocaleFile();
        
        for (let labelKey of Object.keys(labelsMap)) {
            
            if (!labels[labelKey]) {
                labels[labelKey] = labelsMap[labelKey];
            }
        }
        
        await this.__updateLocaleFile(labels);
    }
    
    static __getLocaleFile() {
        let fileName = this.__getLocaleFileName(Device.language());
        return FileUtil.readLocalJson(fileName, {});
    }
    
    static async __updateLocaleFile(content) {   
        let fileName = this.__getLocaleFileName(Device.language());
        await FileUtil.updateLocalJson(fileName, content);
    }
    
    static __getLocaleFileName(locale) {

        let languageCode = "";

        if (locale) {
            languageCode = "_" + locale;
        }

        return Locale.__LOCALE_FILE_TEMPLATE.replace("{}", languageCode);
    }
}

module.exports = {
    Locale
};

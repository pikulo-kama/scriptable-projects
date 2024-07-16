// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: language;

const root = {
    
    fileUtil: importModule("File Util"),
    localizationFileTemplate: "locale{}.json",
    
    registerLabels: async labelsObject => {
        
        let labels = root.getLocaleFile()
        
        for (let labelKey of Object.keys(labelsObject)) {
            
            if (!labels[labelKey]) {
                labels[labelKey] = labelsObject[labelKey]
            }
        }
        
        await root.updateLocaleFile(labels)
    },
    
    getLabel: (key) => {
        let labels = root.getLocaleFile()
        return labels[key]
    },
    
    getLocaleFile: () => {
        
        let fileName = root.getLocaleFileName(Device.language())
            
        let content = root.fileUtil.getConfiguration(fileName, "{}")
        return JSON.parse(content)
    },
    
    updateLocaleFile: async content => {
        
        let fileName = root.getLocaleFileName(Device.language())
        await root.fileUtil.updateConfiguration(fileName, JSON.stringify(content))
    },
    
    getLocaleFileName: locale => {
        return root.localizationFileTemplate
            .replace("{}", locale ? "_" + locale : "")
    }
}

module.exports.registerLabels = root.registerLabels
module.exports.getLabel = root.getLabel

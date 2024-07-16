// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

const root = {
    
    manager: FileManager.iCloud(),
    getScriptableDir: () => root.joinPaths([
        root.manager.documentsDirectory(),
        "Resources"
    ]),
    
    updateConfiguration: async (fileName, content) => {
        await root.updateExtConfiguration(fileName, content, Script.name())
    },
    
    updateExtConfiguration: async (fileName, content, scriptName) => {
        
        const manager = root.manager
        const targetDirectory = root.joinPaths(
            [root.getScriptableDir(), scriptName])
        
        if (!manager.isDirectory(targetDirectory)) {
            manager.createDirectory(targetDirectory, true)
        }
        
        const targetFile = manager.joinPath(targetDirectory, fileName)
            
        await manager.write(targetFile, root.castToData(content))
    },
    
    getConfiguration: (fileName, defaultValue) => {
        return root.doGetConfiguration(fileName, defaultValue, Script.name())
    },
    
    getExtConfiguration: (fileName, defaultValue, scriptName) => {
        return root.doGetConfiguration(fileName, defaultValue, scriptName)
    },
    
    findExtConfigurations: (fileNameRegex, scriptName) => {
        
        let scriptDir = root.joinPaths(
            [root.getScriptableDir(), scriptName]
        )
        
        if (!root.manager.isDirectory(scriptDir)) {
            return []
        }
        
        return root.manager.listContents(scriptDir)
            .filter(fileName => fileName.match(fileNameRegex))
    },
    
    doGetConfiguration: (fileName, defaultValue, scriptName) => {
        const targetFile = root.joinPaths(
            [root.getScriptableDir(), scriptName, fileName]
        )
        
        if (!root.manager.fileExists(targetFile)) {
            
            console.warn("File does not exist: " + targetFile)
            return defaultValue
        }
        
        return root.manager.readString(targetFile)
    },
    
    
    castToData: content => {
        return Data.fromString(String(content))
    },
    
    joinPaths: paths => {
        let resultPath = ""
        
        for (let path of paths) {
            resultPath = root.manager.joinPath(resultPath, path)
        }
        
        return resultPath
    }
}

module.exports.updateConfiguration = root.updateConfiguration
module.exports.updateExtConfiguration = root.updateExtConfiguration
module.exports.getConfiguration = root.getConfiguration
module.exports.getExtConfiguration = root.getExtConfiguration
module.exports.findExtConfigurations = root.findExtConfigurations

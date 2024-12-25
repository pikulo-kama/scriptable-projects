// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

const root = {
    
    manager: FileManager.iCloud(),
    getScriptableDir: () => root.__joinPaths([
        root.manager.documentsDirectory(),
        "Resources"
    ]),
    
    updateConfiguration: async (fileName, content) => {
        await root.updateExtConfiguration(fileName, content, Script.name())
    },
    
    updateExtConfiguration: async (fileName, content, scriptName) => {
        
        const manager = root.manager
        const targetDirectory = root.__joinPaths(
            [root.getScriptableDir(), scriptName])
        
        if (!manager.isDirectory(targetDirectory)) {
            manager.createDirectory(targetDirectory, true)
        }
        
        const targetFile = manager.joinPath(targetDirectory, fileName)
            
        await manager.write(targetFile, root.__castToData(content))
    },
    
    getConfiguration: (fileName, defaultValue) => {
        return root.__doGetConfiguration(fileName, defaultValue, Script.name())
    },
    
    getExtConfiguration: (fileName, defaultValue, scriptName) => {
        return root.__doGetConfiguration(fileName, defaultValue, scriptName)
    },
    
    findExtConfigurations: (fileNameRegex, scriptName) => {
        
        let scriptDir = root.__joinPaths(
            [root.getScriptableDir(), scriptName]
        )
        
        if (!root.manager.isDirectory(scriptDir)) {
            return []
        }
        
        return root.manager.listContents(scriptDir)
            .filter(fileName => fileName.match(fileNameRegex))
    },
    
    __doGetConfiguration: (fileName, defaultValue, scriptName) => {
        const targetFile = root.__joinPaths(
            [root.getScriptableDir(), scriptName, fileName]
        )
        
        if (!root.manager.fileExists(targetFile)) {
            
            console.warn("File does not exist: " + targetFile)
            return defaultValue
        }
        
        return root.manager.readString(targetFile)
    },
    
    
    __castToData: content => {
        return Data.fromString(String(content))
    },
    
    __joinPaths: paths => {
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

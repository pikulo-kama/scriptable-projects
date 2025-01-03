// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

class FileUtil {

    static __manager = FileManager.iCloud();

    static async updateLocalJson(fileName, content) {
        await this.updateJson(Script.name(), fileName, content);
    }

    static async updateJson(scriptName, fileName, content) {
        await this.updateFile(scriptName, fileName, JSON.stringify(content));
    }
    
    static async updateLocalFile(fileName, content) {
        await this.updateFile(Script.name(), fileName, content);
    }
    
    static async updateFile(scriptName, fileName, content) {
        
        const targetDirectory = this.joinPaths(
            this.__getScriptableDir(), 
            scriptName
        );
        
        if (!this.__manager.isDirectory(targetDirectory)) {
            this.__manager.createDirectory(targetDirectory, true);
        }
        
        const targetFile = this.joinPaths(targetDirectory, fileName); 
        await this.__manager.write(targetFile, this.__castToData(content));
    }

    static readLocalJson(fileName, defautlValue) {
        return this.readJson(Script.name(), fileName, defautlValue);
    }

    static readJson(scriptName, fileName, defaultValue) {
        let content = this.readFile(scriptName, fileName, defaultValue);

        if (typeof content === 'string') {
            content = JSON.parse(content);
        }

        return content;
    }
    
    static readLocalFile(fileName, defaultValue) {
        return this.readFile(Script.name(), fileName, defaultValue);
    }
    
    static readFile(scriptName, fileName, defaultValue) {

        const targetFile = this.joinPaths(
            this.__getScriptableDir(), 
            scriptName, 
            fileName
        );
        
        if (!this.__manager.fileExists(targetFile)) {
            console.warn("File does not exist: " + targetFile);
            return defaultValue;
        }
        
        return this.__manager.readString(targetFile);
    }
    
    static findFiles(scriptName, fileNameRegex) {
        
        const scriptDirectory = this.joinPaths(
            this.__getScriptableDir(), 
            scriptName
        );
        
        if (!this.__manager.isDirectory(scriptDirectory)) {
            return [];
        }
        
        return this.__manager.listContents(scriptDirectory)
            .filter(fileName => fileName.match(fileNameRegex));
    }

    static joinPaths(...paths) {
        
        let resultPath = "";
        
        for (let path of paths) {
            resultPath = this.__manager.joinPath(resultPath, path);
        }
        
        return resultPath;
    }

    static __getScriptableDir() {
        return this.joinPaths(
            this.__manager.documentsDirectory(),
            "Resources"
        );
    }
    
    static __castToData(content) {
        return Data.fromString(String(content));
    }
}

module.exports = {
    FileUtil
};

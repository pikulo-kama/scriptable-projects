// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

class FileUtil {

    static __manager = FileManager.iCloud();
    
    static __RESOURCES_DIR = "Resources";
    static __LOCALES_DIR = "i18n";
    static __JS_EXTENSION = ".js";

    static async updateScript(scriptName, script) {

        const scriptPath = this.joinPaths(
            this.__getScriptableDirectory(),
            scriptName
        );

        await this.__manager.write(scriptPath, Data.fromString(script));
    }

    static async updateLocale(scriptName, languageCode, content) {
        
        let localeFileName = `locale_${languageCode}.json`;
        await this.__updateFileInternal(
            scriptName,
            localeFileName,
            JSON.stringify(content, null, 4),
            this.__getLocalesDirectory()
        );
    }

    static async updateLocalJson(fileName, content) {
        await this.updateJson(Script.name(), fileName, content);
    }

    static async updateJson(scriptName, fileName, content) {
        await this.updateFile(scriptName, fileName, JSON.stringify(content, null, 4));
    }
    
    static async updateLocalFile(fileName, content) {
        await this.updateFile(Script.name(), fileName, content);
    }

    static async updateFile(scriptName, fileName, content) {
        await this.__updateFileInternal(scriptName, fileName, content, this.__getResourcesDirectory());
    }
    
    static async __updateFileInternal(scriptName, fileName, content, directory) {
        
        const targetDirectory = this.joinPaths(
            directory,
            scriptName
        );
        
        if (!this.__manager.isDirectory(targetDirectory)) {
            this.__manager.createDirectory(targetDirectory, true);
        }
        
        const targetFile = this.joinPaths(targetDirectory, fileName); 
        await this.__manager.write(targetFile, this.__castToData(content));
    }

    static localeExists(scriptName, languageCode) {
        let localeFileName = `locale_${languageCode}.json`;
        return this.__fileExistsInternal(scriptName, localeFileName, this.__getLocalesDirectory());
    }

    static fileExists(scriptName, fileName) {
        return this.__fileExistsInternal(scriptName, fileName, this.__getResourcesDirectory());
    }

    static __fileExistsInternal(scriptName, fileName, directory) {

        const targetFile = this.joinPaths(
            directory,
            scriptName, 
            fileName
        );
        
        return this.__manager.fileExists(targetFile);
    }

    static readScript(scriptName) {

        const scriptPath = this.joinPaths(this.__getScriptableDirectory(), scriptName);
        return this.__manager.readString(scriptPath);
    }

    static readLocale(scriptName, languageCode) {

        let localeFileName = `locale_${languageCode}.json`;
        let content = this.__readFileInternal(
            scriptName,
            localeFileName,
            {},
            this.__getLocalesDirectory()
        );

        if (typeof content === 'string') {
            content = JSON.parse(content);
        }

        return content;
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
        return this.__readFileInternal(scriptName, fileName, defaultValue, this.__getResourcesDirectory());
    }
    
    static __readFileInternal(scriptName, fileName, defaultValue, directory) {

        const targetFile = this.joinPaths(
            directory, 
            scriptName, 
            fileName
        );
        
        if (!this.__manager.fileExists(targetFile)) {
            console.warn("File does not exist: " + targetFile);
            return defaultValue;
        }
        
        return this.__manager.readString(targetFile);
    }

    static findLocaleDirectories() {
        return this.__manager.listContents(this.__getLocalesDirectory());
    }

    static findScripts() {
        return this.__manager.listContents(this.__getScriptableDirectory())
            .filter((script) => script.endsWith(this.__JS_EXTENSION));
    }
    
    static findFiles(scriptName, fileNameRegex) {
        
        const scriptDirectory = this.joinPaths(
            this.__getResourcesDirectory(), 
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

    static __getResourcesDirectory() {
        return this.joinPaths(
            this.__getScriptableDirectory(),
            this.__RESOURCES_DIR
        );
    }

    static __getLocalesDirectory() {
        return this.joinPaths(
            this.__getScriptableDirectory(),
            this.__LOCALES_DIR
        );
    }

    static __getScriptableDirectory() {
        return this.__manager.documentsDirectory();
    }
    
    static __castToData(content) {
        return Data.fromString(String(content));
    }
}

module.exports = {
    FileUtil
};

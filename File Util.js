// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

/**
 * Helper class.
 * Used to simplify work with file system.
 *
 * FileUtil only operates in iCloud no
 * changes to physical file system is being made.
 * 
 * @class FileUtil
 */
class FileUtil {

    static #manager = FileManager.iCloud();
    
    static #RESOURCES_DIR = "Resources";
    static #LOCALES_DIR = "i18n";
    static #JS_EXTENSION = ".js";

    /**
     * Used to update Scriptable script content.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} script script content
     * @memberof FileUtil
     */
    static async updateScript(scriptName, script) {

        const scriptPath = this.joinPaths(
            this.#getScriptableDirectory(),
            scriptName
        );

        await this.#manager.write(scriptPath, Data.fromString(script));
    }

    /**
     * Used to update locale file
     * associated with the script and provided language code.
     *
     * @static
     * @param {String} scriptName script name for which locale is being updated
     * @param {String} languageCode language code associated with locale
     * @param {String} content locale file content
     * @memberof FileUtil
     */
    static async updateLocale(scriptName, languageCode, content) {
        
        let localeFileName = `locale_${languageCode}.json`;
        await this.#updateFileInternal(
            scriptName,
            localeFileName,
            JSON.stringify(content, null, 4),
            this.#getLocalesDirectory()
        );
    }

    /**
     * Used to update JSON resource
     * associated with current script.
     *
     * @static
     * @param {String} fileName name of resource file
     * @param {String} content JSON file content
     * @memberof FileUtil
     */
    static async updateLocalJson(fileName, content) {
        await this.updateJson(Script.name(), fileName, content);
    }

    /**
     * Used to update JSON resource
     * associated with provided script.
     *
     * @static
     * @param {String} scriptName name of script for which file is updated
     * @param {String} fileName name of resource file
     * @param {String} content JSON file content
     * @memberof FileUtil
     */
    static async updateJson(scriptName, fileName, content) {
        await this.updateFile(scriptName, fileName, JSON.stringify(content, null, 4));
    }
    
    /**
     * Used to update file resource
     * associated with current script.
     *
     * @static
     * @param {String} fileName name of resource file
     * @param {String} content file content
     * @memberof FileUtil
     */
    static async updateLocalFile(fileName, content) {
        await this.updateFile(Script.name(), fileName, content);
    }

    /**
     * Used to update file resource
     * associated with provided script.
     *
     * @static
     * @param {String} scriptName name of script for which file is updated
     * @param {String} fileName name of resource file
     * @param {String} content file content
     * @memberof FileUtil
     */
    static async updateFile(scriptName, fileName, content) {
        await this.#updateFileInternal(scriptName, fileName, content, this.#getResourcesDirectory());
    }
    
    /**
     * Used to update files in general.
     * Used only internally.
     *
     * @static
     * @param {String} scriptName name of script associated with file
     * @param {String} fileName name of file that should be updated
     * @param {String} content file content
     * @param {String} directory path on which file should be created
     * @memberof FileUtil
     */
    static async #updateFileInternal(scriptName, fileName, content, directory) {
        
        const targetDirectory = this.joinPaths(
            directory,
            scriptName
        );
        
        if (!this.#manager.isDirectory(targetDirectory)) {
            this.#manager.createDirectory(targetDirectory, true);
        }
        
        const targetFile = this.joinPaths(targetDirectory, fileName); 
        await this.#manager.write(targetFile, Data.fromString(String(content)));
    }


    /**
     * Checks whether script has locale
     * with provided language code.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} languageCode language code
     * @return {Boolean} True if locale exists otherwise false
     * @memberof FileUtil
     */
    static localeExists(scriptName, languageCode) {
        let localeFileName = `locale_${languageCode}.json`;
        return this.#fileExistsInternal(scriptName, localeFileName, this.#getLocalesDirectory());
    }

    /**
     * Checks whether script has resource file
     * with provided name.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} fileName name of file
     * @return {Boolean} True if file exists otherwise false
     * @memberof FileUtil
     */
    static fileExists(scriptName, fileName) {
        return this.#fileExistsInternal(scriptName, fileName, this.#getResourcesDirectory());
    }

    /**
     * Used to check whether file exists.
     * Used internally.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} fileName name of file
     * @param {String} directory path where script name directory is located
     * @return {Boolean} True if file exists otherwise false
     * @memberof FileUtil
     */
    static #fileExistsInternal(scriptName, fileName, directory) {

        const targetFile = this.joinPaths(
            directory,
            scriptName, 
            fileName
        );
        
        return this.#manager.fileExists(targetFile);
    }

    /**
     * Used to read content of Scriptable script.
     *
     * @static
     * @param {String} scriptName name of script
     * @return {String} script content
     * @memberof FileUtil
     */
    static readScript(scriptName) {

        const scriptPath = this.joinPaths(this.#getScriptableDirectory(), scriptName);
        return this.#manager.readString(scriptPath);
    }

    /**
     * Used to read locale object with provided 
     * language code for provided script.
     * 
     * Will return empty locale object if it doesn't exist.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} languageCode language code
     * @return {Object} locale object
     * @memberof FileUtil
     */
    static readLocale(scriptName, languageCode) {

        let localeFileName = `locale_${languageCode}.json`;
        let content = this.#readFileInternal(
            scriptName,
            localeFileName,
            {},
            this.#getLocalesDirectory()
        );

        if (typeof content === 'string') {
            content = JSON.parse(content);
        }

        return content;
    }

    /**
     * Used to read JSON file associated
     * with current script.
     *
     * @static
     * @param {String} fileName name of JSON file
     * @param {Object} defautlValue default value, would be returned when file doens't exist
     * @return {Object} content of JSON file if exists otherwise default value
     * @memberof FileUtil
     */
    static readLocalJson(fileName, defautlValue) {
        return this.readJson(Script.name(), fileName, defautlValue);
    }
    
    /**
     * Used to read JSON file associated
     * with provided script.
     *
     * @static
     * @param {String} scriptName script name
     * @param {String} fileName name of JSON file
     * @param {Object} defautlValue default value, would be returned when file doens't exist
     * @return {Object} content of JSON file if exists otherwise default value
     * @memberof FileUtil
     */
    static readJson(scriptName, fileName, defaultValue) {
        let content = this.readFile(scriptName, fileName, defaultValue);

        if (typeof content === 'string') {
            content = JSON.parse(content);
        }

        return content;
    }
    
    /**
     * Used to read resource file associated
     * with current script.
     *
     * @static
     * @param {String} fileName file name
     * @param {Object} defaultValue, would be returned when file doens't exist
     * @return {Object} content of file if exists otherwise default value
     * @memberof FileUtil
     */
    static readLocalFile(fileName, defaultValue) {
        return this.readFile(Script.name(), fileName, defaultValue);
    }

    /**
     * Used to read resource file associated
     * with provided script.
     *
     * @static
     * @param {String} scriptName script name
     * @param {String} fileName file name
     * @param {Object} defaultValue, would be returned when file doens't exist
     * @return {Object} content of file if exists otherwise default value
     * @memberof FileUtil
     */
    static readFile(scriptName, fileName, defaultValue) {
        return this.#readFileInternal(scriptName, fileName, defaultValue, this.#getResourcesDirectory());
    }
    
    /**
     * Used to read file.
     * Used internally.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} fileName name of file
     * @param {String} defaultValue default value
     * @param {String} directory path where file is located
     * @return {Object} content of file if exists otherwise default value
     * @memberof FileUtil
     */
    static #readFileInternal(scriptName, fileName, defaultValue, directory) {

        const targetFile = this.joinPaths(
            directory, 
            scriptName, 
            fileName
        );
        
        if (!this.#manager.fileExists(targetFile)) {
            console.warn("File does not exist: " + targetFile);
            return defaultValue;
        }
        
        return this.#manager.readString(targetFile);
    }

    /**
     * Used to get list of scripts
     * that have locale directories created.
     *
     * @static
     * @return {List<String>} list of locale directory names
     * @memberof FileUtil
     */
    static findLocaleDirectories() {
        return this.#manager.listContents(this.#getLocalesDirectory());
    }

    /**
     * Used to get list of Scriptable script names.
     *
     * @static
     * @return {List<String>} list of script names
     * @memberof FileUtil
     */
    static findScripts() {
        return this.#manager.listContents(this.#getScriptableDirectory())
            .filter((script) => script.endsWith(this.#JS_EXTENSION));
    }

    /**
     * Used to join several string literals
     * into file path.
     *
     * @static
     * @param {List<String>} segments file path segments that should be composed
     * @return {String} file path
     * @memberof FileUtil
     */
    static joinPaths(...segments) {
        
        let filePath = "";
        
        for (let segment of segments) {
            filePath = this.#manager.joinPath(filePath, segment);
        }
        
        return filePath;
    }

    /**
     * Used to get 'Resources' directory path.
     * In this directory all script internal data
     * is being stored.
     *
     * @static
     * @return {String} Resources directory path
     * @memberof FileUtil
     */
    static #getResourcesDirectory() {
        return this.joinPaths(
            this.#getScriptableDirectory(),
            this.#RESOURCES_DIR
        );
    }

    /**
     * Used to get locales 'i18n' directory path.
     * In this directory all labels and translations
     * used by widgets and UI tables are being stored.
     *
     * @static
     * @return {String} locales directory path
     * @memberof FileUtil
     */
    static #getLocalesDirectory() {
        return this.joinPaths(
            this.#getScriptableDirectory(),
            this.#LOCALES_DIR
        );
    }

    /**
     * Used to get main scriptable directory.
     * This is Scriptable file system root.
     *
     * @static
     * @return {String} Scriptable root directory path
     * @memberof FileUtil
     */
    static #getScriptableDirectory() {
        return this.#manager.documentsDirectory();
    }
}


module.exports = {
    FileUtil
};

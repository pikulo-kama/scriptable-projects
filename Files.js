// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

/**
 * Helper class.
 * Used to simplify work with file system.
 *
 * Files only operates in iCloud no
 * changes to device file system is being made.
 * 
 * @class Files
 */
class Files {

    static #manager = FileManager.iCloud();
    
    static #FEATURES_DIR = "Features";
    static #RESOURCES_DIR = "Resources";
    static #LOCALES_DIR = "i18n";

    static #FEATURE_FILE_NAME = "feature.json";
    static #JS_EXTENSION = ".js";

    /**
     * Used to update features object
     * for provided script.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {Object} content features object
     * @memberof Files
     */
    static async updateFeatureFile(scriptName, content) {

        await this.#updateFileInternal(
            scriptName,
            this.#FEATURE_FILE_NAME,
            JSON.stringify(content, null, 4),
            this.#getFeaturesDirectory()
        );
    }

    /**
     * Used to update Scriptable script content.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} script script content
     * @memberof Files
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
     * @memberof Files
     */
    static async updateLocale(scriptName, languageCode, content) {
        
        await this.#updateFileInternal(
            scriptName,
            this.#getLocaleFileName(languageCode),
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
     * @memberof Files
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
     * @memberof Files
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
     * @memberof Files
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
     * @memberof Files
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
     * @memberof Files
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
     * Checks whether feature file
     * exists for provided script.
     *
     * @static
     * @param {String} scriptName name of script
     * @return {Boolean} true if feature file exists otherwise false
     * @memberof Files
     */
    static featureFileExists(scriptName) {
        return this.#fileExistsInternal(
            scriptName, this.#FEATURE_FILE_NAME, this.#getFeaturesDirectory()
        );
    }

    /**
     * Checks whether script has locale
     * with provided language code.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} languageCode language code
     * @return {Boolean} True if locale exists otherwise false
     * @memberof Files
     */
    static localeExists(scriptName, languageCode) {

        return this.#fileExistsInternal(
            scriptName, 
            this.#getLocaleFileName(languageCode), 
            this.#getLocalesDirectory()
        );
    }

    /**
     * Checks whether script has resource file
     * with provided name.
     *
     * @static
     * @param {String} scriptName name of script
     * @param {String} fileName name of file
     * @return {Boolean} True if file exists otherwise false
     * @memberof Files
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
     * @memberof Files
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
     * Used to read feature file for current
     * script.
     *
     * @static
     * @return {Object} feature configuration
     * @memberof Files
     */
    static readLocalFeatureFile() {
        return this.readFeatureFile(Script.name());
    }

    /**
     * Used to read feature file for
     * provided script.
     *
     * @static
     * @param {String} scriptName name of script
     * @return {Object} feature configuration
     * @memberof Files
     */
    static readFeatureFile(scriptName) {

        const defaultValue = {
            __debug: {
                __enabled: false
            }
        };

        const content = this.#readFileInternal(
            scriptName, 
            this.#FEATURE_FILE_NAME, 
            defaultValue, 
            this.#getFeaturesDirectory()
        );

        return this.#toJSON(content);
    }

    /**
     * Used to read content of Scriptable script.
     *
     * @static
     * @param {String} scriptName name of script
     * @return {String} script content
     * @memberof Files
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
     * @memberof Files
     */
    static readLocale(scriptName, languageCode) {

        const content = this.#readFileInternal(
            scriptName,
            this.#getLocaleFileName(languageCode),
            {},
            this.#getLocalesDirectory()
        );

        return this.#toJSON(content);
    }

    /**
     * Used to read JSON file associated
     * with current script.
     *
     * @static
     * @param {String} fileName name of JSON file
     * @param {Object} defautlValue default value, would be returned when file doens't exist
     * @return {Object} content of JSON file if exists otherwise default value
     * @memberof Files
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
     * @memberof Files
     */
    static readJson(scriptName, fileName, defaultValue) {
        const content = this.readFile(scriptName, fileName, defaultValue);
        return this.#toJSON(content);
    }
    
    /**
     * Used to read resource file associated
     * with current script.
     *
     * @static
     * @param {String} fileName file name
     * @param {Object} defaultValue, would be returned when file doens't exist
     * @return {Object} content of file if exists otherwise default value
     * @memberof Files
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
     * @memberof Files
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
     * @memberof Files
     */
    static #readFileInternal(scriptName, fileName, defaultValue, directory) {

        const targetFile = this.joinPaths(
            directory, 
            scriptName, 
            fileName
        );
        
        if (!this.#manager.fileExists(targetFile)) {
            console.warn(`File does not exist: ${targetFile}`);
            return defaultValue;
        }
        
        return this.#manager.readString(targetFile);
    }

    /**
     * Used to get list of scripts
     * that have feature file.
     *
     * @static
     * @return {List<String>} list of script names
     * @memberof Files
     */
    static findFeatureDirectories() {
        return this.#manager.listContents(this.#getFeaturesDirectory());
    }

    /**
     * Used to get list of scripts
     * that have locale directories created.
     *
     * @static
     * @return {List<String>} list of locale directory names
     * @memberof Files
     */
    static findLocaleDirectories() {
        return this.#manager.listContents(this.#getLocalesDirectory());
    }

    /**
     * Used to get list of Scriptable script names.
     *
     * @static
     * @return {List<String>} list of script names
     * @memberof Files
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
     * @memberof Files
     */
    static joinPaths(...segments) {
        
        let filePath = "";
        
        for (const segment of segments) {
            filePath = this.#manager.joinPath(filePath, segment);
        }
        
        return filePath;
    }

    /**
     * Used to get 'Debug' directory
     * where all runnable script configurations
     * are stored.
     *
     * @return {String} Debug directory path
     * @memberof Files
     */
    static #getFeaturesDirectory() {
        return this.joinPaths(
            this.#getScriptableDirectory(),
            this.#FEATURES_DIR
        );
    }

    /**
     * Used to get 'Resources' directory path.
     * In this directory all script internal data
     * is being stored.
     *
     * @static
     * @return {String} Resources directory path
     * @memberof Files
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
     * @memberof Files
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
     * @memberof Files
     */
    static #getScriptableDirectory() {
        return this.#manager.documentsDirectory();
    }

    /**
     * Used to transform object
     * to JSON in case if it's string
     *
     * @param {String|Object} content JSON like string object
     * @return {Object} JSON value
     * @memberof Files
     */
    static #toJSON(content) {

        if (typeof content === 'string') {
            return JSON.parse(content);
        }

        return content;
    }

    /**
     * Used to get name of locale file
     * for provided language code.
     * 
     * @param {String} languageCode language code
     * @returns Name of locale file
     */
    static #getLocaleFileName(languageCode) {
        return `locale_${languageCode}.json`;
    }
}


module.exports = {
    Files
};

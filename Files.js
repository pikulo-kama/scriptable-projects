// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: copy;

const { JS_EXTENSION } = importModule("Constants");

/**
 * Helper class.
 * Used to simplify work with the Scriptable file system.
 *
 * Files only operates in iCloud; no changes to the local 
 * device file system are being made.
 * * @class Files
 */
class Files {

    /**
     * Internal iCloud File Manager instance.
     * @type {FileManager}
     * @private
     */
    static #manager = FileManager.iCloud();
    
    /**
     * Name of the directory where feature configurations are stored.
     * @type {string}
     */
    static FeaturesDirectory = "Features";

    /**
     * Name of the directory where script resources are stored.
     * @type {string}
     */
    static ResourcesDirectory = "Resources";

    /**
     * Name of the directory where localization files are stored.
     * @type {string}
     */
    static LocalesDirectory = "i18n";

    /**
     * Default filename for feature configuration files.
     * @type {string}
     * @private
     */
    static #FEATURE_FILE_NAME = "feature.json";

    /**
     * Returns the active file manager instance.
     * @returns {FileManager} The iCloud file manager.
     */
    static manager() {
        return this.#manager;
    }

    /**
     * Returns the root documents directory path.
     * @returns {string} Path to documents.
     */
    static rootDirectory() {
        return this.#manager.documentsDirectory();
    }

    /**
     * Moves a file from the source path to the destination path.
     * If a file already exists at the destination, it is deleted 
     * before the move operation to prevent errors.
     *
     * @static
     * @param {string} sourcePath - The current full path of the file.
     * @param {string} destinationPath - The target full path for the file.
     * @memberof Files
     */
    static forceMove(sourcePath, destinationPath) {

        if (this.#manager.fileExists(destinationPath)) {
            this.#manager.remove(destinationPath);
        }

        this.#manager.move(sourcePath, destinationPath);
    }

    /**
     * Writes raw content to a specific file path.
     * @param {string} filePath - Full path to the file.
     * @param {string} content - String content to write.
     */
    static updateScriptableFile(filePath, content) {
        this.#manager.write(filePath, Data.fromString(content));
    }

    /**
     * Used to update features object for provided script.
     *
     * @static
     * @param {String} scriptName - Name of script.
     * @param {Object} content - Features object to stringify.
     * @memberof Files
     */
    static async updateFeatureFile(scriptName, content) {
        await this.#updateFileInternal(
            scriptName,
            this.#FEATURE_FILE_NAME,
            JSON.stringify(content, null, 4),
            this.getFeaturesDirectory()
        );
    }

    /**
     * Used to update Scriptable script content.
     *
     * @static
     * @param {String} scriptName - Name of the script file.
     * @param {String} script - The JavaScript source code.
     * @memberof Files
     */
    static async updateScript(scriptName, script) {
        const scriptPath = this.joinPaths(
            this.getScriptableDirectory(),
            scriptName
        );

        await this.#manager.write(scriptPath, Data.fromString(script));
    }

    /**
     * Used to update locale file associated with the script and provided language code.
     *
     * @static
     * @param {String} scriptName - Script name for which locale is being updated.
     * @param {String} languageCode - Language code (e.g., 'en_US').
     * @param {Object} content - Locale object content.
     * @memberof Files
     */
    static async updateLocale(scriptName, languageCode, content) {
        await this.#updateFileInternal(
            scriptName,
            this.#getLocaleFileName(languageCode),
            JSON.stringify(content, null, 4),
            this.getLocalesDirectory()
        );
    }

    /**
     * Used to update JSON resource associated with the current running script.
     *
     * @static
     * @param {String} fileName - Name of resource file.
     * @param {Object} content - JSON object to save.
     * @memberof Files
     */
    static async updateLocalJson(fileName, content) {
        await this.updateJson(Script.name(), fileName, content);
    }

    /**
     * Used to update JSON resource associated with a specific script.
     *
     * @static
     * @param {String} scriptName - Name of script for which file is updated.
     * @param {String} fileName - Name of resource file.
     * @param {Object} content - JSON object to save.
     * @memberof Files
     */
    static async updateJson(scriptName, fileName, content) {
        await this.updateFile(scriptName, fileName, JSON.stringify(content, null, 4));
    }
    
    /**
     * Used to update file resource associated with the current script.
     *
     * @static
     * @param {String} fileName - Name of resource file.
     * @param {string} content - File content.
     * @memberof Files
     */
    static async updateLocalFile(fileName, content) {
        await this.updateFile(Script.name(), fileName, content);
    }

    /**
     * Used to update file resource associated with a provided script.
     *
     * @static
     * @param {String} scriptName - Name of script for which file is updated.
     * @param {String} fileName - Name of resource file.
     * @param {string} content - File content.
     * @memberof Files
     */
    static async updateFile(scriptName, fileName, content) {
        await this.#updateFileInternal(scriptName, fileName, content, this.getResourcesDirectory());
    }
    
    /**
     * Internal logic for handling directory creation and file writing.
     *
     * @static
     * @private
     * @param {String} scriptName - Name of script directory.
     * @param {String} fileName - File name to write.
     * @param {string} content - Raw content.
     * @param {String} directory - Base directory path.
     */
    static async #updateFileInternal(scriptName, fileName, content, directory) {
        const targetDirectory = this.joinPaths(directory, scriptName);
        
        if (!this.#manager.isDirectory(targetDirectory)) {
            this.#manager.createDirectory(targetDirectory, true);
        }

        const targetFile = this.joinPaths(targetDirectory, fileName); 
        await this.#manager.write(targetFile, Data.fromString(String(content)));
    }

    /**
     * Checks whether feature file exists for provided script.
     *
     * @static
     * @param {String} scriptName - Name of script.
     * @return {Boolean} True if feature file exists.
     * @memberof Files
     */
    static featureFileExists(scriptName) {
        return this.#fileExistsInternal(
            scriptName, this.#FEATURE_FILE_NAME, this.getFeaturesDirectory()
        );
    }

    /**
     * Checks whether script has locale with provided language code.
     *
     * @static
     * @param {String} scriptName - Name of script.
     * @param {String} languageCode - Language code.
     * @return {Boolean} True if locale exists.
     * @memberof Files
     */
    static localeExists(scriptName, languageCode) {
        return this.#fileExistsInternal(
            scriptName, 
            this.#getLocaleFileName(languageCode), 
            this.getLocalesDirectory()
        );
    }

    /**
     * Checks whether script has resource file with provided name.
     *
     * @static
     * @param {String} scriptName - Name of script.
     * @param {String} fileName - Name of file.
     * @return {Boolean} True if file exists.
     * @memberof Files
     */
    static fileExists(scriptName, fileName) {
        return this.#fileExistsInternal(scriptName, fileName, this.getResourcesDirectory());
    }

    /**
     * Internal existence check logic.
     * @private
     */
    static #fileExistsInternal(scriptName, fileName, directory) {
        const targetFile = this.joinPaths(directory, scriptName, fileName);
        return this.#manager.fileExists(targetFile);
    }

    /**
     * Reads a string from a specific file path.
     * @param {string} filePath - Path to the file.
     * @returns {string} File content.
     */
    static readScriptableFile(filePath) {
        return this.#manager.readString(filePath);
    }

    /**
     * Reads feature file for the current script.
     * @returns {Object} Feature configuration object.
     * @memberof Files
     */
    static readLocalFeatureFile() {
        return this.readFeatureFile(Script.name());
    }

    /**
     * Reads feature file for a specific script.
     * @param {String} scriptName - Name of script.
     * @returns {Object} Feature configuration object.
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
            this.getFeaturesDirectory()
        );

        return this.#toJSON(content);
    }

    /**
     * Reads content of a Scriptable script.
     * @param {String} scriptName - Name of script.
     * @returns {String} script source.
     * @memberof Files
     */
    static readScript(scriptName) {
        const scriptPath = this.joinPaths(this.getScriptableDirectory(), scriptName);
        return this.#manager.readString(scriptPath);
    }

    /**
     * Reads locale object for a script and language code.
     * @param {String} scriptName - Name of script.
     * @param {String} languageCode - Language code.
     * @returns {Object} Locale object or empty object if not found.
     * @memberof Files
     */
    static readLocale(scriptName, languageCode) {
        const content = this.#readFileInternal(
            scriptName,
            this.#getLocaleFileName(languageCode),
            {},
            this.getLocalesDirectory()
        );

        return this.#toJSON(content);
    }

    /**
     * Reads JSON file associated with current script.
     * @param {String} fileName - Name of JSON file.
     * @param {Object} defaultValue - Fallback value.
     * @returns {Object} Parsed JSON or default.
     * @memberof Files
     */
    static readLocalJson(fileName, defaultValue) {
        return this.readJson(Script.name(), fileName, defaultValue);
    }
    
    /**
     * Reads JSON file associated with provided script.
     * @param {String} scriptName - script name.
     * @param {String} fileName - Name of JSON file.
     * @param {Object} defaultValue - Fallback value.
     * @returns {Object} Parsed JSON or default.
     * @memberof Files
     */
    static readJson(scriptName, fileName, defaultValue) {
        const content = this.readFile(scriptName, fileName, defaultValue);
        return this.#toJSON(content);
    }
    
    /**
     * Reads resource file associated with current script.
     * @param {String} fileName - file name.
     * @param {any} defaultValue - Fallback value.
     * @returns {string|any} content or default value.
     * @memberof Files
     */
    static readLocalFile(fileName, defaultValue) {
        return this.readFile(Script.name(), fileName, defaultValue);
    }

    /**
     * Reads resource file associated with provided script.
     * @param {String} scriptName - script name.
     * @param {String} fileName - file name.
     * @param {any} defaultValue - Fallback value.
     * @returns {string|any} content or default value.
     * @memberof Files
     */
    static readFile(scriptName, fileName, defaultValue) {
        return this.#readFileInternal(scriptName, fileName, defaultValue, this.getResourcesDirectory());
    }
    
    /**
     * Internal read logic.
     * @private
     */
    static #readFileInternal(scriptName, fileName, defaultValue, directory) {
        const targetFile = this.joinPaths(directory, scriptName, fileName);

        if (!this.#manager.fileExists(targetFile)) {
            console.warn(`File does not exist: ${targetFile}`);
            return defaultValue;
        }

        return this.#manager.readString(targetFile);
    }

    /**
     * List all directories within the Features folder.
     * @returns {string[]} List of directory names.
     */
    static findFeatureDirectories() {
        return this.#manager.listContents(this.getFeaturesDirectory());
    }

    /**
     * List all directories within the Locales folder.
     * @returns {string[]} List of directory names.
     */
    static findLocaleDirectories() {
        return this.#manager.listContents(this.getLocalesDirectory());
    }

    /**
     * Finds scripts in a directory filtering by JS extension.
     * @param {string} [targetDirectory=null] - Directory to search. Defaults to Scriptable root.
     * @returns {string[]} List of script filenames.
     */
    static findScripts(targetDirectory = null) {
        if (targetDirectory === null) {
            targetDirectory = this.getScriptableDirectory();
        }
        
        return this.#manager.listContents(targetDirectory)
            .filter((script) => script.endsWith(JS_EXTENSION));
    }

    /**
     * Resolves the full path for a resource in the current script's folder.
     * @param {String} fileName - Resource name.
     * @returns {String} Full path.
     */
    static resolveLocalResource(fileName) {
        return this.resolveResource(Script.name(), fileName);
    }

    /**
     * Resolves the full path for a resource in a specific script's folder.
     * @param {String} scriptName - Script directory name.
     * @param {String} fileName - Resource name.
     * @returns {String} Full path.
     */
    static resolveResource(scriptName, fileName) {
        return this.joinPaths(
            this.getResourcesDirectory(),
            scriptName,
            fileName
        );
    }

    /**
     * Returns the full path to the Features directory.
     * @returns {String} Path.
     */
    static getFeaturesDirectory() {
        return this.joinPaths(
            this.getScriptableDirectory(),
            this.FeaturesDirectory
        );
    }

    /**
     * Returns the full path to the Resources directory.
     * @returns {String} Path.
     */
    static getResourcesDirectory() {
        return this.joinPaths(
            this.getScriptableDirectory(),
            this.ResourcesDirectory
        );
    }

    /**
     * Returns the full path to the Locales directory.
     * @returns {String} Path.
     */
    static getLocalesDirectory() {
        return this.joinPaths(
            this.getScriptableDirectory(),
            this.LocalesDirectory
        );
    }

    /**
     * Returns the root Scriptable documents directory.
     * @returns {String} Path.
     */
    static getScriptableDirectory() {
        return this.#manager.documentsDirectory();
    }

    /**
     * Combines multiple path segments into a single path string.
     * @param {...string} segments - Path parts to join.
     * @returns {String} Full joined path.
     */
    static joinPaths(...segments) {
        let filePath = "";

        for (const segment of segments) {
            filePath = this.#manager.joinPath(filePath, segment);
        }
        
        return filePath;
    }

    /**
     * Parses content into JSON if it is a string.
     * @private
     */
    static #toJSON(content) {
        if (typeof content === 'string') {
            return JSON.parse(content);
        }

        return content;
    }

    /**
     * Generates the filename for a locale JSON.
     * @private
     * @param {String} languageCode - e.g., 'en'.
     * @returns {string} e.g., 'locale_en.json'.
     */
    static #getLocaleFileName(languageCode) {
        return `locale_${languageCode}.json`;
    }
}


module.exports = {
    Files
};

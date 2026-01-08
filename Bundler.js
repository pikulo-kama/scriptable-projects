// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: file-archive;

const { Files } = importModule("Files");
const { JS_EXTENSION, EMPTY_STRING } = importModule("Constants");


/**
 * Represents metadata for a specific file, including its name and location.
 * Provides utility methods to resolve full system paths.
 */
class FileInfo {
    
    /**
     * The name of the file (including extension).
     * @type {string}
     * @private
     */
    #name;

    /**
     * The directory path where the file is located.
     * @type {string}
     * @private
     */
    #directory;

    #dependencies;
    
    /**
     * Creates an instance of FileInfo.
     * @param {string} name - The name of the file.
     * @param {string} directory - The directory path.
     */
    constructor(name, directory, dependencies) {
        this.#name = name;
        this.#directory = directory;
        this.#dependencies = dependencies
    }
    
    /**
     * Gets the name of the file.
     * @returns {string} The filename.
     */
    name() {
        return this.#name;
    }
    
    /**
     * Gets the directory path of the file.
     * @returns {string} The directory path.
     */
    directory() {
        return this.#directory;
    }
    
    /**
     * Resolves the full path of the file by joining the directory and name.
     * @returns {string} The full file path.
     */
    path() {
        return Files.joinPaths(this.directory(), this.name());
    }

    dependencies() {
        return this.#dependencies;
    }
}


/**
 * Used to compose script and all of its 
 * dependencies into single file and then
 * store it in Scriptable root directory.
 *
 * @class Bundler
 */
class Bundler {

    static #DEPENDENCY_REGEXP = new RegExp(/const\s*\{[^}]+\}\s*=\s*importModule\(["']([^"']+)["']\);?/g);
    static #MODULE_EXPORTS_REGEXP = new RegExp(/module\.exports\s*=\s*{[^}]+};?/g);

    #scriptName;
    #scriptsDirectory;
    #scriptMetadata = new Map();
    #dependencyScripts = new Map();

    /**
     * Creates an instance of Bundler.
     * @param {String} scriptName script that should be bundled
     * @memberof Bundler
     */
    constructor(scriptName, scriptsDirectory) {
        this.#scriptName = scriptName;
        this.#scriptsDirectory = scriptsDirectory;
    }

    /**
     * Composes script and all of its 
     * dependencies into single file and then
     * store it in Scriptable root directory.
     *
     * @memberof Bundler
     */
    async bundle() {

        this.#processDependencies(this.#scriptName);
        
        let scriptBody = "";
        const mainScriptMetadata = this.#scriptMetadata.get(this.#scriptName);
        const mainScriptBody = this.#dependencyScripts.get(this.#scriptName);

        // Delete main script from dependencies.
        this.#dependencyScripts.delete(this.#scriptName);

        // Add back removed metadata.
        scriptBody += mainScriptMetadata;

        // Add all dependencies.
        for (const dependencyBody of this.#dependencyScripts.values()) {
            scriptBody += dependencyBody;
        }

        // Add main script.
        scriptBody += mainScriptBody;

        const targetFileName = `${this.#scriptName} (Bundled)${JS_EXTENSION}`;
        const targetFilePath = Files.joinPaths(this.#scriptsDirectory, targetFileName);
        await Files.updateScriptableFile(targetFilePath, scriptBody);

        return new FileInfo(
            targetFileName, 
            this.#scriptsDirectory, 
            this.#dependencyScripts.keys()
        );
    }

    /**
     * Used to process provided script by removing
     * and then storing its metadata, dependency scripts and
     * module exports blocks.
     * 
     * Script is recursive and will process all dependencies as well.
     *
     * @param {String} scriptName script that should be processed
     * @memberof Bundler
     */
    #processDependencies(scriptName) {
        const scriptPath = Files.joinPaths(this.#scriptsDirectory, scriptName + JS_EXTENSION);
        let scriptBody = Files.readScriptableFile(scriptPath);
        scriptBody = this.#extractMetadataAndGet(scriptName, scriptBody);

        const scriptDependencies = this.#getScriptDependencies(scriptBody);
        scriptBody = this.#removeDependenciesAndGet(scriptBody);

        for (const dependencyName of scriptDependencies) {

            // Don't process if it was already processed
            // in previous scripts.
            if (this.#dependencyScripts.has(dependencyName)) {
                continue;
            }
            
            this.#processDependencies(dependencyName);
        }
        
        this.#dependencyScripts.set(scriptName, scriptBody);
    }

    /**
     * Used to get list of dependency scripts
     * by analyzing provided content.
     *
     * @param {String} scriptBody script content
     * @return {List<String>} list of dependency scripts
     * @memberof Bundler
     */
    #getScriptDependencies(scriptBody) {

        const dependencyMatches = [...scriptBody.matchAll(Bundler.#DEPENDENCY_REGEXP)];
        return dependencyMatches.map(match => match[1]);
    }
    
    /**
     * Used to update provided script by
     * removing all dependency and module exports
     * blocks.
     *
     * @param {String} scriptBody script content
     * @return {String} updated script content
     * @memberof Bundler
     */
    #removeDependenciesAndGet(scriptBody) {

        const dependencyMatches = [...scriptBody.matchAll(Bundler.#DEPENDENCY_REGEXP)];

        for (const match of dependencyMatches) {

            const importModuleBlock = match[0];
            scriptBody = scriptBody.replaceAll(importModuleBlock, EMPTY_STRING);
        }

        const exportMatches = [...scriptBody.matchAll(Bundler.#MODULE_EXPORTS_REGEXP)];

        for (const match of exportMatches) {

            const exportBlock = match[0];
            scriptBody = scriptBody.replaceAll(exportBlock, EMPTY_STRING);
        }

        return scriptBody;
    }

    /**
     * Used to remove Scriptable metadata from
     * provided script.
     * 
     * Removed metadata is being stored for later use.
     *
     * @param {String} scriptName script name
     * @param {String} scriptBody script content
     * @return {String} updated script content without metadata
     * @memberof Bundler
     */
    #extractMetadataAndGet(scriptName, scriptBody) {
        const scriptBodyLines = scriptBody.split('\n');
        const metadataLines = scriptBodyLines.splice(0, 3);

        // Store metadata to later use it when building
        // back composed script.
        this.#scriptMetadata.set(scriptName, metadataLines.join('\n'));
        return scriptBodyLines.join('\n');
    }
}


async function bundleScript(scriptName, scriptDirectory) {
    const bundler = new Bundler(scriptName, scriptDirectory);
    return bundler.bundle();
}


module.exports = {
    bundleScript
};

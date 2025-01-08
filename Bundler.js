// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-archive;

const { FileUtil } = importModule("File Util");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");


const JS_EXTENSION = ".js";
const EMPTY_STRING = "";

/**
 * ENTRY POINT
 */
async function main() {

    const scriptName = await ScriptSelector.selectScript();

    if (scriptName) {
        const bundler = new Bundler(scriptName);
        await bundler.bundle();
    }
}


/**
 * Used to select script that
 * should be bundled.
 *
 * @class ScriptSelector
 */
class ScriptSelector {

    /**
     * Used to select script that
     * should be bundled.
     * 
     * @static
     * @return {String} script name
     * @memberof ScriptSelector
     */
    static async selectScript() {

        const scriptList = FileUtil.findScripts()
            .map((script) => script.replace(JS_EXTENSION, EMPTY_STRING))
            .sort();

        const result = await modal()
            .title(tr("bundler_scriptSelectionModalTitle"))
            .actions(scriptList)
            .present();
        
        if (result.isCancelled()) {
            return null;
        }
        
        return result.choice();
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
    #scriptMetadata = new Map();
    #dependencyScripts = new Map();

    /**
     * Creates an instance of Bundler.
     * @param {String} scriptName script that should be bundled
     * @memberof Bundler
     */
    constructor(scriptName) {
        this.#scriptName = scriptName;
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
        for (let dependencyBody of this.#dependencyScripts.values()) {
            scriptBody += dependencyBody;
        }

        // Add main script.
        scriptBody += mainScriptBody;

        const targetFileName = tr("bundler_bundledScriptName", this.#scriptName);
        await FileUtil.updateScript(targetFileName + JS_EXTENSION, scriptBody)
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

        let scriptBody = FileUtil.readScript(scriptName + JS_EXTENSION);
        scriptBody = this.#extractMetadataAndGet(scriptName, scriptBody);

        const scriptDependencies = this.#getScriptDependencies(scriptBody);
        scriptBody = this.#removeDependenciesAndGet(scriptBody);
        this.#dependencyScripts.set(scriptName, scriptBody);

        for (let dependencyName of scriptDependencies) {

            // Don't process if it was already processed
            // in previous scripts.
            if (this.#dependencyScripts.has(dependencyName)) {
                continue;
            }

            this.#processDependencies(dependencyName);
        }
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

        for (let match of dependencyMatches) {

            let importModuleBlock = match[0];
            scriptBody = scriptBody.replaceAll(importModuleBlock, EMPTY_STRING);
        }

        const exportMatches = [...scriptBody.matchAll(Bundler.#MODULE_EXPORTS_REGEXP)];

        for (let match of exportMatches) {

            let exportBlock = match[0];
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
        let scriptBodyLines = scriptBody.split('\n')
        let metadataLines = scriptBodyLines.splice(0, 3)

        // Store metadata to later use it when building
        // back composed script.
        this.#scriptMetadata.set(scriptName, metadataLines.join('\n'));
        return scriptBodyLines.join('\n');
    }
}


await main();
Script.complete();

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-archive;

const { FileUtil } = importModule("File Util");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");


const conf = {
    jsExtension: ".js",
    emptyString: ""
}


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
            .map((script) => script.replace(conf.jsExtension, conf.emptyString))
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

    static __DEPENDENCY_REGEXP = new RegExp(/const\s*\{[^}]+\}\s*=\s*importModule\(["']([^"']+)["']\);?/g);
    static __MODULE_EXPORTS_REGEXP = new RegExp(/module\.exports\s*=\s*{[^}]+};?/g);

    /**
     * Creates an instance of Bundler.
     * @param {String} scriptName script that should be bundled
     * @memberof Bundler
     */
    constructor(scriptName) {
        this.__scriptName = scriptName;
        this.__scriptMetadata = new Map();
        this.__dependencyScripts = new Map();
    }

    
    /**
     * Composes script and all of its 
     * dependencies into single file and then
     * store it in Scriptable root directory.
     *
     * @memberof Bundler
     */
    async bundle() {

        this.__processDependencies(this.__scriptName);
        
        let scriptBody = "";
        const mainScriptMetadata = this.__scriptMetadata.get(this.__scriptName);
        const mainScriptBody = this.__dependencyScripts.get(this.__scriptName);

        // Delete main script from dependencies.
        this.__dependencyScripts.delete(this.__scriptName);

        // Add back removed metadata.
        scriptBody += mainScriptMetadata;

        // Add all dependencies.
        for (let dependencyBody of this.__dependencyScripts.values()) {
            scriptBody += dependencyBody;
        }

        // Add main script.
        scriptBody += mainScriptBody;

        const targetFileName = tr("bundler_bundledScriptName", this.__scriptName);
        await FileUtil.updateScript(targetFileName + conf.jsExtension, scriptBody)
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
    __processDependencies(scriptName) {

        let scriptBody = FileUtil.readScript(scriptName + conf.jsExtension);
        scriptBody = this.__extractMetadataAndGet(scriptName, scriptBody);

        const scriptDependencies = this.__getScriptDependencies(scriptBody);
        scriptBody = this.__removeDependenciesAndGet(scriptBody);
        console.log(scriptName)
        this.__dependencyScripts.set(scriptName, scriptBody);

        for (let dependencyName of scriptDependencies) {

            // Don't process if it was already processed
            // in previous scripts.
            if (this.__dependencyScripts.has(dependencyName)) {
                continue;
            }

            this.__processDependencies(dependencyName);
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
    __getScriptDependencies(scriptBody) {

        const dependencyMatches = [...scriptBody.matchAll(Bundler.__DEPENDENCY_REGEXP)];
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
    __removeDependenciesAndGet(scriptBody) {

        const dependencyMatches = [...scriptBody.matchAll(Bundler.__DEPENDENCY_REGEXP)];

        for (let match of dependencyMatches) {

            let importModuleBlock = match[0];
            scriptBody = scriptBody.replaceAll(importModuleBlock, conf.emptyString);
        }

        const exportMatches = [...scriptBody.matchAll(Bundler.__MODULE_EXPORTS_REGEXP)];

        for (let match of exportMatches) {

            let exportBlock = match[0];
            scriptBody = scriptBody.replaceAll(exportBlock, conf.emptyString);
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
    __extractMetadataAndGet(scriptName, scriptBody) {
        let scriptBodyLines = scriptBody.split('\n')
        let metadataLines = scriptBodyLines.splice(0, 3)

        // Store metadata to later use it when building
        // back composed script.
        this.__scriptMetadata.set(scriptName, metadataLines.join('\n'));
        return scriptBodyLines.join('\n');
    }
}

await main();
Script.complete();

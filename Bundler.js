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


class ScriptSelector {

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


class Bundler {

    static __DEPENDENCY_REGEXP = new RegExp(/const\s*\{[^}]+\}\s*=\s*importModule\(["']([^"']+)["']\);?/g);
    static __MODULE_EXPORTS_REGEXP = new RegExp(/module\.exports\s*=\s*{[^}]+};?/g);

    constructor(scriptName) {
        this.__scriptName = scriptName;
        this.__scriptMetadata = new Map();
        this.__dependencyScripts = new Map();
    }

    async bundle() {

        this.__processDependencies(this.__scriptName);
        
        let scriptBody = "";
        const mainScriptMetadata = this.__scriptMetadata.get(this.__scriptName);
        const mainScriptBody = this.__dependencyScripts.get(this.__scriptName);

        // Delete main script from dependencies
        this.__dependencyScripts.delete(this.__scriptName);

        // Add metadata
        scriptBody += mainScriptMetadata;

        // Add all dependencies
        for (let dependencyBody of this.__dependencyScripts.values()) {
            scriptBody += dependencyBody;
        }

        // Add main script
        scriptBody += mainScriptBody;

        const targetFileName = tr("bundler_bundledScriptName", this.__scriptName);
        await FileUtil.updateScript(targetFileName + conf.jsExtension, scriptBody)
    }

    __processDependencies(scriptName) {

        let scriptBody = FileUtil.readScript(scriptName + conf.jsExtension);
        scriptBody = this.__extractMetadataAndGet(scriptName, scriptBody);

        const scriptDependencies = this.__getScriptDependencies(scriptBody);
        scriptBody = this.__removeDependenciesAndGet(scriptBody);
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

    __getScriptDependencies(scriptBody) {

        const dependencyMatches = [...scriptBody.matchAll(Bundler.__DEPENDENCY_REGEXP)];
        return dependencyMatches.map(match => match[1]);
    }

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

    __extractMetadataAndGet(scriptName, scriptBody) {
        let scriptBodyLines = scriptBody.split('\n')
        let metadataLines = scriptBodyLines.splice(0, 3)

        this.__scriptMetadata.set(scriptName, metadataLines.join('\n'));
        return scriptBodyLines.join('\n');
    }
}


const scriptName = await ScriptSelector.selectScript();

if (scriptName) {
    const bundler = new Bundler(scriptName);
    await bundler.bundle();
}

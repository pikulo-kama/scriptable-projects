// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-archive;

const { Files } = importModule("Files");
const { tr } = importModule("Localization");
const { modal } = importModule("Modal");
const { bundleScript } = importModule("Bundler");


const JS_EXTENSION = ".js";
const EMPTY_STRING = "";


/**
 * ENTRY POINT
 */
async function main() {

    const scriptList = Files.findScripts()
        .map((script) => script.replace(JS_EXTENSION, EMPTY_STRING))
        .sort();

    const result = await modal()
        .title(tr("bundlerUI_scriptSelectionModalTitle"))
        .actions(scriptList)
        .present();
    
    if (!result.isCancelled()) {
        await bundleScript(result.choice(), Files.getScriptableDirectory());
    }
}


await main();
Script.complete();

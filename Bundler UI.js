// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-archive;

const { JS_EXTENSION, EMPTY_STRING } = importModule("Constants");
const { Files } = importModule("Files");
const { tr } = importModule("Localization");
const { modal } = importModule("Modal");
const { bundleScript } = importModule("Bundler");


/**
 * Main entry point for the Bundler UI.
 * This function:
 * 1. Scans the Scriptable directory for existing scripts.
 * 2. Filters and sorts the names for display.
 * 3. Presents a modal for the user to select a script.
 * 4. Triggers the bundling process for the selected script.
 * @async
 * @function main
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

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-archive;
const alertUtil = importModule("Alert Util")
const locale = importModule("Locale")

await locale.registerLabels({
    "select_script_to_bundle": "Select Script to Bundle",
    "bundle_prefix": " (Bundled)"
})

const NOT_BUNDLEABLE_TAG = "Not Bundleable"
const IMPORT_SCRIPTS_REGEXP = /\s*(?:const|var|let)\s+\w+\s+=\s+importModule\((?:"|')(?<name>.+)(?:"|')\)/g
const IMPORT_REGEXP = (importName) => new RegExp("importModule\\((\"|\')" + importName + "(\"|\')\\)", "g")


const fm = FileManager.iCloud()

if (config.runsInApp) {
    
    let userInput = await selectScript()
    let scriptName = userInput.selectedScript
    
    if (userInput.selectedScript == undefined) return
    
    let bundledScript = bundleScript(userInput.selectedScript)
    saveScript(userInput.selectedScript, bundledScript.scriptContent)
}

async function selectScript() {
    
    let inputData = {}
    
    let scriptList = fm.listContents(fm.documentsDirectory())
        .filter(script => script.endsWith(".js") && isBundleable(script))
        .map(script => script.replace(".js", ""))
        .sort()
        
    let result = await alertUtil.createCancelableAlert({
        title: locale.getLabel("select_script_to_bundle"),
        actions: scriptList
    })
    
    if (!result.isCancelled) {
        inputData.selectedScript = result.choice
    }
    
    return inputData
}

function bundleScript(script, parentScript, dataIn) {
    
    let scriptData = {
        scriptContent: "",
        moduleName: getModuleName(script, parentScript)
    }
    
    if (dataIn != undefined) {
        scriptData.scriptContent = dataIn.scriptContent
    }
    
    let content = readScript(script)
    let importMatches = [...content.matchAll(IMPORT_SCRIPTS_REGEXP)]
    
    for (let importMatch of importMatches) {
        
        let importScript = importMatch[1]
        let importRegex = IMPORT_REGEXP(importScript)
        
        scriptData = bundleScript(importScript, script, scriptData)
        content = content.replace(importRegex, scriptData.moduleName)
    }
    
    // extract Scriptable metadata.
    // it should be stored so when root
    // script would be processed it will 
    // add metadata on the beginning of file.
    let metadata = removeMetadata(content)
    
    content = metadata.content
    scriptData.moduleName = getModuleName(script, parentScript)
    
    // If this is import script
    // then replace following areas
    if (parentScript != undefined) {
        content = content
                    .replace(/root\./g, scriptData.moduleName + ".")
                    .replace(/const root/g, "const " + scriptData.moduleName)
                    .replace(/module\.exports\..+/g, "")
    } else {
        // Add metadata on the beginning
        // if this is root script
        scriptData.scriptContent = metadata.metadata + scriptData.scriptContent
    }
    
    // Add current script content to overall
    scriptData.scriptContent += content
    return scriptData
}

function removeMetadata(content) {
    let lines = content.split('\n')
    let metadata = lines.splice(0, 3)
    
    return {
        metadata: metadata,
        content: lines.join('\n')
    }
}

function getModuleName(script, caller) {
    
    if (caller == undefined) {
        return undefined
    }
    
    caller = caller.trim().replace(/\s+/g, "")
    script = script.trim().replace(/\s+/g, "")
    
    return  caller + "_" + script + "_" + Math.floor(Math.random() * 10_000)
}

function readScript(scriptName) {
    return fm.readString(
        fm.joinPath(
            fm.documentsDirectory(),
            scriptName + ".js"
        )
    )
}

function saveScript(scriptName, content) {
    
    let newFileName = scriptName + locale.getLabel("select_script_to_bundle") + ".js"
    let newFilePath = fm.joinPath(
        fm.documentsDirectory(),
        newFileName
    )
    
    fm.write(newFilePath, Data.fromString(content))
    fm.addTag(newFilePath, NOT_BUNDLEABLE_TAG)
}

function isBundleable(script) {
    let filePath = fm.joinPath(fm.documentsDirectory(), script)
    let allTags = fm.allTags(filePath)
    
    return !allTags.includes(NOT_BUNDLEABLE_TAG)
}

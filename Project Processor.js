// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: pencil-ruler;

const alertUtil = importModule("Alert Util");
const fileUtil = importModule("File Util");

const fm = FileManager.iCloud()


/**
 * Used to select project that should be processed
 * into single file.
 */
class ProjectSelector {

    static __HIDDEN_DIRECTORY_INDICATOR = ".";
    static __NON_PROJECT_DIRS = [
        "Resources",
    ];

    /**
     * Returns name of the project that was selected by user.
     * 
     * @returns {String} project name
     */
    async selectProject() {

        const nonProjectDirs = ProjectSelector.__NON_PROJECT_DIRS;

        const projectList = fm.listContents(fm.documentsDirectory())
            .filter(file =>  
                !file.startsWith(ProjectSelector.__HIDDEN_DIRECTORY_INDICATOR) &&
                fm.isDirectory(fm.joinPath(fm.documentsDirectory(), file)) &&
                !nonProjectDirs.includes(file)
            );
        
        const result = await alertUtil.createCancelableAlert({
            title: "Select Project",
            actions: projectList
        });
        
        return result.isCancelled ? null : result.choice;
    }
}

/**
 * Used to process 'main.js' file
 * of the project and replace all imports
 * in it with actual files.
 */
class ProjectProcessor {

    static __REGEXP_INCLUDE = /\/\/\#include\s+\"(.*)\"/g;
    static __JS_EXTENSION = ".js";
    static __MAIN_FILE_NAME = "main";
    static __INCLUDE_SEPARATOR = "/";

    /**
     * Composes project into single file and writes
     * it into main Scriptable directory.
     * 
     * @param {String} project project name
     */
    processAndSave(project) {

        this._project = project;

        const mainScriptFileName = ProjectProcessor.__MAIN_FILE_NAME + ProjectProcessor.__JS_EXTENSION;
        const mainFileContent = this.__getProjectFile(mainScriptFileName);
        const processedScript = this.__replaceFileImports(mainFileContent);

        this.__writeScript(processedScript);
    }

    /**
     * Used to replace all imports in
     * script file.
     * 
     * @param {String} fileContent file content where imports should be replaced
     * @returns {String} formatted content of initially provided script
     */
    __replaceFileImports(fileContent) {
        
        let matches = [...fileContent.matchAll(ProjectProcessor.__REGEXP_INCLUDE)];
        
        for (let importMatch of matches) {
            
            let importLine = importMatch[0];
            let importLocation = importMatch[1];

            let locationParts = importLocation.split(ProjectProcessor.__INCLUDE_SEPARATOR);
            let projectName = locationParts[0];
            let fileName = locationParts[1];

            let importFileContent = this.__getProjectFile(fileName, projectName);

            fileContent = fileContent.replace(importLine, importFileContent);
        }

        return fileContent;
    }

    /**
     * Loads file content of the script
     * from selected project.
     * 
     * If no project provided then current
     * would be used.
     * 
     * @param {String} fileName name of script that should be loaded
     * @param {String} project project to which script relates
     * @throws {Error} when script doesn't exist
     * @returns {String} content of script
     */
    __getProjectFile(fileName, project) {

        if (!project) {
            project = this._project;
        }

        const projectFileLocation = fileUtil.joinPaths([
            fm.documentsDirectory(),
            project,
            fileName
        ]);

        if (!fm.fileExists(projectFileLocation)) {
            throw new Error(`Project file '${fileName}' doesn't exist in ${project}.`);
        }

        return fm.readString(projectFileLocation);
    }

    /**
     * Writes provided script content
     * into file inside main Scriptable directory.
     * 
     * Project name is being used as final script name.
     * 
     * @param {String} scriptContent script that should be written to disk
     */
    __writeScript(scriptContent) {

        const filePath = fm.joinPath(
            fm.documentsDirectory(),
            this._project + ProjectProcessor.__JS_EXTENSION
        );
        
        fm.write(filePath, Data.fromString(scriptContent));
    }
}


if (!config.runsInApp) {
    return;
}

let selector = new ProjectSelector();
let processor = new ProjectProcessor();

let project = await selector.selectProject();

if (project) {
    processor.processAndSave(project);
}

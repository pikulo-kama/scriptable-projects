// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: download;

const { Files } = importModule("Files");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");
const { metadata, cacheRequest } = importModule("Cache");
const { JS_EXTENSION, EMPTY_STRING } = importModule("Constants");
const { bundleScript } = importModule("Bundler");


/**
 * Main entry point for the Script Installer.
 * Orchestrates repository downloading, user selection via modal, and script installation.
 */
async function main() {
    const installer = new ScriptInstaller();
    await installer.downloadRepository();

    // Make sure script installer is up-to-date.
    await installer.installScript("Script Installer");

    const result = await modal()
        .title(tr("installer_scriptSelectionModalTitle"))
        .actions(installer.getScriptList())
        .present();

    if (!result.isCancelled()) {
        const fileInfo = await installer.installScript(result.choice());
        const targetScriptPath = Files.joinPaths(Files.getScriptableDirectory(), fileInfo.name());

        // Move script requested by user to scriptable root directory.
        Files.forceMove(fileInfo.path(), targetScriptPath);
    }

    installer.cleanupResources();
}

/**
 * Handles the downloading and installation of scripts from a remote GitHub repository.
 * Manages caching, file system operations, and asset synchronization.
 */
class ScriptInstaller {

    /**
     * The GitHub API endpoint for the repository tree.
     * @type {string}
     * @private
     */
    #REPO_URL = "https://api.github.com/repos/pikulo-kama/scriptable-projects/git/trees/main?recursive=1"

    /**
     * Downloads the entire repository structure to a local temporary directory.
     * Utilizes caching to respect GitHub API rate limits.
     * @async
     */
    async downloadRepository() {

        const fm = Files.manager();

        // Due to GitHub API limitations we are caching responses for 24 hours
        // before fetching new data.
        const treeRequest = cacheRequest(this.#treeRequestMetadata(), 24);
        const fileRequest = cacheRequest(this.#fileRequestMetadata(), 24);

        const treeData = await treeRequest.get(this.#REPO_URL);

        if (!fm.isDirectory(this.#repositoryDirectory())) {
            fm.createDirectory(this.#repositoryDirectory());
        }

        for (const item of treeData.tree) {
            const itemPath = Files.joinPaths(this.#repositoryDirectory(), item.path);

            if (item.type === "tree") {
                fm.createDirectory(itemPath, true);

            } else if (item.type === "blob") {
                const fileInfo = await fileRequest.get(item.url);
                const content = fileInfo.content.replace(/\s/g, "");
                const fileData = Data.fromBase64String(content);

                fm.write(itemPath, fileData);
            }
        }
    }

    /**
     * Bundles a specific script and moves it to the Scriptable documents folder.
     * @async
     * @param {string} scriptName - The name of the script to install.
     */
    async installScript(scriptName) {
        const bundledFileInfo = await bundleScript(scriptName, this.#repositoryDirectory());
        this.#installScriptResources(scriptName, bundledFileInfo.dependencies());

        return bundledFileInfo;
    }

    /**
     * Synchronizes associated resources (Features, i18n, Resources) for a given script.
     * @async
     * @param {string} scriptName - The name of the script whose resources are being installed.
     * @param {Iterable<string>} dependencies - List of dependency script names.
     */
    async #installScriptResources(scriptName, dependencies) {

        const scripts = Array.of(scriptName);
        scripts.push(...dependencies);

        const directoriesToSync = [
            Files.FeaturesDirectory,
            Files.ResourcesDirectory,
            Files.LocalesDirectory
        ];
        
        // Move script data if available.
        for (const directory of directoriesToSync) {
            for (const script of scripts) {
                this.#syncDirectory(directory, script);
            }
        }
    }

    /**
     * Synchronizes a specific directory for a script by moving files from 
     * the downloaded repository to the local Scriptable environment.
     * * It mirrors the source structure, creates target directories if they 
     * are missing, and uses a force move to overwrite existing files.
     *
     * @private
     * @param {string} directory - The base category directory (e.g., 'i18n' or 'Resources').
     * @param {string} scriptName - The name of the script directory to sync.
     * @memberof ScriptInstaller
     */
    #syncDirectory(directory, scriptName) {
        const fm = Files.manager();
        const sourceDirectoryPath = Files.joinPaths(this.#repositoryDirectory(), directory, scriptName);
        const targetDirectoryPath = Files.joinPaths(Files.getScriptableDirectory(), directory, scriptName);

        // Script doesn't have files in repository directory.
        if (!fm.isDirectory(sourceDirectoryPath)) {
            return;
        }

        for (const directoryFile of fm.listContents(sourceDirectoryPath)) {
            const sourceFilePath = Files.joinPaths(sourceDirectoryPath, directoryFile);
            const targetFilePath = Files.joinPaths(targetDirectoryPath, directoryFile);

            if (!fm.isDirectory(targetDirectoryPath)) {
                fm.createDirectory(targetDirectoryPath, true);
            }

            Files.forceMove(sourceFilePath, targetFilePath);
        }
    }

    /**
     * Retrieves a list of available scripts from the downloaded repository.
     * @returns {string[]} Sorted list of script names without extensions.
     */
    getScriptList() {
        return Files.findScripts(this.#repositoryDirectory())
            .map((script) => script.replace(JS_EXTENSION, EMPTY_STRING))
            .sort();
    }

    /**
     * Removes the temporary repository directory after installation.
     */
    cleanupResources() {
        const fm = Files.manager();
        fm.remove(this.#repositoryDirectory());
    }

    /**
     * Resolves the path to the temporary repository storage.
     * @returns {string} Path to the Repository directory.
     */
    #repositoryDirectory() {
        return Files.resolveLocalResource("Repository");
    }

    /**
     * Internal metadata schema for repository tree requests.
     * @private
     */
    #treeRequestMetadata() {
        return metadata()
            .list().property("tree")
                .data().property("path").add()
                .data().property("type").add()
                .data().property("url").add()
            .add()
        .create();
    }

    /**
     * Internal metadata schema for file content requests.
     * @private
     */
    #fileRequestMetadata() {
        return metadata()
            .data().property("content").add()
        .create();
    }
}


await main();
Script.complete();

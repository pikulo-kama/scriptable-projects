// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: download;

const { Files } = importModule("Files");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");
const { metadata, cacheRequest } = importModule("Cache");
const { JS_EXTENSION, EMPTY_STRING } = importModule("Constants");
const { bundleScript } = importModule("Bundler");


async function main() {
	const installer = new ScriptInstaller();
	await installer.downloadRepository();

	// Make sure script installer is up-to-date.
	installer.installScriptResources("Script Installer");

	const result = await modal()
		.title(tr("installer_scriptSelectionModalTitle"))
		.actions(installer.getScriptList())
		.present();

	if (!result.isCancelled()) {
		await installer.installScript(result.choice());
		await installer.installScriptResources(result.choice());
	}

	installer.cleanup();
}


class ScriptInstaller {
  
  #REPO_URL = "https://api.github.com/repos/pikulo-kama/scriptable-projects/git/trees/main?recursive=1"

  async downloadRepository() {
    
    const fm = Files.manager();
    
    // Due to GitHub API limitations we are caching responses for 24 hours
    // before fetching new data.
    const treeRequest = cacheRequest(this.#treeRequestMetadata(), 24);
    const fileRequest = cacheRequest(this.#fileRequestMetadata(), 24);

    const treeData = await treeRequest.get(this.#REPO_URL);
    
    for (const item of treeData.tree) {
      const itemPath = Files.joinPaths(this.repositoryDirectory(), item.path);
      
      if (!fm.isDirectory(this.repositoryDirectory())) {
        fm.createDirectory(this.repositoryDirectory());
      }
      
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

  async installScript(scriptName) {
		const fm = Files.manager();
		const repositoryDirectory = this.repositoryDirectory();

		// Bundle script and move it to scriptable folder.
		const bundledFileInfo = await bundleScript(scriptName, repositoryDirectory);
		const targetScriptPath = Files.joinPaths(Files.getScriptableDirectory(), bundledFileInfo.name());
		
		if (fm.fileExists(targetScriptPath)) {
			fm.remove(targetScriptPath);
		}
		
		fm.move(bundledFileInfo.path(), targetScriptPath);
	}

  async installScriptResources(scriptName) {

		const fm = Files.manager();
		const repositoryDirectory = this.repositoryDirectory();
		const directoriesToSync = [
			Files.FeaturesDirectory,
			Files.ResourcesDirectory,
			Files.LocalesDirectory
		];

		// Move script data if available.
		for (const directory of directoriesToSync) {

			const sourceDirectoryPath = Files.joinPaths(repositoryDirectory, directory, scriptName);
			const targetDirectoryPath = Files.joinPaths(Files.getScriptableDirectory(), directory, scriptName);

			// Script doesn't have related files in directory.
			if (!fm.isDirectory(sourceDirectoryPath)) {
				continue;
			}

			for (const directoryFile of fm.listContents(sourceDirectoryPath)) {
				const sourceFilePath = Files.joinPaths(sourceDirectoryPath, directoryFile);
				const targetFilePath = Files.joinPaths(targetDirectoryPath, directoryFile);

				if (!fm.isDirectory(targetDirectoryPath)) {
					fm.createDirectory(targetDirectoryPath, true);
				}

				fm.move(sourceFilePath, targetFilePath);
			}
		}
  }

  getScriptList() {
    return Files.findScripts(this.repositoryDirectory())
        .map((script) => script.replace(JS_EXTENSION, EMPTY_STRING))
        .sort();
  }

  cleanup() {
	const fm = Files.manager();
	fm.remove(this.repositoryDirectory());
  }

  repositoryDirectory() {
	return Files.resolveLocalResource("Repository");
  }

  #treeRequestMetadata() {
    return metadata()
      	.list()
			.property("tree")
			.data()
				.property("path")
				.add()
			.data()
				.property("type")
				.add()
			.data()
				.property("url")
				.add()
		.add()
    .create();
  }

  #fileRequestMetadata() {
    return metadata()
		.data()
			.property("content")
			.add()
		.create();
  }
}


await main();
Script.complete()

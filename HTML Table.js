// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;

const { Files } = importModule("Files");


class HTMLTable {

    static #INDEX_HTML = Files.resolveResource("HTML Table", "index.html");

    #webView = new WebView();
    #tableData = [];

    #onDataModificaitonFunction = () => {};

    setTableData(tableData) {
        this.#tableData = tableData;
    }

    onDataModification(onDataModification) {
        this.#onDataModificaitonFunction = onDataModification;
    }

    async present() {
        
        await this.#webView.loadFile(HTMLTable.#INDEX_HTML);
        await this.#sendData();
        
        this.#watch();
        await this.#webView.present();
    }

    #watch() {
        this.#webView.evaluateJavaScript('console.log("Starting watcher");', true)
            .then((response) => {

                console.log("Received data");
                this.#onDataModificaitonFunction(response);

                this.#watch();
            });
    }

    async #sendData() {
        await this.#webView.evaluateJavaScript(
            `window.onScriptableMessage('${JSON.stringify(this.#tableData)}');`
        );
    }
}


module.exports = {
    HTMLTable
};

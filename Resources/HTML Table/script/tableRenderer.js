

class TableRenderer {

    #tableElement = document.getElementById("content-table");
    
    render() {

        const records = [];

        const data = window.tableData;
        const metadata = window.tableMetadata;

        for (const record of data) {

            const cells = [];

            for (const cellMetadata of metadata) {

                const cellRenderer = CellRendererFactory.getRenderer(cellMetadata);
                const cellHTML = cellRenderer.getCell(record);

                cells.push(cellHTML);
            }

            cells.push(Td(`<button>Click</button>`));

            const recordHTML = Tr(cells.join(""));
            records.push(recordHTML);
        }

        this.#tableElement.innerHTML = records.join("");
    }
}



class CellType {

    static Text = "text";
    static Checkbox = "checkbox";
    static DatePicker = "datepicker";
}

class ITableCellRenderer {

    #cellMetadata;

    constructor(cellMetadata) {
        this.#cellMetadata = cellMetadata;
    }

    getCell(record) {
        throw new Error("Should be overridden.");
    };

    getMetadata() {
        return this.#cellMetadata;
    }

    getValue(record) {
        return record[this.#cellMetadata.name];
    }
}

class TextCellRenderer extends ITableCellRenderer {

    getCell(record) {
        return Td(
            super.getValue(record)
        );
    }
}

class CellRendererFactory {

    static getRenderer(cellMetadata) {

        switch (cellMetadata.type) {

            case CellType.Text:
                return new TextCellRenderer(cellMetadata);
        }
    }
}

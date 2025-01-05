// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: database;

const { FileUtil } = importModule("File Util");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");

class DataField {

    constructor(name, defaultValue = null) {
        this.__fieldName = name;
        this.__defaultValue = defaultValue;
    }

    getName() {
        return this.__fieldName;
    }

    getDefault() {
        return this.__defaultValue;
    }
}

class TextDataField extends DataField {
}

class BoolDataField extends DataField {
}

class NumberDataField extends DataField {
}

class UIField {

    constructor(fieldLabelFunction, weight) {
        this.__fieldLabelFunction = fieldLabelFunction;
        this.__weight = weight;
        this.__color = null;

        if (typeof fieldLabelFunction === 'string') {
            this.__fieldLabelFunction = () => fieldLabelFunction;
        }
    }
    
    setColor(color) {
        this.__color = color;
    }
}

class UIFormReadOnly extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight);
    }
}

class UIDatePicker extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight, color);
        this.__hourField = null;
        this.__minuteField = null;
    }

    setHourField(dataField) {
        this.__hourField = dataField;
    }

    setMinuteField(dataField) {
        this.__minuteField = dataField;
    }
}

class UIDeleteRowField extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight);
        this.__message = tr("crudModule_deleteFieldMessage");
        this.__confirmAction = tr("crudModule_deleteFieldConfirmAction");
    }

    setMessage(message) {
        this.__message = message;
    }

    setConfirmAction(action) {
        this.__confirmAction = action;
    }
}

class UIForm extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight);
        this.__formTitleFunction = () => "";
        this.__fields = [];
        this.__actions = [];
        this.__defaultAction = null;
    }

    setFormTitleFunction(formTitleFunction) {
        this.__formTitleFunction = formTitleFunction;
    }

    addFormField(formField) {
        this.__fields.push(formField);
    }

    addDefaultAction(actionLabel) {

        if (this.__defaultAction) {
            return;
        }

        const defaultAction = new UIDefaultFormAction(actionLabel);
        this.__defaultAction = this.addFormAction(defaultAction);

        return this.__defaultAction;
    }

    addFormAction(action) {
        
        let actionId = this.__actions.length;
        action.setId(actionId);

        this.__actions.push(action);
        return action;
    }
}

class UIFormField {

    constructor(dataField, label) {
        this.__dataField = dataField;
        this.__label = label;
        this.__rules = [];
    }

    addRule(rule) {
        this.__rules.push(rule);
    }
}

class UIFormAction {

    constructor(label) {
        this.__id = null;
        this.__label = label;
        this.__actionCallbacks = [];
    }

    setId(id) {
        this.__id = id;
    }

    addCallback(dataField, callback) {
        this.__actionCallbacks.push({
            dataField,
            callback
        });
    }
}

class UIDefaultFormAction extends UIFormAction {

    constructor(label) {
        super(label);
    }
}

class UIFilterField {

    constructor(dataField, label) {
        this.__dataField = dataField;
        this.__label = label;
    }
}

class UIFieldMetadata {

    constructor(tableRow, tableRecord, uiField) {
        this.tableRow = tableRow;
        this.tableRecord = tableRecord;
        this.uiField = uiField;
    }
}

class UIFieldHandler {

    async handle(uiTable, metadata) {}
}

class UIFormHandler extends UIFieldHandler {

    async handle(uiTable, metadata) {

        this.__tableRecord = metadata.tableRecord;
        this.__uiField = metadata.uiField;
        this.__uiTable = uiTable;

        const result = await this.__presentForm();

        if (result.isCancelled()) {
            return;
        }

        const selectedAction = this.__uiField.__actions.find(action => 
            action.__label === result.choice()
        );
        
        // Handle default action
        if (selectedAction instanceof UIDefaultFormAction) {
            this.__processFieldChanges(result);

        // Handle custom actions
        } else {
            this.__processCustomAction(selectedAction);
        }
        
        this.__uiTable.__upsertTableRecord(this.__tableRecord);
    }

    async __presentForm() {

        const formTitle = this.__uiField.__formTitleFunction(this.__tableRecord);

        const modalBuilder = modal()
            .title(formTitle)
            .actions(this.__uiField.__actions.map(action => action.__label));
        
        this.__uiField.__fields.forEach(field => {

            const fieldName = field.__dataField.__fieldName;
            modalBuilder.field()
                .name(fieldName)
                .label(field.__label)
                .initial(this.__tableRecord[fieldName])
                .validations(field.__rules)
                .add();
        });
        
        return await modalBuilder.present();
    }

    async __processFieldChanges(result) {

        for (let formField of this.__uiField.__fields) {

            let dataField = formField.__dataField;
            let originalValue = this.__tableRecord[dataField.__fieldName];
            let updatedValue = result.get(dataField.__fieldName);

            this.__uiTable.__onChangeFunction(this.__tableRecord, dataField, updatedValue, originalValue);
            this.__tableRecord[dataField.__fieldName] = updatedValue;
        }
    }

    async __processCustomAction(action) {

        for (let actionCallback of action.__actionCallbacks) {

            let {
                dataField,
                callback
            } = actionCallback;

            let originalValue = this.__tableRecord[dataField.__fieldName];
            let updatedValue = callback(this.__tableRecord, action);

            this.__uiTable.__onChangeFunction(this.__tableRecord, dataField, updatedValue, originalValue);
            this.__tableRecord[dataField.__fieldName] = updatedValue;
        }
    }
}

class UIDatePickerHandler extends UIFieldHandler {

    async handle(uiTable, metadata) {

        this.__tableRecord = metadata.tableRecord;
        this.__uiField = metadata.uiField;
        this.__uiTable = uiTable;

        const hourField = this.__uiField.__hourField;
        const minuteField = this.__uiField.__minuteField;

        const originalHours = this.__tableRecord[hourField.__fieldName];
        const originalMinutes = this.__tableRecord[minuteField.__fieldName];

        const resultSeconds = await this.__presentDatePicker(originalHours, originalMinutes);
  
        const updatedHours = Math.floor(resultSeconds / 3600);
        const updatedMinutes = resultSeconds / 60 - (updatedHours * 60);
        
        if (originalHours !== updatedHours) {
            this.__uiTable.__onChangeFunction(
                this.__tableRecord, 
                hourField, 
                updatedHours, 
                originalHours
            );
        }

        if (originalMinutes !== updatedMinutes) {
            this.__uiTable.__onChangeFunction(
                this.__tableRecord, 
                minuteField, 
                updatedMinutes, 
                originalMinutes
            );
        }

        this.__tableRecord[hourField.__fieldName] = updatedHours;
        this.__tableRecord[minuteField.__fieldName] = updatedMinutes;
        
        this.__uiTable.__upsertTableRecord(this.__tableRecord);
    }

    async __presentDatePicker(hours, minutes) {

        let seconds = 0;

        if (hours) {
            seconds += hours * 3600;
        }

        if (minutes) {
            seconds += minutes * 60;
        }

        const datePicker = new DatePicker();
        datePicker.countdownDuration = seconds;

        return await datePicker.pickCountdownDuration();
    }
}

class UIDeleteRowFieldHandler extends UIFieldHandler {

    async handle(uiTable, metadata) {

        const shouldRemove = await this.__presentDeleteModal(metadata.uiField);

        if (shouldRemove) {

            // Remove record
            uiTable.__tableData = uiTable.__tableData.filter(record => 
                record.id !== metadata.tableRecord.id
            );
            
            uiTable.__table.removeRow(metadata.tableRow);
            uiTable.__table.reload();
            uiTable.__onDataModificationFunction(uiTable.__tableData);
        }
    }

    async __presentDeleteModal(uiField) {
        
        const result = await modal()
            .title(uiField.__message)
            .actions([uiField.__confirmAction])
            .present();
        
        if (!result.isCancelled()) {
            return true;
        }
        
        return false;
    }
}

class UIFieldHandlerFactory {

    static getHandler(uiField) {
        
        if (uiField instanceof UIForm) {
            return new UIFormHandler();

        } else if (uiField instanceof UIDatePicker) {
            return new UIDatePickerHandler();

        } else if (uiField instanceof UIDeleteRowField) {
            return new UIDeleteRowFieldHandler();
            
        } else if (uiField instanceof UIFormReadOnly) {
            return null;
        }

        return null;
    }
}

class FilterMetadata {

    constructor(filterField, appliedFilters) {
        this.label = filterField.__label;
        this.dataField = filterField.__dataField;
        this.appliedFilters = appliedFilters;
    }
}

class FilterHandler {

    async handle(uiTable, metadata) {}

    getFilterFunction() {}
}

class TextFilterHandler extends FilterHandler {

    async handle(uiTable, metadata) {

        const dataField = metadata.dataField;
        const fieldName = dataField.__fieldName;
        const filterValue = uiTable.__appliedFilters[fieldName];

        const result = await modal()
            .title(tr("crudModule_filterModalTitle", metadata.label))
            .actions([
                tr("crudModule_applyFilterAction"), 
                tr("crudModule_clearFilterAction")
            ])
            .field()
                .name(fieldName)
                .label(metadata.label)
                .initial(filterValue)
                .add()
            .present();

        if (result.isCancelled()) {
            return;
        }
        
        if (result.choice() === tr("crudModule_applyFilterAction")) {
            await uiTable.__upsertFilter(fieldName, result.get(fieldName));

        } else if (result.choice() === tr("ccrudModule_learFilterAction")) {
            await uiTable.__deleteFilter(fieldName);
        }
    }

    getFilterFunction() {
        return (recordValue, filterValue) => 
            this.__toLower(recordValue).includes(this.__toLower(filterValue));
    }

    __toLower(value) {
        return String(value).toLowerCase();
    }
}

class BoolFilterHandler extends FilterHandler {

    async handle(uiTable, metadata) {

        const dataField = metadata.dataField;
        const fieldName = dataField.__fieldName;
        const filterValue = uiTable.__appliedFilters[fieldName];

        const yesAction = this.__getYesNoAction(filterValue === true, "crudModule_yesBooleanAction");
        const noAction = this.__getYesNoAction(filterValue === false, "crudModule_noBooleanAction");

        const result = await modal()
            .title(tr("crudModule_filterModalTitle", metadata.label))
            .actions([yesAction, noAction, tr("crudModule_clearFilterAction")])
            .present();

        if (result.isCancelled()) {
            return;
        }
        
        if (result.choice() === tr("crudModule_clearFilterAction")) {
            await uiTable.__deleteFilter(fieldName);
            
        } else {

            const newFilterValue = result.choice() === yesAction;
            await uiTable.__upsertFilter(fieldName, newFilterValue);
        }
    }

    getFilterFunction() {
        return (recordValue, filterValue) => recordValue === filterValue;
    }

    __getYesNoAction(isEnabled, actionKey) {

        let enabledIndicator = "";

        if (isEnabled) {
            enabledIndicator = tr("crudModule_filterAppliedIndicator");
        }

        return tr(actionKey, enabledIndicator).trim();
    }
}

class NumberFilterHandler extends FilterHandler {

    async handle(uiTable, metadata) {
        throw new Error("Number filtering not implemented.");
    }

    getFilterFunction() {
        throw new Error("Number filtering not implemented.");
    }
}

class FilterHandlerFactory {

    static getHandler(filterField) {

        const dataField = filterField.__dataField;

        if (dataField instanceof TextDataField) {
            return new TextFilterHandler();

        } else if (dataField instanceof NumberDataField) {
            return new NumberFilterHandler();

        } else if (dataField instanceof BoolDataField) {
            return new BoolFilterHandler();
        }

        return null;
    }
}

class UIDataTable {

    constructor() {
        this.__table = new UITable();
        this.__appliedFilters = {};
        this.__tableData = [];

        this.__dataFields = [];
        this.__uiFields = [];
        this.__filterFields = [];

        this.__sortingFunction = () => 1;
        this.__onChangeFunction = () => {};
        this.__onDataModificationFunction = () => {};

        this.__showSeparators = false;
        this.__allowCreation = false;

        this.title = "";
        this.filterButtonText = tr("crudModule_headerFilterButton");
        this.createButtonText = tr("crudModule_headerCreateButton");
        this.headerBackgroundColor = Color.white();
        this.headerTitleColor = Color.darkGray();
        this.rowHeight = 44;

        this.sequenceFileName = "sequence.json";
        this.filtersFileName = "filter.json";
    }

    allowCreation() {
        this.__allowCreation = true;
    }

    showSeparators() {
        this.__showSeparators = true;
    }

    setTableData(tableData) {
        this.__tableData = tableData;
    }

    setDataFields(dataFields) {
        this.__dataFields = dataFields;
    }

    setUIFields(uiFields) {
        this.__uiFields = uiFields;
    }

    addFilterField(dataField, label) {
        this.__filterFields.push(new UIFilterField(dataField, label));
    }

    setSortingFunction(sortingFunction) {
        this.__sortingFunction = sortingFunction;
    }

    onFieldChange(onChangeFunction) {
        this.__onChangeFunction = onChangeFunction;
    }

    onDataModification(onDataChangeFunction) {
        this.__onDataModificationFunction = onDataChangeFunction;
    }

    async present() {
        this.__table.showSeparators = this.__showSeparators;
        this.__tableData = this.__tableData.sort(this.__sortingFunction);

        if (this.__filterFields.length > 0) {
            this.__loadFilters();
        }

        await this.__reloadTable();
        await this.__table.present();
    }

    async __reloadTable() {

        this.__table.removeAllRows();
        await this.__addHeaderRow();

        for (let tableRecord of this.__getFilteredTableData()) {
            await this.__addTableRow(tableRecord);
        }

        this.__table.reload();
    }

    async __addHeaderRow() {

        const tableHeader = new UITableRow();
        
        tableHeader.isHeader = true;
        tableHeader.cellSpacing = 0.1;
        tableHeader.backgroundColor = this.headerBackgroundColor;

        const headerTitle = tableHeader.addText(this.title);
        headerTitle.widthWeight = 410;
        headerTitle.titleColor = this.headerTitleColor;

        // Add 'Filter' button
        if (this.__filterFields.length > 0) {

            const filterButton = tableHeader.addButton(this.filterButtonText);
            filterButton.widthWeight = 40;
            filterButton.onTap = async () => {
                await this.__presentFiltersModal();
                await this.__reloadTable();
            };
        }

        // Add 'Create' button
        if (this.__allowCreation) {

            const createButton = tableHeader.addButton(this.createButtonText);
            createButton.widthWeight = 40;
            createButton.onTap = async () => {
                await this.__upsertTableRecord();
                await this.__reloadTable();
            };
        }

        this.__table.addRow(tableHeader);
    }

    async __addTableRow(tableRecord) {

        const tableRow = new UITableRow();
        tableRow.height = this.rowHeight;

        for (let uiField of this.__uiFields) {

            let uiFieldLabel = uiField.__fieldLabelFunction(tableRecord);
            let tableCell;

            if (uiField instanceof UIFormReadOnly) {
                tableCell = tableRow.addText(uiFieldLabel);

            } else {
                tableCell = tableRow.addButton(uiFieldLabel);
            }

            tableCell.widthWeight = uiField.__weight;
            tableCell.titleColor = uiField.__color;

            let handler = UIFieldHandlerFactory.getHandler(uiField);

            // Don't add on tap callback if there is no
            // handler for field.
            if (!handler) {
                continue;
            }

            tableCell.onTap = async () => {

                const metadata = new UIFieldMetadata(tableRow, tableRecord, uiField);
                await handler.handle(this, metadata);
                await this.__reloadTable();
            };
        }

        this.__table.addRow(tableRow);
    }

    async __upsertTableRecord(updatedRecord) {

        // Handle create
        if (!updatedRecord?.id) {

            let newRecord = {
                id: await this.__nextSequenceValue()
            };

            this.__dataFields.forEach(field => 
                newRecord[field.__fieldName] = field.__defaultValue
            );
            
            this.__tableData.push(newRecord);

        // Handle update
        } else {
            
            const recordIndex = this.__tableData.findIndex(tableRecord =>
                tableRecord.id === updatedRecord.id
            );
            this.__tableData[recordIndex] = updatedRecord;
        }

        this.__onDataModificationFunction(this.__tableData);
    }

    async __nextSequenceValue() {

        let sequence = FileUtil.readLocalJson(this.sequenceFileName, {next: 0});
        sequence.next += 1
        
        await FileUtil.updateLocalJson(this.sequenceFileName, sequence);
        return sequence.next;
    }

    async __presentFiltersModal() {

        const appliedFiltersList = Object.keys(this.__appliedFilters);
        const labelFilterMap = {};

        this.__filterFields.forEach(field => {

            let popupLabel = "";

            if (appliedFiltersList.includes(field.__dataField.__fieldName)) {
                popupLabel += tr("crudModule_filterAppliedIndicator") + " ";
            }

            popupLabel += field.__label;
            labelFilterMap[popupLabel] = field;
        });

        const actions = [...Object.keys(labelFilterMap), tr("crudModule_clearAllFiltersAction")];
        const result = await modal()
            .title(tr("crudModule_filterSelectionModalTitle"))
            .actions(actions)
            .present();
        
        if (result.isCancelled()) {
            return;
        }
        
        if (result.choice() === tr("crudModule_clearAllFiltersAction")) {
            this.__clearFilters();
            return;   
        }

        const selectedFilterField = labelFilterMap[result.choice()];
        const filterHandler = FilterHandlerFactory.getHandler(selectedFilterField);

        if (filterHandler) {
            const metadata = new FilterMetadata(selectedFilterField, appliedFiltersList);
            await filterHandler.handle(this, metadata);
        }
    }

    __getFilteredTableData() {

        let filteredData = this.__tableData;

        for (let filterField of this.__filterFields) {

            let dataField = filterField.__dataField;
            let fieldName = dataField.__fieldName;
            let filterValue = this.__appliedFilters[fieldName];

            // Skip if there is no filtering for this field.
            if (filterValue === undefined) {
                continue;
            }

            let handler = FilterHandlerFactory.getHandler(filterField);

            if (handler) {

                let filterFunction = handler.getFilterFunction();
                filteredData = filteredData.filter((tableRecord) => 
                    filterFunction(tableRecord[fieldName], filterValue)
                );
            }
        }

        return filteredData;
    }

    __loadFilters() {
        this.__appliedFilters = FileUtil.readLocalJson(this.filtersFileName, {});
    }
    
    async __upsertFilter(fieldName, filter) {
        this.__appliedFilters[fieldName] = filter;
        await FileUtil.updateLocalJson(this.filtersFileName, this.__appliedFilters);
    }

    async __deleteFilter(fieldName) {
        delete this.__appliedFilters[fieldName];
        await FileUtil.updateLocalJson(this.filtersFileName, this.__appliedFilters);
    }

    async __clearFilters() {
        this.__appliedFilters = {};
        await FileUtil.updateLocalJson(this.filtersFileName, {});
    }
}


module.exports = {
    TextDataField,
    BoolDataField,
    NumberDataField,
    UIFormAction,
    UIFormReadOnly,
    UIFormField,
    UIForm,
    UIDatePicker,
    UIDeleteRowField,
    UIDataTable
};

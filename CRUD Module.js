// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: database;

const { FileUtil } = importModule("File Util");
const { modal } = importModule("Modal");
const { tr } = importModule("Localization");


/**
 * Used to hold information about 
 * editable field of table record.
 * 
 * Not used directly.
 *
 * @class DataField
 */
class DataField {

    /**
     * Creates an instance of DataField.
     * 
     * @param {String} name name of field in JSON record
     * @param {Object} defaultValue default value of field, used during creation
     * @memberof DataField
     */
    constructor(name, defaultValue = null) {
        this.__fieldName = name;
        this.__defaultValue = defaultValue;
    }

    /**
     * Used to get name of JSON record field.
     *
     * @return {String} name of field
     * @memberof DataField
     */
    getName() {
        return this.__fieldName;
    }

    /**
     * Used to get default value of field.
     *
     * @return {Object} default value
     * @memberof DataField
     */
    getDefault() {
        return this.__defaultValue;
    }
}


/**
 * Used to hold information about 
 * editable text field of table record.
 *
 * @class TextDataField
 * @extends {DataField}
 */
class TextDataField extends DataField {
}


/**
 * Used to hold information about 
 * editable boolean field of table record.
 *
 * @class BoolDataField
 * @extends {DataField}
 */
class BoolDataField extends DataField {
}


/**
 * Used to hold information about 
 * editable number field of table record.
 *
 * @class NumberDataField
 * @extends {DataField}
 */
class NumberDataField extends DataField {
}


/**
 * Used to store table cell related
 * UI information.
 * 
 * Not used directly.
 *
 * @class UIField
 */
class UIField {

    /**
     * Creates an instance of UIField.
     * 
     * @param {Function} fieldLabelFunction function used to set title of UI field.
     * @param {Number} weight width weight of field
     * @memberof UIField
     */
    constructor(fieldLabelFunction, weight) {
        this.__fieldLabelFunction = fieldLabelFunction;
        this.__weight = weight;
        this.__color = null;
        this.__aligningFunction = (cell) => cell.leftAligned();

        if (typeof fieldLabelFunction === 'string') {
            this.__fieldLabelFunction = () => fieldLabelFunction;
        }
    }
    
    /**
     * Used to set text color of field.
     * Only works with readonly field.
     *
     * @param {Color} color text color
     * @memberof UIField
     */
    setColor(color) {
        this.__color = color;
    }

    /**
     * Used to right align field content.
     *
     * @memberof UIField
     */
    rightAligned() {
        this.__aligningFunction = (cell) => cell.rightAligned();
    }
}


/**
 * Represents readonly UI table field.
 *
 * @class UIFormReadOnly
 * @extends {UIField}
 */
class UIFormReadOnly extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight);
    }
}


/**
 * Represents date picker UI table field.
 *
 * @class UIDatePicker
 * @extends {UIField}
 */
class UIDatePicker extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight, color);
        this.__hourField = null;
        this.__minuteField = null;
    }

    /**
     * Data field representing hour.
     *
     * @param {DataField} dataField hour data field
     * @memberof UIDatePicker
     */
    setHourField(dataField) {
        this.__hourField = dataField;
    }

    /**
     * Data field representing minute.
     *
     * @param {DataField} dataField number data field
     * @memberof UIDatePicker
     */
    setMinuteField(dataField) {
        this.__minuteField = dataField;
    }
}


/**
 * Used to represent field which
 * only purpose is to remove table row.
 *
 * @class UIDeleteRowField
 * @extends {UIField}
 */
class UIDeleteRowField extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight, color);
        this.__message = tr("crudModule_deleteFieldMessage");
        this.__confirmAction = tr("crudModule_deleteFieldConfirmAction");
    }

    /**
     * Used to set delete field confirm message.
     *
     * @param {String} message deletion confirm message
     * @memberof UIDeleteRowField
     */
    setMessage(message) {
        this.__message = message;
    }

    /**
     * Used to set name of deletion confirm action.
     *
     * @param {String} action name of confirm action
     * @memberof UIDeleteRowField
     */
    setConfirmAction(action) {
        this.__confirmAction = action;
    }
}


/**
 * Used to represent field that can update
 * one or more data fields.
 *
 * @class UIForm
 * @extends {UIField}
 */
class UIForm extends UIField {

    constructor(fieldLabelFunction, weight, color) {
        super(fieldLabelFunction, weight, color);
        this.__formTitleFunction = () => "";
        this.__fields = [];
        this.__actions = [];
        this.__defaultAction = null;
    }

    /**
     * Used to set function which
     * is used to get form title.
     *
     * @param {Function} formTitleFunction function used to get form title
     * @memberof UIForm
     */
    setFormTitleFunction(formTitleFunction) {
        this.__formTitleFunction = formTitleFunction;
    }

    /**
     * Used to add form field to the form.
     *
     * @param {UIFormField} formField form field
     * @memberof UIForm
     */
    addFormField(formField) {
        this.__fields.push(formField);
    }

    /**
     * Used to set label of default update action.
     * Default aciton is used to update form fields.
     *
     * @param {String} actionLabel label of default action
     * @memberof UIForm
     */
    addDefaultAction(actionLabel) {

        if (this.__defaultAction) {
            return;
        }

        const defaultAction = new UIDefaultFormAction(actionLabel);
        this.addFormAction(defaultAction);
    }

    /**
     * Used to add custom action to the form.
     *
     * @param {UIFormAction} action form action
     * @memberof UIForm
     */
    addFormAction(action) {
        this.__actions.push(action);
    }
}


/**
 * Used to hold information about form field
 * of the form.
 *
 * @class UIFormField
 */
class UIFormField {

    /**
     * Creates an instance of UIFormField.
     * 
     * @param {DataField} dataField data field associated with form field
     * @param {String} label form field placeholder
     * @memberof UIFormField
     */
    constructor(dataField, label) {
        this.__dataField = dataField;
        this.__label = label;
        this.__rules = [];
    }

    /**
     * Used to add validations
     * for form field.
     *
     * @param {ModalRule} rule form field validation
     * @memberof UIFormField
     */
    addRule(rule) {
        this.__rules.push(rule);
    }
}


/**
 * Represents custom form action
 * of form.
 *
 * @class UIFormAction
 */
class UIFormAction {

    /**
     * Creates an instance of UIFormAction.
     * 
     * @param {String} label label of form action
     * @memberof UIFormAction
     */
    constructor(label) {
        this.__label = label;
        this.__actionCallbacks = [];
    }

    /**
     * Used to add callbacks that are executed
     * when action is triggered.
     *
     * @param {DataField} dataField data field that should be udpated when action is triggered
     * @param {Function} callback function that updates data field
     * @memberof UIFormAction
     */
    addCallback(dataField, callback) {
        this.__actionCallbacks.push({
            dataField,
            callback
        });
    }
}


/**
 * Default form action.
 * It's only purpose is to update form field data.
 *
 * @class UIDefaultFormAction
 * @extends {UIFormAction}
 */
class UIDefaultFormAction extends UIFormAction {

    constructor(label) {
        super(label);
    }
}


/**
 * Represents data filter.
 *
 * @class UIFilterField
 */
class UIFilterField {

    /**
     * Creates an instance of UIFilterField.
     * 
     * @param {DataField} dataField data field by which data should be filtered
     * @param {String} label filter name
     * @memberof UIFilterField
     */
    constructor(dataField, label) {
        this.__dataField = dataField;
        this.__label = label;
    }
}


/**
 * Holds UI field metadata
 * which is passed into handler.
 *
 * @class UIFieldMetadata
 */
class UIFieldMetadata {

    /**
     * Creates an instance of UIFieldMetadata.
     * 
     * @param {UITableRow} tableRow table row
     * @param {Object} tableRecord JSON of current record
     * @param {UIField} uiField UI field metadata
     * @memberof UIFieldMetadata
     */
    constructor(tableRow, tableRecord, uiField) {
        this.tableRow = tableRow;
        this.tableRecord = tableRecord;
        this.uiField = uiField;
    }
}

/**
 * Interface.
 * Should not be used directly.
 * 
 * Used to handle each type of UI field.
 *
 * @class UIFieldHandler
 */
class UIFieldHandler {

    /**
     * Used to handle tap on 
     * UI field.
     *
     * @param {UIDataTable} uiTable UI data table instance
     * @param {UIFieldMetadata} metadata metadata
     * @memberof UIFieldHandler
     */
    async handle(uiTable, metadata) {}
}

/**
 * Handler used to handle forms.
 *
 * @class UIFormHandler
 * @extends {UIFieldHandler}
 */
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

    /**
     * Used to present form
     *
     * @return {Promise<ModalResult>} promise of modal result
     * @memberof UIFormHandler
     */
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

    /**
     * Used to process changes in form fields.
     *
     * @param {ModalResult} result modal result
     * @memberof UIFormHandler
     */
    async __processFieldChanges(result) {

        for (let formField of this.__uiField.__fields) {

            let dataField = formField.__dataField;
            let originalValue = this.__tableRecord[dataField.__fieldName];
            let updatedValue = result.get(dataField.__fieldName);

            this.__uiTable.__onChangeFunction(this.__tableRecord, dataField, updatedValue, originalValue);
            this.__tableRecord[dataField.__fieldName] = updatedValue;
        }
    }

    /**
     * Used to process custom actions.
     *
     * @param {UIFormAction} action custom form action
     * @memberof UIFormHandler
     */
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


/**
 * Handler used process date picker fields.
 *
 * @class UIDatePickerHandler
 * @extends {UIFieldHandler}
 */
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

    /**
     * Used to present date picker.
     *
     * @param {Number} hours hours
     * @param {Number} minutes minutes
     * @return {Promise<Number>} promise with selected duration
     * @memberof UIDatePickerHandler
     */
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

/**
 * Handler used to process delete field.
 *
 * @class UIDeleteRowFieldHandler
 * @extends {UIFieldHandler}
 */
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

    /**
     * Used to present deletion confirmation modal.
     *
     * @param {UIField} uiField UI field
     * @return {Boolean} True if deletion confirmed otherwise false
     * @memberof UIDeleteRowFieldHandler
     */
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

/**
 * Factory used to get handler
 * based on the UI field.
 *
 * @class UIFieldHandlerFactory
 */
class UIFieldHandlerFactory {

    /**
     * Factory method.
     *
     * @static
     * @param {UIField} uiField UI field
     * @return {UIFieldHandler} field handler
     * @memberof UIFieldHandlerFactory
     */
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

/**
 * Used to hold metadata for filter.
 *
 * @class FilterMetadata
 */
class FilterMetadata {

    /**
     * Creates an instance of FilterMetadata.
     * @param {UIFilterField} filterField filter field
     * @memberof FilterMetadata
     */
    constructor(filterField) {
        this.label = filterField.__label;
        this.dataField = filterField.__dataField;
    }
}

/**
 * Interface.
 * Should not be used directly.
 * 
 * Used to handle filter selection.
 *
 * @class FilterHandler
 */
class FilterHandler {

    /**
     * Used to handle filter selection.
     *
     * @param {UIDataTable} uiTable UI data table instance
     * @param {FilterMetadata} metadata filter metadata
     * @memberof FilterHandler
     */
    async handle(uiTable, metadata) {}

    /**
     * Used to get filtering function to filter
     * table data.
     * 
     * @return {Function} filtering function
     * @memberof FilterHandler
     */
    getFilterFunction() {}
}

/**
 * Used to handle filtering operations
 * for text fields.
 *
 * @class TextFilterHandler
 * @extends {FilterHandler}
 */
class TextFilterHandler extends FilterHandler {

    /**
     * @param {UIDataTable} uiTable UI data table instance
     * @param {FilterMetadata} metadata filter metadata
     * @memberof TextFilterHandler
     */
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

    /**
     * @return {Function} filtering function
     * @memberof FilterHandler
     */
    getFilterFunction() {
        return (recordValue, filterValue) => 
            this.__toLower(recordValue).includes(this.__toLower(filterValue));
    }

    __toLower(value) {
        return String(value).toLowerCase();
    }
}

/**
 * Used to handle filtering operations
 * for boolean fields.
 *
 * @class BoolFilterHandler
 * @extends {FilterHandler}
 */
class BoolFilterHandler extends FilterHandler {

    /**
     * @param {UIDataTable} uiTable UI data table instance
     * @param {FilterMetadata} metadata filter metadata
     * @memberof BoolFilterHandler
     */
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

    /**
     * @return {Function} filtering function
     * @memberof BoolFilterHandler
     */
    getFilterFunction() {
        return (recordValue, filterValue) => recordValue === filterValue;
    }

    /**
     * Used to get action name
     * for the Yes/No action.
     * 
     * Will append filterAppliedIndicator
     * for filter value that is currently applied.
     *
     * @param {Boolean} isEnabled whether filter is currently applied
     * @param {String} actionKey text key of an action
     * @return {String} formatted action name
     * @memberof BoolFilterHandler
     */
    __getYesNoAction(isEnabled, actionKey) {

        let enabledIndicator = "";

        if (isEnabled) {
            enabledIndicator = tr("crudModule_filterAppliedIndicator");
        }

        return tr(actionKey, enabledIndicator).trim();
    }
}

/**
 * Used to handle filtering operations
 * for number fields.
 *
 * @class NumberFilterHandler
 * @extends {FilterHandler}
 */
class NumberFilterHandler extends FilterHandler {

    /**
     * @param {UIDataTable} uiTable UI data table instance
     * @param {FilterMetadata} metadata filter metadata
     * @memberof NumberFilterHandler
     */
    async handle(uiTable, metadata) {
        throw new Error("Number filtering not implemented.");
    }

    /**
     * @return {Function} filtering function
     * @memberof NumberFilterHandler
     */
    getFilterFunction() {
        throw new Error("Number filtering not implemented.");
    }
}

/**
 * Factory used to get filter handle
 * based on the filter field.
 *
 * @class FilterHandlerFactory
 */
class FilterHandlerFactory {

    /**
     * Factory method used to get filter handle
     * based on the filter field.
     *
     * @static
     * @param {UIFilterField} filterField filter field
     * @return {FilterHandler} filter handler corresponding provided field
     * @memberof FilterHandlerFactory
     */
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

/**
 * Main component.
 * Used to compose and maintain UITable.
 *
 * @class UIDataTable
 */
class UIDataTable {

    /**
     * Creates an instance of UIDataTable.
     * @memberof UIDataTable
     */
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

    /**
     * Will add create button that allows
     * to insert new records in table.
     *
     * @memberof UIDataTable
     */
    allowCreation() {
        this.__allowCreation = true;
    }

    /**
     * Will add horizontal lines
     * between table records.
     *
     * @memberof UIDataTable
     */
    showSeparators() {
        this.__showSeparators = true;
    }

    /**
     * Used to set table data JSON.
     * It should be a list of JSON objects
     * where each object has the same structure.
     *
     * @param {Object} tableData JSON table data
     * @memberof UIDataTable
     */
    setTableData(tableData) {
        this.__tableData = tableData;
    }

    /**
     * Used to set data fields.
     * Which are list of table fields
     * that are updateable.
     *
     * @param {List<DataField>} dataFields data fields
     * @memberof UIDataTable
     */
    setDataFields(dataFields) {
        this.__dataFields = dataFields;
    }

    /**
     * Used to set UI fields.
     * These fields defines what and how
     * should be rendered on UITable.
     * 
     * Each UI field represents configuration for
     * a table column.
     *
     * @param {List<UIField>} uiFields UI fields
     * @memberof UIDataTable
     */
    setUIFields(uiFields) {
        this.__uiFields = uiFields;
    }

    /**
     * Used to register filter field.
     * These are fields by which you can filter
     * table dataset.
     *
     * @param {DataField} dataField data field by which value dataset should be filtered
     * @param {String} label label of the filter in filtering modal
     * @memberof UIDataTable
     */
    addFilterField(dataField, label) {
        this.__filterFields.push(new UIFilterField(dataField, label));
    }

    /**
     * Used to set sorting function which is applied initially when
     * UITable is rendered for the first time.
     *
     * @param {Function} sortingFunction data sorting function
     * @memberof UIDataTable
     */
    setSortingFunction(sortingFunction) {
        this.__sortingFunction = sortingFunction;
    }

    /**
     * Used to register global callback function
     * which is invoked each time table data is 
     * being modified.
     * 
     * Usable when you want to do some additional
     * operations when some data changes.
     *
     * @param {Function} onChangeFunction global onChange callback function
     * @memberof UIDataTable
     */
    onFieldChange(onChangeFunction) {
        this.__onChangeFunction = onChangeFunction;
    }

    /**
     * Used to register onSave callback.
     * This function is invoked when dataset in
     * general is being modified.
     * 
     * Main purpose of this function is to persist
     * data into storage when it changes, since UI
     * table is not responsible for actual data persistence.
     *
     * @param {Function} onDataChangeFunction onSave function
     * @memberof UIDataTable
     */
    onDataModification(onDataChangeFunction) {
        this.__onDataModificationFunction = onDataChangeFunction;
    }

    /**
     * Main entry point.
     * Used to present UITable.
     *
     * @memberof UIDataTable
     */
    async present() {
        this.__table.showSeparators = this.__showSeparators;
        this.__tableData = this.__tableData.sort(this.__sortingFunction);

        if (this.__filterFields.length > 0) {
            this.__loadFilters();
        }

        await this.__reloadTable();
        await this.__table.present();
    }

    /**
     * Used to clear and render UITable
     * from scratch.
     * 
     * This function is invoked each time data is
     * modified.
     *
     * @memberof UIDataTable
     */
    async __reloadTable() {

        this.__table.removeAllRows();
        await this.__addHeaderRow();

        for (let tableRecord of this.__getFilteredTableData()) {
            await this.__addTableRow(tableRecord);
        }

        this.__table.reload();
    }

    /**
     * Used to create table header row.
     * Header row contains title and optionally
     * create and filter buttons.
     *
     * @memberof UIDataTable
     */
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

    /**
     * Used to render data record
     * on UITable.
     *
     * @param {Object} tableRecord table record in JSON format
     * @memberof UIDataTable
     */
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

            uiField.__aligningFunction(tableCell);
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

    /**
     * Used to update or create data record
     * and reflect changes in UIDataTable state.
     * 
     * Function also calls onSave callback,
     * giving possibility to persist changes.
     *
     * @param {Object} updatedRecord new or updated table record
     * @memberof UIDataTable
     */
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

    /**
     * Used to get next ID value from sequence file.
     *
     * @return {Number} next ID
     * @memberof UIDataTable
     */
    async __nextSequenceValue() {

        let sequence = FileUtil.readLocalJson(this.sequenceFileName, {next: 0});
        sequence.next += 1
        
        await FileUtil.updateLocalJson(this.sequenceFileName, sequence);
        return sequence.next;
    }

    /**
     * Used to present filters modal.
     *
     * @return {Future<ModalResult>} promise with modal result
     * @memberof UIDataTable
     */
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
            const metadata = new FilterMetadata(selectedFilterField);
            await filterHandler.handle(this, metadata);
        }
    }

    /**
     * Used to get table data with 
     * applied filters to it.
     * 
     * This function doesn't affect actual
     * table data in UIDataTable state.
     *
     * @return {List<Object>} filtered table data
     * @memberof UIDataTable
     */
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

    /**
     * Used to load currently applied filters
     * from storage and save it into UIDataTable state.
     *
     * @memberof UIDataTable
     */
    __loadFilters() {
        this.__appliedFilters = FileUtil.readLocalJson(this.filtersFileName, {});
    }
    
    /**
     * Used to create or update existing filter in storage.
     * Also updates UIDataTable state.
     * 
     * @param {String} fieldName name of field that is associated with filter
     * @param {Object} filter filter value (could be string, number or boolean)
     * @memberof UIDataTable
     */
    async __upsertFilter(fieldName, filter) {
        this.__appliedFilters[fieldName] = filter;
        await FileUtil.updateLocalJson(this.filtersFileName, this.__appliedFilters);
    }

    /**
     * Used to delete filter from storage
     * and UIDataTable state.
     *
     * @param {String} fieldName name of field for which filter should be removed
     * @memberof UIDataTable
     */
    async __deleteFilter(fieldName) {
        delete this.__appliedFilters[fieldName];
        await FileUtil.updateLocalJson(this.filtersFileName, this.__appliedFilters);
    }

    /**
     * Used to remove all filters from storage
     * and UIDataTable state.
     *
     * @memberof UIDataTable
     */
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

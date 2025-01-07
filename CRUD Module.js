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

    #fieldName;
    #defaultValue;

    /**
     * Creates an instance of DataField.
     * 
     * @param {String} name name of field in JSON record
     * @param {Object} defaultValue default value of field, used during creation
     * @memberof DataField
     */
    constructor(name, defaultValue = null) {
        this.#fieldName = name;
        this.#defaultValue = defaultValue;
    }

    /**
     * Used to get name of JSON record field.
     *
     * @return {String} name of field
     * @memberof DataField
     */
    getName() {
        return this.#fieldName;
    }

    /**
     * Used to get default value of field.
     *
     * @return {Object} default value
     * @memberof DataField
     */
    getDefault() {
        return this.#defaultValue;
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

    #fieldLabelFunction;
    #cellAligningFunction = (cell) => cell.leftAligned();

    #weight;
    #color = null;

    /**
     * Creates an instance of UIField.
     * 
     * @param {Function} fieldLabelFunction function used to set title of UI field.
     * @param {Number} weight width weight of field
     * @memberof UIField
     */
    constructor(fieldLabelFunction, weight) {
        this.#fieldLabelFunction = fieldLabelFunction;
        this.#weight = weight;

        if (typeof fieldLabelFunction === 'string') {
            this.#fieldLabelFunction = () => fieldLabelFunction;
        }
    }

    /**
     * Used to get function that returns
     * field label.
     *
     * @return {Function} field label function
     * @memberof UIField
     */
    getFieldLabelFunction() {
        return this.#fieldLabelFunction;
    }

    /**
     * Used to get field width weight.
     *
     * @return {Number} field width weight
     * @memberof UIField
     */
    getWeight() {
        return this.#weight;
    }
    
    /**
     * Used to set text color of field.
     * Only works with readonly field.
     *
     * @param {Color} color text color
     * @memberof UIField
     */
    setColor(color) {
        this.#color = color;
    }

    /**
     * Used to get field color.
     *
     * @return {Color} field color
     * @memberof UIField
     */
    getColor() {
        return this.#color;
    }

    /**
     * Used to right align field content.
     *
     * @memberof UIField
     */
    rightAligned() {
        this.#cellAligningFunction = (cell) => cell.rightAligned();
    }

    /**
     * Used to get cell aligning function.
     *
     * @return {Function} table cell aligning function
     * @memberof UIField
     */
    getAligningFunction() {
        return this.#cellAligningFunction;
    }
}


/**
 * Represents readonly UI table field.
 *
 * @class UIFormReadOnly
 * @extends {UIField}
 */
class UIFormReadOnly extends UIField {
}


/**
 * Represents date picker UI table field.
 *
 * @class UIDatePicker
 * @extends {UIField}
 */
class UIDatePicker extends UIField {

    #hourField;
    #minuteField;

    /**
     * Data field representing hours.
     *
     * @param {DataField} dataField hours data field
     * @memberof UIDatePicker
     */
    setHourField(dataField) {
        this.#hourField = dataField;
    }

    /**
     * Used to get data field represention hours.
     *
     * @return {DataField} hours data field
     * @memberof UIDatePicker
     */
    getHourField() {
        return this.#hourField;
    }

    /**
     * Data field representing minutes.
     *
     * @param {DataField} dataField minutes data field
     * @memberof UIDatePicker
     */
    setMinuteField(dataField) {
        this.#minuteField = dataField;
    }

    /**
     * Used to get data field represention minutes.
     *
     * @return {DataField} minutes data field
     * @memberof UIDatePicker
     */
    getMinuteField() {
        return this.#minuteField;
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

    #message = tr("crudModule_deleteFieldMessage");
    #confirmAction = tr("crudModule_deleteFieldConfirmAction");

    constructor(fieldLabelFunction, weight) {
        super(fieldLabelFunction, weight);
    }

    /**
     * Used to set delete field confirm message.
     *
     * @param {String} message deletion confirm message
     * @memberof UIDeleteRowField
     */
    setMessage(message) {
        this.#message = message;
    }

    /**
     * Used to get deletion confirmation message.
     *
     * @return {String} confirmation message
     * @memberof UIDeleteRowField
     */
    getMessage() {
        return this.#message;
    }

    /**
     * Used to set name of deletion confirm action.
     *
     * @param {String} action name of confirm action
     * @memberof UIDeleteRowField
     */
    setConfirmAction(action) {
        this.#confirmAction = action;
    }

    /**
     * Used to get name of deletion confirm action.
     *
     * @return {String} name of confirm action
     * @memberof UIDeleteRowField
     */
    getConfirmAction() {
        return this.#confirmAction;
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

    #formTitleFunction = () => "";

    #fields = [];
    #actions = [];

    #hasDefaultAction = false;

    /**
     * Used to set function which
     * is used to get form title.
     *
     * @param {Function} formTitleFunction function used to get form title
     * @memberof UIForm
     */
    setFormTitleFunction(formTitleFunction) {
        this.#formTitleFunction = formTitleFunction;
    }

    /**
     * Used to get form title
     * function.
     *
     * @return {Function} form title function
     * @memberof UIForm
     */
    getFormTitleFunction() {
        return this.#formTitleFunction;
    }

    /**
     * Used to add form field to the form.
     *
     * @param {UIFormField} formField form field
     * @memberof UIForm
     */
    addFormField(formField) {
        this.#fields.push(formField);
    }

    /**
     * Used to get list of form fields.
     *
     * @return {List<UIFormField>} list of form fields
     * @memberof UIForm
     */
    getFormFields() {
        return this.#fields;
    }

    /**
     * Used to set label of default update action.
     * Default aciton is used to update form fields.
     *
     * @param {String} actionLabel label of default action
     * @memberof UIForm
     */
    addDefaultAction(actionLabel) {

        if (!this.#hasDefaultAction) {

            const defaultAction = new UIDefaultFormAction(actionLabel);
            this.addFormAction(defaultAction);

            this.#hasDefaultAction = true;
        }
    }

    /**
     * Used to add custom action to the form.
     *
     * @param {UIFormAction} action form action
     * @memberof UIForm
     */
    addFormAction(action) {
        this.#actions.push(action);
    }

    /**
     * Used to get list of form actions.
     *
     * @return {List<UIFormAction>} list of form actions
     * @memberof UIForm
     */
    getFormActions() {
        return this.#actions;
    }
}


/**
 * Used to hold information about form field
 * of the form.
 *
 * @class UIFormField
 */
class UIFormField {

    #rules = [];
    #dataField;
    #label;

    /**
     * Creates an instance of UIFormField.
     * 
     * @param {DataField} dataField data field associated with form field
     * @param {String} label form field placeholder
     * @memberof UIFormField
     */
    constructor(dataField, label) {
        this.#dataField = dataField;
        this.#label = label;
    }

    /**
     * Used to get UI form field label.
     *
     * @return {String} from field label
     * @memberof UIFormField
     */
    getLabel() {
        return this.#label;
    }

    /**
     * Used to get data field associated
     * with UI form field.
     *
     * @return {DataField} data field
     * @memberof UIFormField
     */
    getDataField() {
        return this.#dataField;
    }

    /**
     * Used to add validations
     * for form field.
     *
     * @param {ModalRule} rule form field validation
     * @memberof UIFormField
     */
    addRule(rule) {
        this.#rules.push(rule);
    }

    /**
     * Used to get form field validation rules.
     *
     * @return {List<ModalRule>} validation rules
     * @memberof UIFormField
     */
    getRules() {
        return this.#rules;
    }
}


/**
 * Represents custom form action
 * of form.
 *
 * @class UIFormAction
 */
class UIFormAction {

    #actionLabel;
    #actionCallbacks = [];

    /**
     * Creates an instance of UIFormAction.
     * 
     * @param {String} label label of form action
     * @memberof UIFormAction
     */
    constructor(label) {
        this.#actionLabel = label;
    }

    /**
     * Used to get action label.
     *
     * @return {String} action label
     * @memberof UIFormAction
     */
    getLabel() {
        return this.#actionLabel;
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
        this.#actionCallbacks.push({
            dataField,
            callback
        });
    }

    /**
     * Used to get list of action callbacks.
     * 
     * @return {List<Object>} list of callbacks
     * @memberof UIFormAction
     */
    getCallbacks() {
        return this.#actionCallbacks;
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

    #dataField;
    #label;

    /**
     * Creates an instance of UIFilterField.
     * 
     * @param {DataField} dataField data field by which data should be filtered
     * @param {String} label filter name
     * @memberof UIFilterField
     */
    constructor(dataField, label) {
        this.#dataField = dataField;
        this.#label = label;
    }

    /**
     * Used to get filter label.
     *
     * @return {String} filter label
     * @memberof UIFilterField
     */
    getLabel() {
        return this.#label;
    }

    /**
     * Used to get data field
     * associated with filter.
     *
     * @return {DataField} filter data field
     * @memberof UIFilterField
     */
    getDataField() {
        return this.#dataField;
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

    #uiTable;
    #tableRecord;
    #uiField;

    async handle(uiTable, metadata) {

        this.#tableRecord = metadata.tableRecord;
        this.#uiField = metadata.uiField;
        this.#uiTable = uiTable;

        const result = await this.#presentForm();

        if (result.isCancelled()) {
            return;
        }

        const selectedAction = this.#uiField.getFormActions().find(action => 
            action.getLabel() === result.choice()
        );
        
        // Handle default action
        if (selectedAction instanceof UIDefaultFormAction) {
            this.#processFieldChanges(result);

        // Handle custom actions
        } else {
            this.#processCustomAction(selectedAction);
        }
        
        uiTable.__upsertTableRecord(this.#tableRecord);
    }

    /**
     * Used to present form
     *
     * @return {Promise<ModalResult>} promise of modal result
     * @memberof UIFormHandler
     */
    async #presentForm() {

        const formTitleFunction = this.#uiField.getFormTitleFunction();
        const formTitle = formTitleFunction(this.#tableRecord);

        const modalBuilder = modal()
            .title(formTitle)
            .actions(this.#uiField.getFormActions().map(action => action.getLabel()));
        
        this.#uiField.getFormFields().forEach(field => {

            const fieldName = field.getDataField().getName();
            modalBuilder.field()
                .name(fieldName)
                .label(field.getLabel())
                .initial(this.#tableRecord[fieldName])
                .validations(field.getRules())
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
    async #processFieldChanges(result) {

        for (let formField of this.#uiField.getFormFields()) {

            let dataField = formField.getDataField();
            let originalValue = this.#tableRecord[dataField.getName()];
            let updatedValue = result.get(dataField.getName());

            this.#uiTable.__onChange(this.#tableRecord, dataField, updatedValue, originalValue);
            this.#tableRecord[dataField.getName()] = updatedValue;
        }
    }

    /**
     * Used to process custom actions.
     *
     * @param {UIFormAction} action custom form action
     * @memberof UIFormHandler
     */
    async #processCustomAction(action) {

        for (let actionCallback of action.getCallbacks()) {

            let {
                dataField,
                callback
            } = actionCallback;

            let originalValue = this.#tableRecord[dataField.getName()];
            let updatedValue = callback(this.#tableRecord, action);

            this.#uiTable.__onChange(this.#tableRecord, dataField, updatedValue, originalValue);
            this.#tableRecord[dataField.getName()] = updatedValue;
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

        const tableRecord = metadata.tableRecord;
        const uiField = metadata.uiField;

        const hourField = uiField.getHourField();
        const minuteField = uiField.getMinuteField();

        const originalHours = tableRecord[hourField.getName()];
        const originalMinutes = tableRecord[minuteField.getName()];

        const resultSeconds = await this.#presentDatePicker(originalHours, originalMinutes);
  
        const updatedHours = Math.floor(resultSeconds / 3600);
        const updatedMinutes = resultSeconds / 60 - (updatedHours * 60);
        
        if (originalHours !== updatedHours) {
            uiTable.__onChange(
                tableRecord, 
                hourField, 
                updatedHours, 
                originalHours
            );
        }

        if (originalMinutes !== updatedMinutes) {
            uiTable.__onChange(
                tableRecord, 
                minuteField, 
                updatedMinutes, 
                originalMinutes
            );
        }

        tableRecord[hourField.getName()] = updatedHours;
        tableRecord[minuteField.getName()] = updatedMinutes;
        
        uiTable.__upsertTableRecord(tableRecord);
    }

    /**
     * Used to present date picker.
     *
     * @param {Number} hours hours
     * @param {Number} minutes minutes
     * @return {Promise<Number>} promise with selected duration
     * @memberof UIDatePickerHandler
     */
    async #presentDatePicker(hours, minutes) {

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

        const shouldRemove = await this.#presentDeleteModal(metadata.uiField);

        if (shouldRemove) {
            uiTable.__removeTableRecord(metadata.tableRecord, metadata.tableRow);
        }
    }

    /**
     * Used to present deletion confirmation modal.
     *
     * @param {UIField} uiField UI field
     * @return {Boolean} True if deletion confirmed otherwise false
     * @memberof UIDeleteRowFieldHandler
     */
    async #presentDeleteModal(uiField) {
        
        const result = await modal()
            .title(uiField.getMessage())
            .actions([uiField.getConfirmAction()])
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
        this.label = filterField.getLabel();
        this.dataField = filterField.getDataField();
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
        const fieldName = dataField.getName();
        const filterValue = uiTable.__getFilterValue(fieldName);

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

        } else if (result.choice() === tr("crudModule_clearFilterAction")) {
            await uiTable.__deleteFilter(fieldName);
        }
    }

    /**
     * @return {Function} filtering function
     * @memberof FilterHandler
     */
    getFilterFunction() {
        return (recordValue, filterValue) => 
            this.#toLower(recordValue).includes(this.#toLower(filterValue));
    }

    #toLower(value) {
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
        const fieldName = dataField.getName();
        const filterValue = uiTable.__getFilterValue(fieldName);

        const yesAction = this.#getYesNoAction(filterValue === true, "crudModule_yesBooleanAction");
        const noAction = this.#getYesNoAction(filterValue === false, "crudModule_noBooleanAction");

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
    #getYesNoAction(isEnabled, actionKey) {

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

        const dataField = filterField.getDataField();

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

    #table = new UITable();
    #appliedFilters = {};
    #tableData = [];

    #dataFields = [];
    #uiFields = [];
    #filterFields = [];

    #sortingFunction = () => 1;
    #onChangeFunction = () => {};
    #onDataModificationFunction = () => {};

    #showSeparators = false;
    #allowCreation = false;

    title = "";
    filterButtonText = tr("crudModule_headerFilterButton");
    createButtonText = tr("crudModule_headerCreateButton");
    headerBackgroundColor = Color.white();
    headerTitleColor = Color.darkGray();
    rowHeight = 44;

    sequenceFileName = "sequence.json";
    filtersFileName = "filter.json";

    /**
     * Will add create button that allows
     * to insert new records in table.
     *
     * @memberof UIDataTable
     */
    allowCreation() {
        this.#allowCreation = true;
    }

    /**
     * Will add horizontal lines
     * between table records.
     *
     * @memberof UIDataTable
     */
    showSeparators() {
        this.#showSeparators = true;
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
        this.#tableData = tableData;
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
        this.#dataFields = dataFields;
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
        this.#uiFields = uiFields;
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
        this.#filterFields.push(new UIFilterField(dataField, label));
    }

    /**
     * Used to set sorting function which is applied initially when
     * UITable is rendered for the first time.
     *
     * @param {Function} sortingFunction data sorting function
     * @memberof UIDataTable
     */
    setSortingFunction(sortingFunction) {
        this.#sortingFunction = sortingFunction;
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
        this.#onChangeFunction = onChangeFunction;
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
        this.#onDataModificationFunction = onDataChangeFunction;
    }

    /**
     * Main entry point.
     * Used to present UITable.
     *
     * @memberof UIDataTable
     */
    async present() {

        this.#table.showSeparators = this.#showSeparators;
        this.#tableData = this.#tableData.sort(this.#sortingFunction);

        if (this.#filterFields.length > 0) {
            this.#loadFilters();
        }

        await this.#reloadTable();
        await this.#table.present();
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
    async #reloadTable() {

        this.#table.removeAllRows();
        await this.#addHeaderRow();

        for (let tableRecord of this.#getFilteredTableData()) {
            await this.#addTableRow(tableRecord);
        }

        this.#table.reload();
    }

    /**
     * Used to create table header row.
     * Header row contains title and optionally
     * create and filter buttons.
     *
     * @memberof UIDataTable
     */
    async #addHeaderRow() {

        const tableHeader = new UITableRow();
        
        tableHeader.isHeader = true;
        tableHeader.cellSpacing = 0.1;
        tableHeader.backgroundColor = this.headerBackgroundColor;

        const headerTitle = tableHeader.addText(this.title);
        headerTitle.widthWeight = 410;
        headerTitle.titleColor = this.headerTitleColor;

        // Add 'Filter' button
        if (this.#filterFields.length > 0) {

            const filterButton = tableHeader.addButton(this.filterButtonText);
            filterButton.widthWeight = 40;
            filterButton.onTap = async () => {
                await this.#presentFiltersModal();
                await this.#reloadTable();
            };
        }

        // Add 'Create' button
        if (this.#allowCreation) {

            const createButton = tableHeader.addButton(this.createButtonText);
            createButton.widthWeight = 40;
            createButton.onTap = async () => {
                await this.__upsertTableRecord();
                await this.#reloadTable();
            };
        }

        this.#table.addRow(tableHeader);
    }

    /**
     * Used to render data record
     * on UITable.
     *
     * @param {Object} tableRecord table record in JSON format
     * @memberof UIDataTable
     */
    async #addTableRow(tableRecord) {

        const tableRow = new UITableRow();
        tableRow.height = this.rowHeight;

        for (let uiField of this.#uiFields) {

            let fieldLabelFunction = uiField.getFieldLabelFunction();
            let aligningFunction = uiField.getAligningFunction();

            let uiFieldLabel = fieldLabelFunction(tableRecord);
            let tableCell;

            if (uiField instanceof UIFormReadOnly) {
                tableCell = tableRow.addText(uiFieldLabel);

            } else {
                tableCell = tableRow.addButton(uiFieldLabel);
            }

            aligningFunction(tableCell);
            tableCell.widthWeight = uiField.getWeight();
            tableCell.titleColor = uiField.getColor();

            let handler = UIFieldHandlerFactory.getHandler(uiField);

            // Don't add on tap callback if there is no
            // handler for field.
            if (!handler) {
                continue;
            }

            tableCell.onTap = async () => {

                const metadata = new UIFieldMetadata(tableRow, tableRecord, uiField);
                await handler.handle(this, metadata);
                await this.#reloadTable();
            };
        }

        this.#table.addRow(tableRow);
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
                id: await this.#nextSequenceValue()
            };

            this.#dataFields.forEach(field => 
                newRecord[field.getName()] = field.getDefault()
            );
            
            this.#tableData.push(newRecord);

        // Handle update
        } else {
            
            const recordIndex = this.#tableData.findIndex(tableRecord =>
                tableRecord.id === updatedRecord.id
            );
            this.#tableData[recordIndex] = updatedRecord;
        }

        this.#onDataModificationFunction(this.#tableData);
    }

    /**
     * Used to remove record from UI table and storage.
     * 
     * @param {Object} tableRecord table record to remove
     * @param {UITableRow} tableRow UI table row to remove
     * @memberof UIDataTable
     */
    __removeTableRecord(tableRecord, tableRow) {

        this.setTableData(this.#tableData.filter(record => 
            record.id !== tableRecord?.id
        ));

        // If UI table row was provided
        // then delete it as well
        if (tableRow) {
            this.#table.removeRow(tableRow);
            this.#table.reload();
        }

        this.#onDataModificationFunction(this.#tableData);
    }

    /**
     * Used to handle updates of data fields.
     * 
     * @param {Object} tableRecord table record
     * @param {DataField} dataField data field that is being updated
     * @param {Object} updatedValue new value
     * @param {Object} originalValue previous value
     */
    __onChange(tableRecord, dataField, updatedValue, originalValue) {
        this.#onChangeFunction(tableRecord, dataField, updatedValue, originalValue);
    }

    /**
     * Used to get next ID value from sequence file.
     *
     * @return {Number} next ID
     * @memberof UIDataTable
     */
    async #nextSequenceValue() {

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
    async #presentFiltersModal() {

        const appliedFiltersList = Object.keys(this.#appliedFilters);
        const labelFilterMap = {};

        this.#filterFields.forEach(field => {

            let popupLabel = "";

            if (appliedFiltersList.includes(field.getDataField().getName())) {
                popupLabel += tr("crudModule_filterAppliedIndicator") + " ";
            }

            popupLabel += field.getLabel();
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
            this.#clearFilters();
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
    #getFilteredTableData() {

        let filteredData = this.#tableData;

        for (let filterField of this.#filterFields) {

            let dataField = filterField.getDataField();
            let fieldName = dataField.getName();
            let filterValue = this.#appliedFilters[fieldName];

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
    #loadFilters() {
        this.#appliedFilters = FileUtil.readLocalJson(this.filtersFileName, {});
    }

    /**
     * Used to get value of applied filter.
     * 
     * @return {Object} filter value
     * @memberof UIDataTable
     */
    __getFilterValue(fieldName) {
        return this.#appliedFilters[fieldName];
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
        this.#appliedFilters[fieldName] = filter;
        await FileUtil.updateLocalJson(this.filtersFileName, this.#appliedFilters);
    }

    /**
     * Used to delete filter from storage
     * and UIDataTable state.
     *
     * @param {String} fieldName name of field for which filter should be removed
     * @memberof UIDataTable
     */
    async __deleteFilter(fieldName) {
        delete this.#appliedFilters[fieldName];
        await FileUtil.updateLocalJson(this.filtersFileName, this.#appliedFilters);
    }

    /**
     * Used to remove all filters from storage
     * and UIDataTable state.
     *
     * @memberof UIDataTable
     */
    async #clearFilters() {
        this.#appliedFilters = {};
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

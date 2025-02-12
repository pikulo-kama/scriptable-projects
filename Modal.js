// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const { addToState, getFromState } = importModule("Util");
const { tr } = importModule("Localization");


/**
 * Used to validate modal fields.
 *
 * @class ModalRule
 */
class ModalRule {

    #messageFunction;
    #ruleFunction;

    /**
     * Checks whether field is populated.
     *
     * @static
     * @memberof ModalRule
     */
    static NotEmpty = new ModalRule(
        field => tr("modal_fieldCantBeEmptyMessage", field.label),
        value => !!value && String(value).length !== 0
    );

    /**
     * Checks whether field is a number.
     *
     * @static
     * @memberof ModalRule
     */
    static Number = new ModalRule(
        field => tr("modal_fieldShouldBeNumberMessage", field.label),
        value => String(value).match("^[0-9]+$")
    );

    /**
     * Creates an instance of ModalRule.
     * @param {Function} messageFunction function that is invoked when validation doesn't pass
     * @param {Function} ruleFunction function used to validate field value, if function returns
     * true - validations passes, otherwise error message is shown
     * @memberof ModalRule
     */
    constructor(messageFunction, ruleFunction) {
        this.#messageFunction = messageFunction;
        this.#ruleFunction = ruleFunction;
    }

    /**
     * Used to get function that is invoked
     * when validation doesn't pass.
     *
     * @return {Function} error message function
     * @memberof ModalRule
     */
    getMessageFunction() {
        return this.#messageFunction;
    }

    /**
     * Used to get function that used to
     * validate field value.
     *
     * @return {Function} validation function
     * @memberof ModalRule
     */
    getRuleFunction()  {
        return this.#ruleFunction;
    }

    /**
     * Used to validate provided
     * value against the rule.
     *
     * @param {Object} value value that should be validated
     * @return {Boolean} True if value satisfies the rule otherwise false
     * @memberof ModalRule
     */
    validate(value) {
        return this.#ruleFunction(value);
    }
}


/**
 * DTO that contains modal result.
 *
 * @class ModalResult
 */
class ModalResult {

    #choice;
    #isCancelled;
    #data;

    /**
     * Creates an instance of ModalResult.
     * @param {String} choice name of action that was selected in modal
     * @param {Boolean} isCancelled whether cancel action was selected
     * @param {Map<String, Object>} data map that contains field results
     * @memberof ModalResult
     */
    constructor(choice, isCancelled, data) {
        this.#choice = choice;
        this.#isCancelled = isCancelled;
        this.#data = data;
    }

    /**
     * Returns selected action.
     *
     * @return {String} name of action
     * @memberof ModalResult
     */
    choice() {
        return this.#choice;
    }

    /**
     * Checks whether cancel action was selected.
     *
     * @return {Boolean} true if cancel action was selected otherwise false
     * @memberof ModalResult
     */
    isCancelled() {
        return this.#isCancelled;
    }

    /**
     * Used to get field value.
     *
     * @param {String} name name of field
     * @return {String} field value
     * @memberof ModalResult
     */
    get(name) {
        return this.#data[name];
    }
}


/**
 * Builder for modal field.
 *
 * @class Field
 */
class Field {

    #modal;
    #name;
    #label;
    #initialValue;
    #validations = [];

    /**
     * Creates an instance of Field.
     * @param {Modal} modal instance of modal builder
     * @memberof Field
     */
    constructor(modal) {
        this.#modal = modal;
    }

    /**
     * Used to set field name.
     * This property will later be used
     * to populate ModalResult data.
     *
     * @param {String} name name of field
     * @return {Field} current instance of field builder
     * @memberof Field
     */
    name(name) {
        this.#name = name;
        return this;
    }

    /**
     * Used to set field label.
     * Used as value placeholder in modal.
     *
     * @param {String} label label of field
     * @return {Field} current instance of field builder
     * @memberof Field
     */
    label(label) {
        this.#label = label;
        return this;
    }

    /**
     * Used to set initial value for field.
     *
     * @param {Object} initialValue field initial value
     * @return {Field} current instance of field builder
     * @memberof Field
     */
    initial(initialValue) {
        this.#initialValue = initialValue;
        return this;
    }

    /**
     * Used to add validation for the field.
     *
     * @param {ModalRule} validation field validation
     * @return {Field} current instance of field builder
     * @memberof Field
     */
    addValidation(validation) {
        this.#validations.push(validation);
        return this;
    }

    /**
     * Used to add list of validations for the field.
     * This will not overwrite previous field validations.
     *
     * @param {List<ModalRule>} validations field validations
     * @return {Field} current instance of field builder
     * @memberof Field
     */
    validations(validations) {
        validations.forEach(validation => this.addValidation(validation));
        return this;
    }

    /**
     * Used to build field object
     * and add it to the Modal builder.
     *
     * @return {Modal} modal builder
     * @memberof Field
     */
    add() {
        const modal = this.#modal;
        const fields = getFromState(modal, "fields");

        const field = {
            id: fields.length,
            name: this.#name,
            label: this.#label,
            value: this.#initialValue,
            previousValue: undefined,
            validations: this.#validations
        };

        fields.push(field);
        return modal;
    }
}


/**
 * Modal builder.
 * Responsible for modal presenting
 * and handling of results.
 *
 * @class Modal
 */
class Modal {

    #title = "";
    #cancelLabel = tr("modal_cancelActionName");
    #actions = [];
    #fields = [];
    #alert = null;

    /**
     * Used to set modal title.
     *
     * @param {String} title modal window title
     * @return {Modal} current instance of modal builder
     * @memberof Modal
     */
    title(title) {
        this.#title = title;
        return this;
    }

    /**
     * Used to set cancel label
     * for modal.
     *
     * @param {String} cancelLabel label of cancel action
     * @return {Modal} current instance of modal builder
     * @memberof Modal
     */
    cancelLabel(cancelLabel) {
        this.#cancelLabel = cancelLabel;
        return this;
    }

    /**
     * Used to initialize list of actions.
     *
     * @param {List<String>} actions list of action names
     * @return {Modal} current instance of modal builder
     * @memberof Modal
     */
    actions(actions) {
        this.#actions = actions;
        return this;
    }

    /**
     * Used to add new field.
     * Actual field creation will be delegated
     * to the Field builder.
     *
     * @return {Field} field builder
     * @memberof Modal
     */
    field() {
        addToState(this, {"fields": this.#fields});
        return new Field(this);
    }

    /**
     * Used to present modal
     * to the user.
     *
     * @return {Promise<ModalResult>} promise with modal results
     * @memberof Modal
     */
    async present() {

        this.#alert = new Alert();
        this.#alert.title = this.#title;
        this.#fields = getFromState(this, "fields", []);

        // Add actions
        this.#actions.forEach(action => this.#alert.addAction(action));
        this.#alert.addCancelAction(this.#cancelLabel);

        // Add fields
        this.#fields.forEach(field => this.#alert.addTextField(field.label, field.value));
    
        const resultCode = await this.#alert.presentAlert();
        let selectedAction = this.#actions[resultCode];
        let isCancelled = false;

        if (!selectedAction) {
            selectedAction = this.#cancelLabel;
            isCancelled = true;
        }

        if (!isCancelled) {
            // Process modal field changes.
            await this.#processFields();
        }

        return new ModalResult(selectedAction, isCancelled, this.#getFieldData());
    }

    /**
     * Used to process form fields
     * by applying validations and
     * restarting processing flow in
     * case of failure.
     *
     * @memberof Modal
     */
    async #processFields() {

        // Save values provided by user.
        for (const field of this.#fields) {
            
            const newValue = this.#alert.textFieldValue(field.id);

            field.previousValue = field.value;
            field.value = newValue;
        }

        let hasErrors = false;

        // Perform validations.
        // Validation should happen after all data from form
        // fields have been taken, otherwise it's being lost
        // since error modal closes main modal we end up losing 
        // data provided by user.
        for (const field of this.#fields) {
            for (const validation of field.validations) {

                const ruleFunction = validation.getRuleFunction();
                
                // Don't proceed with validation of field
                // if one rule already failed.
                if (ruleFunction(field.value)) {
                    break;
                }

                const messageFunction = validation.getMessageFunction();
                const errorMessage = messageFunction(field);
                await showError(errorMessage);
                
                field.value = field.previousValue;
                hasErrors = true;
            }
        }

        if (hasErrors) {
            await this.present();
        }
    }

    /**
     * Used to build fields into
     * fieldName -> value map.
     *
     * @return {Map<String, String>} modal field results
     * @memberof Modal
     */
    #getFieldData() {

        const fieldData = {};

        for (const field of this.#fields) {
            fieldData[field.name] = field.value;
        }

        return fieldData;
    }
}


/**
 * Used to present simple popup
 * with provided message, title and action name.
 *
 * @param {String} title title of modal
 * @param {String} message message to show
 * @param {String} confirmAction name of action
 */
async function presentModal(title, message, confirmAction) {
    const alert = new Alert();

    alert.addAction(confirmAction);
    alert.title = title;
    alert.message = message;
    
    await alert.present();
}


/**
 * Used to present error popup
 * with provided message.
 *
 * @param {String} message message to show
 */
async function showError(message) {
    return await presentModal(
        tr("modal_errorModalTitle"),
        message,
        tr("modal_errorModalOkActionName")
    );
}


/**
 * Used to present warning popup
 * with provided message.
 *
 * @param {String} message message to show
 */
async function showWarning(message) {
    return await presentModal(
        tr("modal_warnModalTitle"),
        message,
        tr("modal_warnModalOkActionName")
    )
}


function modal() {
    return new Modal();
}


module.exports = {
    modal,
    showError,
    showWarning,
    ModalRule
};

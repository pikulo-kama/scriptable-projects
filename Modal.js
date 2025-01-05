// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const { tr } = importModule("Localization");


class ModalRule {

    static NotEmpty = new ModalRule(
        field => tr("modal_fieldCantBeEmptyMessage", field.label),
        value => !!value && String(value).length !== 0
    );

    static Number = new ModalRule(
        field => tr("modal_fieldShouldBeNumberMessage", field.label),
        value => String(value).match("^[0-9]+$")
    );

    constructor(messageFunction, ruleFunction) {
        this.messageFunction = messageFunction;
        this.ruleFunction = ruleFunction;
    }
}


class ModalResult {

    constructor(choice, isCancelled, data) {
        this.__choice = choice;
        this.__isCancelled = isCancelled;
        this.__data = data;
    }

    choice() {
        return this.__choice;
    }

    isCancelled() {
        return this.__isCancelled;
    }

    get(name) {
        return this.__data[name];
    }
}


class Field {

    constructor(modal) {
        this.__modal = modal;
        this.__name = undefined;
        this.__label = undefined;
        this.__initialValue = undefined;
        this.__validations = [];
    }

    name(name) {
        this.__name = name;
        return this;
    }

    label(label) {
        this.__label = label;
        return this;
    }

    initial(initialValue) {
        this.__initialValue = initialValue;
        return this;
    }

    addValidation(validation) {
        this.__validations.push(validation);
        return this;
    }

    validations(validations) {
        validations.forEach(validation => this.addValidation(validation));
        return this;
    }

    add() {
        const modal = this.__modal;

        const field = {
            id: modal.__fields.length,
            name: this.__name,
            label: this.__label,
            previousValue: this.__initialValue,
            validations: this.__validations
        };

        modal.__fields.push(field);
        return modal;
    }
}


class Modal {

    constructor() {
        this.__title = "";
        this.__cancelLabel = tr("modal_cancelActionName");
        this.__actions = [];
        this.__fields = [];

        this.__alert = null;
        this.__modalResult = null;
        this.__internalData = {};
    }

    title(title) {
        this.__title = title;
        return this;
    }

    cancelLabel(cancelLabel) {
        this.__cancelLabel = cancelLabel;
        return this;
    }

    actions(actions) {
        this.__actions = actions;
        return this;
    }

    field() {
        return new Field(this);
    }

    async present() {

        this.__alert = new Alert();
        this.__alert.title = this.__title;

        // Add actions
        this.__actions.forEach(action => this.__alert.addAction(action));
        this.__alert.addCancelAction(this.__cancelLabel);

        // Add fields
        this.__fields.forEach(field => this.__alert.addTextField(field.label, field.previousValue));
    
        const resultCode = await this.__alert.presentAlert();
        let selectedAction = this.__actions[resultCode];
        let isCancelled = false;

        if (!selectedAction) {
            selectedAction = this.__cancelLabel;
            isCancelled = true;
        }

        if (!isCancelled) {
            // Process modal field changes.
            await this.__processFields();
        }

        return new ModalResult(selectedAction, isCancelled, this.__internalData);
    }

    async __processFields() {

        // Save values provided by user.
        for (let field of this.__fields) {
            
            let fieldValue = this.__alert.textFieldValue(field.id);

            field.previousValue = fieldValue;
            this.__internalData[field.name] = fieldValue;
        }

        let hasErrors = false;

        // Perform validations.
        // Validation should happen after all data from form
        // fields have been taken, otherwise it's being lost
        // since error modal closes main modal we end up losing 
        // data provided by user.
        for (let field of this.__fields) {

            let fieldValue = this.__internalData[field.name];

            for (let validation of field.validations) {

                if (validation.ruleFunction(fieldValue)) {
                    continue;
                }

                let errorMessage = validation.messageFunction(field);
                await this.__presentErrorModal(errorMessage);
                
                hasErrors = true;
            }
        }

        if (hasErrors) {
            await this.present();
        }
    }

    async __presentErrorModal(message) {

        let errorAlert = new Alert();

        errorAlert.addAction(tr("modal_errorModalOkActionName"));
        errorAlert.title = tr("modal_errorModalTitle");
        errorAlert.message = message;
        
        await errorAlert.present();
    }
}


function modal() {
    return new Modal();
}

module.exports = {
    modal,
    ModalRule
};

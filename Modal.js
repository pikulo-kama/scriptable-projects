// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const { tr } = importModule("Localization");


class ModalRule {

    static NotEmpty = new ModalRule(
        field => tr("err_field_cant_be_empty", field.label),
        value => !!value && String(value).length !== 0
    );

    static Number = new ModalRule(
        field => tr("err_field_should_be_number", field.label),
        value => String(value).match("^[0-9]+$")
    );

    constructor(messageFunction, ruleFunction) {
        this.messageFunction = messageFunction;
        this.ruleFunction = ruleFunction;
    }
}


class ModalResult {

    constructor(choice, isCancelled) {
        this.__choice = choice;
        this.__isCancelled = isCancelled;
        this.__data = {};
    }

    choice() {
        return this.__choice;
    }

    isCancelled() {
        return this.__isCancelled;
    }

    set(name, value) {
        this.__data[name] = value;
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

    addValidation(modalRule) {
        this.__validations.push(modalRule);
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
        this.__alert = new Alert();
        this.__title = "";
        this.__cancelLabel = tr("default_cancel_action");
        this.__actions = [];
        this.__fields = [];

        this.__modalResult = null;
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

        this.__alert.title = this.__title;

        // Add actions
        this.__actions.forEach(action => this.__alert.addAction(action));
        this.__alert.addCancelAction(this.__cancelLabel);

        // Add fields
        this.__fields.forEach(field => this.__alert.addTextField(field.label, field.previousValue));
    
        const resultCode = await this.__alert.presentAlert();
        const selectedAction = this.__actions[resultCode];
        let isCancelled = false;

        if (!selectedAction) {
            selectedAction = this.__cancelLabel;
            isCancelled = true;
        }

        this.__modalResult = new ModalResult(selectedAction, isCancelled);
        // Process modal field changes.
        this.__processFields();

        return this.__modalResult;
    }

    async __processFields() {

        for (let field of this.__fields) {
            
            let fieldValue = this.__alert.textFieldValue(field.id);
            field.previousValue = fieldValue;

            if (fieldValue === "") {
                fieldValue = undefined;
            }

            this.__modalResult.set(field.name, fieldValue);
                
            if (this.__modalResult.isCancelled()) {
                continue;
            }
            
            // Process field validations.
            for (let validation of field.validations) {

                if (!validation.ruleFunction(fieldValue)) {
                    
                    let errorMessage = validation.messageFunction(field);
                    await this.__presentErrorModal(errorMessage);
                    await this.present();
                }
            }
        }
    }

    async __presentErrorModal(message) {

        let errorAlert = new Alert();

        errorAlert.addAction(tr("error_modal_action"));
        errorAlert.title = tr("error_modal_title");
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

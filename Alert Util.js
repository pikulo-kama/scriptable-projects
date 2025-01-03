// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const { Locale } = importModule("Localization");

class AlertRule {

    static NotEmpty = new AlertRule(
        field => Locale.tr("err_field_cant_be_empty").replace("%field_name", field.label),
        value => !!value && String(value).length !== 0
    );

    static Number = new AlertRule(
        field => Locale.tr("err_field_should_be_number").replace("%field_name", field.label),
        value => String(value).match("^[0-9]+$")
    );

    constructor(messageFunction, ruleFunction) {
        this.messageFunction = messageFunction;
        this.ruleFunction = ruleFunction;
    }
}

class AlertUtil {

    static async createCancelableAlert(configIn) {

        let result = {
            choice: null,
            data: {}
        };
        
        if (configIn === undefined) {
            return result;
        }
        
        const config = {
            actions: configIn.actions ?? [],
            title: configIn.title ?? "",
            fields: configIn.fields ?? [],
            cancelLabel: configIn.cancelLabel ?? Locale.tr("default_cancel_action")
        };
        
        if (typeof config.actions == "string") {
            config.actions = [config.actions];
        }
        
        const alert = new Alert();
        alert.addCancelAction(config.cancelLabel);
        
        for (let action of config.actions) {
            alert.addAction(action);
        }
        
        alert.title = config.title;
        
        for (let field of config.fields) {

            if (field.initial === undefined) {
                alert.addTextField(field.label);

            } else {
                alert.addTextField(field.label, field.initial);
            }
        }
    
        let code = await alert.presentAlert();
        
        result.choice = code === -1 ? config.cancelLabel : config.actions[code];
        result.isCancelled = result.choice === config.cancelLabel;
        result[`is${result.choice}`] = true;
        
        for (let i = 0; i < config.fields.length; i++) {

            let value = alert.textFieldValue(i);
            config.fields[i].initial = value;
            let field = config.fields[i];
            
            result.data[field.var] = value === "" ? undefined : value;
                
            if (!field.validations || result.isCancelled) {
                continue;
            }
            
            for (let validation of field.validations) {

                if (validation.ruleFunction(value)) {
                    continue;
                }
                    
                let message = validation.message;
                
                if (typeof message == "function") {
                    message = message(field);
                }
            
                await this.__createErrorModal(message).present();
                return this.createCancelableAlert(config);
            }
        }

        return result;
    }

    static __createErrorModal(message) {
        let errorAlert = new Alert()
        
        errorAlert.addAction(Locale.tr("error_modal_action"));
                    
        errorAlert.title = Locale.tr("error_modal_title");
        errorAlert.message = message;
        
        return errorAlert;
    }
}


Locale.registerLabels({
    "err_field_cant_be_empty": "Field '%field_name' cannot be empty",
    "err_field_should_be_number": "Field '%field_name' should be a number",
    "default_cancel_action": "Cancel",
    "error_modal_action": "OK",
    "error_modal_title": "⛔️ Error"
});

module.exports = {
    AlertUtil,
    AlertRule
};

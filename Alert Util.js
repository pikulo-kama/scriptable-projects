// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const root = {
    
    locale: importModule("Localization"),
    
    rules: {
        notEmpty: {
            message: field => root.locale.getLabel("err_field_cant_be_empty").replace("%field_name", field.label),
            rule: value => {
                return !!value && String(value).length !== 0
            }
        },
        number: {
            message: field => root.locale.getLabel("err_field_should_be_number").replace("%field_name", field.label),
            rule: value => String(value).match("^[0-9]+$")
        }
    },
    
    createCancelableAlert: async (configIn) => {
        let res = {
            choice: null,
            data: {}
        }
        
        if (configIn === undefined) {
            return res
        }
        
        const config = {
            actions: configIn.actions ?? [],
            title: configIn.title ?? "",
            fields: configIn.fields ?? [],
            cancelLabel: configIn.cancelLabel ?? root.locale.getLabel("default_cancel_action")
        }
        
        if (typeof config.actions == "string") {
            config.actions = [config.actions]
        }
        
        const alert = new Alert()
        alert.addCancelAction(config.cancelLabel)
        
        for (let action of config.actions) {
            alert.addAction(action)
        }
        
        alert.title = config.title
        
        for (let field of config.fields) {
            if (field.initial === undefined) {
                alert.addTextField(field.label)
            } else {
                alert.addTextField(field.label, field.initial)
            }
        }
    
        let code = await alert.presentAlert()
        
        res.choice = code === -1 ? config.cancelLabel : config.actions[code]
        res.isCancelled = res.choice === config.cancelLabel
        res[`is${res.choice}`] = true
        
        for (let i = 0; i < config.fields.length; i++) {
            let value = alert.textFieldValue(i)
            config.fields[i].initial = value
            let field = config.fields[i]
            
            res.data[field.var] = 
                value === "" ? undefined : value
                
            if (!field.validations || res.isCancelled) {
                continue
            }
            
            for (let validation of field.validations) {
                if (!validation.rule(value)) {
                    
                    let message = validation.message
                    
                    if (typeof message == "function") {
                        message = message(field)
                    }
                
                    await root.createErrorModal(message).present()
                    return root.createCancelableAlert(config)
                }
            }
        }
        return res
    },
    
    createErrorModal: (message) => {
        let errorAlert = new Alert()
        
        errorAlert.addAction(root.locale.getLabel("error_modal_action"))
                    
        errorAlert.title = root.locale.getLabel("error_modal_title")
        errorAlert.message = message
        
        return errorAlert
    }
}

root.locale.registerLabels({
    "err_field_cant_be_empty": "Field '%field_name' cannot be empty",
    "err_field_should_be_number": "Field '%field_name' should be a number",
    "default_cancel_action": "Cancel",
    "error_modal_action": "OK",
    "error_modal_title": "⛔️ Error"
})

module.exports.createCancelableAlert = root.createCancelableAlert
module.exports.rules = root.rules

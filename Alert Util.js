// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: exclamation-triangle;

const root = {
    
    rules: {
        notEmpty: {
            message: field => `Field '${field.label}' cannot be empty`,
            rule: value => {
                return ![null, undefined].includes(value) &&
                    String(value).length !== 0
            }
        },
        number: {
            message: field => `Field '${field.label}' should be a number`,
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
            cancelLabel: configIn.cancelLabel ?? "Cancel"
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
                
            if (!field.validations || res.choice === "Cancel") {
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
        
        errorAlert.addAction("OK")
                    
        errorAlert.title = "⛔️ Error"
        errorAlert.message = message
        
        return errorAlert
    }
}

module.exports.createCancelableAlert = root.createCancelableAlert
module.exports.rules = root.rules
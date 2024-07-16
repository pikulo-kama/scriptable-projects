// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: database;

const root = {
    
    fileImport: importModule("File Util"),
    alertImport: importModule("Alert Util"),
    configImport: importModule("Config Util"),
    
    inputs: {
        datePicker: "datePicker",
        form: "form",
        listForm: "listForm"
    },
    
    
    defaultConfig: {
        storageFile: "storage.json",
        storageScript: Script.name(),
        showSeparators: false,
        header: {
            title: "Table",
            titleColor: Color.darkGray(),
            backgroundColor: Color.white(),
            addNewBtnName: "New"
        },
        creationFields: [],
        dataDefaults: [],
        fields: [],
        deleteField: {
            label: "🗑️",
            weight: 15,
            message: "Are you sure?",
            confirmLabel: "Yes"
        }
    },
    
    
    tableData: [],
    table: new UITable(),
    
    
    buildTable: async configIn => {
        
        root.configImport.store.config = root.defaultConfig
        
        if (configIn != undefined) {
            root.configImport.store.userConfig = configIn
        }
        
        root.table.showSeparators = root.configImport.conf("showSeparators")
        root.tableData = root.getData()
        
        let sortFunction = root.configImport.conf("sort")
        
        if (sortFunction) {
            root.tableData = root.tableData.sort(sortFunction)
        }
        
        await root.syncTable()
        
        root.table.present()
    },
    
    syncTable: async () => {
        root.table.removeAllRows()
        await root.addAdminPanel()
        
        for (let record of root.tableData) {
            await root.addEntryRow(record)
        }
    },
    
    
     addAdminPanel: async () => {
        const adminRow = new UITableRow()
        
        adminRow.isHeader = true
        adminRow.cellSpacing = 0.1
        adminRow.backgroundColor = root.configImport.conf("header.backgroundColor")
        
        const label = adminRow.addText(root.configImport.conf("header.title"))
        label.widthWeight = 410
        label.titleColor = root.configImport.conf("header.titleColor")
        
        const addNewCell = adminRow.addButton(root.configImport.conf("header.addNewBtnName"))
        addNewCell.widthWeight = 40
        addNewCell.onTap = async () => {
            const record = await root.createNewRecord()
            
            if (record != -1) {
                root.tableData.push(record)
                await root.updateRow(record)
            }
        }
        
        root.table.addRow(adminRow)
    },
    
    
    addEntryRow: async (rowData) => {
        let row = new UITableRow()
        
        let fields = root.configImport.conf("fields")
        
        for (let field of fields) {
            let btnLabel = field.label
            let handler = root.getHandler(field, rowData)
            
            if (typeof btnLabel == "function") {
                btnLabel = field.label(rowData)
            }
            
            let btn = row.addButton(btnLabel)
            btn.widthWeight = field.weight
            btn.onTap = async () => {
                
                const handlerFunction = root.getHandlerFunction(handler)
                
                updatedData = await handlerFunction(field, rowData, handler)
                
                if (updatedData == -1) {
                    updatedData = {}
                }
                
                let foundRowData = root.tableData.find(r => r.id == rowData.id)
                root.mergeData(updatedData, foundRowData)
                
                await root.updateRow(foundRowData, row)
            }
        }
        
        await root.addDeleteField(row, rowData)
        root.table.addRow(row)
    },
    
    
    addDeleteField: async (row, rowData) => {
        
        let deleteBtn = row.addButton(root.configImport.conf("deleteField.label"))
        deleteBtn.widthWeight = root.configImport.conf("deleteField.weight")
        deleteBtn.onTap = async () => {
            let res = await root.deleteRecord(row, rowData)
            
            if (res) {
                root.tableData = root.tableData.filter(r => r.id !== rowData.id)
            
                root.table.removeRow(row)
                root.table.reload()
                root.saveData()
            }
        }
    },
    
    
    handleForm: async (field, rowData, handler) => {
        
        let handlerActions = []
        let updatedData = {}
        let actions = []
        
        let title = handler.title
        let fields = handler.fields
        
        if (fields === undefined) {
            fields = []
        }
        
        if (typeof title == "function") {
            title = title(rowData)
        }
        
        if (handler.defaultAction !== undefined) {
            actions.push(handler.defaultAction)
        
        }
        
        if (handler.actions !== undefined) {
            
            handlerActions = handler.actions
            
            if (typeof handler.actions == "function") {
                handlerActions = handler.actions(rowData)
            }
            
            actions = actions.concat(handlerActions.map(a => a.name))
        
        }
        
        if (actions.length == 0) {
            handler.defaultAction = "Ok"
            actions = "Ok"
        }
        
        for (let i = 0; i < fields.length; i++) {
            fields[i].initial = rowData[fields[i].var]
        }
        
        const result = await root.alertImport.createCancelableAlert({
            fields: fields,
            actions: actions,
            title: title
        })
        
        if (result.isCancelled) {
            return -1
        }
        
        let onChangeCallback = root.configImport.conf("onChange")
        
        if (handler.defaultAction == result.choice) {
            
            for (let i = 0; i < fields.length; i++) {
                let varName = fields[i].var
                let newValue = result.data[varName]
                
                let oldValue = rowData[varName]
        
                if (onChangeCallback != undefined && oldValue != newValue) {
                    onChangeCallback(rowData, varName, newValue, oldValue)
                }
                
                updatedData[varName] = newValue
            }
            
        } else {
            
            let actionRecord = handlerActions
                .find(action => action.name == result.choice)
            
            if (actionRecord?.onChoose != undefined) {
                
                let callback = actionRecord.onChoose
                let varName = callback.var
                
                let newValue = callback.callback
                
                if (typeof callback.callback == "function") {
                    newValue = callback.callback(rowData, result.choice)
                }
                
                let oldValue = rowData[varName]
        
                if (onChangeCallback != undefined && oldValue != newValue) {
                    onChangeCallback(rowData, varName, newValue, oldValue)
                }
                
                updatedData[varName] = newValue
            }
        }
        
        return updatedData
    },
    
    
    handleDatePicker: async (field, rowData, handler) => {
        
        const onChangeCallback = root.configImport.conf("onChange")
        const datePicker = new DatePicker()
        
        let updatedData = {}
        let initialSeconds = 0
        
        const hField = handler.hourField
        const mField = handler.minuteField
        
        const initialMinutes = rowData[mField]
        const initialHour = rowData[hField]
        
        if (initialHour !== undefined) {
            initialSeconds += rowData[hField] * 3600
        }
        
        if (initialMinutes !== undefined) {
            initialSeconds += rowData[mField] * 60
        }
        
        datePicker.countdownDuration = initialSeconds
        const seconds = await datePicker.pickCountdownDuration()
        
        const hour = Math.floor(seconds / 3600)
        const minute = seconds / 60 - (hour * 60)
        
        updatedData[hField] = hour
        updatedData[mField] = minute
        
        if (onChangeCallback != undefined && initialMinutes != minute) {
            onChangeCallback(rowData, mField, minute, initialMinutes)
        }
        
        if (onChangeCallback != undefined && initialHour != hour) {
            onChangeCallback(rowData, hField, hour, initialHour)
        }
        
        return updatedData
    },
    
    
    handleListForm: async (field, rowData, handler) => {
        
        let data = {}
        data[field.var] = []
        
        let lastChoice = ""
        
        do {
            let res = await root.alertImport.createCancelableAlert({
                actions: ["Add", "Done"],
                title: field.title,
                fields: [{
                    validations: field.validations,
                    label: field.fieldLabel,
                    var: "tmpField"
                }]
            })
            
            if (res.isCancelled) {
                return -1
            }
            
            lastChoice = res.choice
            data[field.var].push(res.data.tmpField)
            
        } while (lastChoice == "Add")
        
        return data
    },
    
    
    createNewRecord: async () => {
        
        let data = {
            id: await root.getAndIncreaseSequence()
        }
        
        const dataDefaults = root.configImport.conf("dataDefaults")
        const creationFields = root.configImport.conf("creationFields")
        
        for (let rec of dataDefaults) {
            data[rec.var] = rec.default
        }
        
        for (let field of creationFields) {
            
            if (field.triggerWhen != undefined &&
                !field.triggerWhen(data)) {
                
                continue
            }
            
            let handler = root.getHandlerFunction(field)
            let updatedData = await handler(field, data, field)
            
            if (updatedData == -1) {
                return -1
            }
            
            root.mergeData(updatedData, data)
        }
        
        return data
    },
    
    getHandler: (field, rowData) => {
        let handlers = field.handlers
        let handler = undefined
        
        if (Array.isArray(handlers)) {
            
            if (handlers.length != 0 &&
                handlers.length > 1) {
                
                for (let handlerObj of handlers) {
                    
                    if (handlerObj.useWhen(rowData)) {
                        handler = handlerObj
                    }
                }
            }
            
        } else {
            handler = handlers
        }
        
        return handler
    },
    
    getHandlerFunction: handler => {
        if (handler.type == root.inputs.form) {
            return root.handleForm
            
        } else if (handler.type == root.inputs.datePicker) {
            return root.handleDatePicker
            
        } else if (handler.type == root.inputs.listForm) {
            return root.handleListForm
        }
    },
    
    getData: () => {
        let file = root.fileImport.getExtConfiguration(
            root.configImport.conf("storageFile"), 
            "[]",
            root.configImport.conf("storageScript")
        )
        return JSON.parse(file)
    },
    
    getAndIncreaseSequence: async () => {
        let file = root.fileImport.getConfiguration(
            "sequence.json", JSON.stringify({
                next: 0
            })
        )
        
        let sequence = JSON.parse(file)
        let nextValue = sequence.next
        
        sequence.next += 1
        
        await root.fileImport.updateConfiguration(
            "sequence.json", JSON.stringify(sequence)
        )
        
        return nextValue
    },
    
    
    saveData: async () => {
        await root.fileImport.updateConfiguration(
            root.configImport.conf("storageFile"), 
            JSON.stringify(root.tableData))
    },
    
    
    deleteRecord: async (rowData, row) => {
        
        const result = await root.alertImport.createCancelableAlert({
            title: root.configImport.conf("deleteField.message"),
            actions: root.configImport.conf("deleteField.confirmLabel")
        })
        
        if (!result.isCancelled) {
            return true
        }
        
        return false
    },
    
    updateRow: async (newRowData, row) => {      
        root.saveData()
        await root.syncTable()
        root.table.reload()
    },
    
    
    mergeData: (dataIn, objToMerge) => {
        
        if (objToMerge == undefined) {
            objToMerge = {}
        }
        
        for (let key of Object.keys(dataIn)) {
            objToMerge[key] = dataIn[key]
        }
        
        return objToMerge
    }
}


module.exports.inputs = root.inputs
module.exports.buildTable = root.buildTable

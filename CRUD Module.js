// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: database;
const fileImport = importModule("File Util")
const alertImport = importModule("Alert Util")
const configImport = importModule("Config Util")

const root = {
    
    inputs: {
        datePicker: "datePicker",
        form: "form",
        listForm: "listForm"
    },
    
    
    defaultConfig: {
        storageFile: "storage.json",
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
        
        configImport.store.config = root.defaultConfig
        
        if (configIn != undefined) {
            configImport.store.userConfig = configIn
        }
        
        root.table.showSeparators = configImport.conf("showSeparators")
        root.tableData = root.getData()
        
        let sortFunction = configImport.conf("sort")
        
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
        adminRow.backgroundColor = configImport.conf("header.backgroundColor")
        
        const label = adminRow.addText(configImport.conf("header.title"))
        label.widthWeight = 410
        label.titleColor = configImport.conf("header.titleColor")
        
        const addNewCell = adminRow.addButton(configImport.conf("header.addNewBtnName"))
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
        
        let fields = configImport.conf("fields")
        
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
        
        let deleteBtn = row.addButton(configImport.conf("deleteField.label"))
        deleteBtn.widthWeight = configImport.conf("deleteField.weight")
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
        
        const result = await alertImport.createCancelableAlert({
            fields: fields,
            actions: actions,
            title: title
        })
        
        if (result.isCancelled) {
            return -1
        }
        
        let onChangeCallback = configImport.conf("onChange")
        
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
        
        const onChangeCallback = configImport.conf("onChange")
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
            let res = await alertImport.createCancelableAlert({
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
        
        const dataDefaults = configImport.conf("dataDefaults")
        const creationFields = configImport.conf("creationFields")
        
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
        
        console.log(handlers)
        console.log(handlers instanceof Array)
        
        if (Array.isArray(handlers)) {
            
            if (handlers.length != 0 &&
                handlers.length > 1) {
                
                for (let handlerObj of handlers) {
                    
                    console.log(handlerObj.useWhen(rowData))
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
        let file = fileImport.getConfiguration(
            configImport.conf("storageFile"), 
            "[]"
        )
        return JSON.parse(file)
    },
    
    getAndIncreaseSequence: async () => {
        let file = fileImport.getConfiguration(
            "sequence.json", JSON.stringify({
                next: 0
            })
        )
        
        let sequence = JSON.parse(file)
        let nextValue = sequence.next
        
        sequence.next += 1
        
        await fileImport.updateConfiguration(
            "sequence.json", JSON.stringify(sequence)
        )
        
        return nextValue
    },
    
    
    saveData: async () => {
        await fileImport.updateConfiguration(
            configImport.conf("storageFile"), 
            JSON.stringify(root.tableData))
    },
    
    
    deleteRecord: async (rowData, row) => {
        
        const result = await alertImport.createCancelableAlert({
            title: configImport.conf("deleteField.message"),
            actions: configImport.conf("deleteField.confirmLabel")
        })
        
        if (!result.isCancelled) {
            return true
        }
        
        return false
    },
    
    
    updateRow: async (newRowData, row) => {
        
//         if (row != undefined) {
//             root.table.removeRow(row)
//         }
// 
//         await root.addEntryRow(newRowData)
        
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


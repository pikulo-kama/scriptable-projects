// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: database;

const { FileUtil } = importModule("File Util");
const { AlertUtil } = importModule("Alert Util");
const { Locale } = importModule("Localization");
const { ConfigStore } = importModule("Config Util");

const root = {

    __configStore: new ConfigStore(),
    
    inputs: {
        datePicker: "datePicker",
        form: "form",
        listForm: "listForm"
    },
    
    filterTypes: {
        boolean: "boolean",
        text: "text"
    },
    
    filterTypeHandlers: () => ({
        boolean: root.handleBooleanFilter,
        text: root.handleTextFilter
    }),
    
    defaultConfig: {
        filterStorageFile: "filter.json",
        storageFile: "storage.json",
        storageScript: Script.name(),
        showSeparators: false,
        header: {
            titleColor: Color.darkGray(),
            backgroundColor: Color.white()
        },
        creationFields: [],
        dataDefaults: [],
        fields: [],
        filterFields: [],
        deleteField: {
            weight: 15
        }
    },
    
    
    tableData: [],
    table: new UITable(),
    
    
    buildTable: async configIn => {
        
        root.__configStore.setConfig(root.defaultConfig);
        root.__configStore.overrideConfig(configIn);
        
        root.table.showSeparators = root.__configStore.get("showSeparators")
        root.tableData = root.getData()
        
        let sortFunction = root.__configStore.get("sort")
        
        if (sortFunction) {
            root.tableData = root.tableData.sort(sortFunction)
        }
        
        await root.syncTable()
        
        root.table.present()
    },
    
    syncTable: async () => {
        root.table.removeAllRows()
        await root.addAdminPanel()
        
        let data = root.getFilteredData()
        
        for (let record of data) {
            await root.addEntryRow(record)
        }
    },
    
    
    getFilteredData: () => {
        
        let filters = root.getAppliedFilters()
        let data = root.tableData
        
        for (filterField of Object.keys(filters)) {
            
            let filterValue = filters[filterField]
            let filterType = root.__configStore.get("filterFields")
                .find(field => field.var === filterField).type
                
            let filterFunction = null
            
            switch (filterType) {
                
                case root.filterTypes.boolean: {
                    filterFunction = row => row[filterField] === filterValue
                }
                case root.filterTypes.text: {
                    filterFunction = row => String(row[filterField]).toLowerCase()
                        .includes(String(filterValue).toLowerCase())
                }
            }
            
            data = data.filter(filterFunction)
        }
        
        return data
    },
    
    
     addAdminPanel: async () => {
        const adminRow = new UITableRow()
        
        adminRow.isHeader = true
        adminRow.cellSpacing = 0.1
        adminRow.backgroundColor = root.__configStore.get("header.backgroundColor")
        
        const label = adminRow.addText(Locale.tr("headerTitle"))
        label.widthWeight = 410
        label.titleColor = root.__configStore.get("header.titleColor")
        
        if (root.__configStore.get("filterFields").length > 0) {
            
            const filterCell = adminRow.addButton(Locale.tr("headerFilterButton"))
            filterCell.widthWeight = 40
            filterCell.onTap = root.openFilterPopup
        }
        
        const addNewCell = adminRow.addButton(Locale.tr("headerCreateButton"))
        addNewCell.widthWeight = 40
        addNewCell.onTap = async () => {
            const record = await root.createNewRecord()
            
            if (record != -1) {
                root.tableData.push(record)
                await root.reloadTable()
            }
        }
        
        root.table.addRow(adminRow)
    },
    
    
    openFilterPopup: async () => {
        
        let clearAllAction = Locale.tr("clearAllFiltersAction")
        let appliedFilters = Object.keys(root.getAppliedFilters())
        
        let filterAppliedLabel = Locale.tr("filterAppliedIndicator")
        let filterFields = root.__configStore.get("filterFields")
            .map(field => {
                let prefix = ""
                
                if (appliedFilters.includes(field.var)) {
                    prefix = filterAppliedLabel + " "
                }
                
                let popupLabel = prefix + field.label
                return {...field, popupLabel}
            })
        
        let actions = filterFields.map(field => field.popupLabel)
        actions.push(clearAllAction)
        
        const result = await AlertUtil.createCancelableAlert({
            actions: actions,
            title: Locale.tr("filterSelectionPopupTitle")
        })
        
        if (result.isCancelled) {
            return
        }
        
        if (result.choice === clearAllAction) {
            root.updateFilters({})
            
        } else {
            let selectedField = filterFields.find(field => field.popupLabel === result.choice)
            let handler = root.filterTypeHandlers()[selectedField.type]
            
            await handler(selectedField)
        }
        
        await root.reloadTable()
    },
    
    
    handleBooleanFilter: async (field) => {
        
        let filters = root.getAppliedFilters()
        let filter = filters[field.var]
        
        const getAction = (condition, label) => {
            let filterAppliedLabel = Locale.tr("filterAppliedIndicator")
            let indicator = (condition ? filterAppliedLabel : "")
            return label.replace("%{applied}", indicator).trim()
        }
        
        let yesAction = getAction(filter === true, Locale.tr("yesBooleanAction"))
        let noAction = getAction(filter === false, Locale.tr("noBooleanAction"))
        let clearAction = Locale.tr("clearFilterAction")
        
        let result = await AlertUtil.createCancelableAlert({
            title: Locale.tr("filterPopupTitle").replace("%{filterName}", field.label),
            actions: [yesAction, noAction, clearAction]
        })
        
        if (result.isCancelled) {
            return
        }
        
        if (result.choice === clearAction) {
            delete filters[field.var]
            
        } else {
            filters[field.var] = result.choice === yesAction
        }
        
        await root.updateFilters(filters)
    },
    
    
    handleTextFilter: async (field) => {
        
        let filters = root.getAppliedFilters()
        let filter = filters[field.var]
        
        let applyFilterAction = Locale.tr("applyFilterAction")
        let clearFilterAction = Locale.tr("clearFilterAction")
        
        let result = await AlertUtil.createCancelableAlert({
            title: Locale.tr("filterPopupTitle").replace("%{filterName}", field.label),
            actions: [applyFilterAction, clearFilterAction],
            fields: [{
                var: field.var,
                initial: filter,
                label: field.label
            }]
        })
        
        if (result.isCancelled) {
            return
        }
        
        if (result.choice === applyFilterAction) {
            filters[field.var] = result.data[field.var]
            
        } else if (result.choice === clearFilterAction) {
            delete filters[field.var]
        }
        
        await root.updateFilters(filters)
    },
    
    
    getAppliedFilters: () => {
        return FileUtil.readLocalJson(
            root.__configStore.get("filterStorageFile"),
            {}
        );
    },
    
    
    updateFilters: async content => {
        await FileUtil.updateLocalJson(
            root.__configStore.get("filterStorageFile"),
            content
        );
    },
    
    
    addEntryRow: async (rowData) => {
        let row = new UITableRow()
        
        let fields = root.__configStore.get("fields")
        
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
                
                await root.reloadTable()
            }
        }
        
        await root.addDeleteField(row, rowData)
        root.table.addRow(row)
    },
    
    
    addDeleteField: async (row, rowData) => {
        
        let deleteBtn = row.addButton(Locale.tr("deleteFieldLabel"))
        deleteBtn.widthWeight = root.__configStore.get("deleteField.weight")
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
            
            let defaultUpdateLabel = Locale.tr("formDefaultUpdateLabel")
            
            handler.defaultAction = defaultUpdateLabel
            actions = defaultUpdateLabel
        }
        
        for (let i = 0; i < fields.length; i++) {
            fields[i].initial = rowData[fields[i].var]
        }
        
        const result = await AlertUtil.createCancelableAlert({
            fields: fields,
            actions: actions,
            title: title
        })
        
        if (result.isCancelled) {
            return -1
        }
        
        let onChangeCallback = root.__configStore.get("onChange")
        
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
        
        const onChangeCallback = root.__configStore.get("onChange")
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
            let res = await AlertUtil.createCancelableAlert({
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
        
        const dataDefaults = root.__configStore.get("dataDefaults")
        const creationFields = root.__configStore.get("creationFields")
        
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
        return FileUtil.readJson(
            root.__configStore.get("storageScript"),
            root.__configStore.get("storageFile"),
            []
        );
    },
    
    getAndIncreaseSequence: async () => {

        let sequence = FileUtil.readLocalJson("sequence.json", {next: 0});

        sequence.next += 1
        
        await FileUtil.updateLocalJson("sequence.json", sequence);
        return sequence.next;
    },
    
    
    saveData: async () => {
        await FileUtil.updateLocalJson(
            root.__configStore.get("storageFile"),
            root.tableData
        );
    },
    
    
    deleteRecord: async (rowData, row) => {
        
        const result = await AlertUtil.createCancelableAlert({
            title: Locale.tr("deleteFieldMessage"),
            actions: Locale.tr("deleteFieldConfirmAction")
        })
        
        if (!result.isCancelled) {
            return true
        }
        
        return false
    },
    
    reloadTable: async () => {
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

Locale.registerLabels({
    "deleteFieldConfirmAction": "Yes",
    "deleteFieldMessage": "Are you sure?",
    "deleteFieldLabel": "🗑️",
    "headerTitle": "📺 Shows&Movies",
    "headerFilterButton": "🔎",
    "headerCreateButton": "➕",
    "filterAppliedIndicator": "✅",
    "filterSelectionPopupTitle": "Filter",
    "filterPopupTitle": "Filter by %{filterName}",
    "clearAllFiltersAction": "Clear All",
    "clearFilterAction": "Clear",
    "yesBooleanAction": "%{applied} Yes",
    "noBooleanAction": "%{applied} No",
    "applyFilterAction": "Filter",
    "formDefaultUpdateLabel": "OK"
})

module.exports.filterTypes = root.filterTypes
module.exports.inputs = root.inputs
module.exports.buildTable = root.buildTable

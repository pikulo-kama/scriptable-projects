// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: bell;
const fileUtil = importModule("File Util")
const alertUtil = importModule("Alert Util")

const rates = {
    periodically: "Periodically",
    hourly: "Hourly",
    daily: "Daily"
}

const CONFIG_FILE_NAME = "reminders.json"
let reminders = getConfig()

// Notification.removeAllDelivered()
// Notification.removeAllPending()
// 
console.log(await Notification.allPending())
console.log(await Notification.allDelivered())

if (config.runsWithSiri || true) {
    
    let actions = ["Add"]
    
    if (reminders.length > 0) {
        actions.push("Delete")
    }
    
    let result = await alertUtil.createCancelableAlert({
        title: "Make a choice",
        actions: actions
    })
    
    if (result.isAdd) {
        const reminder = await createNewReminder()
    
        if (reminder !== undefined) {
            await scheduleReminder(reminder)
        }
         
    } else if (result.isDelete) {
        result = await alertUtil.createCancelableAlert({
            title: "Choose reminder to delete",
            actions: reminders.map(r => r.title)
        })
        
        if (!result.isCancelled) {
            
            let reminder = reminders.find(r => r.title == result.choice)
            Notification.removeDelivered([reminder.id])
            Notification.removePending([reminder.id])
            
            reminders = reminders.filter(r => r.title !== result.choice)
            saveConfig()
        }
    }
    
} else if (config.runsInWidget) {
// todo: add widget view
} else if (config.runsInNotification){
    await updateNotificationTriggerDate()
}

Script.complete()

async function updateNotificationTriggerDate() {
        
    let currentReminder = args.notification
    
    console.log(currentReminder)    
    if (currentReminder.userInfo.rate === rates.periodically) {

//         Notification.removeDelivered(
//             [currentReminder.identifier]
//         )
        
        const triggerDate = new Date()
        triggerDate.setMilliseconds(
            triggerDate.getMilliseconds() + reminder.interval
        )
        
        currentReminder.setTriggerDate(triggerDate)
        currentReminder.schedule()
    }
}

async function scheduleReminder(reminder) {
    let notification = new Notification()
    notification.title = reminder.title
    notification.body = reminder.body
    notification.userInfo.rate = reminder.reminderRate
    
    notification.identifier = reminder.id
    
    if (reminder.reminderRate === rates.daily) {
        
        const hour = reminder.time.getHours()
        const minute = reminder.time.getMinutes()
        
        notification.setDailyTrigger(hour, minute, true)
    
    } else if (reminder.reminderRate === rates.periodically) {
        
        const triggerDate = new Date()
        triggerDate.setMilliseconds(
            triggerDate.getMilliseconds() + reminder.interval
        )
        
        notification.setTriggerDate(triggerDate)
    }
    
    await notification.schedule()
}

async function createNewReminder() {
    
    let reminder = {
        id: UUID.string()
    }
    
    let result = await alertUtil.createCancelableAlert({
        fields: [{
            var: "title",
            label: "Reminder",
            validations: [
                alertUtil.rules.notEmpty
            ]
        }, {
            var: "body",
            label: "Description",
            validations: [{
                rule: (value) => String(value).length <= 100,
                message: "Body length shouldn't be more than 100 characters"
            },
            alertUtil.rules.notEmpty]
        }],
        actions: "Next",
        title: "Enter reminder name"
    })
    
    if (result.isCancelled) {
        return
    }
    
    reminder.title = result.data.title
    reminder.body = result.data.body
    
    result = await alertUtil.createCancelableAlert({
        actions: [
            rates.daily,
            rates.hourly,
            rates.periodically,
        ],
        title: "Select notification rate"
    })
    
    if (result.isCancelled) {
        return
    }
    
    reminder.reminderRate = result.choice
    let dp = new DatePicker()
    
    switch (reminder.reminderRate) {
        case rates.periodically:
            let seconds = await dp.pickCountdownDuration()
            reminder.interval = seconds * 1000
            break
            
        case rates.daily:
            let time = await dp.pickTime()
            reminder.time = time
            break
            
        case rates.hourly:
            result = await alertUtil.createCancelableAlert({
                title: "Select hour interval",
                actions: "Next",
                fields: [{
                    var: "interval",
                    label: "Hour Interval",
                    validations: [alertUtil.rules.number]
                }]
            })
            
            if (result.isCancelled) {
                return
            }
            
            reminder.interval = result.data.interval
    }
    
    reminders.push(reminder)
    saveConfig()
    
    return reminder
}

function getConfig() {
    const file = fileUtil.getConfiguration(CONFIG_FILE_NAME, "[]")
    return JSON.parse(file)
}

function saveConfig() {
    fileUtil.updateConfiguration(
        CONFIG_FILE_NAME, JSON.stringify(reminders)
    )
}
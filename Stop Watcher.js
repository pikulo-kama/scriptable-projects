// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: stopwatch;
const fileUtil = importModule("File Util")
const alertUtil = importModule("Alert Util")
const crud = importModule("CRUD Module")


// debug
if (false) {
    buildWidget("TUF")
    return
}

if (config.runsInWidget) {
    buildWidget(args.widgetParameter)
} else {
    await crud.buildTable({
        storageFile: "watchlist.json",
        header: {
            title: "📺 Shows&Movies",
            titleColor: new Color("#364b4d"),
            backgroundColor: new Color("#c5d0d1"),
            addNewBtnName: "➕"
        },
        onChange: (row, field, oldVal, newVal) => {
            
            if (["season", "episode"].includes(field)) {
                row.hour = null
                row.minute = null
            }
        },
        sort: (f, s) => s.isDone - f.isDone || f.id - s.id,
        dataDefaults: [{
            var: "isDone",
            default: false
        }, {
            var: "serieId",
            default: null,
        }, {
            var: "showInSummary",
            default: false
        }, {
            var: "serieName",
            default: "..."
        }, {
            var: "season",
            default: "1"
        }, {
            var: "episode",
            default: "1"
        }, {
            var: "hour",
            default: null
        }, {
            var: "minute",
            default: null
        }],
        fields: [{
            label: getStatusLabel,
            weight: 20,
            handlers: {
                type: crud.inputs.form,
                title: (r) => r.isDone ?  
                        "Mark as in-progress?" :
                        "Have you completed it?",
                actions: [{
                    name: "Yes",
                    onChoose: {
                        callback: r => !r.isDone,
                        var: "isDone"
                    }
                }]
            }
        }, {
            label: r => !!r.serieId ? "🆔" : "❓",
            weight: 20,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "serieId",
                    label: "New Serie ID"
                }],
                actions: [{
                    name: "Toggle Summary View",
                    onChoose: {
                        callback: r => !r.showInSummary,
                        var: "showInSummary"
                    }
                }],
                defaultAction: "Update ID",
                title: r => (r.showInSummary ? "✅" : "⛔️") + " Watchlist Integration"
            }
        }, {
            label: (r) => r.serieName,
            weight: 70,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "serieName",
                    label: "New Serie Name",
                }],
                defaultAction: "Update", 
                title: "Update Serie Name"
            }
        }, {
            label: getTag,
            weight: 50,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "season",
                    label: "Season",
                }, {
                    var: "episode",
                    label: "Episode",
                }],
                actions: [{
                    name: "Next Episode",
                    onChoose: {
                        callback: r => String(Number(r.episode) + 1),
                        var: "episode"
                    }
                }],
                defaultAction: "Update",
                title: "Update Series Data"
            }
        }, {
            label: getTimeCode,
            weight: 30,
            handlers: {
                type: crud.inputs.datePicker,
                hourField: "hour",
                minuteField: "minute"
            }
        }]
    })
}

function getStatusLabel(d) {
    
    return d.isDone ? "✅" : "🎬"
}

function getTag(d) {
    
    return d.isDone ? "➖" :
        `s${d.season}e${d.episode}`
}
    
function getTimeCode(d) {
    
    let value
    
    if (d.isDone) {
        value = "➖"
        
    } else if (!d.hour && !d.minute) {
        value = "TBW"
        
    } else {
        let hour = String(d.hour).length < 2 ?
            "0" + d.hour : d.hour
        
        let minute = String(d.minute).length < 2 ?
            "0" + d.minute : d.minute
        
        value = `${hour}:${minute}`
    }
    
    return value
}

function generateBlack() {
    
    let bound = 5
    let color = ""
    
    while (color.length != 6) {
        color += randInt(bound).toString(16)
    }
    
    return new Color(color)
}

function randInt(i) {
    return Math.floor(Math.random() * i)
}

function buildWidget(serieName) {
    
    const dataFont = 17
    
    let rec = getData()
        .find(r => r.serieName == serieName)
        
    if (!rec) {
        return
    }
    
    let fields = [
        {
            label: "S",
            value: rec.season
        },
        {
            label: "E",
            value: rec.episode
        },
        {
            label: "T",
            value: getTimeCode(rec)
        }
    ]
    
    if (rec.isDone) {
        fields = [
            {
                label: "✓",
                value: "Done"
            }
        ]
    }
    
    const colors = {
        main: generateBlack(),
        reverse: Color.white(),
        sep: Color.lightGray()
    }
    
    const widget = new ListWidget()
    const stack = widget.addStack()
    
    const serieNameWidget = stack.addText(rec.serieName.padEnd(20))
    stack.addSpacer(20)
        
    for (let field of fields) {
        const hStack = stack.addStack()
        hStack.spacing = 7
        hStack.layoutHorizontally()
        
        const label = hStack.addText(field.label)
        
        label.font = Font.boldMonospacedSystemFont(dataFont)
        label.textColor = colors.reverse
        label.textOpacity = .9
        
        const separator = hStack.addText("|")
        
        separator.font = Font.blackRoundedSystemFont(dataFont)
        separator.textColor = colors.sep
        separator.textOpacity = .8
        
        const value = hStack.addText(field.value)
        
        value.font = Font.blackRoundedSystemFont(dataFont)
        value.textColor = colors.reverse
        value.textOpacity = .7
        
    }
    
    stack.addSpacer(rec.isDone ? 50 : 30)
    
    widget.backgroundColor = colors.main
    stack.layoutVertically()
    
    serieNameWidget.font = Font.
         blackMonospacedSystemFont(dataFont + 1)
    serieNameWidget.textColor = colors.reverse
    
    QuickLook.present(widget)
    Script.setWidget(widget)
    Script.complete()
}

function getData() {
    let file = fileUtil.getConfiguration("watchlist.json", "[]")
    return JSON.parse(file)
}

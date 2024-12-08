// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: stopwatch;
const fileUtil = importModule("File Util")
const alertUtil = importModule("Alert Util")
const crud = importModule("CRUD Module")
const locale = importModule("Localization")

await locale.registerLabels({
    "t_serie_name_placeholder": "...",
    "t_completion_status_label_done": "Mark as in-progress?",
    "t_completion_status_label_undone": "Have you completed it?",
    "t_completion_status_toggle_action": "Yes",
    "t_api_integration_serie_set": "🆔",
    "t_api_integration_serie_unset": "❓",
    "t_new_serie_id_label": "New Serie ID",
    "t_toggle_summary_view_action": "Toggle Summary View",
    "t_update_serie_id_action": "Update ID",
    "t_show_in_summary_label": "✅ Watchlist Integration",
    "t_dont_show_in_summary_label": "⛔️ Watchlist Integration",
    "t_serie_name_label": "New Serie Name",
    "t_serie_name_update_action": "Update",
    "t_serie_name_update_title": "Update Serie Name",
    "t_season_label": "Season",
    "t_episode_label": "Episode",
    "t_next_episode_action": "Next Episode",
    "t_season_episode_update_action": "Update",
    "t_season_episode_update_title": "Update Series Data",
    "t_completion_status_completed": "✅",
    "t_completion_status_uncompleted": "🎬",
    "t_season_episode_tag_uncompleted": "s%{season}e%{episode}",
    "t_field_completed": "➖",
    "t_timecode_watched": "%{hour}:%{minute}",
    "t_timecode_unwatched": "TBW",
    "t_filter_button": "🔎",
    "w_season_label": "S",
    "w_episode_label": "E",
    "w_timecode_label": "T",
    "w_completed_label_pt1": "✓",
    "w_completed_label_pt2": "Done",
    "w_label_value_separator": "|"
})

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
            titleColor: new Color("#364b4d"),
            backgroundColor: new Color("#c5d0d1")
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
            default: locale.getLabel("t_serie_name_placeholder")
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
        filterFields: [{
            var: "isDone",
            type: crud.filterTypes.boolean,
            label: "Completed"
        }, {
            var: "serieName",
            type: crud.filterTypes.text,
            label: "Name"
        }],
        fields: [{
            label: getStatusLabel,
            weight: 20,
            handlers: {
                type: crud.inputs.form,
                title: (r) => r.isDone ?  
                        locale.getLabel("t_completion_status_label_done") :
                        locale.getLabel("t_completion_status_label_undone"),
                actions: [{
                    name: locale.getLabel("t_completion_status_toggle_action"),
                    onChoose: {
                        callback: r => !r.isDone,
                        var: "isDone"
                    }
                }]
            }
        }, {
            label: r => !!r.serieId ? locale.getLabel("t_api_integration_serie_set") : 
                                      locale.getLabel("t_api_integration_serie_unset"),
            weight: 20,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "serieId",
                    label: locale.getLabel("t_new_serie_id_label")
                }],
                actions: [{
                    name: locale.getLabel("t_toggle_summary_view_action"),
                    onChoose: {
                        callback: r => !r.showInSummary,
                        var: "showInSummary"
                    }
                }],
                defaultAction: locale.getLabel("t_update_serie_id_action"),
                title: r => r.showInSummary ? locale.getLabel("t_show_in_summary_label") : 
                                              locale.getLabel("t_dont_show_in_summary_label")
            }
        }, {
            label: (r) => r.serieName,
            weight: 70,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "serieName",
                    label: locale.getLabel("t_serie_name_label"),
                }],
                defaultAction: locale.getLabel("t_serie_name_update_action"), 
                title: locale.getLabel("t_serie_name_update_title")
            }
        }, {
            label: getTag,
            weight: 50,
            handlers: {
                type: crud.inputs.form,
                fields: [{
                    var: "season",
                    label: locale.getLabel("t_season_label"),
                }, {
                    var: "episode",
                    label: locale.getLabel("t_episode_label"),
                }],
                actions: [{
                    name: locale.getLabel("t_next_episode_action"),
                    onChoose: {
                        callback: r => String(Number(r.episode) + 1),
                        var: "episode"
                    }
                }],
                defaultAction: locale.getLabel("t_season_episode_update_action"),
                title: locale.getLabel("t_season_episode_update_title")
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
    
    return d.isDone ? locale.getLabel("t_completion_status_completed") : 
        locale.getLabel("t_completion_status_uncompleted")
}

function getTag(d) {

    let tag = d.isDone ? locale.getLabel("t_field_completed") :
        locale.getLabel("t_season_episode_tag_uncompleted")
    
    return tag.replace("%{season}", d.season)
              .replace("%{episode}", d.episode)
}
    
function getTimeCode(d) {
    
    let value
    
    if (d.isDone) {
        value = locale.getLabel("t_field_completed")
        
    } else if (!d.hour && !d.minute) {
        value = locale.getLabel("t_timecode_unwatched")
        
    } else {
        let hour = String(d.hour).length < 2 ?
            "0" + d.hour : d.hour
        
        let minute = String(d.minute).length < 2 ?
            "0" + d.minute : d.minute
        
        value = locale.getLabel("t_timecode_watched")
            .replace("%{hour}", hour)
            .replace("%{minute}", minute)
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
            label: locale.getLabel("w_season_label"),
            value: rec.season
        },
        {
            label: locale.getLabel("w_episode_label"),
            value: rec.episode
        },
        {
            label: locale.getLabel("w_timecode_label"),
            value: getTimeCode(rec)
        }
    ]
    
    if (rec.isDone) {
        fields = [
            {
                label: locale.getLabel("w_completed_label_pt1"),
                value: locale.getLabel("w_completed_label_pt2")
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
        
        const separator = hStack.addText(locale.getLabel("w_label_value_separator"))
        
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

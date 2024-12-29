// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: stopwatch;

const fileUtil = importModule("File Util")
const alertUtil = importModule("Alert Util")
const crud = importModule("CRUD Module")
const locale = importModule("Localization")
const ui = importModule("UI")


const conf = {
    debug: {
        enabled: false,

        forceWidget: false,

        forceSeriesName: false,
        seriesName: "Dungeon GF"
    }
}


class SeriesTableView {

    async present() {

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
                label: this.__getStatusLabel,
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
                label: this.__getTag,
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
                label: this.__getTimeCode,
                weight: 30,
                handlers: {
                    type: crud.inputs.datePicker,
                    hourField: "hour",
                    minuteField: "minute"
                }
            }]
        })
    }

    __getStatusLabel(d) {
    
        return d.isDone ? locale.getLabel("t_completion_status_completed") : 
            locale.getLabel("t_completion_status_uncompleted")
    }
    
    __getTag(d) {
    
        let tag = d.isDone ? locale.getLabel("t_field_completed") :
            locale.getLabel("t_season_episode_tag_uncompleted")
        
        return tag.replace("%{season}", d.season)
                  .replace("%{episode}", d.episode)
    }
        
    __getTimeCode(d) {
        
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
}


class WidgetBuilder {

    constructor() {
        this.__primaryColor = this.__generateBlack();
        this.__separatorColor = Color.lightGray();
        this.__contrastColor = Color.white();
    }

    build(seriesInfo) {

        const root = ui.rootWidget()
            .color(this.__primaryColor)
            .render();
        
        const contentStack = ui.stack()
            .vertical()
            .renderFor(root);
        
        // Series name
        ui.text()
            .content(seriesInfo.serieName.padEnd(20))
            .color(this.__contrastColor)
            .blackMonospacedFont(18)
            .renderFor(contentStack);
        
        ui.spacer().renderFor(contentStack);

        // If watching is still unfinished
        if (!seriesInfo.isDone) {

            this.__addInformationRow(
                locale.getLabel("w_season_label"), 
                seriesInfo.season,
                contentStack
            );
            this.__addInformationRow(
                locale.getLabel("w_episode_label"), 
                seriesInfo.episode,
                contentStack
            );
            this.__addInformationRow(
                locale.getLabel("w_timecode_label"), 
                this.__getTimeCode(seriesInfo),
                contentStack
            );

        // If series marked as watched
        } else {
            this.__addInformationRow(
                locale.getLabel("w_completed_label_pt1"), 
                locale.getLabel("w_completed_label_pt2"),
                contentStack
            );
        }
        
        ui.spacer().renderFor(contentStack);
        return root;
    }

    __addInformationRow(label, value, root) {

        const infoRowStack = ui.stack().renderFor(root);
        
        // Label
        ui.text()
            .content(label)
            .color(this.__contrastColor)
            .opacity(0.9)
            .boldMonospacedFont(17)
            .renderFor(infoRowStack);
            
        ui.spacer().renderFor(infoRowStack, 4);
        
        // Separator
        ui.text()
            .content(locale.getLabel("w_label_value_separator"))
            .color(this.__separatorColor)
            .opacity(0.8)
            .blackRoundedFont(17)
            .renderFor(infoRowStack);
        
        ui.spacer().renderFor(infoRowStack, 4);
        
        // Value
        ui.text()
            .content(value)
            .color(this.__contrastColor)
            .opacity(0.7)
            .blackRoundedFont(17)
            .renderFor(infoRowStack);
    }

    __generateBlack() {

        const randInt = (i) =>  Math.floor(Math.random() * i);
    
        let bound = 5
        let color = ""
        
        while (color.length != 6) {
            color += randInt(bound).toString(16)
        }
        
        return new Color(color)
    }

    __getTimeCode(seriesInfo) {
        
        if (!seriesInfo.hour && !seriesInfo.minute) {
            return locale.getLabel("t_timecode_unwatched");    
        } 

        return locale.getLabel("t_timecode_watched")
            .replace("%{hour}", this.__pad(seriesInfo.hour))
            .replace("%{minute}", this.__pad(seriesInfo.minute));
    }

    __pad(text) {
        let castedText = String(text);

        if (castedText.length < 2) {
            castedText = "0" + castedText;
        }

        return castedText;
    }
}


class SeriesRepository {

    retrieve() {

        let seriesData = fileUtil.getConfiguration("watchlist.json", "[]")
        let seriesJSON = JSON.parse(seriesData);

        return seriesJSON
            .find(record => record.serieName == conf.seriesName);
    }
}


function getSeriesName() {

    let seriesName = conf.debug.forceSeriesName ? 
        conf.debug.seriesName :
        args.widgetParameter;

    if (!seriesName) {
        throw new Error("Series name was not provided.");
    }

    return seriesName;
}


conf.seriesName = getSeriesName();

if (config.runsInWidget || conf.debug.forceWidget) {
    const repository = new SeriesRepository();
    const seriesInfo = repository.retrieve();

    if (seriesInfo) {

        const builder = new WidgetBuilder();
        const widget = builder.build(seriesInfo);

        ui.present(widget);
    }

// Runs in app - show table
} else {
    const tableView = new SeriesTableView();
    await tableView.present();
}

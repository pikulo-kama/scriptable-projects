// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: stopwatch;

const { FileUtil } = importModule("File Util");
const crud = importModule("CRUD Module");
const { tr } = importModule("Localization");
const {
    spacer,
    stack,
    text,
    image,
    rootWidget,
    present
} = importModule("UI")


const conf = {
    debug: {
        enabled: false,

        forceWidget: false,

        forceSeriesName: false,
        seriesName: "AoT"
    }
}


class WidgetBuilder {

    constructor() {
        this.__darkColorHex = this.__generateDarkHex();
    }

    build(seriesInfo) {

        const root = rootWidget()
            .gradient()
                .color(0.05, this.__getDarkColor())
                .color(0.7, new Color("a9a9a9"))
                .topToBottom()
                .create()
            .render();
        
        const contentStack = stack()
            .vertical()
            .renderFor(root);
            
        this.__renderSeriesName(seriesInfo, contentStack);
        spacer().renderFor(contentStack);
        
        this.__renderTimeCode(seriesInfo, contentStack);
        spacer().renderFor(contentStack, 4);
        this.__renderInfo(seriesInfo, contentStack);
        spacer().renderFor(contentStack);
        
        return root;
    }
    
    __renderSeriesName(seriesInfo, root) {
        
        const wrapper = stack().renderFor(root);
        
        // Series name
        text()
            .content(seriesInfo.serieName)
            .limit(16)
            .centerAlign()
            .color(Color.white())
            .blackMonospacedFont(18)
            .renderFor(wrapper);
    }

    __renderTimeCode(seriesInfo, root) {
        
        let contentWidget;
        const wrapper = stack()
            .color(this.__getDarkColor(0.9))
            .width(100)
            .padding(1, 7)
            .radius(5)
            .renderFor(root);
        
        if (seriesInfo.isDone) {
            contentWidget = image()
                .icon("checkmark.circle")
                .size(24);
                
        } else {
            contentWidget = text()
                .content(this.__getTimeCode(seriesInfo))
                .blackFont(24);
        }
        
        contentWidget
            .color(Color.white())
            .opacity(0.9)
            .renderFor(wrapper);
    }
    
    __renderInfo(seriesInfo, root) {
        
        let contentWidget;
        const wrapper = stack()
            .borderColor(Color.white())
            .borderWidth(5)
            .width(80)
            .padding(2, 7)
            .radius(5)
            .renderFor(root);
            
        if (seriesInfo.isDone) {
            contentWidget = image()
                .icon("checkmark")
                .heavyWeight()
                .size(14);
            
        } else {
            
            const {
                season,
                episode
            } = seriesInfo;
            
            contentWidget = text()
                .content(`s${season}e${episode}`)
                .blackFont(17);
        }
            
        contentWidget
            .color(this.__getDarkColor())
            .opacity(0.9)
            .renderFor(wrapper);
    }
    
    __getDarkColor(opacity = 1) {
        return new Color(
            this.__darkColorHex,
            opacity
        );
    }

    __generateDarkHex() {
        
        const bound = 5;
        
        const randInt = (i) =>  Math.floor(Math.random() * i);
        const createColorPart = (bound) => randInt(bound).toString(16);
        
        return createColorPart(bound) +
               createColorPart(bound) +
               createColorPart(bound);
    }

    __getTimeCode(seriesInfo) {
        
        if (!seriesInfo.hour && !seriesInfo.minute) {
            return tr("t_timecode_unwatched");    
        } 

        return tr("t_timecode_watched",
            this.__pad(seriesInfo.hour),
            this.__pad(seriesInfo.minute)
        );
    }

    __pad(text) {
        let castedText = String(text);

        if (castedText.length < 2) {
            castedText = "0" + castedText;
        }

        return castedText;
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
                default: tr("t_serie_name_placeholder")
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
                            tr("t_completion_status_label_done") :
                            tr("t_completion_status_label_undone"),
                    actions: [{
                        name: tr("t_completion_status_toggle_action"),
                        onChoose: {
                            callback: r => !r.isDone,
                            var: "isDone"
                        }
                    }]
                }
            }, {
                label: r => !!r.serieId ? tr("t_api_integration_serie_set") : 
                                          tr("t_api_integration_serie_unset"),
                weight: 20,
                handlers: {
                    type: crud.inputs.form,
                    fields: [{
                        var: "serieId",
                        label: tr("t_new_serie_id_label")
                    }],
                    actions: [{
                        name: tr("t_toggle_summary_view_action"),
                        onChoose: {
                            callback: r => !r.showInSummary,
                            var: "showInSummary"
                        }
                    }],
                    defaultAction: tr("t_update_serie_id_action"),
                    title: r => r.showInSummary ? tr("t_show_in_summary_label") : 
                                                  tr("t_dont_show_in_summary_label")
                }
            }, {
                label: (r) => r.serieName,
                weight: 70,
                handlers: {
                    type: crud.inputs.form,
                    fields: [{
                        var: "serieName",
                        label: tr("t_serie_name_label"),
                    }],
                    defaultAction: tr("t_serie_name_update_action"), 
                    title: tr("t_serie_name_update_title")
                }
            }, {
                label: this.__getTag,
                weight: 50,
                handlers: {
                    type: crud.inputs.form,
                    fields: [{
                        var: "season",
                        label: tr("t_season_label"),
                    }, {
                        var: "episode",
                        label: tr("t_episode_label"),
                    }],
                    actions: [{
                        name: tr("t_next_episode_action"),
                        onChoose: {
                            callback: r => String(Number(r.episode) + 1),
                            var: "episode"
                        }
                    }],
                    defaultAction: tr("t_season_episode_update_action"),
                    title: tr("t_season_episode_update_title")
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
    
        return d.isDone ? tr("t_completion_status_completed") : 
            tr("t_completion_status_uncompleted")
    }
    
    __getTag(d) {
    
        return d.isDone ? 
            tr("t_field_completed") :
            tr("t_season_episode_tag_uncompleted", d.season, d.episode);
    }
        
    __getTimeCode(d) {
        
        let value
        
        if (d.isDone) {
            value = tr("t_field_completed")
            
        } else if (!d.hour && !d.minute) {
            value = tr("t_timecode_unwatched")
            
        } else {
            let hour = String(d.hour).length < 2 ?
                "0" + d.hour : d.hour
            
            let minute = String(d.minute).length < 2 ?
                "0" + d.minute : d.minute
            
            value = tr("t_timecode_watched", hour, minute);
        }
        
        return value
    }
}


class SeriesRepository {

    retrieve() {
        return FileUtil.readLocalJson("watchlist.json", [])
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


if (config.runsInWidget || conf.debug.forceWidget) {
    
    conf.seriesName = getSeriesName();
    const repository = new SeriesRepository();
    const seriesInfo = repository.retrieve();

    if (seriesInfo) {

        const builder = new WidgetBuilder();
        const widget = builder.build(seriesInfo);

        present(widget);
    }

// Runs in app - show table
} else {
    const tableView = new SeriesTableView();
    await tableView.present();
}

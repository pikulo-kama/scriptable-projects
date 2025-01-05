// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: stopwatch;

const { FileUtil } = importModule("File Util");
const { ModalRule } = importModule("Modal");
const { tr } = importModule("Localization");

const {
    spacer,
    stack,
    text,
    image,
    rootWidget,
    present
} = importModule("UI");

const {
    BoolDataField,
    TextDataField,
    NumberDataField,
    UIForm,
    UIDatePicker,
    UIDeleteRowField,
    UIFormAction,
    UIFormField,
    UIDataTable
} = importModule("CRUD Module");


const conf = {
    debug: {
        enabled: false,

        forceWidget: false,

        forceSeriesName: false,
        seriesName: "Naruto"
    }
}


function pad(text) {
    let castedText = String(text);

    if (castedText.length < 2) {
        castedText = "0" + castedText;
    }

    return castedText;
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
            return tr("stopWatcher_timeCodePlaceholder");    
        } 

        return tr("stopWatcher_timeCodeLabel",
            pad(seriesInfo.hour),
            pad(seriesInfo.minute)
        );
    }
}


class SeriesTableView {

    static __STORAGE_FILE = "watchlist.json";

    constructor() {
        this.__isDoneField = new BoolDataField("isDone", false);
        this.__seriesIdField = new TextDataField("serieId");
        this.__showInSummaryField = new BoolDataField("showInSummary", false);
        this.__serieNameField = new TextDataField("serieName", tr("stopWatcher_serieNamePlaceholder"));
        this.__seasonField = new TextDataField("season", "1");
        this.__episodeField = new TextDataField("episode", "1");
        this.__hourField = new NumberDataField("hour");
        this.__minuteField = new NumberDataField("minute");
    }

    async present() {

        const uiFields = this.__getUIFields()
        const dataFields = [
            this.__isDoneField,
            this.__seriesIdField,
            this.__showInSummaryField,
            this.__serieNameField,
            this.__seasonField,
            this.__episodeField,
            this.__hourField,
            this.__minuteField
        ];

        const table = new UIDataTable();
        table.title = tr("stopWatcher_tableTitle");
        table.rowHeight = 50;
        table.showSeparators()

        table.allowCreation();
        table.setTableData(FileUtil.readLocalJson(SeriesTableView.__STORAGE_FILE, []));
        table.onDataModification((tableData) => FileUtil.updateLocalJson(SeriesTableView.__STORAGE_FILE, tableData));
        table.onFieldChange(this.__onFieldChange);

        table.setDataFields(dataFields);
        table.setUIFields(uiFields);

        table.addFilterField(this.__isDoneField, "Completed");
        table.addFilterField(this.__serieNameField, "Name");

        table.setSortingFunction((first, second) => 
            second.isDone - first.isDone || first.id - second.id
        );

        await table.present();
    }

    __getUIFields() {

        // Status Field
        const statusUIField = new UIForm(this.__getStatusLabel, 20);
        statusUIField.setFormTitleFunction(this.__getStatusFormTitle);
        const toggleStatusAction = new UIFormAction(tr("stopWatcher_toggleStatusActionName"));
        toggleStatusAction.addCallback(this.__isDoneField, (series) => !series.isDone);
        statusUIField.addFormAction(toggleStatusAction);

        // Integration Field
        const apiIntegrationUIField = new UIForm(this.__getApiIntegrationLabel, 20);
        apiIntegrationUIField.setFormTitleFunction(this.__getApiIntegrationFormTitle);
        const seriesIdFormField = new UIFormField(this.__seriesIdField, tr("stopWatcher_apiIntegrationFieldFormLabel"));
        const toggleSummaryViewAction = new UIFormAction(tr("stopWatcher_toggleSummaryViewActionName"));
        toggleSummaryViewAction.addCallback(this.__showInSummaryField, (series) => !series.showInSummary);

        apiIntegrationUIField.addDefaultAction(tr("stopWatcher_updateApiIntegrationIdActionName"));
        apiIntegrationUIField.addFormAction(toggleSummaryViewAction);
        apiIntegrationUIField.addFormField(seriesIdFormField);

        // Series name field
        const serieNameUIField = new UIForm((series) => series.serieName, 70);
        serieNameUIField.setFormTitleFunction(() => tr("stopWatcher_serieNameFormTitle"));
        serieNameUIField.setColor(Color.white());
        const serieNameFormField = new UIFormField(this.__serieNameField, tr("stopWatcher_serieNameFieldFormLabel"));

        serieNameUIField.addDefaultAction(tr("stopWatcher_updateSerieNameActionName"));
        serieNameUIField.addFormField(serieNameFormField);

        // Season/Episode field
        const tagUIField = new UIForm(this.__getTag, 50);
        tagUIField.setFormTitleFunction(() => tr("stopWatcher_tagFormTitle"));
        const seasonFormField = new UIFormField(this.__seasonField, tr("stopWatcher_seasonFieldFormLabel"));
        const episodeFormField = new UIFormField(this.__episodeField, tr("stopWatcher_episodeFieldFormLabel"));
        const nextEpisodeAction = new UIFormAction(tr("stopWatcher_nextEpisodeActionName"));
        
        nextEpisodeAction.addCallback(this.__episodeField, (series) => String(Number(series.episode) + 1));
        seasonFormField.addRule(ModalRule.Number);
        episodeFormField.addRule(ModalRule.Number);

        tagUIField.addDefaultAction(tr("stopWatcher_updateTagActionName"));
        tagUIField.addFormAction(nextEpisodeAction);
        tagUIField.addFormField(seasonFormField);
        tagUIField.addFormField(episodeFormField);

        // Time code field
        const timeCodeUIField = new UIDatePicker(this.__getTimeCode, 30);
        timeCodeUIField.setHourField(this.__hourField);
        timeCodeUIField.setMinuteField(this.__minuteField);

        // Delete field
        const deleteUIField = new UIDeleteRowField(() => tr("stopWatcher_deleteFieldLabel"), 15);

        return [
            statusUIField,
            apiIntegrationUIField,
            serieNameUIField,
            tagUIField,
            timeCodeUIField,
            deleteUIField
        ];
    }

    __onFieldChange(series, field) {
        if (field.getName() === "season" ||
            field.getName() === "episode"
        ) {
            series.hour = null;
            series.minute = null;
        }
    }

    __getApiIntegrationLabel(series) {
        return !!series.serieId ? 
            tr("stopWatcher_integrationIdSetLabel") : 
            tr("stopWatcher_integrationIdUnsetLabel");
    }

    __getApiIntegrationFormTitle(series) {
        return series.showInSummary ? 
            tr("stopWatcher_integrationTitleWhenInSummary") : 
            tr("stopWatcher_integrationTitleWhenNotInSummary");
    }

    __getStatusLabel(series) {
        return series.isDone ? tr("stopWatcher_doneStatusLabel") : 
            tr("stopWatcher_ongoingStatusLabel")
    }

    __getStatusFormTitle(series) {
        return series.isDone ? 
            tr("stopWatcher_statusDoneTitle") :
            tr("stopWatcher_statusOngoingTitle");
    }
    
    __getTag(series) {
        return series.isDone ? 
            tr("stopWatcher_doneStatusFieldPlaceholder") :
            tr("stopWatcher_tagLabel", series.season, series.episode);
    }
        
    __getTimeCode(series) {
        
        if (series.isDone) {
            return tr("stopWatcher_doneStatusFieldPlaceholder");
        }

        if (!series.hour && !series.minute) {
            return tr("stopWatcher_timeCodePlaceholder");
        }

        return tr("stopWatcher_timeCodeLabel", 
            pad(series.hour), 
            pad(series.minute)
        );
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

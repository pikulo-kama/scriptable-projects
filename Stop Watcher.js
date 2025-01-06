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
    },

    storageFileName: "watchlist.json"
}


/**
 * ENTRY POINT
 */
async function main() {

    const seriesList = FileUtil.readLocalJson(conf.storageFileName, [])

    if (config.runsInWidget || conf.debug.forceWidget) {
        
        conf.seriesName = getSeriesName();
        const seriesInfo = seriesList.find(record => record.serieName == conf.seriesName)
    
        if (seriesInfo) {
    
            const builder = new WidgetBuilder(seriesInfo);
            present(builder.build());
        }
    
    // Runs in app - show table
    } else {
        const tableView = new SeriesTableView(seriesList);
        await tableView.present();
    }
}


/**
 * Used to get series name for which
 * widget should be presented.
 * 
 * Not used for UI table.
 * 
 * @returns {String} series name
 */
function getSeriesName() {

    let seriesName = conf.debug.forceSeriesName ? 
        conf.debug.seriesName :
        args.widgetParameter;

    if (!seriesName) {
        throw new Error("Series name was not provided.");
    }

    return seriesName;
}


/**
 * Used to add extra leading '0'
 * to provided text.
 * 
 * Used for hour and minute values
 * to make sure that both hour and minute
 * will always display two digits.
 *
 * @param {String} text string representation of hour/minute
 * @return {String} padded string representation of hour/minute
 */
function pad(text) {
    let castedText = String(text);

    if (castedText.length < 2) {
        castedText = "0" + castedText;
    }

    return castedText;
}


/**
 * Used to build widget for provided user name.
 *
 * @class WidgetBuilder
 */
class WidgetBuilder {

    /**
     * Creates an instance of WidgetBuilder.
     * @param {Object} seriesInfo JSON with series data
     * @memberof WidgetBuilder
     */
    constructor(seriesInfo) {
        this.__seriesInfo = seriesInfo;
        this.__darkColorHex = this.__generateDarkHex();
    }

    /**
     * Used to create widget
     * with series information.
     *
     * @return {ListWidget} series widget
     * @memberof WidgetBuilder
     */
    build() {

        const root = rootWidget()
            .gradient()
                .color(0.05, this.__getDarkColor())
                .color(0.7, new Color("a9a9a9"))
                .color(0.9, Color.white())
                .topToBottom()
                .create()
            .render();
        
        const contentStack = stack()
            .vertical()
            .renderFor(root);
            
        this.__renderSeriesName(contentStack);
        spacer().renderFor(contentStack);
        
        this.__renderTimeCode(contentStack);
        spacer().renderFor(contentStack, 4);
        this.__renderInfo(contentStack);
        spacer().renderFor(contentStack);
        
        return root;
    }
    
    /**
     * Used to render series name
     * on widget.
     *
     * @param {*} root parent widget
     * @memberof WidgetBuilder
     */
    __renderSeriesName(root) {
        
        const wrapper = stack().renderFor(root);
        
        // Series name
        text()
            .content(this.__seriesInfo.serieName)
            .limit(16)
            .centerAlign()
            .color(Color.white())
            .blackMonospacedFont(18)
            .renderFor(wrapper);
    }

    /**
     * Used to render time code
     * of the last moment that was watched.
     * 
     * If status is done then placeholder is
     * shown.
     *
     * @param {*} root parent widget
     * @memberof WidgetBuilder
     */
    __renderTimeCode(root) {
        
        let contentWidget;
        const wrapper = stack()
            .color(this.__getDarkColor(0.9))
            .width(100)
            .padding(1, 7)
            .radius(5)
            .renderFor(root);
        
        if (this.__seriesInfo.isDone) {
            contentWidget = image()
                .icon("checkmark.circle")
                .size(24);
                
        } else {
            contentWidget = text()
                .content(this.__getTimeCode())
                .blackFont(24);
        }
        
        contentWidget
            .color(Color.white())
            .opacity(0.9)
            .renderFor(wrapper);
    }
    
    /**
     * Used to render season and
     * episode block when series are still
     * active, if status is done the placeholder
     * will be displayed.
     *
     * @param {*} root parent widget
     * @memberof WidgetBuilder
     */
    __renderInfo(root) {
        
        let contentWidget;
        const wrapper = stack()
            .borderColor(Color.white())
            .borderWidth(5)
            .width(80)
            .padding(2, 7)
            .radius(5)
            .renderFor(root);
            
        if (this.__seriesInfo.isDone) {
            contentWidget = image()
                .icon("checkmark")
                .heavyWeight()
                .size(14);
            
        } else {
            
            const {
                season,
                episode
            } = this.__seriesInfo;
            
            contentWidget = text()
                .content(`s${season}e${episode}`)
                .blackFont(17);
        }
            
        contentWidget
            .color(this.__getDarkColor())
            .opacity(0.9)
            .renderFor(wrapper);
    }
    
    /**
     * Used to get generated dark color
     * with provided opacity.
     * 
     * By default no opacity.
     *
     * @param {Number} [opacity=1] opacity of color
     * @return {Color} color with applied opacity
     * @memberof WidgetBuilder
     */
    __getDarkColor(opacity = 1) {
        return new Color(
            this.__darkColorHex,
            opacity
        );
    }

    /**
     * Used to generate dark
     * color which is used in gradient
     * and other visual elements.
     *
     * @return {String} HEX value of dark color
     * @memberof WidgetBuilder
     */
    __generateDarkHex() {
        
        const bound = 5;
        
        const randInt = (i) =>  Math.floor(Math.random() * i);
        const createColorPart = (bound) => randInt(bound).toString(16);
        
        return createColorPart(bound) +
               createColorPart(bound) +
               createColorPart(bound);
    }

    /**
     * Used to format time code.
     *
     * @return {String} formatted time code
     * @memberof WidgetBuilder
     */
    __getTimeCode() {
        
        if (!this.__seriesInfo.hour && !this.__seriesInfo.minute) {
            return tr("stopWatcher_timeCodePlaceholder");    
        } 

        return tr("stopWatcher_timeCodeLabel",
            pad(this.__seriesInfo.hour),
            pad(this.__seriesInfo.minute)
        );
    }
}


/**
 * Used to build UI table for
 * editing of series data
 *
 * @class SeriesTableView
 */
class SeriesTableView {

    /**
     * Creates an instance of SeriesTableView.
     * @param {List<Object>} seriesList list of series JSON
     * @memberof SeriesTableView
     */
    constructor(seriesList) {

        this.__seriesList = seriesList;

        this.__isDoneField = new BoolDataField("isDone", false);
        this.__seriesIdField = new TextDataField("serieId");
        this.__showInSummaryField = new BoolDataField("showInSummary", false);
        this.__serieNameField = new TextDataField("serieName", tr("stopWatcher_serieNamePlaceholder"));
        this.__seasonField = new TextDataField("season", "1");
        this.__episodeField = new TextDataField("episode", "1");
        this.__hourField = new NumberDataField("hour");
        this.__minuteField = new NumberDataField("minute");
    }

    /**
     * Renders UI table.
     *
     * @memberof SeriesTableView
     */
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
        table.setTableData(this.__seriesList);
        table.onDataModification((tableData) => FileUtil.updateLocalJson(conf.storageFileName, tableData));
        table.onFieldChange(this.__onFieldChange);

        table.setDataFields(dataFields);
        table.setUIFields(uiFields);

        table.addFilterField(this.__isDoneField, tr("stopWatcher_isDoneFilterName"));
        table.addFilterField(this.__serieNameField, tr("stopWatcher_serieNameFilterName"));

        table.setSortingFunction((first, second) => 
            second.isDone - first.isDone || first.id - second.id
        );

        await table.present();
    }

    /**
     * Used to get table UI fields.
     *
     * @return {List<UIField>} list of UI fields
     * @memberof SeriesTableView
     */
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

    /**
     * Callback function used to
     * handle changes in season and episode.
     * When any of the fields modified will
     * reset time code.
     *
     * @param {*} series
     * @param {*} field
     * @memberof SeriesTableView
     */
    __onFieldChange(series, field) {
        if (field.getName() === "season" ||
            field.getName() === "episode"
        ) {
            series.hour = null;
            series.minute = null;
        }
    }

    /**
     * Used to get label for Episodate
     * API integration UI field.
     *
     * @param {Object} series series JSON record
     * @return {String} label for UI field
     * @memberof SeriesTableView
     */
    __getApiIntegrationLabel(series) {
        return !!series.serieId ? 
            tr("stopWatcher_integrationIdSetLabel") : 
            tr("stopWatcher_integrationIdUnsetLabel");
    }

    /**
     * Used to get title for Episodate
     * API integration field form.
     *
     * @param {Object} series series JSON record
     * @return {String} title for form
     * @memberof SeriesTableView
     */
    __getApiIntegrationFormTitle(series) {
        return series.showInSummary ? 
            tr("stopWatcher_integrationTitleWhenInSummary") : 
            tr("stopWatcher_integrationTitleWhenNotInSummary");
    }

    /**
     * Used to get label for Status UI field.
     *
     * @param {Object} series series JSON record
     * @return {String} status field label
     * @memberof SeriesTableView
     */
    __getStatusLabel(series) {
        return series.isDone ? tr("stopWatcher_doneStatusLabel") : 
            tr("stopWatcher_ongoingStatusLabel")
    }

    /**
     * Used to get title for Status field form.
     *
     * @param {Object} series series JSON record
     * @return {String} title for status form
     * @memberof SeriesTableView
     */
    __getStatusFormTitle(series) {
        return series.isDone ? 
            tr("stopWatcher_statusDoneTitle") :
            tr("stopWatcher_statusOngoingTitle");
    }
    
    /**
     * Used to get label season/episode field.
     *
     * @param {Object} series series JSON record
     * @return {String} label for season/episode field
     * @memberof SeriesTableView
     */
    __getTag(series) {
        return series.isDone ? 
            tr("stopWatcher_doneStatusFieldPlaceholder") :
            tr("stopWatcher_tagLabel", series.season, series.episode);
    }
    
    /**
     * Used to get label for time code field.
     *
     * @param {Object} series series JSON record
     * @return {String} label for time code field
     * @memberof SeriesTableView
     */
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


await main();
Script.complete();

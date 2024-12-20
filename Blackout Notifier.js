// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: moon;

const conf = {
    debug: {
        enable: false,

        forceWidget: false,
        forceIndicator: false,
        forceNoOutages: false,
        forceNotAvailable: false,
        forceAddress: false,

        address: "Івано-Франківськ,Стуса,10",
        currentHour: 17
    },
    
    showGradient: true,
    styleGradient: (gradient) => {
        
        gradient.locations = [0, 0.5];
        gradient.colors = [
            new Color("040059"),
            new Color("030037")
        ];
    }
};


/**
 * Should be used to get instance of ScheduleWebView.
 */
class ScheduleWebViewFactory {
    
    /**
     * Used to get instance of ScheduleWebView.
     * 
     * @returns {ScheduleWebView} schedule web view.
     */
    static getWebView() {
        
        if (conf.debug.enable) {
            return new DebugScheduleWebView();
        }
        
        return new OeIfScheduleWebView();
    }
}


/**
 * Interface.
 * Shouldn't be used directly.
 * 
 * Main attributes:
 * - Should allow to download schedule data.
 * - Should allow to show in-page report.
 * - Should have schedule data separated for today and tomorrow.
 */
class ScheduleWebView {
    
    /**
     * Downloads raw JSON data
     * of outages for today and tomorrow.
     */
    async downloadSchedules() {}

    /**
     * Presents OE web page with schedules report for
     * provided address.
     */
    async present() {}

    /**
     * Used to get today schedule information.
     * 
     * @returns {Schedule} Schedule for today.
     */
    getToday() {}

    /**
     * Used to get tomorrow schedule information.
     * 
     * @returns {Schedule} Schedule for tomorrow.
     */
    getTomorrow() {}

    /**
     * Used to check whether data is present.
     * If data is not available this is most likely due
     * to connection issues on device or host is down.
     * 
     * @returns {boolean} True if available, otherwise False.
     */
    isAvailable() {}
}


/**
 * Used only for debug purposes.
 * Used to emulate all possible scenarios.
 * 
 * This web view was only tested with IF OE data format.
 */
class DebugScheduleWebView extends ScheduleWebView {
    
    getToday() {
        
        let data;
        
        if (conf.debug.forceNoOutages) {
            data = [];
            
        } else {
            
            data = this.__generateSegmentsWithType(8, 0)
                    .concat(this.__generateSegmentsWithType(1, 1))
                    .concat(this.__generateSegmentsWithType(5, 0))
                    .concat(this.__generateSegmentsWithType(4, 2))
                    .concat(this.__generateSegmentsWithType(16, 0))
                    .concat(this.__generateSegmentsWithType(2, 2))
                    .concat(this.__generateSegmentsWithType(7, 0))
                    .concat(this.__generateSegmentsWithType(4, 1))
                    .concat(this.__generateSegmentsWithType(1, 0));
        }
        
        return new Schedule({
            hoursList: data
        });
    }
    
    getTomorrow() {
        
        let data = null;
        
        if (conf.debug.forceIndicator) {
            data = this.__generateSegmentsWithType(48, 1);
        }
        
        return new Schedule({
            hoursList: data
        });
    }
    
    isAvailable() {
        return !conf.debug.forceNotAvailable;
    }
    
    /**
     * Generates list of schedule segments
     * with provided outage type.
     * 
     * @param {Number} amount amount of segments that should be created.
     * @param {Number} type outage type of segmenst.
     * @returns {Array<Object>} list of schedule segments
     */
    __generateSegmentsWithType(amount, type) {
        
        let outages = [];
        
        while (amount-- > 0) {
            outages.push({
                electricity: type
            });
        }
        
        return outages;
    }
}


/**
 * Used to get schedule data from OE IF outage website.
 * 
 * Filed "electicity" represents type of outage.
 * There are three types:
 * - 0 - No outage
 * - 1 - Outage
 * - 2 - Probable outage
 * 
 * Data structure looks like so:
 * 
 * "today": {
 *  "hourList": [
 *      {
 *          "electricity": 0
 *      },
 *      {
 *          "electricity": 1
 *      },
 *      ...
 *  ]
 * }
 */
class OeIfScheduleWebView extends ScheduleWebView {

    constructor() {
        super();

        this._today = null;
        this._tomorrow = null;
        
        this._available = false;
    }

    async downloadSchedules() {

        let webView = await this.__getWebView();
        let schedules = await webView.evaluateJavaScript(this.__getDownloadScheduleJSPayload());

        if (schedules) {

            this._available = true;

            this._today = new Schedule(schedules.graphs.today);
            this._tomorrow = new Schedule(schedules.graphs.tomorrow);
        }
    }

    async present() {

        let webView = await this.__getWebView();

        await webView.evaluateJavaScript(this.__getLoadScheduleReportJSPayload());
        await webView.present();
    }

    getToday() {
        return this._today;
    }

    getTomorrow() {
        return this._tomorrow;
    }

    isAvailable() {
        return this._available;
    }

    /**
     * Wrapper to get web view of OE IF website.
     * 
     * @returns {WebView} web view.
     */
    async __getWebView() {

        let webView = new WebView();
        await webView.loadURL("https://svitlo.oe.if.ua");

        return webView;
    }

    /**
     * JS script that will send request to get outages JSON data.
     * 
     * @returns {String} JS script as text.
     */
    __getDownloadScheduleJSPayload() {
        return "" +
            "$.ajax({" +
            "   url: 'https://be-svitlo.oe.if.ua/GavGroupByAccountNumber'," +
            "   type: 'POST'," +
            "   data: {" +
            "      accountNumber: ''," +
            "      userSearchChoice: 'pob'," +
            "      address: '" + conf.address.address + "'" +
            "   }," +
            "   async: false" +
            "}).responseJSON;";
    }

    /**
     * JS script that will populate address 
     * using data that was provided into widget
     * and then load report.
     * 
     * @returns {String} JS script as text.
     */
    __getLoadScheduleReportJSPayload() {
        return "" +
            "let cityField = document.getElementById('searchCityAdress');" +
            "let streetField = document.getElementById('searchStreetAdress');" +
            "let buildingField = document.getElementById('searchBuildingAdress');" +
            "let submitButton = document.getElementById('adressReport');" +

            "cityField.value = '" + conf.address.city + "';" +
            "streetField.value = '" + conf.address.street + "';" +
            "buildingField.value = '" + conf.address.buildingNumber + "';" +

            "submitButton.click();";
    }
}


/**
 * Used to store list of outage recrords.
 * Also serves as iterator.
 */
class Schedule {
    
    /**
     * @param {Object} rawData JSON object with ras schedule data.
     */
    constructor(rawData) {
        
        this._outageRecords = [];
        this._outageRecordIndex = -1;
        this._hasInfo = true;
        
        this.__fillOutageRecords(rawData);
    }
    
    /**
     * Checks if schedule 
     * was updated with outage information.
     * 
     * @returns {boolean} True if information was updated, otherwise False.
     */
    hasInfo() {
        return this._hasInfo;
    }

    /**
     * Iterator method, checks if there 
     * is next record in collection.
     * 
     * @returns {boolean} True if has next record, otherwise False.
     */
    hasNext() {
        return this._outageRecordIndex + 1 < this._outageRecords.length;
    }

    /**
     * Shifts iterator index and returns next element.
     * 
     * @returns {OutageRecord} next Schedule from collection.
     */
    next() {
        return this._outageRecords[++this._outageRecordIndex];
    }

    /**
     * Used to transform raw JSON
     * into list of outage records.
     * 
     * @param {Object} rawData JSON object with ras schedule data.
     */
    __fillOutageRecords(rawData) {

        let scheduleSegments = rawData?.hoursList;
        
        if (!scheduleSegments) {
            this._hasInfo = false;
            return;
        }
        
        // Get how much minutes each segment of data represents.
        // i.e. 24 hours (24 * 60 = 1440),
        // If 48 segments then 1440 / 48 = 30 = each segment is 30 minutes.
        let scheduleSegmentDuration = new Time(24).getTime() / scheduleSegments.length;
        let outageOrder = 1;
        
        for (let segmentId = 0; segmentId < scheduleSegments.length; segmentId++) {

            let scheduleSegment = scheduleSegments[segmentId];
            let outageType = scheduleSegment.electricity;

            let isNoOutage = outageType == 0;
            let isProbableOutage = outageType == 2;

            if (isNoOutage) {
                continue;
            }
            
            let outageStreak = this.__getOutageStreak(segmentId, scheduleSegments, outageType);

            let outageStart = segmentId * scheduleSegmentDuration;
            let outageEnd = outageStart + (outageStreak * scheduleSegmentDuration);
            
            // Need to shift index
            // since adjacent outages of the same type
            // will be included in current record and 
            // don't need their own.
            segmentId += outageStreak;
            this._outageRecords.push(
                new OutageRecord(Time.of(outageStart), Time.of(outageEnd), isProbableOutage, outageOrder++)
            );
        }
    }

    /**
     * Traverses daily schedule segments recursively.
     * To find amount of adjacent segments with the same outage type.
     * Method also counts segmentIdx that was provided.
     * 
     * Example: If segmentIdx=2 and outageType=1 and scheduleSegments=[type=0, type=2, type=1, type=1, type=0].
     * This method will then return 2 since there are only two adjacent segments with outage type 1.
     * 
     * @param {Number} segmentIdx index of schedule segment for which streak should be found.
     * @param {Array<Object>} scheduleSegments full list of schedule segments.
     * @param {Number} outageType outage type based on which streak should be found.
     * @param {Number} segmentCount This is only used internally by method.
     * @returns {Number} amount of adjacent segments with the same outage type.
     */
    __getOutageStreak(segmentIdx, scheduleSegments, outageType, segmentCount = 1) {

        let nextSegmentIdx = segmentIdx + 1;

        // Break if last schedule segment reached.
        if (nextSegmentIdx >= scheduleSegments.length) {
            return segmentCount;
        }

        let nextSegmentOutageType = scheduleSegments[nextSegmentIdx].electricity;

        // If outage type is the same then look deeper.
        if (nextSegmentOutageType == outageType) {
            return this.__getOutageStreak(nextSegmentIdx, scheduleSegments, outageType, segmentCount + 1);
        }

        return segmentCount;
    }
}


/**
 * DTO used to store outage record.
 */
class OutageRecord {

    static HOUR_RANGE_SEPARATOR = " - ";

    /**
     * @param {Time} startTime time when outage starts.
     * @param {Time} endTime time when outage ends.
     * @param {Boolean} isProbable whether outage is probable or not.
     * @param {Number} order order of outage in schedule.
     */
    constructor(startTime, endTime, isProbable, order) {

        this._startTime = startTime;
        this._endTime = endTime;
        this._isProbable = isProbable;
        this._order = order;
    }

    /**
     * Tells whether schedule is probable or will happen 100%.
     * 
     * @returns {boolean} True if outage is probable, otherwise False.
     */
    isProbable() {
        return this._isProbable;
    }

    /**
     * Tells order of schedule in daily schedule.
     * 
     * @returns {Number} order of the schedule.
     */
    getOrder() {
        return this._order;
    }

    /**
     * Checks if outage record is in past.
     * 
     * @returns {boolean} True if outage record is already in past,
     * otherwise False.
     */
    isPassed() {

        let now = new Date();

        let finishTime = this._endTime;
        let currentTime = new Time(now.getHours() , now.getMinutes());
        
        if (conf.debug.enable) {
            currentTime = new Time(conf.debug.currentHour);
        }

        return currentTime.getTime() >= finishTime.getTime();
    }

    /**
     * Transforms outage record into readable form.
     * Example: 16:30 - 17:00, 21:00, etc.
     * 
     * @returns {String} Visual representation of outage record.
     */
    toString() {

        return this._startTime.toString() +
            OutageRecord.HOUR_RANGE_SEPARATOR +
            this._endTime.toString();
    }
}


class ScheduleWidget {

    /**
     * Entrypoint. Used to render schedule widget.
     * 
     * @param {ScheduleWebView} webView 
     */
    async render(webView) {

        // This is triggered when schedule data was
        // not loaded due to connection issues.
        if (!webView.isAvailable()) {
            this.__present(this.__getNotAvailableRootWidget());
            return;
        }

        const root = this.__createRootWidget();
        const todaySchedule = webView.getToday();

        // Render header of widget (icon + address).
        const headerStack = this.__addStack(root);
        this.__addIcon(headerStack, "lightbulb.slash", 15, null, "regular");
        this.__addSpacer(headerStack, 5);
        this.__addText(headerStack, conf.address.shortAddress, Font.blackRoundedSystemFont(10), new Color("bfbfbf"), null, 16);

        // Add indicator if there are schedules for tomorrow.
        if (webView.getTomorrow().hasInfo()) {
            this.__renderTomorrowScheduleIndicator(root, webView.getTomorrow());
        }

        this.__addSpacer(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            this.__addIcon(root, "lightbulb.fill", 46, Color.yellow(), "heavy");
            this.__addSpacer(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.__renderOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last outage record.
            if (todaySchedule.hasNext()) {
                this.__addSpacer(root, 5);
            }
        }

        this.__present(root);
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget.
     * @param {OutageRecord} outageRecord daily outage record.
     */
    __renderOutageRecord(root, outageRecord) {

        let outageIconCode = outageRecord.getOrder() + ".square.fill";
        let outageIconColor = null;
        let opacity = null;

        // Change styling of outages that may not occur.
        if (outageRecord.isProbable()) {
            outageIconCode = "questionmark.square";
            outageIconColor = Color.yellow();
        }

        // Make outage record slightly transparent if it's already passed.
        if (outageRecord.isPassed()) {
            opacity = 0.6;
        }

        let outageStack = this.__addStack(root);
        this.__addIcon(outageStack, outageIconCode, 16, outageIconColor, null, opacity);
        this.__addSpacer(outageStack, 2);
        this.__addText(outageStack, outageRecord.toString(), Font.blackSystemFont(14), null, opacity);
    }

    /**
     * Used to render indicator that shows whether there would
     * be outages tomorrow or not.
     * 
     * @param {ListWidget} root root widget.
     * @param {Schedule} tomorrowSchedule tomorrow schedule.
     */
    __renderTomorrowScheduleIndicator(root, tomorrowSchedule) {

        let indicatorColor = Color.green();

        if (tomorrowSchedule.hasNext()) {
            indicatorColor = Color.red();
        }

        this.__addSpacer(root, 2);
        const newScheduleStack = this.__addStack(root);
        this.__addSpacer(newScheduleStack, 3);
        this.__addIcon(newScheduleStack, "info.circle.fill", 10, indicatorColor, "light", 0.7);
        this.__addSpacer(newScheduleStack, 3);
        this.__addText(newScheduleStack, "new", Font.blackRoundedSystemFont(10), null, 0.9);
    }

    /**
     * Used to get alternative root widget.
     * This one ised when web view is not available.
     * 
     * @returns {ListWidget} root widget.
     */
    __getNotAvailableRootWidget() {

        const root = this.__createRootWidget();

        this.__addSpacer(root);
        this.__addIcon(root, "network.slash", 46, null, "heavy");
        this.__addSpacer(root);
        
        return root;
    }

    /**
     * Wrapper to create stack.
     * 
     * @param {*} parent parent widget.
     * @returns {StackWidget} stack widget.
     */
    __addStack(parent) {
        let stack = parent.addStack();
        stack.centerAlignContent();

        return stack;
    }

    /**
     * Wrapper to create text widget.
     * 
     * @param {*} parent parent widget.
     * @param {String} text widget text.
     * @param {Font} font font of text.
     * @param {Color} color color of text.
     * @param {Number} opacity opacity of text.
     * @param {Number} maxLength max length of text.
     * @returns {TextWidget} text widget.
     */
    __addText(parent, text, font, color, opacity, maxLength) {

        if (maxLength) {
            text = this.__truncate(text, maxLength);
        }

        let textWidget = parent.addText(text);

        if (font) {
            textWidget.font = font;
        }

        if (color) {
            textWidget.textColor = color;
        }

        if (opacity) {
            textWidget.textOpacity = opacity;
        }

        textWidget.centerAlignText();
        return textWidget;
    }

    /**
     * Wrapper to create image widget.
     * 
     * @param {*} parent parent widget.
     * @param {String} iconCode SF symbol code.
     * @param {Number} size image size.
     * @param {Color} color image color.
     * @param {String} weight SF symbol weight.
     * @param {Number} opacity image opacity.
     * @returns {ImageWidget} image widget.
     */
    __addIcon(parent, iconCode, size, color, weight, opacity) {

        let icon = SFSymbol.named(iconCode);

        if (weight == "light") {
            icon.applyLightWeight();

        } else if (weight == "regular") {
            icon.applyRegularWeight();

        } else if (weight == "heavy") {
            icon.applyHeavyWeight();
        }

        let iconWidget = parent.addImage(icon.image);

        if (size) {
            iconWidget.imageSize = new Size(size, size);
        }

        if (color) {
            iconWidget.tintColor = color;
        }

        if (opacity) {
            iconWidget.imageOpacity = opacity;
        }
        
        iconWidget.centerAlignImage();
        return iconWidget;
    }

    /**
     * Wrapper to add spacer.
     * 
     * @param {*} parent parent widget.
     * @param {Number} size spacer size.
     * @returns {SpacerWidget} spacer widget.
     */
    __addSpacer(parent, size) {
        return parent.addSpacer(size);
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget.
     */
    __createRootWidget() {

        const root = new ListWidget();
        
        if (conf.showGradient) {
            
            const gradient = new LinearGradient();
            conf.styleGradient(gradient);
            root.backgroundGradient = gradient;
        }
        
        return root;
    }

    /**
     * Truncates text to provided length.
     * 
     * @param {String} text text to truncate.
     * @param {Number} maxLength maximum final text length.
     * @returns {String} truncated text.
     */
    __truncate(text, maxLength) {

        if (text.length > maxLength) {
            
            let truncated = text.substring(0, maxLength - 2);
            text = truncated + "..";
        }

        return text;
    }

    /**
     * Used to present root widget.
     * 
     * @param {ListWidget} root root widget.
     */
    __present(root) {
        QuickLook.present(root);
        Script.setWidget(root);
    }
}


/**
 * Stores hour and minute in relativity to the day.
 */
class Time {

    static HOUR_MINUTES = 60;
    static HOUR_MINUTE_SEPARATOR = ":";

    /**
     * Creates time from hours and minutes.
     * 
     * @param {Number} hours hours.
     * @param {Number} minutes minutes.
     */
    constructor(hours, minutes) {
     
        this._hours = hours;
        this._minutes = 0;
        this._time = hours * Time.HOUR_MINUTES;

        if (minutes) {
            this._minutes = minutes;
            this._time += minutes;
        }
    }

    /**
     * Creates time from sum of hours and minutes.
     * 
     * @param {Number} time time that should be transofrmed into object.
     * @returns {Time} instance of Time.
     */
    static of(time) {

        let hours = Math.floor(time / Time.HOUR_MINUTES);
        let minutes = time - (hours * Time.HOUR_MINUTES);

        return new Time(hours, minutes);
    }

    /**
     * Returns sum of hours and minutes.
     * 
     * @returns {Number} time.
     */
    getTime() {
        return this._time;
    }

    /**
     * Returns hours.
     * 
     * @returns {Number} hours.
     */
    getHours() {
        return this._hours;
    }

    /**
     * Returns minutes.
     * 
     * @returns {Number} minutes.
     */
    getMinutes() {
        return this._minutes;
    }

    /**
     * Transform time into readable form
     * Example: 2:30, 5:00, etc.
     * 
     * @returns {String} Text representation of time.
     */
    toString() {
        
        let minutes = String(this.getMinutes());

        if (minutes.length == 1) {
            minutes = "0" + minutes;
        }

        return this.getHours() + Time.HOUR_MINUTE_SEPARATOR + minutes;
    }
}


function getAddress() {

    let address = conf.debug.forceAddress ?
        conf.debug.address :
        args.widgetParameter
        
    if (!address) {
        throw new Error("Address was not provided.");
    }

    let addressComponents = address.split(",");

    if (addressComponents.length !== 3) {
        throw new Error("Address should contain city, street and building number separated by comma.");
    }

    let city = addressComponents[0];
    let street = addressComponents[1];
    let buildingNumber = addressComponents[2];
    let shortAddress = buildingNumber + ", " + street;

    return {
        address,
        city,
        street,
        buildingNumber,
        shortAddress
    };
}


// Needs to be initialized after config is initialized.
conf.address = getAddress();
let webView = ScheduleWebViewFactory.getWebView();

if (config.runsInWidget || conf.debug.forceWidget) {
    const widget = new ScheduleWidget();
    
    await webView.downloadSchedules();
    await widget.render(webView);

} else {
    await webView.present();
}

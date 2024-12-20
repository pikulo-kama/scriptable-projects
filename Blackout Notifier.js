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
        address: "Івано-Франківськ,Любачівського,12В",
        currentHour: 17
    },
    
    showGradient: true,
    styleGradient: (gradient) => {
        
        gradient.locations = [0, 0.5];
        gradient.colors = [
            new Color("030037"),
            new Color("010024")
        ];
    }
};

/**
 * Should be used to get instance of ScheduleWebView.
 */
class ScheduleWebViewFactory {
    
    /**
     * Used to get instance of ScheduleWebView
     * 
     * @returns {ScheduleWebView} schedule web view
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
 * - Should allow to download schedule data
 * - Should allow to show in-page report.
 * - Should have schedule data separated for today and tomorrow.
 */
class ScheduleWebView {
    
    /**
     * Downloads raw JSON data
     * of outages for today and tomorrow.
     */
    async downloadSchedule() {}

    /**
     * Presents OE web page with schedules report for
     * provided address.
     */
    async present() {}

    /**
     * Used to get today schedule information
     * 
     * @returns {ScheduleList} ScheduleList object of today schedule
     */
    getToday() {}

    /**
     * Used to get tomorrow schedule information
     * 
     * @returns {ScheduleList} ScheduleList object of tomorrow schedule
     */
    getTomorrow() {}

    /**
     * Used to check whether data is present.
     * If data is not available this is most likely due
     * to connection issues on device or host is down.
     * 
     * @returns {boolean} True if available, otherwise False
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
            
            data = this.__generateRecords(8, 0)
                    .concat(this.__generateRecords(1, 1))
                    .concat(this.__generateRecords(5, 0))
                    .concat(this.__generateRecords(4, 2))
                    .concat(this.__generateRecords(16, 0))
                    .concat(this.__generateRecords(2, 2))
                    .concat(this.__generateRecords(7, 0))
                    .concat(this.__generateRecords(4, 1))
                    .concat(this.__generateRecords(1, 0));
        }
        
        return new ScheduleList({
            hoursList: data
        });
    }
    
    getTomorrow() {
        
        let data = null;
        
        if (conf.debug.forceIndicator) {
            data = this.__generateRecords(48, 1);
        }
        
        return new ScheduleList({
            hoursList: data
        });
    }
    
    isAvailable() {
        return !conf.debug.forceNotAvailable;
    }
    
    __generateRecords(amount, type) {
        
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

    async downloadSchedule() {

        let webView = await this.__getWebView();
        let schedules = await webView.evaluateJavaScript(this.__getDownloadScheduleJSPayload());

        if (schedules) {

            this._available = true;

            this._today = new ScheduleList(schedules.graphs.today);
            this._tomorrow = new ScheduleList(schedules.graphs.tomorrow);
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
     * @returns {WebView} web view
     */
    async __getWebView() {

        let webView = new WebView();
        await webView.loadURL("https://svitlo.oe.if.ua");

        return webView;
    }

    /**
     * JS script that will send request to get outages JSON data.
     * 
     * @returns {String} JS script as text
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
     * @returns {String} JS script as text
     */
    __getLoadScheduleReportJSPayload() {
        return "" +
            "let cityField = document.getElementById('searchCityAdress');" +
            "let streetField = document.getElementById('searchStreetAdress');" +
            "let houseField = document.getElementById('searchBuildingAdress');" +
            "let submitButton = document.getElementById('adressReport');" +

            "cityField.value = '" + conf.address.city + "';" +
            "streetField.value = '" + conf.address.street + "';" +
            "houseField.value = '" + conf.address.appartment + "';" +

            "submitButton.click();";
    }
}

/**
 * DTO used to store single range of outage schedule.
 * Time-type objects are basically amount of minutes from start of the day.
 * 
 * i.e. 3:15 AM would be represented as 3 * 60 + 15 = 195.
 * 
 * Probable outages are those that may not occur (50/50).
 * Each schedule has its own order value in daily schedule list.
 * This order is later used when rendering widget.
 */
class Schedule {

    static HOUR_RANGE_SEPARATOR = " - ";
    static HOUR_MIN_SEPARATOR = ":";

    constructor(startTime, endTime, isProbable, order) {

        this._startTime = startTime;
        this._endTime = endTime;
        this._isProbable = isProbable;
        this._order = order;
    }

    /**
     * Tells whether schedule is probable or will happen 100%.
     * 
     * @returns {boolean} True if outage is probable, otherwise False
     */
    isProbable() {
        return this._isProbable;
    }

    /**
     * Tells order of schedule in daily schedule.
     * 
     * @returns {Number} order of the schedule
     */
    getOrder() {
        return this._order;
    }

    /**
     * Checks if outage is in past.
     * 
     * @returns {boolean} True if current outage is already in past,
     * otherwise False 
     */
    isPassed() {

        let now = new Date();

        let finishTime = this._endTime;
        let currentTime = TimeUtil.createTime(
            now.getHours(), 
            now.getMinutes()
        );
        
        if (conf.debug.enable) {
            currentTime = TimeUtil.createTime(conf.debug.currentHour);
        }

        return currentTime >= finishTime;
    }

    /**
     * Transforms object into readable form.
     * Example: 16:30 - 17:00, 21:00, etc.
     * 
     * @returns {String} Visual representation of schedule
     */
    toString() {

        return this.__getReadableTime(this._startTime) +
            Schedule.HOUR_RANGE_SEPARATOR +
            this.__getReadableTime(this._endTime);
    }
    
    /**
     * Transform time (hours * 60 + minutes) into readable form
     * Example: 150 -> 2:30, 300 -> 5:00, etc.
     * 
     * @param {Number} time time that should be transformed into readable form
     * @returns {String} Text representation of time
     */
    __getReadableTime(time) {
        
        let hours = TimeUtil.getHours(time);
        let minutes = TimeUtil.getMinutes(time);
        
        if (minutes == 0) {
            minutes = "00";
        }
        
        return hours + Schedule.HOUR_MIN_SEPARATOR + minutes;
    }
}

/**
 * Used to store list of Schedule class instances.
 * Also serves as iterator.
 * 
 */
class ScheduleList {
    
    constructor(rawData) {
        
        this.data = [];
        this.currentOutageRecordIndex = -1;
        this._hasInfo = true;
        
        this.__formatData(rawData);
    }
    
    /**
     * Checks if daily schedule 
     * was updated with outage information.
     * 
     * @returns {boolean} True if information was updated, otherwise False
     */
    hasInfo() {
        return this._hasInfo;
    }

    /**
     * Iterator method, checks if there 
     * is next record in collection
     * 
     * @returns {boolean} True if has next record, otherwise False
     */
    hasNext() {
        return this.currentOutageRecordIndex + 1 < this.data.length;
    }

    /**
     * Shifts iterator index and returns next element.
     * 
     * @returns {Schedule} next Schedule from collection
     */
    next() {
        return this.data[++this.currentOutageRecordIndex];
    }

    /**
     * Used to transform raw JSON
     * into list of Schedule class instances.
     * 
     * @param {Object} rawData 
     */
    __formatData(rawData) {
        
        if (!rawData?.hoursList) {
            this._hasInfo = false;
            return;
        }
        
        let timeRanges = rawData.hoursList;
        // Get how much minutes each segment of data represents
        // i.e. 24 hours (24 * 60 = 1440),
        // If 48 segments then 1440 / 48 = 30 = each segment is 30 minutes
        let timeRangeUnit = TimeUtil.createTime(24) / timeRanges.length;
        let outageOrder = 1;
        
        for (let i = 0; i < timeRanges.length; i++) {

            let timeRange = timeRanges[i];
            let outageType = timeRange.electricity;

            let isNoOutage = outageType == 0;
            let isProbableOutage = outageType == 2;

            if (isNoOutage) {
                continue;
            }
            
            let streak = this.__getOutageStreak(i, timeRanges, outageType);

            let startTime = i * timeRangeUnit;
            let endTime = startTime + (streak * timeRangeUnit);
            
            // Need to shift index
            // since adjacent hours will be included
            // in current entry and they don't need
            // their own records.
            i += streak;
            this.data.push(new Schedule(startTime, endTime, isProbableOutage, outageOrder++));
        }
    }

    /**
     * Recursive method.
     * Traverses daily schedule time ranges.
     * To find amount of adjacent ranges with the same outage type.
     * Method also counts rangeIdx that was provided.
     * 
     * Example: If rangeIdx=2 and outageType=1 and ranges=[type=0, type=2, type=1, type=1, type=0].
     * This method will then return 2 since there are only two adjacent ranges with outage type 1.
     * 
     * @param {Number} rangeIdx index of range for which streak should be found.
     * @param {Array<Object>} ranges full list of daily schedule time ranges.
     * @param {Number} outageType outage type based on which streak should be found.
     * @param {Number} rangeCount This is only used internally by method.
     * @returns {Number} amount of adjacent time ranges with the same outage type.
     */
    __getOutageStreak(rangeIdx, ranges, outageType, rangeCount = 1) {

        // Last outage range
        if (rangeIdx == ranges.length - 1) {
            return rangeCount;
        }

        let sameAsPrevious = ranges[++rangeIdx].electricity == outageType;

        if (sameAsPrevious) {
            return this.__getOutageStreak(rangeIdx, ranges, outageType, rangeCount + 1);
        }

        return rangeCount;
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
            this.__present(this.__getNotAvailableWidget());
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
            this.__addTomorrowScheduleAvailabilityIndicator(root, webView.getTomorrow());
        }

        this.__addSpacer(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            this.__addIcon(root, "lightbulb.fill", 46, Color.yellow(), "heavy");
            this.__addSpacer(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.__addOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last element.
            if (todaySchedule.hasNext()) {
                this.__addSpacer(root, 5);
            }
        }

        this.__present(root);
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget
     * @param {Schedule} outageRecord daily outage record
     */
    __addOutageRecord(root, outageRecord) {

        let outageIconCode = outageRecord.getOrder() + ".square.fill";
        let outageIconColor = null;
        let opacity = null;

        // Change styling of outages that may not occur.
        if (outageRecord.isProbable()) {
            outageIconCode = "questionmark.square";
            outageIconColor = Color.yellow();
        }

        // Make outage record slightly transpaerent if it's already passed.
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
     * @param {ListWidget} root root widget
     * @param {ScheduleList} tomorrowSchedule tomorrow schedule
     */
    __addTomorrowScheduleAvailabilityIndicator(root, tomorrowSchedule) {

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
     * @returns {ListWidget} root widget
     */
    __getNotAvailableWidget() {

        const root = this.__createRootWidget();

        this.__addSpacer(root);
        this.__addIcon(root, "network.slash", 46, null, "heavy");
        this.__addSpacer(root);
        
        return root;
    }

    /**
     * Truncates text to provided length.
     * 
     * @param {String} text text to truncate
     * @param {Number} maxLength maximum final text length
     * @returns {String} truncated text
     */
    __truncate(text, maxLength) {

        if (text.length > maxLength) {
            
            let truncated = text.substring(0, maxLength - 2);
            text = truncated + "..";
        }

        return text;
    }

    /**
     * Wrapper to create stack.
     * 
     * @param {*} parent parent widget
     * @returns {StackWidget} stack widget
     */
    __addStack(parent) {
        let stack = parent.addStack();
        stack.centerAlignContent();

        return stack;
    }

    /**
     * Wrapper to create text widget.
     * 
     * @param {*} parent parent widget
     * @param {String} text widget text
     * @param {Font} font font of text
     * @param {Color} color color of text
     * @param {Number} opacity opacity of text
     * @param {Number} maxLength max length of text
     * @returns {TextWidget} text widget
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
     * @param {*} parent parent widget
     * @param {String} iconCode SF symbol code
     * @param {Number} size image size
     * @param {Color} color image color
     * @param {String} weight SF symbol weight
     * @param {Number} opacity image opacity
     * @returns {ImageWidget} image widget
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
     * @param {*} parent parent widget
     * @param {Number} size spacer size
     * @returns {SpacerWidget} spacer widget
     */
    __addSpacer(parent, size) {
        return parent.addSpacer(size);
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget
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
     * Used to present root widget
     * 
     * @param {ListWidget} root root widget
     */
    __present(root) {
        QuickLook.present(root);
        Script.setWidget(root);
    }
}


/**
 * Wrapper for address.
 */
class Address {

    constructor() {
        
        this.address = conf.debug.forceAddress ?
            conf.debug.address :
            args.widgetParameter
            
        if (!this.address) {
            throw new Error("Address was not provided.");
        }

        let addressComponents = this.address.split(",");

        this.city = addressComponents[0];
        this.street = addressComponents[1];
        this.appartment = addressComponents[2];

        this.shortAddress = this.appartment + ", " + this.street;
    }
}

class TimeUtil {
    
    static HOUR_MINS = 60;
    
    /**
     * Creates time from hours and minutes (if provided).
     * Example: createTime(5, 15) -> 5 * 60 + 15 -> 315
     * 
     * @param {Number} hours hours
     * @param {Number} minutes minutes (optional)
     * @returns {Number} time
     */
    static createTime(hours, minutes) {
        let time = hours * TimeUtil.HOUR_MINS;
        
        if (minutes) {
            time += minutes;
        }
        
        return time;
    }
    
    /**
     * Used to extract hours from time.
     * Example: getHours(315) -> 5
     * 
     * @param {Number} time time
     * @returns {Number} hours
     */
    static getHours(time) {
        return Math.floor(time / TimeUtil.HOUR_MINS);
    }
    
    /**
     * Used to extract minutes from time.
     * Example: getMinutes(315) -> 15
     * 
     * @param {Number} time time
     * @returns {Number} minutes
     */
    static getMinutes(time) {
        const hours = TimeUtil.getHours(time);
        return time - hours * TimeUtil.HOUR_MINS;
    }
}

conf.address = new Address();

let webView = ScheduleWebViewFactory.getWebView();

if (config.runsInWidget || conf.debug.forceWidget) {
    const widget = new ScheduleWidget();
    
    await webView.downloadSchedule();
    await widget.render(webView);

} else {
    await webView.present();
}

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: moon;

const {
    spacer,
    stack,
    text,
    image,
    rootWidget,
    present
} = importModule("UI");


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
    styleGradient: (rootWidget) => {
        
        rootWidget.gradient()
            .color(0, new Color("040059"))
            .color(0.5, new Color("030037"))
            .create()
    }
};


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
     * @returns {Boolean} True if available, otherwise False.
     */
    isAvailable() {}
}


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
 * Used only for debug purposes.
 * Used to emulate all possible scenarios.
 * 
 * This web view was only tested with IF OE data format.
 */
class DebugScheduleWebView extends ScheduleWebView {
    
    getToday() {
        
        let records = [];
        
        if (!conf.debug.forceNoOutages) {
            
            records = [
                new OutageRecord(Time.of(4), Time.of(4, 30), false, 1),
                new OutageRecord(Time.of(9), Time.of(11), true, 2),
                new OutageRecord(Time.of(17), Time.of(18), true, 3),
                new OutageRecord(Time.of(21, 30), Time.of(23, 30), false, 4)
            ];
        }
        
        return new Schedule(records);
    }
    
    getTomorrow() {
        return new Schedule(conf.debug.forceIndicator ? [] : null);
    }
    
    isAvailable() {
        return !conf.debug.forceNotAvailable;
    }
}


/**
 * Used to get schedule data from OE IF outage website.
 * 
 * Field "status" represents type of outage.
 * There are three types:
 * - 0 - No outage
 * - 1 - Outage
 * - 2 - Probable outage
 */
class OeIfScheduleWebView extends ScheduleWebView {

    constructor() {
        super();

        this._today = null;
        this._tomorrow = null;
        
        this._available = false;
    }

    async downloadSchedules() {

        let schedules = await this.__downloadSchedulesInternal();

        if (schedules) {

            this._available = true;

            this._today = new Schedule(schedules.today);
            this._tomorrow = new Schedule(schedules.tomorrow);
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
     * Used to download raw JSON data of schedules.
     * Returns data for both today and tomorrow.
     * 
     * @returns {Map<String, List<OutageRecord>>} Map with schedule records for today and tomorrow
     */
    async __downloadSchedulesInternal() {

        let today;
        let tomorrow;

        let queue = await this.__getQueueNumber();
        
        if (!queue) {
            return null;
        }

        let webView = await this.__getWebView();
        let scheduleList = await webView.evaluateJavaScript(this.__getDownloadSchedulesByQueueJSPayload());

        let first = scheduleList[0];
        let second = scheduleList[1];

        if (first) {
            
            let info = this.__createOutageRecords(first.queues[queue]);

            if (this.__isFutureSchedule(first)) {
                tomorrow = info;

            } else {
                today = info;
            }
        }

        if (second) {

            let info = this.__createOutageRecords(second.queues[queue]);

            if (this.__isFutureSchedule(second)) {
                tomorrow = info;

            } else {
                today = info;
            }
        }

        return {
            today,
            tomorrow
        };
    }

    /**
     * Used to transform raw outage JSON
     * to list of OutageRecord.
     * 
     * @param {Object} outageEntries JSON of outage entries
     * @returns {List<OutageRecord>} list of wrapped outage records
     */
    __createOutageRecords(outageEntries) {

        let outageRecords = [];

        if (!outageEntries) {
            return null;
        }

        let outageOrder = 1;

        for (let outageEntry of outageEntries) {

            let startTime = Time.ofString(outageEntry.from);
            let endTime = Time.ofString(outageEntry.to);

            let isProbable = outageEntry.status !== 1;

            outageRecords.push(new OutageRecord(startTime, endTime, isProbable, outageOrder++));
        }

        return outageRecords;
    }

    /**
     * Used to get queue number for the provided
     * address.
     * 
     * @returns formatted queue number (i.e. 3.1, 5.2, etc)
     */
    async __getQueueNumber() {

        let webView = await this.__getWebView();
        let response = await webView.evaluateJavaScript(this.__getDownloadScheduleJSPayload());
        
        if (!response) {
            return null;
        }

        let queue = response.current.queue;
        let subQueue = response.current.subqueue;

        return queue + "." + subQueue;
    }

    /**
     * Checks if schedule is planned for today or tomorrow.
     * 
     * @param {Object} schedule JSON object of schedule
     * @returns {Boolean} True if for tomorrow otherwise False
     */
    __isFutureSchedule(schedule) {

        if (!schedule) {
            return false;
        }

        let dateParts = schedule.eventDate.split(".");
        
        let day = dateParts[0];
        let month = dateParts[1];
        let year = dateParts[2];

        let scheduleDate = new Date(`${year}-${month}-${day}`);
        return scheduleDate > new Date();
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
     * Used only to get queue information.
     * 
     * Actual data is retrieved separately.
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

    /**
     * JS script that will send request 
     * to get outages JSON data.
     * 
     * @returns {String} JS script as text.
     */
    __getDownloadSchedulesByQueueJSPayload() {
        return "" +
            "$.ajax({" +
            "   url: 'https://be-svitlo.oe.if.ua/schedule-by-queue'," +
            "   data: {" +
            "      accountNumber: ''," +
            "      userSearchChoice: 'pob'," +
            "      address: '" + conf.address.address + "'" +
            "   }," +
            "   async: false" +
            "}).responseJSON;";
    }
}


/**
 * Used to store list of outage records.
 * Also serves as iterator.
 */
class Schedule {
    
    /**
     * @param {List<OutageRecord>} records list of outage records.
     */
    constructor(records) {
        
        this._outageRecords = [];
        this._outageRecordIndex = -1;
        this._hasInfo = false;

        if (records) {
            this._hasInfo = true
            this._outageRecords = records;
        }
    }
    
    /**
     * Checks if schedule 
     * was updated with outage information.
     * 
     * @returns {Boolean} True if information was updated, otherwise False.
     */
    hasInfo() {
        return this._hasInfo;
    }

    /**
     * Iterator method, checks if there 
     * is next record in collection.
     * 
     * @returns {Boolean} True if has next record, otherwise False.
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
     * @returns {Boolean} True if outage is probable, otherwise False.
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
     * @returns {Boolean} True if outage record is already in past,
     * otherwise False.
     */
    isPassed() {

        let now = new Date();

        let finishTime = this._endTime;
        let currentTime = Time.of(now.getHours() , now.getMinutes());
        
        if (conf.debug.enable) {
            currentTime = Time.of(conf.debug.currentHour);
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


/**
 * Helper class used to render
 * widget with schedule information.
 */
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
            present(this.__getNotAvailableRootWidget());
            return;
        }

        const root = this.__createRootWidget();
        const todaySchedule = webView.getToday();

        // Render header of widget (icon + address).
        const headerStack = stack().renderFor(root);
        
        image()
            .icon("lightbulb.slash")
            .size(15)
            .regularWeight()
            .renderFor(headerStack);
            
        spacer().renderFor(headerStack, 5);
        
        text()
            .content(conf.address.shortAddress)
            .limit(16)
            .blackRoundedFont(10)
            .color(new Color("bfbfbf"))
            .renderFor(headerStack);

        // Add indicator if there are schedules for tomorrow.
        if (webView.getTomorrow().hasInfo()) {
            this.__renderTomorrowScheduleIndicator(root, webView.getTomorrow());
        }

        spacer().renderFor(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            image()
                .icon("lightbulb.fill")
                .size(46)
                .yellowColor()
                .heavyWeight()
                .renderFor(root);
                
            spacer().renderFor(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.__renderOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last outage record.
            if (todaySchedule.hasNext()) {
                spacer().renderFor(root, 5);
            }
        }

        present(root);
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget.
     * @param {OutageRecord} outageRecord daily outage record.
     */
    __renderOutageRecord(root, outageRecord) {

        let outageIcon = image();
        let outagePeriodText = text();
        
        // Change styling of outages that may not occur.
        if (outageRecord.isProbable()) {
            outageIcon.icon("questionmark.square")
            outageIcon.yellowColor();
                
        } else {
            let iconCode = outageRecord.getOrder() + ".square.fill"
            outageIcon.icon(iconCode);
        }

        // Make outage record slightly transparent if it's already passed.
        if (outageRecord.isPassed()) {
            outageIcon.opacity(0.6);
            outagePeriodText.opacity(0.6);
        }

        let outageStack = stack().renderFor(root);
        
        outageIcon
            .size(16)
            .renderFor(outageStack);
        
        spacer().renderFor(outageStack, 2);
        
        outagePeriodText
            .content(outageRecord.toString())
            .blackFont(14)
            .renderFor(outageStack);
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

        spacer().renderFor(root, 2);
            
        const newScheduleStack = stack().renderFor(root);
        
        spacer().renderFor(newScheduleStack, 3);
        image()
            .icon("info.circle.fill")
            .size(10)
            .color(indicatorColor)
            .lightWeight()
            .opacity(0.7)
            .renderFor(newScheduleStack);

        spacer().renderFor(newScheduleStack, 3);
        text()
            .content("new")
            .blackRoundedFont(10)
            .opacity(0.9)
            .renderFor(newScheduleStack);
    }

    /**
     * Used to get alternative root widget.
     * This one ised when web view is not available.
     * 
     * @returns {ListWidget} root widget.
     */
    __getNotAvailableRootWidget() {

        const root = this.__createRootWidget();

        spacer().renderFor(root);
        image()
            .icon("network.slash")
            .size(46)
            .heavyWeight()
            .renderFor(root);
        spacer().renderFor(root);
        
        return root;
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget.
     */
    __createRootWidget() {

        const root = rootWidget()
        
        if (conf.showGradient) {
            conf.styleGradient(root);
        }
        
        return root.render();
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
        this._minutes = minutes;
        this._time = hours * Time.HOUR_MINUTES + minutes;
    }

    /**
     * Creates time from hours and minutes.
     * 
     * @param {Number} hours hours
     * @param {Number} minutes minutes
     * @returns {Time} instance of Time.
     */
    static of(hours, minutes) {

        if (!minutes) {
            minutes = 0;
        }

        return new Time(hours, minutes);
    }

    static ofString(stringTime) {

        let timeParts = stringTime.split(Time.HOUR_MINUTE_SEPARATOR);
        let hours = Number(timeParts[0]);
        let minutes = Number(timeParts[1]);

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

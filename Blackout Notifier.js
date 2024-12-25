// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: moon;

const ui = importModule("UI");


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
            ui.present(this.__getNotAvailableRootWidget());
            return;
        }

        const root = this.__createRootWidget();
        const todaySchedule = webView.getToday();

        // Render header of widget (icon + address).
        const headerStack = ui.stack().renderFor(root);
        
        ui.image()
            .icon("lightbulb.slash")
            .size(15)
            .regularWeight()
            .renderFor(headerStack);
            
        ui.spacer().renderFor(headerStack, 5);
        
        ui.text()
            .content(conf.address.shortAddress)
            .limit(16)
            .blackRoundedFont(10)
            .color(new Color("bfbfbf"))
            .renderFor(headerStack);

        // Add indicator if there are schedules for tomorrow.
        if (webView.getTomorrow().hasInfo()) {
            this.__renderTomorrowScheduleIndicator(root, webView.getTomorrow());
        }

        ui.spacer().renderFor(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            ui.image()
                .icon("lightbulb.fill")
                .size(46)
                .yellowColor()
                .heavyWeight()
                .renderFor(root);
                
            ui.spacer().renderFor(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.__renderOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last outage record.
            if (todaySchedule.hasNext()) {
                ui.spacer().renderFor(root, 5);
            }
        }

        ui.present(root);
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget.
     * @param {OutageRecord} outageRecord daily outage record.
     */
    __renderOutageRecord(root, outageRecord) {

        let outageIcon = ui.image();
        let outagePeriodText = ui.text();
        
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

        let outageStack = ui.stack().renderFor(root);
        
        outageIcon
            .size(16)
            .renderFor(outageStack);
        
        ui.spacer().renderFor(outageStack, 2);
        
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

        ui.spacer().renderFor(root, 2);
            
        const newScheduleStack = ui.stack().renderFor(root);
        
        ui.spacer().renderFor(newScheduleStack, 3);
        ui.image()
            .icon("info.circle.fill")
            .size(10)
            .color(indicatorColor)
            .lightWeight()
            .opacity(0.7)
            .renderFor(newScheduleStack);

        ui.spacer().renderFor(newScheduleStack, 3);
        ui.text()
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

        ui.spacer().renderFor(root);
        ui.image()
            .icon("network.slash")
            .size(46)
            .heavyWeight()
            .renderFor(root);
        ui.spacer().renderFor(root);
        
        return root;
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget.
     */
    __createRootWidget() {

        const root = ui.createRoot();
        
        if (conf.showGradient) {
            
            const gradient = new LinearGradient();
            conf.styleGradient(gradient);
            root.backgroundGradient = gradient;
        }
        
        return root;
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

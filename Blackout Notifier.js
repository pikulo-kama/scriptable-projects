// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: moon;

const {
    debugFeatureEnabled, 
    featureEnabled, 
    getFeature 
} = importModule("Feature");

const {
    spacer,
    stack,
    text,
    image,
    rootWidget,
    presentSmall
} = importModule("UI");


const parameters = getAddress();

/**
 * ENTRY POINT
 */
async function main() {

    const webView = ScheduleWebViewFactory.getWebView();

    if (config.runsInWidget || debugFeatureEnabled("forceWidget")) {
        const widgetBuilder = new ScheduleWidgetBuilder();
        
        await webView.downloadSchedules();
        const widget = widgetBuilder.build(webView);
        
        presentSmall(widget);
        return;
    }

    await webView.present();
}


/**
 * Used to get arguments provided by user.
 * 
 * address - full addres which is city, stree and building number separated by comma.
 * city - name of the city (obtained from address).
 * street - name of street (obtained from address).
 * buildingNumber - number of building (obtained from address).
 * shortAddress - short version of address which is displayed as widget title (created based on the address).
 *
 * @return {Object} used defined script configurations
 */
function getAddress() {

    let address = args.widgetParameter;

    if (debugFeatureEnabled("mockAddress")) {
        address = getFeature("mockAddress");
    }
        
    if (!address) {
        throw new Error("Address was not provided.");
    }

    const addressComponents = address.split(",");

    if (addressComponents.length < 3) {
        throw new Error("Address should contain city, street and building number separated by comma.");
    }
    
    const getParameter = (position) => {
        if (addressComponents.length < position) {
            return null;
        }
        
        return addressComponents[position - 1];
    }

    const city = getParameter(1);
    const street = getParameter(2);
    const buildingNumber = getParameter(3);
    const queue = getParameter(4);
    const shortAddress = `${buildingNumber}, ${street}`;
    
    return {
        address,
        city,
        street,
        buildingNumber,
        queue,
        shortAddress
    };
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
        
        if (debugFeatureEnabled("mockWebView")) {
            return new MockScheduleWebView();
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
class MockScheduleWebView extends ScheduleWebView {
    
    getToday() {
        
        let records = [];
        
        if (!debugFeatureEnabled("forceNoOutages")) {
            
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
        return new Schedule(debugFeatureEnabled("forceIndicator") ? [] : null);
    }
    
    isAvailable() {
        return !debugFeatureEnabled("forceNotAvailable");
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

    #today = null;
    #tomorrow = null;
    #available = false;

    async downloadSchedules() {

        const schedules = await this.#downloadSchedulesInternal();

        if (!schedules) {
            return;
        }

        this.#available = true;

        this.#today = new Schedule(schedules.today);
        this.#tomorrow = new Schedule(schedules.tomorrow);
    }

    async present() {

        const webView = await this.#getWebView();

        await webView.evaluateJavaScript(this.#getLoadScheduleReportJSPayload());
        await webView.present();
    }

    getToday() {
        return this.#today;
    }

    getTomorrow() {
        return this.#tomorrow;
    }

    isAvailable() {
        return this.#available;
    }

    /**
     * Used to download raw JSON data of schedules.
     * Returns data for both today and tomorrow.
     * 
     * @returns {Map<String, List<OutageRecord>>} Map with schedule records for today and tomorrow
     */
    async #downloadSchedulesInternal() {

        let today;
        let tomorrow;

        const webView = await this.#getWebView();
        let queueList = [];
        const outagesByDate = {}
        
        // In case address relates to
        // multiple queues and only wants
        // to see certain one.
        if (parameters.queue) {
            queueList = [parameters.queue]
            
        } else {
            queueList = await this.#getApplicableQueues();
        }
        
        if (queueList.length == 0) {
            return null;
        }
        
        // Collect outage data from all queues.
        for (const queue of queueList) {
            const scheduleList = await webView.evaluateJavaScript(this.#getDownloadSchedulesByQueueJSPayload(queue), true);

            if (!scheduleList) {
                continue;
            }

            for (const schedule of scheduleList) {

                const outageDate = schedule.eventDate;
                const outages = schedule.queues[queue];

                if (!outagesByDate[outageDate]) {
                    outagesByDate[outageDate] = [];
                }

                outagesByDate[outageDate].push(...outages);
            }
        }

        // Format collected data.
        for (const outageDate in outagesByDate) {
            const outageDateIdentifier = this.#getDayDifference(outageDate);
            const outages = outagesByDate[outageDate];

            outages.sort((a, b) => a.from.localeCompare(b.from));

            // Today.
            if (outageDateIdentifier == 0) {
                today = this.#createOutageRecords(outages);

            // Tomorrow.
            } else if (outageDateIdentifier == 1) {
                tomorrow = this.#createOutageRecords[outages];
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
    #createOutageRecords(outageEntries) {

        const outageRecords = [];

        if (!outageEntries) {
            return null;
        }

        let outageOrder = 1;

        for (const outageEntry of outageEntries) {

            const startTime = Time.ofString(outageEntry.from);
            const endTime = Time.ofString(outageEntry.to);

            const isProbable = outageEntry.status !== 1;

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
    async #getApplicableQueues() {

        const webView = await this.#getWebView();
        const response = await webView.evaluateJavaScript(this.#getDownloadScheduleJSPayload(), true);
        
        if (!response) {
            return [];
        }

        if (response.current.possibleQueues) {
            return response.current.possibleQueues;
        }

        const queue = response.current.queue;
        const subQueue = response.current.subQueue;

        return [`${queue}.${subQueue}`];
    }

    /**
     * Used to parse text date of format dd-mm-YYYY
     * and return an integer value that represents amount
     * of days provided date is off from today.
     * 
     * e.g. if date is today's date -> 0
     *      if date is tomorrow's date -> 1
     *      etc.
     * 
     * @param {String} outageDateStr 
     * @returns date offset from current date
     */
    #getDayDifference(outageDateStr) {

        const dateParts = outageDateStr.split(".");
        
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];

        const outageDate = new Date(`${year}-${month}-${day}`);
        const today = new Date()

        outageDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        const millisInDay = 1000 * 60 * 60 * 24;
        return (outageDate - today) / millisInDay;
    }

    /**
     * Wrapper to get web view of OE IF website.
     * 
     * @returns {WebView} web view.
     */
    async #getWebView() {

        const webView = new WebView();
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
    #getDownloadScheduleJSPayload() {
        return `
            fetch('https://be-svitlo.oe.if.ua/schedule-by-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    accountNumber: '',
                    userSearchChoice: 'pob',
                    address: '${parameters.address}'
                })
            })
            .then(res => res.json())
            .then(data => completion(data))
            
            null
        `
    }

    /**
     * JS script that will populate address 
     * using data that was provided into widget
     * and then load report.
     * 
     * @returns {String} JS script as text.
     */
    #getLoadScheduleReportJSPayload() {
        return `
            (async () => {
              // Helper: wait for element to appear
              const waitFor = (selector) => new Promise(resolve => {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                const obs = new MutationObserver(() => {
                  const el = document.querySelector(selector);
                  if (el) {
                    obs.disconnect();
                    resolve(el);
                  }
                });
                obs.observe(document.body, { childList: true, subtree: true });
              });
            
              // Helper: set React input value properly
              const setReactValue = (el, value) => {
                const lastValue = el.value;
                el.value = value;
                const event = new Event('input', { bubbles: true });
                const tracker = el._valueTracker;
                if (tracker) tracker.setValue(lastValue);
                el.dispatchEvent(event);
              };
              
              // Wait for fields (youâll need to customize selectors below)
              const cityField = await waitFor('input[name="city"]');
              const streetField = await waitFor('input[name="street"]');
              const buildingField = await waitFor('input[name="building"]');
              const searchButton = await waitFor('button[type="submit"]');
              
              // Fill values
              setReactValue(cityField, '${parameters.city}');
              setReactValue(streetField, '${parameters.street}');
              setReactValue(buildingField, '${parameters.buildingNumber}');
            
              // Click the generate report button.
              searchButton.click();
            
              const queueButton = await waitFor('button[data-testid="submitSearchQueue-${parameters.queue}"]');
              
              // If there is queue specified explicitly
              // and address has this queue assigned then use it.
              if (queueButton) {
                 queueButton.click();
              }
              
              completion();
            })();
            
            null
        `;
    }

    /**
     * JS script that will send request 
     * to get outages JSON data.
     * 
     * @param {String} queue queue number
     * @returns {String} JS script as text.
     */
    #getDownloadSchedulesByQueueJSPayload(queue) {
        return `
            fetch('https://be-svitlo.oe.if.ua/schedule-by-queue?queue=${queue}')
                .then(res => res.json())
                .then(data => completion(data))
            
            null
        `
    }
}


/**
 * Used to store list of outage records.
 * Also serves as iterator.
 */
class Schedule {

    #outageRecords = [];
    #outageRecordIndex = -1;
    #hasInfo = false;
    
    /**
     * @param {List<OutageRecord>} records list of outage records.
     */
    constructor(records) {

        if (records) {
            this.#hasInfo = true
            this.#outageRecords = records;
        }
    }
    
    /**
     * Checks if schedule 
     * was updated with outage information.
     * 
     * @returns {Boolean} True if information was updated, otherwise False.
     */
    hasInfo() {
        return this.#hasInfo;
    }

    /**
     * Iterator method, checks if there 
     * is next record in collection.
     * 
     * @returns {Boolean} True if has next record, otherwise False.
     */
    hasNext() {
        return this.#outageRecordIndex + 1 < this.#outageRecords.length;
    }

    /**
     * Shifts iterator index and returns next element.
     * 
     * @returns {OutageRecord} next Schedule from collection.
     */
    next() {
        return this.#outageRecords[++this.#outageRecordIndex];
    }
}


/**
 * DTO used to store outage record.
 */
class OutageRecord {

    static #HOUR_RANGE_SEPARATOR = " - ";

    #startTime;
    #endTime;
    #isProbable;
    #order;

    /**
     * @param {Time} startTime time when outage starts.
     * @param {Time} endTime time when outage ends.
     * @param {Boolean} isProbable whether outage is probable or not.
     * @param {Number} order order of outage in schedule.
     */
    constructor(startTime, endTime, isProbable, order) {

        this.#startTime = startTime;
        this.#endTime = endTime;
        this.#isProbable = isProbable;
        this.#order = order;
    }

    /**
     * Tells whether schedule is probable or will happen 100%.
     * 
     * @returns {Boolean} True if outage is probable, otherwise False.
     */
    isProbable() {
        return this.#isProbable;
    }

    /**
     * Tells order of schedule in daily schedule.
     * 
     * @returns {Number} order of the schedule.
     */
    getOrder() {
        return this.#order;
    }

    /**
     * Checks if outage record is in past.
     * 
     * @returns {Boolean} True if outage record is already in past,
     * otherwise False.
     */
    isPassed() {
        
        // This is edge case for scenarios
        // where outage ends on midnight,
        // since we're storing only time
        // without date we can't do regular
        // comparison.
        if (this.#endTime.isMidnight()) {
            return false;
        }
        
        const now = new Date();
        let currentTime = Time.of(now.getHours() , now.getMinutes());
        
        if (debugFeatureEnabled("mockCurrentHour")) {
            currentTime = Time.of(getFeature("mockCurrentHour"));
        }
        
        return currentTime.getTime() >= this.#endTime.getTime();
    }

    /**
     * Transforms outage record into readable form.
     * Example: 16:30 - 17:00, 21:00, etc.
     * 
     * @returns {String} Visual representation of outage record.
     */
    toString() {

        return this.#startTime.toString() +
            OutageRecord.#HOUR_RANGE_SEPARATOR +
            this.#endTime.toString();
    }
}


/**
 * Helper class used to render
 * widget with schedule information.
 */
class ScheduleWidgetBuilder {

    /**
     * Entrypoint. Used to render schedule widget.
     * 
     * @param {ScheduleWebView} webView 
     */
    build(webView) {

        // This is triggered when schedule data was
        // not loaded due to connection issues.
        if (!webView.isAvailable()) {
            return this.#getNotAvailableRootWidget();
        }

        const root = this.#createRootWidget();
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
            .content(parameters.shortAddress)
            .limit(16)
            .blackRoundedFont(10)
            .color(new Color("bfbfbf"))
            .renderFor(headerStack);

        // Add indicator if there are schedules for tomorrow.
        if (webView.getTomorrow().hasInfo()) {
            this.#renderTomorrowScheduleIndicator(root, webView.getTomorrow());
        }

        spacer().renderFor(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            image()
                .icon("lightbulb.fill")
                .size(46)
                .color(Color.yellow())
                .heavyWeight()
                .renderFor(root);
                
            spacer().renderFor(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.#renderOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last outage record.
            if (todaySchedule.hasNext()) {
                spacer().renderFor(root, 5);
            }
        }

        return root;
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget.
     * @param {OutageRecord} outageRecord daily outage record.
     */
    #renderOutageRecord(root, outageRecord) {

        const outageIcon = image();
        const outagePeriodText = text();
        
        // Change styling of outages that may not occur.
        if (outageRecord.isProbable()) {
            outageIcon.icon("questionmark.square")
            outageIcon.color(Color.yellow());
                
        } else {
            const iconCode = `${outageRecord.getOrder()}.square.fill`
            outageIcon.icon(iconCode);
        }

        // Make outage record slightly transparent if it's already passed.
        if (outageRecord.isPassed()) {
            outageIcon.opacity(0.6);
            outagePeriodText.opacity(0.6);
        }

        const outageStack = stack().renderFor(root);
        
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
    #renderTomorrowScheduleIndicator(root, tomorrowSchedule) {

        const indicatorColor = tomorrowSchedule.hasNext() ? Color.red() : Color.green();

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
    #getNotAvailableRootWidget() {

        const root = this.#createRootWidget();

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
    #createRootWidget() {

        const root = rootWidget();
        
        if (featureEnabled("showGradient")) {
            
            root.gradient()
                .color(0, new Color("040059"))
                .color(0.5, new Color("030037"))
                .create();
        }
        
        return root.render();
    }
}


/**
 * Stores hour and minute in relativity to the day.
 */
class Time {

    static #HOUR_MINUTES = 60;
    static #HOUR_MINUTE_SEPARATOR = ":";

    #hours;
    #minutes;
    #time;

    /**
     * Creates time from hours and minutes.
     * 
     * @param {Number} hours hours.
     * @param {Number} minutes minutes.
     */
    constructor(hours, minutes) {
     
        this.#hours = hours;
        this.#minutes = minutes;
        this.#time = hours * Time.#HOUR_MINUTES + minutes;
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

        const timeParts = stringTime.split(Time.#HOUR_MINUTE_SEPARATOR);
        const hours = Number(timeParts[0]);
        const minutes = Number(timeParts[1]);

        return new Time(hours, minutes);
    }

    /**
     * Returns sum of hours and minutes.
     * 
     * @returns {Number} time.
     */
    getTime() {
        return this.#time;
    }

    /**
     * Returns hours.
     * 
     * @returns {Number} hours.
     */
    getHours() {
        return this.#hours;
    }

    /**
     * Returns minutes.
     * 
     * @returns {Number} minutes.
     */
    getMinutes() {
        return this.#minutes;
    }
    
    /**
     * Used to check if time 
     * represents midnight.
     * 
     * @returns {Number} True if midnight otherwise False.
     */
    isMidnight() {
        return this.#hours == 0 && this.#minutes == 0
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
            minutes = `0${minutes}`;
        }

        return this.getHours() + Time.#HOUR_MINUTE_SEPARATOR + minutes;
    }
}


await main();
Script.complete();

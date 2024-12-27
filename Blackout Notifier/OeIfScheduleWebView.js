
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

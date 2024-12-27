
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

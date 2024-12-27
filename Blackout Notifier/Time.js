
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

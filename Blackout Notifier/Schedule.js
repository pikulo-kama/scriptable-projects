
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

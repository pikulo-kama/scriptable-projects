
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

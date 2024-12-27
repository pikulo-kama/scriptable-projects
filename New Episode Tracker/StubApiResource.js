
/**
 * TV series API resource used for debugging.
 * Emulates data without access to internet.
 */
class StubApiResource extends ApiResource {

    async download() {
        
        let seriesInfo = new SeriesInfo(
            "Debug",
            conf.debug.forceEndedStatus ? Status.Ended : Status.Ongoing
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(1, 1, this.__dateNMonthsInPast(12))
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(1, 2, this.__dateNMonthsInPast(6))
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(2, 1, this.__getNextEpisodeDate())
        );
        
        return seriesInfo;
    }

    /**
     * Used to get next episode date
     * behavious will change depending on
     * debug configuration
     * 
     * @returns {Date} next episode release date
     */
    __getNextEpisodeDate() {

        // Last known episode already aired.
        // No information when next would be (Waiting).
        if (conf.debug.forceWaitingStatus) {
            return this.__dateNMonthsInPast(1);
        }

        if (conf.debug.forceCountdownHours) {
            return this.__dateNHoursInFuture(2);
        }

        if (conf.debug.forceCountdownDays) {
            return this.__dateNDaysInFuture(5);
        }

        if (conf.debug.forceCountdownWeeks) {
            return this.__dateNDaysInFuture(8);
        }

        if (conf.debug.forceCountdownMonths) {
            return this.__dateNMonthsInFuture(3);
        }
        
        return new Date();
    }

    /**
     * Used to create date wich
     * is N months in past from now.
     * 
     * @param {Number} months amount of months
     * @returns date in the past
     */
    __dateNMonthsInPast(months) {

        let date = new Date();
        date.setMonth(date.getMonth() - months);

        return date;
    }

    /**
     * Used to create date wich
     * is N months in future from now.
     * 
     * @param {Number} months amount of months
     * @returns date in the future
     */
    __dateNMonthsInFuture(months) {
        
        let date = new Date();
        date.setMonth(date.getMonth() + months);

        return date;
    }

    /**
     * Used to create date wich
     * is N days in future from now.
     * 
     * @param {Number} days amount of days
     * @returns date in the future
     */
    __dateNDaysInFuture(days) {
        
        let date = new Date();
        date.setDate(date.getDate() + days);

        return date;
    }

    /**
     * Used to create date wich
     * is N hours in future from now.
     * 
     * @param {Number} hours amount of hours
     * @returns date in the future
     */
    __dateNHoursInFuture(hours) {
        
        let date = new Date();
        date.setHours(date.getHours() + hours);

        return date;
    }
}

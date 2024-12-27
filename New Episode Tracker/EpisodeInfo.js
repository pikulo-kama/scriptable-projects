
/**
 * Episode DTO
 */
class EpisodeInfo {
    
    /**
     * @param {Number} season season
     * @param {Number} episode episode number
     * @param {Date} airDate episode release date
     */
    constructor(season, episode, airDate) {
        this._season = season;
        this._episode = episode;
        this._airDate = airDate;
    }
    
    /**
     * Used to get episode season.
     * 
     * @returns {Number} season
     */
    getSeason() {
        return this._season;
    }
    
    /**
     * Used to get episode number.
     * 
     * @returns {Number} episode number
     */
    getEpisode() {
        return this._episode;
    }
    
    /**
     * Used to get episode release date.
     * 
     * @returns {Date} release date
     */
    getAirDate() {
        return this._airDate;
    }
    
    /**
     * Used to get textual representation
     * of episode.
     * 
     * Example: s2e12 (season 2, episode 12), etc.
     * 
     * @returns {String} textual representation of episode
     */
    toString() {
        
        let episodeString = "";
        
        let season = this._season;
        let episode = this._episode;
        
        if (season && episode) {
            episodeString = `s${season}e${episode}`;
        }
        
        return episodeString;
    }
}

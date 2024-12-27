
/**
 * DTO with series information.
 */
class SeriesInfo {
    
    /**
     * @param {String} title series title
     * @param {Status} status status of series (Ended, Ongoing)
     * @param {String} image path to series image on device file system
     * @param {String} imageURI URI to series image
     */
    constructor(title, status, image, imageURI) {
        
        this._title = title;
        this._status = status;
        this._image = image;
        this._imageURI = imageURI;
        
        this._episodes = [];
    }
    
    /**
     * Get series title.
     * 
     * @returns {String} series title
     */
    getTitle() {
        return this._title;
    }
    
    /**
     * Get series status.
     * 
     * @returns {Status} series status
     */
    getStatus() {
        return this._status;
    }
    
    /**
     * Get series image path.
     * 
     * @returns {String} series image path
     */
    getImage() {
        return this._image;
    }
    
    /**
     * Get series image URI.
     * 
     * @returns {String} series image URI
     */
    getImageURI() {
        return this._imageURI;
    }
    
    /**
     * Get series episode list.
     * 
     * @returns {Array<Episode>} list of series episodes
     */
    getEpisodes() {
        return this._episodes;
    }
    
    /**
     * Adds episode to the series.
     * 
     * @param {EpisodeInfo} episode episode that should be added
     */
    addEpisode(episode) {
        this._episodes.push(episode);
    }
}

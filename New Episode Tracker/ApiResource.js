
/**
 * Used to obtain TV series information.
 */
class ApiResource {

    /**
     * Used to download series information.
     * 
     * Should return the following info:
     * - title
     * - image (path to the image of series in file system (if available))
     * - imageURI
     * - status
     * - episodes
     *    - season
     *    - episode
     *    - airDate (date when episode would be released)
     * 
     * @returns {SeriesInfo} series information
     */
    async download() {}
}

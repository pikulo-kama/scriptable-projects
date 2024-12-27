
/**
 * Main TV series API resource.
 * Consumes 'episodate' API to get series information.
 */
class EpisodateApiResource extends ApiResource {

    constructor() {
        super();
        this._webUrl = "https://episodate.com/api/show-details?q=";
    }

    async download() {

        const cacheConfig = this.__getCacheConfig();
        const url = this.__getSeriesUrl();

        const seriesData = await cacheUtil.getRequest(cacheConfig, url);
        const seriesInfo = new SeriesInfo(
            seriesData.title,
            seriesData.status == 'Ended' ? Status.Ended : Status.Ongoing,
            seriesData.image,
            seriesData.imageURI
        );

        seriesData.episodes.forEach(ep => {
            let episode = new EpisodeInfo(
                ep.season,
                ep.episode,
                new Date(ep.airDate)
            );
            
            seriesInfo.addEpisode(episode);
        });

        return seriesInfo;
    }

    /**
     * Used to get URL for current series
     * information.
     * 
     * @returns {String} URL
     */
    __getSeriesUrl() {
        return this._webUrl + conf.seriesName;
    }

    /**
     * Used to get cache configuration of 
     * TV series information.
     * 
     * This config is used to cache and then
     * retrieve series information from cache.
     * 
     * @returns {Object} cache config
     */
    __getCacheConfig() {
        return [
            {
                prop: "tvShow.name",
                alias: "title"
            },
            {
                prop: "tvShow.image_thumbnail_path",
                alias: "image",
                type: cacheUtil.types.IMAGE
            },
            {
                prop: "tvShow.image_thumbnail_path",
                alias: "imageURI"
            },
            {
                prop: "tvShow.status"
            },
            {
                prop: "tvShow.episodes",
                type: cacheUtil.types.LIST,
                mappings: [
                    {
                        prop: "season"
                    },
                    {
                        prop: "episode"
                    },
                    {
                        prop: "air_date",
                        alias: "airDate",
                        transform: (text) => {
                            return new Date(text.replace(" ", "T") + "Z");
                        }
                    }
                ]
            }
        ];
    }
}

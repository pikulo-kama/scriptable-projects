// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: tv;

const { FileUtil } = importModule("File Util");
const { metadata, cacheRequest } = importModule("Cache");
const { tr } = importModule("Localization")

const {
    spacer,
    stack,
    text,
    rootWidget,
    present
} = importModule("UI");

const {
    UIFormReadOnly,
    UIDataTable
} = importModule("CRUD Module");


const conf = {
    debug: {
        enabled: false,
        forceWidget: false
    }
};


/**
 * ENTRY POINT
 */
async function main() {

    const repository = SeriesDataRepositoryFactory.getRepository();
    const seriesData = await repository.getData();

    if (config.runsInWidget || conf.debug.forceWidget) {
        const widget = WidgetBuilder.build(seriesData);
        present(widget);

    } else {
        const table = await TableBuilder.build(seriesData);
        await table.present();
    }
}


/**
 * Used to format episode count by
 * adding suffix 'ep' or 'eps' depending
 * on count whether it's singular or plural.
 *
 * @param {Number} episodeCount episode count
 * @return {String} formatted episode count
 */
function getEpisodeCountLabel(episodeCount) {
    
    let key = "watchQueue_episodeSingular";
    
    if (episodeCount > 1) {
        key = "watchQueue_episodePlural";
    }
    
    return tr(key, episodeCount);
}


/**
 * Interface.
 * Used to retrieve series data.
 *
 * @class SeriesDataRepository
 */
class SeriesDataRepository {

    /**
     * Used to retrieve series data.
     * 
     * @return {Object} data ready to be displayed in both widget and table
     * @memberof SeriesDataRepository
     */
    async getData() {}
}


/**
 * Used to get and process data from Stop Watcher script.
 *
 * @class StopWatcherRepository
 */
class StopWatcherRepository {

    #apiURI = "https://episodate.com/api/show-details?q=";

    /**
     * Used to get processed Stop Watcher data
     * with information about current series watch
     * completion.
     * 
     * Additionally data from Episodate API is being
     * obtained to get how many episodes are still to watch.
     *
     * @return {Object} series data
     * @memberof StopWatcherRepository
     */
    async getData() {

        const processedRecords = [];
        const stopWatcherData = FileUtil.readJson("Stop Watcher", "watchlist.json", [])
            // Only get those that have 'episodate' API field
            // populated.
            .filter(seriesRecord => seriesRecord.serieId);

        for (let stopWatcherRecord of stopWatcherData) {

            let season = stopWatcherRecord.season;
            let episode = stopWatcherRecord.episode;

            // Need to shift back since current
            // episode in 'Stop Watcher' will always
            // be unwatched.
            episode -= 1;

            // In case if it was first episode
            // we need to shift season back as well.
            if (episode < 1) {
                season = Math.max(season - 1, 1);
                episode = 99;
            }

            let processedRecord = {
                serieId: stopWatcherRecord.serieId,
                showInSummary: stopWatcherRecord.showInSummary,
                season,
                episode
            };

            let additionalInformation = await this.#fetchAdditionalData(processedRecord);
            processedRecord = {...processedRecord, ...additionalInformation};

            if (processedRecord.count > 0) {
                processedRecords.push(processedRecord);
            }
        }

        return processedRecords;
    }

    /**
     * Used to get additional data from Episodate API.
     * Gets name of series and amount of unwatched episodes.
     *
     * @param {Object} record series record from Stop Watcher script
     * @return {Object} series record from Stop Watcher script with additional information
     * @memberof StopWatcherRepository
     */
    async #fetchAdditionalData(record) {
    
        const request = cacheRequest(this.#getMetadata());
        
        let response = await request.get(this.#apiURI + record.serieId);
        let episodeQualifier = this.#getEpisodeId(record);
        
        const unwatchedEpisodeCount = response.episodes
            .filter(episode => this.#getEpisodeId(episode) > episodeQualifier)
            .filter(episode => new Date(episode.airDate) < Date.now())
            .length;

        return {
            count: unwatchedEpisodeCount,
            name: response.name
        };
    }
    
    /**
     * Used to get unique number
     * representing series season and episode.
     *
     * @param {Object} seriesRecord series record
     * @return {Number} episode ID
     * @memberof StopWatcherRepository
     */
    #getEpisodeId(seriesRecord) {
        return seriesRecord.season * 1000 + seriesRecord.episode
    }

    /**
     * Used to get metadata needed to obtain
     * information from Episodate API.
     *
     * @return {Object} request metadata
     * @memberof StopWatcherRepository
     */
    #getMetadata() {
        return metadata()
            .data()
                .property("tvShow.name")
                .add()
            .list()
                .property("tvShow.episodes")
                .data()
                    .property("air_date")
                    .alias("airDate")
                    .transformFunction(value => new Date(value.replace(" ", "T") + "Z"))
                    .add()
                .data()
                    .property("season")
                    .add()
                .data()
                    .property("episode")
                    .add()
                .add()
            .create();
    }
}


/**
 * Debug repository used to
 * obtain mock series data.
 *
 * @class DebugRepository
 */
class DebugRepository {

    /**
     * Used to get mock series data
     *
     * @return {List<Object>} mock series data
     * @memberof DebugRepository
     */
    async getData() {
        return [
            {
                serieId: "dark-matter-apple-tv",
                name: "Dark Matter",
                showInSummary: true,
                season: 1,
                episode: 7,
                count: 10
            },
            {
                serieId: "game-of-thrones",
                name: "Game of Thrones",
                showInSummary: true,
                season: 7,
                episode: 7,
                count: 15
            },
            {
                serieId: "the-last-of-us",
                name: "The Last of Us",
                showInSummary: false,
                season: 1,
                episode: 2,
                count: 5
            }
        ];
    }
}


/**
 * Repository factory.
 *
 * @class SeriesDataRepositoryFactory
 */
class SeriesDataRepositoryFactory {

    /**
     * Factory method.
     * Used to get instance of repository.
     *
     * @static
     * @return {SeriesDataRepository} series data repository
     * @memberof SeriesDataRepositoryFactory
     */
    static getRepository() {

        if (conf.debug.enabled) {
            return new DebugRepository();
        }

        return new StopWatcherRepository();
    }
}


/**
 * Used to build widget.
 *
 * @class WidgetBuilder
 */
class WidgetBuilder {

    /**
     * Used to build widget.
     *
     * @static
     * @param {List<Object>} seriesRecords list of series records
     * @return {ListWidget} widget with remaining episodes to watch summary
     * @memberof WidgetBuilder
     */
    static build(seriesRecords) {
        
        let totalEpisodeCount = seriesRecords
            .filter(record => record.showInSummary)
            .reduce((totalEpisodes, record) => totalEpisodes + record.count, 0);
            
        let episodeCountWidget = text();
        
        // Nothing to be watched
        if (totalEpisodeCount === 0) {
            episodeCountWidget.content(tr("watchQueue_nothingLabel"));
        
        // Display episode count
        } else {
            episodeCountWidget.content(getEpisodeCountLabel(totalEpisodeCount));
        }
        
        const root = rootWidget()
            .gradient()
                .color(0, new Color("8b0000", 0.75))
                .color(0.2, new Color("8b0000", 0.4))
                .color(0.6, new Color("0f0f0f"))
                .create()
            .render();
        
        episodeCountWidget
            .blackMonospacedFont(25)
            .renderFor(root);
        
        spacer().renderFor(root, 5);
        
        text()
            .content(tr("watchQueue_toBeWatchedLabel"))
            .blackMonospacedFont(14)
            .opacity(0.3)
            .renderFor(root);

        return root;
    }
}


/**
 * Used to build detailed table
 * with how much episodes are left to watch.
 *
 * @class TableBuilder
 */
class TableBuilder {

    /**
     * Used to build readonly table
     * with detailed information on how much
     * episodes are left to watch.
     *
     * @static
     * @param {List<Object>} seriesRecords list of records
     * @return {UITable} UI table
     * @memberof TableBuilder
     */
    static async build(seriesRecords) {

        const uiFields = [
            new UIFormReadOnly((seriesData) => tr("watchQueue_tableSeriesNameLabel", seriesData.name), 75),
            new UIFormReadOnly((seriesData) => getEpisodeCountLabel(seriesData.count), 25)
        ];

        const table = new UIDataTable();
        table.title = tr("watchQueue_tableTitle");
        table.rowHeight = 55;
        table.showSeparators();

        table.setTableData(seriesRecords);
        table.setUIFields(uiFields);
        table.setSortingFunction((first, second) =>
            second.count - first.count
        );

        return table;
    }
}


await main();
Script.complete();

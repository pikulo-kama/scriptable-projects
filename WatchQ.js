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
        enabled: true,
        forceWidget: false
    }
};


function getEpisodeCountLabel(episodeCount) {
    
    let key = "watchQueue_episodeSingle";
    
    if (episodeCount > 1) {
        key = "watchQueue_episodePlural";
    }
    
    return tr(key, episodeCount);
}


class SeriesDataRepository {

    async getData() {}
}


class StopWatcherRepository {

    constructor() {
        this.__apiURI = "https://episodate.com/api/show-details?q=";
    }

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

            let additionalInformation = await this.__fetchAdditionalData(processedRecord);
            processedRecord = {...processedRecord, ...additionalInformation};

            if (processedRecord.count > 0) {
                processedRecords.push(processedRecord);
            }
        }

        return processedRecords;
    }

    async __fetchAdditionalData(record) {
    
        const request = cacheRequest(this.__getMetadata());
        
        let response = await request.get(this.__apiURI + record.serieId);
        let episodeQualifier = this.__getEpisodeId(record);
        
        const unwatchedEpisodeCount = response.episodes
            .filter(episode => this.__getEpisodeId(episode) > episodeQualifier)
            .filter(episode => new Date(episode.airDate) < Date.now())
            .length;

        return {
            count: unwatchedEpisodeCount,
            name: response.name
        };
    }
    
    __getEpisodeId(info) {
        return info.season * 1000 + info.episode
    }

    __getMetadata() {
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


class DebugRepository {

    async getData() {
        return [
            {
                serieId: "dark-matter-apple-tv",
                name: "Dark Matter",
                season: 1,
                episode: 7,
                count: 10
            },
            {
                serieId: "game-of-thrones",
                name: "Game of Thrones",
                season: 7,
                episode: 7,
                count: 15
            },
            {
                serieId: "the-last-of-us",
                name: "The Last of Us",
                season: 1,
                episode: 2,
                count: 5
            }
        ];
    }
}


class SeriesDataRepositoryFactory {

    static getRepository() {

        if (conf.debug.enabled) {
            return new DebugRepository();
        }

        return new StopWatcherRepository();
    }
}


class WidgetBuilder {

    static build(seriesRecords) {
        let totalEpisodeCount = seriesRecords
            .filter(record => record.showInSummary)
            .reduce((totalEpisodes, record) => totalEpisodes + record.episodeCount, 0);
            
        let episodeCountWidget = text();
        
        // Nothing to be watched
        if (totalEpisodeCount === 0) {
            episodeCountWidget.content(tr("watchQueue_nothingLabel"));
        
        // Display episode count
        } else {
            episodeCountWidget.content(getEpisodeCountLabel(totalEpisodeCount));
        }
        
        const root = rootWidget().render();
        
        episodeCountWidget
            .blackMonospacedFont(24)
            .renderFor(root);
        
        spacer().renderFor(root, 10);
        
        text()
            .content(tr("watchQueue_toBeWatchedLabel"))
            .blackMonospacedFont(18)
            .renderFor(root);

        return root;
    }
}


class TableBuilder {

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

const repository = SeriesDataRepositoryFactory.getRepository();
const seriesData = await repository.getData();

if (config.runsInWidget || conf.debug.forceWidget) {
    const widget = WidgetBuilder.build(seriesData);
    present(widget);

} else {
    const table = await TableBuilder.build(seriesData);
    await table.present();
}

Script.complete();

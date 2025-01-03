// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bars;
const { FileUtil } = importModule("File Util");
const { metadata, cacheRequest } = importModule("Cache");
const { Locale } = importModule("Localization")
const {
    spacer,
    stack,
    text,
    rootWidget,
    present
} = importModule("UI");

const conf = {
    debug: false,
    api: "https://episodate.com/api/show-details?q=",
}

const cacheMetadata = metadata()
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

await Locale.registerLabels({
    "t_header": "⚪️ Watchlist",
    "w_nothing": "Nothing",
    "w_to_be_watched": "to be Watched",
    "t_watchlist_no_data_header": "Watchlist is empty",
    "t_watchlist_no_data_subheader": "Add new series in 'Stop Watcher' and make sure that ID is set",
    "t_watchlist_empty_header": "Nothing to watch 😔",
    "t_watchlist_empty_subheader": "Looks like you need to wait a little longer...",
    "episode": " ep",
    "episode_plural_ending": "s"
})

let series = getListOfSeries()

if (conf.debug) {
    series = [
        {
            id: "dark-matter-apple-tv",
            season: 1,
            episode: 7
        }
    ]
}

let seriesApiData = await Promise.all(series.map(getSerieApiInfo))

if (config.runsInWidget) {
    buildWidget(seriesApiData)

} else {
    buildTable(seriesApiData)
}

Script.complete()


function buildWidget(seriesData) {
    
    let unwatchedEpisodes = seriesData
        .filter(serie => serie.showInSummary)
        .reduce((sum, serie) => sum + serie.episodeCount, 0)
        
    let episodeCountWidget = text();
    
    // Nothing to be watched
    if (unwatchedEpisodes === 0) {
        episodeCountWidget.content(Locale.tr("w_nothing"));
    
    // Display episode count
    } else {
        episodeCountWidget.content(getEpisodeCountLabel(unwatchedEpisodes));
    }
    
    const root = rootWidget().render();
    
    episodeCountWidget
        .blackMonospacedFont(24)
        .renderFor(root);
    
    spacer().renderFor(root, 10);
    
    text()
        .content(Locale.tr("w_to_be_watched"))
        .blackMonospacedFont(18)
        .renderFor(root);
        
    present(root);
}

function addMessageRow(header, subheader, table) {
    let row = new UITableRow()
    row.height = 44 * 3

    row.addText(header, subheader)
    table.addRow(row)
}

function buildTable(seriesData) {

    let table = new UITable()
    let headerRow = new UITableRow()

    headerRow.isHeader = true
    headerRow.backgroundColor = Color.darkGray()
    headerRow.cellSpacing = 100

    headerRow.addText(Locale.tr("t_header"))
    table.addRow(headerRow)
    
    let activeData = seriesData
        .filter(serie => serie.name && serie.episodeCount > 0)

    for (let serie of activeData) {
        
        let serieRow = new UITableRow()
        let episodeCountLabel = getEpisodeCountLabel(serie.episodeCount)
        
        let nameCell = serieRow.addText(serie.name)
        let episodeCountCell = serieRow.addText(episodeCountLabel)

        nameCell.widthWeight = 90
        episodeCountCell.widthWeight = 15

        nameCell.titleFont = Font.thinSystemFont(18)
        episodeCountCell.titleFont = Font.blackMonospacedSystemFont(13)

        table.addRow(serieRow)
    }

    if (seriesData.length === 0) {

        addMessageRow(
            Locale.tr("t_watchlist_no_data_header"), 
            Locale.tr("t_watchlist_no_data_subheader"),
            table
        )
        
    } else if (activeData.length === 0) {
        
        addMessageRow(
            Locale.tr("t_watchlist_empty_header"),
            Locale.tr("t_watchlist_empty_subheader"),
            table
        )
    }

    table.present()
}

function getEpisodeCountLabel(episodeCount) {
    
    let label = episodeCount + Locale.tr("episode")
    let pluralEnding = Locale.tr("episode_plural_ending")
    
    if (episodeCount > 1) {
        label += pluralEnding
    }
    
    return label
}

function getListOfSeries() {
    
    return FileUtil.readJson("Stop Watcher", "watchlist.json", [])
        .filter(info => info.serieId)
        .map(info => {
            
            let season = info.season
            let episode = info.episode

            episode -= 1

            if (episode < 1) {
                season = Math.max(season - 1, 1)
                episode = 99
            }
            
            return {
                id: info.serieId,
                season,
                episode,
                showInSummary: info.showInSummary
            }
        })
}

async function getSerieApiInfo(serieInfo) {
    
    const now = Date.now();
    const request = cacheRequest(cacheMetadata);
    
    let showApiData = await request.get(conf.api + serieInfo.id);
    let episodeQualifier = getEpQualifier(serieInfo);
    
    let unwatchedEpisodes = showApiData.episodes.filter(episode => 
        getEpQualifier(episode) > episodeQualifier &&
        now > new Date(episode.airDate)
    )

    return {
        id: serieInfo.id,
        name: showApiData.name,
        episodeCount: unwatchedEpisodes.length,
        showInSummary: serieInfo.showInSummary
    }
}

function getEpQualifier(info) {
    return info.season * 1000 + info.episode
}

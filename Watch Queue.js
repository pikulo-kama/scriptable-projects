// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bars;
const fileUtil = importModule("File Util")
const cacheUtil = importModule("Cache")
const locale = importModule("Localization")


const conf = {
    debug: false,
    api: "https://episodate.com/api/show-details?q=",
}

const cacheConf = [
    {
        prop: "tvShow.name"
    },
    {
        prop: "tvShow.episodes",
        type: cacheUtil.types.LIST,
        mappings: [
            {
                prop: "air_date",
                alias: "airDate",
                transform: v => new Date(v.replace(" ", "T") + "Z")
            },
            {
                prop: "season"
            },
            {
                prop: "episode"
            }
        ]
    }
]

await locale.registerLabels({
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
        
    let episodeCountLabel
    
    if (unwatchedEpisodes === 0) {
        episodeCountLabel = locale.getLabel("w_nothing")
        
    } else {
        episodeCountLabel = getEpisodeCountLabel(unwatchedEpisodes)
    }
    
    const widget = new ListWidget()
    
    const episodeCountWidget = widget.addText(episodeCountLabel)
    widget.addSpacer(10)
    const headerWidget = widget.addText(locale.getLabel("w_to_be_watched"))

    headerWidget.centerAlignText()
    headerWidget.font = Font.blackMonospacedSystemFont(18)
    headerWidget.textOpacity = .8

    episodeCountWidget.centerAlignText()
    episodeCountWidget.font = Font.blackMonospacedSystemFont(24)
    episodeCountWidget.textOpacity = 1

    QuickLook.present(widget)
    Script.setWidget(widget)
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

    headerRow.addText(locale.getLabel("t_header"))
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
            locale.getLabel("t_watchlist_no_data_header"), 
            locale.getLabel("t_watchlist_no_data_subheader"),
            table
        )
        
    } else if (activeData.length === 0) {
        
        addMessageRow(
            locale.getLabel("t_watchlist_empty_header"),
            locale.getLabel("t_watchlist_empty_subheader"),
            table
        )
    }

    table.present()
}

function getEpisodeCountLabel(episodeCount) {
    
    let label = episodeCount + locale.getLabel("episode")
    let pluralEnding = locale.getLabel("episode_plural_ending")
    
    if (episodeCount > 1) {
        label += pluralEnding
    }
    
    return label
}

function getListOfSeries() {
    
    let stopWatcherData = JSON.parse(fileUtil.getExtConfiguration(
        "watchlist.json", "[]", "Stop Watcher"
    ))
    
    return stopWatcherData
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
    
    const now = Date.now()
    let showApiData = await cacheUtil.getRequest(cacheConf, conf.api + serieInfo.id)
    let episodeQualifier = getEpQualifier(serieInfo)
    
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

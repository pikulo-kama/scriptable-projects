// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bars;
const fileUtil = importModule("File Util")
const cacheUtil = importModule("Cache")


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


function buildTable(seriesData) {

    let table = new UITable()
    let headerRow = new UITableRow()

    headerRow.isHeader = true
    headerRow.backgroundColor = Color.darkGray()
    headerRow.cellSpacing = 100

    headerRow.addText("⚪️ Watchlist")
    table.addRow(headerRow)

    for (let serie of seriesData) {

        if (!serie.name || serie.episodeCount === 0) {
            continue
        }
    
        let serieRow = new UITableRow()

        let episodeCountPrefix = " ep"

        if (serie.episodeCount > 1) {
            episodeCountPrefix += "s"
        }
        
        let nameCell = serieRow.addText(serie.name)
        let episodeCountCell = serieRow.addText(serie.episodeCount + episodeCountPrefix)

        nameCell.widthWeight = 90
        episodeCountCell.widthWeight = 15

        nameCell.titleFont = Font.thinSystemFont(18)
        episodeCountCell.titleFont = Font.blackMonospacedSystemFont(13)

        table.addRow(serieRow)
    }

    if (seriesData.length == 0) {

        let placeholderRow = new UITableRow()
        placeholderRow.height = 44 * 3

        placeholderRow.addText(
            "Watchlist is empty", 
            "Add new series in 'Stop Watcher' and make sure that ID is set"
        )

        table.addRow(placeholderRow)
    }

    table.present()
}

function buildWidget(seriesData) {

    let unwatchedEpisodes = seriesData.reduce((sum, serie) => sum + serie.episodeCount, 0)
    let episodeCountLabel = "" + unwatchedEpisodes;

    if (unwatchedEpisodes > 99) {
        episodeCountLabel = "99+"
    }

    episodeCountLabel += " ep"

    if (unwatchedEpisodes > 1) {
        episodeCountLabel += "s"
    }

    const widget = new ListWidget()
    const stack = widget.addStack()
    const countStack = stack.addStack()

    stack.centerAlignContent()
    stack.layoutVertically()

    countStack.centerAlignContent()
    countStack.layoutHorizontally()

    const headerWidget = stack.addText("in Watchlist")
    stack.addSpacer(20)

    countStack.addSpacer(10)
    const episodeCountWidget = countStack.addText(episodeCountLabel)
    countStack.addSpacer(10)

    headerWidget.centerAlignText()
    headerWidget.font = Font.blackMonospacedSystemFont(18)
    headerWidget.textOpacity = .8

    episodeCountWidget.rightAlignText()
    episodeCountWidget.padding = 10
    episodeCountWidget.font = Font.blackMonospacedSystemFont(24)
    episodeCountWidget.textOpacity = 1

    QuickLook.present(widget)
    Script.setWidget(widget)
    Script.complete()
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
                episode
            }
        })
}

async function getSerieApiInfo(serieInfo) {
    
    const now = Date.now()
    let showApiData = await cacheUtil.getRequest(cacheConf, conf.api + serieInfo.id)
    let episodeQualifier = serieInfo.season * 1000 + serieInfo.episode

    let unwatchedEpisodes = showApiData.episodes
        .map(ep => ({...ep, qualifier: ep.season * 1000 + ep.episode}))

    unwatchedEpisodes = unwatchedEpisodes.filter(episode => 
            episode.qualifier > episodeQualifier &&
            now > new Date(episode.airDate)
        )

    return {
        name: showApiData.name,
        episodeCount: unwatchedEpisodes.length
    }
}

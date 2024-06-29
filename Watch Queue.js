// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bars;
const fileUtil = importModule("File Util")


const conf = {
    api: "https://episodate.com/api/show-details?q=",
}

const cacheConf = {
    
}

let series = getListOfSeries()
let seriesApiData = series.map(getSerieApiInfo)

console.log(series)
console.log(seriesApiData)


function getListOfSeries() {
    
    let stopWatcherData = JSON.parse(fileUtil.getExtConfiguration(
        "watchlist.json", "[]", "Stop Watcher"
    ))
    
    return stopWatcherData
        .filter(info => info.serieId)
        .map(info => {
            
            let season = info.season
            let episode = info.episode
            
            // Don't count episode if it wasn't watched yet
            if (!info.hour && !info.minute) {
                episode -= 1

                if (episode < 1) {
                    season -= 1
                }
            }

            season = Math.max(season, 1);
            episode = Math.max(episode, 1)
            
            return {
                id: info.serieId,
                season,
                episode
            }
        })
}

function getSerieApiInfo(serieInfo) {
    
    return 1
}

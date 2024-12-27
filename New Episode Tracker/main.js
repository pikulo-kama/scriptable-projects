// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: film;

const cacheUtil = importModule("Cache");
const files = importModule("File Util");
const ui = importModule("UI");


const conf = {
    debug: {
        enabled: true,
        
        mockData: false,
        forceCountdownMonths: false,
        forceCountdownWeeks: false,
        forceCountdownDays: false,
        forceCountdownHours: false,
        forceWaitingStatus: false,
        forceEndedStatus: false,
        
        forceSeriesName: false,
        seriesName: "the-last-of-us",
        
        rerollColor: false
    },

    googleVisionApiKey: files.getConfiguration("google_vision_api_key.txt", "<your API key>"),
    backgroundColor: new Color("070d0d")
};

//#include "New Episode Tracker/ApiResource.js"
//#include "New Episode Tracker/EpisodateApiResource.js"
//#include "New Episode Tracker/StubApiResource.js"
//#include "New Episode Tracker/ApiResourceFactory.js"
//#include "New Episode Tracker/SeriesInfo.js"
//#include "New Episode Tracker/Series.js"
//#include "New Episode Tracker/EpisodeInfo.js"
//#include "New Episode Tracker/Status.js"
//#include "New Episode Tracker/SeriesWidget.js"

/**
 * Used to get series name for which
 * data should be provided.
 * 
 * @returns {String} series name
 */
function getSeriesName() {

    let seriesName = conf.debug.forceSeriesName ?
        conf.debug.seriesName :
        args.widgetParameter;

    if (!seriesName) {
        throw new Error("Series name was not provided")
    }

    return seriesName;
}


conf.seriesName = getSeriesName();

const apiResource = ApiResourceFactory.getResource();
const seriesData = await apiResource.download();

const widget = new SeriesWidget();
const seriesObject = new Series(seriesData);
await seriesObject.obtainDominantColor();

const renderedWidget = widget.create(seriesObject);

if (conf.debug.enabled) {
    renderedWidget.presentMedium();

} else {
    ui.present(renderedWidget);
}

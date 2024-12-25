// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: film;

const cacheUtil = importModule("Cache");
const files = importModule("File Util");
const ui = importModule("UI");


const conf = {
    debug: {
        enabled: false,
        mockData: false,
        forceSeriesName: false,
        rerollColor: false,
        seriesName: "game-of-thrones"
    },

    googleVisionApiKey: files.getConfiguration("google_vision_api_key.txt", "<your API key>"),
    backgroundColor: new Color("070d0d")
};


/**
 * TV series status enum.
 */
class Status {
    static Ended = "Ended";
    static Ongoing = "Ongoing";
}


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
     * @returns {Object} JSON with series information
     */
    async download() {}
}


/**
 * TV series API resource factory.
 * Should always be used to get instance of ApiResource.
 */
class ApiResourceFactory {

    /**
     * Used to get instance of ApiResource.
     * 
     * @returns {ApiResource} resource with series info
     */
    static getResource() {

        if (conf.debug.mockData) {
            return new StubApiResource();
        }

        return new EpisodateApiResource();
    }
}


/**
 * TV series API resource used for debugging.
 * Emulates data without access to internet.
 */
class StubApiResource extends ApiResource {

    async download() {

        return {
            title: "Game of Thrones",
            image: null,
            imageURI: null,
            status: Status.Ongoing,
            episodes: [
                {
                    season: 1,
                    episode: 1,
                    airDate: this.__dateNMonthInPast(12)
                },
                {
                    season: 1,
                    episode: 2,
                    airDate: this.__dateNMonthInPast(6)
                },
                {
                    season: 2,
                    episode: 1,
                    airDate: this.__dateNMonthInFuture(4)
                }
            ]
        };
    }

    /**
     * Used to create date wich
     * is N months in past from now.
     * 
     * @param {Number} months amount of months
     * @returns date in the past
     */
    __dateNMonthInPast(months) {

        let date = new Date();
        date.setMonth(date.getMonth() - months);

        return date;
    }

    /**
     * Used to create date wich
     * is N months in future from now.
     * 
     * @param {Number} months amount of months
     * @returns date in the future
     */
    __dateNMonthInFuture(months) {
        
        let date = new Date();
        date.setMonth(date.getMonth() + months);

        return date;
    }
}


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

        const seriesInfo = await cacheUtil.getRequest(cacheConfig, url);

        seriesInfo.episodes.forEach(episode => {
            episode.airDate = new Date(episode.airDate);
            episode.status = episode.status == 'Ended' ? Status.Ended : Status.Ongoing;
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


/**
 * DTO for TV series object.
 */
class Series {

    static __formatter = new RelativeDateTimeFormatter();
    static __REGEXP_COUNTDOWN = /in\s(\d+)\s(\w+)/;

    /**
     * @param {Object} rawData JSON data with series information
     */
    constructor(rawData) {

        this._title = rawData.title;
        this._status = rawData.status;
        this._imageURI = rawData.imageURI;
        this._image = this.__processImage(rawData.image);

        this._countdown = null;
        this._nextEpisode = null;
        this._dominantColor = null;

        this.__processCountdown(rawData);
    }

    /**
     * Used to get title of the series.
     * 
     * @returns {String} series title
     */
    getTitle() {
        return this._title;
    }

    /**
     * Used to get image that represents
     * current TV series.
     * 
     * @returns {Image} TV series image
     */
    getImage() {
        return this._image;
    }

    /**
     * Used to get TV series image
     * dominant color.
     * 
     * Initially is null need
     * to call 'obtainDominantColor' method
     * to populate it.
     * 
     * @returns {Color} series image dominant color
     */
    getDominantColor() {
        return this._dominantColor;
    }

    /**
     * Used to check whether current TV
     * series has ended.
     * 
     * @returns {boolean} True if ended, otherwise False
     */
    isEnded() {
        return this._status == Status.Ended;
    }

    /**
     * Used to check whether current TV
     * has countdown for the next episode.
     * 
     * @returns {boolean} True if has countdown, otherwise False
     */
    hasCountdown() {
        return !!this._countdown;
    }

    /**
     * Used to get next episode of the series
     * that hasn't been released yet.
     * 
     * @returns {Object} JSON with next episode information
     */
    getNextEpisode() {
        return this._nextEpisode;
    }

    /**
     * Used to get countdown for the next episode.
     * Returns string representation of countdown.
     * Example: 3h, 17d, ~3mo, etc.
     * 
     * @returns {String} textual representation of countdown
     */
    getCountdown() {

        let time = this._countdown.time;
        let type = this._countdown.type;

        let countdownString;

        if (type == 'hour') {
            countdownString = time + 'h';

        } else if (type == 'day') {
            countdownString = time + 'd';

        } else if (type == 'month') {
            countdownString = '~' + time + 'mo';
        }

        return countdownString;
    }

    /**
     * Used to assign dominant color
     * to current TV series object.
     * 
     * Dominant color will be either
     * retrieved from cache if it's there 
     * already, otherwise Google's Cloud Vision API
     * would be used to get colors for the image.
     */
    async obtainDominantColor() {

        if (!this._imageURI) {
            this._dominantColor = Color.gray();
            return;
        }

        const fileName = "dominant_colors.json";

        let colorMap = JSON.parse(files.getConfiguration(fileName, "{}"));
        let colorFromFile = colorMap[this._imageURI];

        if (!colorFromFile || conf.debug.rerollColor) {

            let dominantColor = await this.__retrieveDominantColor();
            colorFromFile = {color: dominantColor};
            colorMap[this._imageURI] = colorFromFile;

            files.updateConfiguration(fileName, JSON.stringify(colorMap));
        }

        this._dominantColor = new Color(colorFromFile.color);
    }

    /**
     * Used to initialize image object
     * for the series.
     * 
     * Will use image directly if it was available
     * for the series, otherwise question mark icon
     * would be used.
     * 
     * @param {String} imagePath path to the downloaded image on device
     * @returns {Image} initialized image for the series
     */
    __processImage(imagePath) {

        if (imagePath) {
            return Image.fromFile(imagePath);
        }

        return SFSymbol.named("questionmark").image;
    }

    /**
     * Used to initialize countdown
     * for the series.
     * 
     * @param {Object} rawData JSON data with series information
     */
    __processCountdown(rawData) {

        const episodes = rawData?.episodes;

        if (!episodes) {
            return;
        }

        let now = SpyDate.now();
        let nextEpisode = this.__getEpisodeAfter(episodes, now);

        if (!nextEpisode) {
            return;
        }

        Series.__formatter.useNumericDateTimeStyle();
        let countdownString = Series.__formatter.string(nextEpisode.airDate, now);

        // Remove 's' from end of countdown
        if (countdownString.endsWith('s')) {
            countdownString = countdownString.substring(0, countdownString.length - 1);
        }

        let match = countdownString.match(Series.__REGEXP_COUNTDOWN);
        let time = Number(match[1]);
        let type = match[2];

        this._nextEpisode = nextEpisode;
        this._countdown = {
            time,
            type
        };
    }

    /**
     * Used to get episode that will be
     * released after provided date.
     * 
     * @param {List<Object>} episodes list of episodes' JSON data
     * @param {Date} targetDate date for which episode should be found
     * @returns {Object} JSON of episode that releases after provided date
     */
    __getEpisodeAfter(episodes, targetDate) {
        episodes = episodes.filter(episode =>
            episode.airDate > targetDate
        )

        if (episodes.length == 0) {
            return null;
        }

        // Sort ascending.
        episodes.sort((first, second) => 
            first.airDate - second.airDate
        )

        // Get first episode after the specifed date.
        return episodes[0];
    }

    /**
     * Entrypoint to the Google's
     * Cloud Vision API.
     * 
     * Used to get dominant colors for the
     * series image.
     * 
     * Random image properties are being picked from the list
     * of generated ones.
     * 
     * @returns {String} HEX representation of color
     */
    async __retrieveDominantColor() {

        let webView = new WebView();
        await webView.loadURL("https://example.com/");

        let response = await webView.evaluateJavaScript(`
            var xhr = new XMLHttpRequest();

            xhr.open('POST', "https://vision.googleapis.com/v1/images:annotate?alt=json&key=${conf.googleVisionApiKey}", false);

            xhr.send(JSON.stringify({
                "requests": [{
                    "image": {
                        "source": {
                            "imageUri": "${this._imageURI}"
                        }
                    },
                    "features": [{
                        "maxResults": 3,
                        "type": "IMAGE_PROPERTIES"
                    }]
                }]
            }));

            JSON.parse(xhr.responseText);
        `);

        let colors = response.responses[0].imagePropertiesAnnotation.dominantColors.colors;        
        let randomColor = colors[Math.floor(Math.random()* colors.length)];

        let red = Number(randomColor.color.red).toString(16);
        let green = Number(randomColor.color.green).toString(16);
        let blue = Number(randomColor.color.blue).toString(16);

        let hexColor = red + green + blue;
        return hexColor;
    }
}


/**
 * Helper class used to create
 * widget with TV series information.
 */
class SeriesWidget {

    create(series) {

        const root = this.__createRootWidget(series);

        // Render widget wrapper
        // with small paddings on top and bottom.
        ui.spacer().renderFor(root, 4);
        const rootStack = ui.stack().renderFor(root);
        ui.spacer().renderFor(root, 4);

        // Series image
        ui.image()
            .image(series.getImage())
            .radius(5)
            .renderFor(rootStack);

        ui.spacer().renderFor(rootStack);
        
        const contentStack = ui.stack()
            .vertical()
            .renderFor(rootStack);
        
        // Series title
        ui.text()
            .content(series.getTitle())
            .blackRoundedFont(24)
            .limit(20)
            .rightAlign()
            .renderFor(contentStack);

        ui.spacer().renderFor(contentStack);
        
        if (series.hasCountdown()) {

            const nextEpisode = series.getNextEpisode();
        
            // Countdown
            ui.spacer().renderFor(contentStack, 10);
            this.__renderCountdown(contentStack, series);
            ui.spacer().renderFor(contentStack);
            
            // Air date
            ui.date()
                .content(nextEpisode.airDate)
                .blackFont(8)
                .opacity(0.7)
                .rightAlign()
                .renderFor(contentStack);
        
        } else {
            // Other statuses (ended, waiting for next season)
            this.__renderStatusPlaceholder(contentStack, series);
        }
        
        return root;
    }
    
    __renderCountdown(root, series) {

        const countdownBox = ui.stack()
            .color(series.getDominantColor())
            .padding(5)
            .radius(5)
            .rightAlign()
            .renderFor(root);
        
        ui.text()
            .content(series.getCountdown())
            .color(conf.backgroundColor)
            .boldMonospacedFont(36)
            .renderFor(countdownBox);
    }
    
    __renderStatusPlaceholder(root, series) {
        
        const statusWidget = ui.image();
        
        if (series.isEnded()) {
            statusWidget.icon("checkmark.circle");
            statusWidget.color(Color.green());
            
        } else {
            statusWidget.icon("hourglass.circle");
            statusWidget.color(Color.yellow());
        }
        
        statusWidget
            .rightAlign()
            .opacity(0.8)
            .size(24)
            .renderFor(root);
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget.
     */
    __createRootWidget(series) {

        const dominantColor = series.getDominantColor();
        const root = ui.createRoot();

        if (dominantColor) {

            const gradient = new LinearGradient();

            gradient.startPoint = new Point(0, 1);
            gradient.endPoint = new Point(1, 1);

            gradient.locations = [0, 0.7];
            gradient.colors = [
                dominantColor,
                conf.backgroundColor
            ];
            root.backgroundGradient = gradient;
        }

        return root;
    }
}


/**
 * Helper class which is used
 * to retrieve current date.
 * 
 * Main purpose of the helper is to be able to overwrite behavior
 * to return mock dates when application runs in debug mode.
 */
class SpyDate {

    /**
     * Used to get current date.
     * 
     * @returns {Date} current date
     */
    static now() {
        return new Date();
    }
}


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

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: film;

const { cacheRequest, metadata } = importModule("Cache");
const { FileUtil } = importModule("File Util");
const { Logger } = importModule("Logger");

const {
    debugEnabled,
    debugFeatureEnabled,
    featureEnabled,
    getFeature
} = importModule("Feature");

const {
    spacer,
    stack,
    text,
    image,
    date,
    rootWidget,
    present
} = importModule("UI");


const GOOGLE_VISION_API_KEY = FileUtil.readLocalFile("google_vision_api_key.txt", "<your API key>");
const seriesNameParameter = getSeriesName();

/**
 * ENTRY POINT
 */
async function main() {
    const apiResource = ApiResourceFactory.getResource();
    const seriesData = await apiResource.download();

    const widget = new SeriesWidget();
    const seriesObject = new Series(seriesData);
    await seriesObject.obtainDominantColor();

    const renderedWidget = widget.create(seriesObject);

    if (debugEnabled()) {
        renderedWidget.presentMedium();

    } else {
        present(renderedWidget);
    }
}


/**
 * Used to get series name for which
 * data should be provided.
 * 
 * @returns {String} series name
 */
function getSeriesName() {

    let seriesName = args.widgetParameter;

    if (debugFeatureEnabled("mockSeriesName")) {
        seriesName = getFeature("mockSeriesName");
    }

    if (!seriesName) {
        throw new Error("Series name was not provided.");
    }

    return seriesName;
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
     * @returns {SeriesInfo} series information
     */
    async download() {}
}


/**
 * Main TV series API resource.
 * Consumes 'episodate' API to get series information.
 */
class EpisodateApiResource extends ApiResource {

    #webUrl = "https://episodate.com/api/show-details?q=";

    async download() {

        const request = cacheRequest(this.#getMetadata());
        const seriesData = await request.get(this.#getSeriesUrl());

        const seriesInfo = new SeriesInfo(
            seriesData.title,
            seriesData.status == 'Ended' ? Status.Ended : Status.Ongoing,
            seriesData.image,
            seriesData.imageURI
        );

        seriesData.episodes.forEach(ep => {
            const episode = new EpisodeInfo(
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
    #getSeriesUrl() {
        return this.#webUrl + seriesNameParameter;
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
    #getMetadata() {

        return metadata()
            .data()
                .property("tvShow.name")
                .alias("title")
                .add()
            .image()
                .property("tvShow.image_thumbnail_path")
                .alias("image")
                .add()
            .data()
                .property("tvShow.image_thumbnail_path")
                .alias("imageURI")
                .add()
            .data()
                .property("tvShow.status")
                .add()
            .list()
                .property("tvShow.episodes")
                .data()
                    .property("season")
                    .add()
                .data()
                    .property("episode")
                    .add()
                .data()
                    .property("air_date")
                    .alias("airDate")
                    .transformFunction(value => new Date(`${value.replace(" ", "T")}Z`))
                    .add()
                .add()
            .create();
    }
}


/**
 * TV series API resource used for debugging.
 * Emulates data without access to internet.
 */
class StubApiResource extends ApiResource {

    async download() {
        
        const seriesInfo = new SeriesInfo(
            "Debug",
            debugFeatureEnabled("forceEndedStatus") ? Status.Ended : Status.Ongoing
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(1, 1, this.#dateNMonthsInPast(12))
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(1, 2, this.#dateNMonthsInPast(6))
        );
        
        seriesInfo.addEpisode(
            new EpisodeInfo(2, 1, this.#getNextEpisodeDate())
        );
        
        return seriesInfo;
    }

    /**
     * Used to get next episode date
     * behavious will change depending on
     * debug configuration
     * 
     * @returns {Date} next episode release date
     */
    #getNextEpisodeDate() {

        // Last known episode already aired.
        // No information when next would be (Waiting).
        if (debugFeatureEnabled("forceWaitingStatus")) {
            return this.#dateNMonthsInPast(1);
        }

        if (debugFeatureEnabled("forceCountdownHours")) {
            return this.#dateNHoursInFuture(2);
        }

        if (debugFeatureEnabled("forceCountdownDays")) {
            return this.#dateNDaysInFuture(5);
        }

        if (debugFeatureEnabled("forceCountdownWeeks")) {
            return this.#dateNDaysInFuture(8);
        }

        if (debugFeatureEnabled("forceCountdownMonths")) {
            return this.#dateNMonthsInFuture(3);
        }
        
        return new Date();
    }

    /**
     * Used to create date wich
     * is N months in past from now.
     * 
     * @param {Number} months amount of months
     * @returns date in the past
     */
    #dateNMonthsInPast(months) {

        const date = new Date();
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
    #dateNMonthsInFuture(months) {
        
        const date = new Date();
        date.setMonth(date.getMonth() + months);

        return date;
    }

    /**
     * Used to create date wich
     * is N days in future from now.
     * 
     * @param {Number} days amount of days
     * @returns date in the future
     */
    #dateNDaysInFuture(days) {
        
        const date = new Date();
        date.setDate(date.getDate() + days);

        return date;
    }

    /**
     * Used to create date wich
     * is N hours in future from now.
     * 
     * @param {Number} hours amount of hours
     * @returns date in the future
     */
    #dateNHoursInFuture(hours) {
        
        const date = new Date();
        date.setHours(date.getHours() + hours);

        return date;
    }
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

        if (debugFeatureEnabled("mockSeriesData")) {
            return new StubApiResource();
        }

        return new EpisodateApiResource();
    }
}


/**
 * DTO with series information.
 */
class SeriesInfo {

    #title;
    #status;
    #image;
    #imageURI;
    #episodes = [];
    
    /**
     * @param {String} title series title
     * @param {Status} status status of series (Ended, Ongoing)
     * @param {String} image path to series image on device file system
     * @param {String} imageURI URI to series image
     */
    constructor(title, status, image, imageURI) {
        this.#title = title;
        this.#status = status;
        this.#image = image;
        this.#imageURI = imageURI;
    }
    
    /**
     * Get series title.
     * 
     * @returns {String} series title
     */
    getTitle() {
        return this.#title;
    }
    
    /**
     * Get series status.
     * 
     * @returns {Status} series status
     */
    getStatus() {
        return this.#status;
    }
    
    /**
     * Get series image path.
     * 
     * @returns {String} series image path
     */
    getImage() {
        return this.#image;
    }
    
    /**
     * Get series image URI.
     * 
     * @returns {String} series image URI
     */
    getImageURI() {
        return this.#imageURI;
    }
    
    /**
     * Get series episode list.
     * 
     * @returns {Array<Episode>} list of series episodes
     */
    getEpisodes() {
        return this.#episodes;
    }
    
    /**
     * Adds episode to the series.
     * 
     * @param {EpisodeInfo} episode episode that should be added
     */
    addEpisode(episode) {
        this.#episodes.push(episode);
    }
}


/**
 * DTO for TV series object.
 */
class Series {

    #logger = new Logger(Series.name);

    static #formatter = new RelativeDateTimeFormatter();
    static #REGEXP_COUNTDOWN = /in\s(\d+)\s(\w+)/;

    #seriesInfo;
    #image;
    #countdown = null;
    #lastEpisode = null;
    #nextEpisode = null;
    #dominantColor = null;

    /**
     * @param {SeriesInfo} seriesInfo series information
     */
    constructor(seriesInfo) {
        
        this.#seriesInfo = seriesInfo;
        this.#image = this.#processImage(seriesInfo.getImage());

        this.#processCountdown(seriesInfo);
    }

    /**
     * Used to get title of the series.
     * 
     * @returns {String} series title
     */
    getTitle() {
        return this.#seriesInfo.getTitle();
    }

    /**
     * Used to get image that represents
     * current TV series.
     * 
     * @returns {Image} TV series image
     */
    getImage() {
        return this.#image;
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
        return this.#dominantColor;
    }

    /**
     * Used to check whether current TV
     * series has ended.
     * 
     * @returns {Boolean} True if ended, otherwise False
     */
    isEnded() {
        return this.#seriesInfo.getStatus() == Status.Ended;
    }

    /**
     * Used to check whether current TV
     * has countdown for the next episode.
     * 
     * @returns {Boolean} True if has countdown, otherwise False
     */
    hasCountdown() {
        return !!this.#countdown;
    }

    /**
     * Used to get air date of last episode of the series
     * that has been released.
     * 
     * @returns {Date} air date of last episode
     */
    getLastEpisodeDate() {
        return this.#lastEpisode?.getAirDate();
    }

    /**
     * Used to get tag of last episode of the series
     * that has been released.
     *
     * @return {String} tag of last episode
     * @memberof Series
     */
    getLastEpisode() {
        return this.#lastEpisode?.toString();
    }

    /**
     * Used to get air date of next episode of the series
     * that hasn't been released yet.
     * 
     * @returns {Date} air date of next episode
     */
    getNextEpisodeDate() {
        return this.#nextEpisode?.getAirDate();
    }
    
    /**
     * Used to get tag of next episode of the series
     * that hasn't been released yet.
     *
     * @return {String} tag of next episode
     * @memberof Series
     */
    getNextEpisode() {
        return this.#nextEpisode?.toString();
    }

    /**
     * Used to get countdown for the next episode.
     * Returns string representation of countdown.
     * Example: 3h, 17d, ~3mo, etc.
     * 
     * @returns {String} textual representation of countdown
     */
    getCountdown() {

        const time = this.#countdown.time;
        const type = this.#countdown.type;

        switch (type) {

            case 'hour':
                return `${time}h`;
            
            case 'day':
                return `${time}d`;
            
            case 'week':
                return `~${time}w`;

            case 'month':
                return `~${time}mo`;
            
            default:
                return `${time} ${type}`;
        }
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
        
        const fileName = "dominant_colors.json";
        const imageURI = this.#seriesInfo.getImageURI();
        
        if (!imageURI) {
            this.#dominantColor = Color.gray();
            return;
        }

        const colorMap = FileUtil.readLocalJson(fileName, {});
        let colorFromFile = colorMap[imageURI];

        if (!colorFromFile || featureEnabled("rerollColor")) {

            const dominantColor = await this.#retrieveDominantColor();
            colorFromFile = {color: dominantColor};
            colorMap[imageURI] = colorFromFile;

            FileUtil.updateLocalJson(fileName, colorMap);
        }

        this.#dominantColor = new Color(colorFromFile.color);
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
    #processImage(imagePath) {
        this.#logger.debug("Processing series image.", {title: this.#seriesInfo.getTitle()});

        if (imagePath) {
            const imageObject = Image.fromFile(imagePath);

            this.#logger.debug("Image data have been loaded from file.", {imageObject, imagePath});
            return imageObject;
        }

        this.#logger.debug("Image path is missing. Question mark placeholder will be displayed instead.")
        return SFSymbol.named("questionmark").image;
    }

    /**
     * Used to initialize countdown
     * for the series.
     * 
     * @param {SeriesInfo} seriesInfo with series information
     */
    #processCountdown(seriesInfo) {

        const now = new Date();
        const nextEpisode = this.#getEpisodeAfter(seriesInfo, now);

        this.#lastEpisode = this.#getEpisodeBefore(seriesInfo, now);

        if (!nextEpisode) {
            return;
        }

        Series.#formatter.useNumericDateTimeStyle();
        let countdownString = Series.#formatter.string(nextEpisode.getAirDate(), now);

        // Remove 's' from end of countdown
        if (countdownString.endsWith('s')) {
            countdownString = countdownString.substring(0, countdownString.length - 1);
        }

        const match = countdownString.match(Series.#REGEXP_COUNTDOWN);
        const time = Number(match[1]);
        const type = match[2];

        this.#nextEpisode = nextEpisode;
        this.#countdown = {
            time,
            type
        };
    }

    /**
     * Used to get episode that will be
     * released after provided date.
     * 
     * @param {SeriesInfo} seriesInfo series information
     * @param {Date} targetDate date for which episode should be found
     * @returns {EpisodeInfo} episode that releases after provided date
     */
    #getEpisodeAfter(seriesInfo, targetDate) {

        let episodes = seriesInfo?.getEpisodes();

        if (!episodes) {
            return;
        }

        episodes = episodes.filter(episode =>
            episode.getAirDate() > targetDate
        )

        if (episodes.length == 0) {
            return null;
        }

        // Sort ascending.
        episodes.sort((first, second) => 
            first.getAirDate() - second.getAirDate()
        )

        // Get first episode after the specifed date.
        return episodes[0];
    }

    #getEpisodeBefore(seriesInfo, targetDate) {
        let episodes = seriesInfo?.getEpisodes();

        if (!episodes) {
            return;
        }

        episodes = episodes.filter(episode =>
            episode.getAirDate() < targetDate
        )

        if (episodes.length == 0) {
            return null;
        }

        // Sort descending.
        episodes.sort((first, second) => 
            second.getAirDate() - first.getAirDate() ||
            second.getEpisode() - first.getEpisode()
        );

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
    async #retrieveDominantColor() {

        const webView = new WebView();
        await webView.loadURL("https://example.com/");

        const response = await webView.evaluateJavaScript(`
            var xhr = new XMLHttpRequest();

            xhr.open('POST', "https://vision.googleapis.com/v1/images:annotate?alt=json&key=${GOOGLE_VISION_API_KEY}", false);

            xhr.send(JSON.stringify({
                "requests": [{
                    "image": {
                        "source": {
                            "imageUri": "${this.#seriesInfo.getImageURI()}"
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

        // If API key is invalid then use fallback color.
        if (response?.error?.status === "INVALID_ARGUMENT") {
            return featureEnabled(".fallbackDominantColor");
        }

        const colors = response.responses[0].imagePropertiesAnnotation.dominantColors.colors;        
        const randomColor = colors[Math.floor(Math.random()* colors.length)];

        const red = Number(randomColor.color.red).toString(16);
        const green = Number(randomColor.color.green).toString(16);
        const blue = Number(randomColor.color.blue).toString(16);

        return red + green + blue;
    }
}


/**
 * Episode DTO
 */
class EpisodeInfo {

    #season;
    #episode;
    #airDate;
    
    /**
     * @param {Number} season season
     * @param {Number} episode episode number
     * @param {Date} airDate episode release date
     */
    constructor(season, episode, airDate) {
        this.#season = season;
        this.#episode = episode;
        this.#airDate = airDate;
    }
    
    /**
     * Used to get episode season.
     * 
     * @returns {Number} season
     */
    getSeason() {
        return this.#season;
    }
    
    /**
     * Used to get episode number.
     * 
     * @returns {Number} episode number
     */
    getEpisode() {
        return this.#episode;
    }
    
    /**
     * Used to get episode release date.
     * 
     * @returns {Date} release date
     */
    getAirDate() {
        return this.#airDate;
    }
    
    /**
     * Used to get textual representation
     * of episode.
     * 
     * Example: s2e12 (season 2, episode 12), etc.
     * 
     * @returns {String} textual representation of episode
     */
    toString() {
        
        const season = this.#season;
        const episode = this.#episode;
        
        if (season && episode) {
            return `s${season}e${episode}`;
        }
        
        return "";
    }
}


/**
 * TV series status enum.
 */
class Status {
    static Ended = "Ended";
    static Ongoing = "Ongoing";
}


/**
 * Helper class used to create
 * widget with TV series information.
 */
class SeriesWidget {

    static #backgroundColor = new Color("070d0d");
    static #tagReleaseDateSeparator = "|";

    /**
     * Used to create widget based on
     * the series information.
     * 
     * @param {Series} series series that should be rendered
     * @returns {ListWidget} widget with all series info ready to render
     */
    create(series) {

        const root = this.#createRootWidget(series);
        let episodeTagToDisplay = series.getLastEpisode();
        let episodeDateToDisplay = series.getLastEpisodeDate();

        if (series.hasCountdown()) {
            episodeTagToDisplay = series.getNextEpisode();
            episodeDateToDisplay = series.getNextEpisodeDate();
        }

        const rootStack = stack()
            .margin(2)
            .renderFor(root);

        // Series image.
        image()
            .image(series.getImage())
            .radius(5)
            .renderFor(rootStack);

        spacer().renderFor(rootStack);
        
        const contentStack = stack()
            .vertical()
            .renderFor(rootStack);
        
        // Series title.
        text()
            .content(series.getTitle())
            .blackRoundedFont(24)
            .limit(16)
            .rightAlign()
            .renderFor(contentStack);

        spacer().renderFor(contentStack);
                            
        // Countdown Block.
        this.#renderCountdownBlock(contentStack, series);

        spacer().renderFor(contentStack, 15);
        
        // Episode info block (tag + release date).
        if (episodeTagToDisplay && episodeDateToDisplay) {

            this.#renderEpisodeInformation(
                contentStack,
                series,
                episodeTagToDisplay,
                episodeDateToDisplay
            );
        }
        
        return root;
    }
    
    /**
     * Used to render countdown block of the series.
     * 
     * If series has ended or there is no countdown
     * then placeholder would be displayed instead.
     * 
     * @param {*} root parent widget where block should be
     * @param {Series} series series
     */
    #renderCountdownBlock(root, series) {

        const boxBuilder = stack();
        let boxContentBuilder;

        // When we awaiting for next episode.
        if (series.hasCountdown()) {

            boxBuilder.color(series.getDominantColor());
            boxContentBuilder = text()
                .content(series.getCountdown())
                .boldMonospacedFont(32);

        } else {

            boxContentBuilder = image()
                .size(36);

            // Series has ended.
            if (series.isEnded()) {
                boxBuilder.color(Color.green());
                boxContentBuilder.icon('checkmark.circle');

            // Not ended but no information when next episode would be.
            } else {
                boxBuilder.color(Color.yellow());
                boxContentBuilder.icon('hourglass.circle');
            }
        }

        const countdownBox = boxBuilder
            .width(120)
            .padding(5)
            .radius(5)
            .rightAlign()
            .renderFor(root);
        
        boxContentBuilder
            .color(SeriesWidget.#backgroundColor)
            .renderFor(countdownBox);
    }

    /**
     * Used to render release info block.
     * Contains season/episode string (s1e3)
     * and actual date when episode would/did air.
     * 
     * @param {*} root parent widget where block should be
     * @param {Series} series series
     * @param {String} episodeTag season/episode string of episode (e.g. s3e2)
     * @param {Date} episodeDate date when displayed episode will be/was released
     */
    #renderEpisodeInformation(root, series, episodeTag, episodeDate) {
        const releaseInfoStack = stack()
            .rightAlign()
            .renderFor(root);
        
        // Season / episode 
        text()
            .content(episodeTag)
            .blackFont(10)
            .opacity(0.9)
            .renderFor(releaseInfoStack);
        
        spacer().renderFor(releaseInfoStack, 4);
        
        text()
            .content(SeriesWidget.#tagReleaseDateSeparator)
            .blackFont(10)
            .color(series.getDominantColor())
            .renderFor(releaseInfoStack);
        
        spacer().renderFor(releaseInfoStack, 4);
        
        // Air date
        date()
            .content(episodeDate)
            .blackFont(8)
            .opacity(0.7)
            .renderFor(releaseInfoStack);
    }

    /**
     * Wrapper to create root widget.
     * 
     * @param {Series} series series
     * @returns {ListWidget} root widget
     */
    #createRootWidget(series) {

        return rootWidget()
            .gradient()
                .leftToRight()
                .color(0, series.getDominantColor())
                .color(0.7, SeriesWidget.#backgroundColor)
                .create()
            .render();
    }
}


await main();
Script.complete();

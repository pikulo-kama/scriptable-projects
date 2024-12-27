
/**
 * DTO for TV series object.
 */
class Series {

    static __formatter = new RelativeDateTimeFormatter();
    static __REGEXP_COUNTDOWN = /in\s(\d+)\s(\w+)/;

    /**
     * @param {SeriesInfo} seriesInfo series information
     */
    constructor(seriesInfo) {
        
        this._seriesInfo = seriesInfo;
        this._image = this.__processImage(seriesInfo.getImage());

        this._countdown = null;
        this._nextEpisode = null;
        this._dominantColor = null;

        this.__processCountdown(seriesInfo);
    }

    /**
     * Used to get title of the series.
     * 
     * @returns {String} series title
     */
    getTitle() {
        return this._seriesInfo.getTitle();
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
     * @returns {Boolean} True if ended, otherwise False
     */
    isEnded() {
        return this._seriesInfo.getStatus() == Status.Ended;
    }

    /**
     * Used to check whether current TV
     * has countdown for the next episode.
     * 
     * @returns {Boolean} True if has countdown, otherwise False
     */
    hasCountdown() {
        return !!this._countdown;
    }

    /**
     * Used to get air date of next episode of the series
     * that hasn't been released yet.
     * 
     * @returns {Date} air date of next episode
     */
    getNextEpisodeDate() {
        return this._nextEpisode?.getAirDate();
    }
    
    getNextEpisode() {
        return this._nextEpisode?.toString();
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
        
        const imageURI = this._seriesInfo.getImageURI();
        
        if (!imageURI) {
            this._dominantColor = Color.gray();
            return;
        }
        
        const fileName = "dominant_colors.json";

        let colorMap = JSON.parse(files.getConfiguration(fileName, "{}"));
        let colorFromFile = colorMap[imageURI];

        if (!colorFromFile || conf.debug.rerollColor) {

            let dominantColor = await this.__retrieveDominantColor();
            colorFromFile = {color: dominantColor};
            colorMap[imageURI] = colorFromFile;

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
     * @param {SeriesInfo} seriesInfo with series information
     */
    __processCountdown(seriesInfo) {

        let now = new Date();
        let nextEpisode = this.__getEpisodeAfter(seriesInfo, now);

        if (!nextEpisode) {
            return;
        }

        Series.__formatter.useNumericDateTimeStyle();
        let countdownString = Series.__formatter.string(nextEpisode.getAirDate(), now);

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
     * @param {SeriesInfo} seriesInfo series information
     * @param {Date} targetDate date for which episode should be found
     * @returns {EpisodeInfo} episode that releases after provided date
     */
    __getEpisodeAfter(seriesInfo, targetDate) {

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
                            "imageUri": "${this._seriesInfo.getImageURI()}"
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

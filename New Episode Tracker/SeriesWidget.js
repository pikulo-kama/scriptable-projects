
/**
 * Helper class used to create
 * widget with TV series information.
 */
class SeriesWidget {

    /**
     * Used to create widget based on
     * the series information.
     * 
     * @param {Series} series series that should be rendered
     * @returns {ListWidget} widget with all series info ready to render
     */
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
            .limit(16)
            .rightAlign()
            .renderFor(contentStack);

        ui.spacer().renderFor(contentStack);
        
        if (series.hasCountdown()) {

            const nextEpisode = series.getNextEpisode();
        
            // Countdown
            ui.spacer().renderFor(contentStack, 10);
            this.__renderCountdown(contentStack, series);
            ui.spacer().renderFor(contentStack);
            
            this.__renderReleaseInformation(contentStack, series)
        
        } else {
            // Other statuses (ended, waiting for next season)
            this.__renderStatusPlaceholder(contentStack, series);
        }
        
        return root;
    }
    
    /**
     * Used to render countdown block of the series.
     * 
     * @param {*} root parent widget where block should be
     * @param {Series} series series
     */
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
    
    /**
     * Used to render release info block.
     * Contains season/episode string (s1e3)
     * and actual date when next episode would air.
     * 
     * @param {*} root parent widget where block should be
     * @param {Series} series series
     */
    __renderReleaseInformation(root, series) {
        
        const releaseInfoStack = ui.stack()
            .rightAlign()
            .renderFor(root);
        
        // Season / episode 
        ui.text()
            .content(series.getNextEpisode())
            .blackFont(10)
            .opacity(0.9)
            .renderFor(releaseInfoStack);
        
        ui.spacer().renderFor(releaseInfoStack, 4);
        
        ui.text()
            .content("|")
            .blackFont(10)
            .color(series.getDominantColor())
            .renderFor(releaseInfoStack);
        
        ui.spacer().renderFor(releaseInfoStack, 4);
        
        // Air date
        ui.date()
            .content(series.getNextEpisodeDate())
            .blackFont(8)
            .opacity(0.7)
            .renderFor(releaseInfoStack);
    }
    
    /**
     * Used to render series status.
     * This is invoked when there are no information
     * when next episode would be released.
     * 
     * Can render two statuses:
     * - Series has ended
     * - No info, but series has not ended (Wait)
     * 
     * @param {*} root parent widget where block should be
     * @param {Series} series series
     */
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
     * @param {Series} series series
     * @returns {ListWidget} root widget
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


/**
 * Helper class used to render
 * widget with schedule information.
 */
class ScheduleWidget {

    /**
     * Entrypoint. Used to render schedule widget.
     * 
     * @param {ScheduleWebView} webView 
     */
    async render(webView) {

        // This is triggered when schedule data was
        // not loaded due to connection issues.
        if (!webView.isAvailable()) {
            ui.present(this.__getNotAvailableRootWidget());
            return;
        }

        const root = this.__createRootWidget();
        const todaySchedule = webView.getToday();

        // Render header of widget (icon + address).
        const headerStack = ui.stack().renderFor(root);
        
        ui.image()
            .icon("lightbulb.slash")
            .size(15)
            .regularWeight()
            .renderFor(headerStack);
            
        ui.spacer().renderFor(headerStack, 5);
        
        ui.text()
            .content(conf.address.shortAddress)
            .limit(16)
            .blackRoundedFont(10)
            .color(new Color("bfbfbf"))
            .renderFor(headerStack);

        // Add indicator if there are schedules for tomorrow.
        if (webView.getTomorrow().hasInfo()) {
            this.__renderTomorrowScheduleIndicator(root, webView.getTomorrow());
        }

        ui.spacer().renderFor(root);

        // Show placeholder when there are no outages planned for today.
        if (!todaySchedule.hasNext()) {
            ui.image()
                .icon("lightbulb.fill")
                .size(46)
                .yellowColor()
                .heavyWeight()
                .renderFor(root);
                
            ui.spacer().renderFor(root);
        }

        // Add each outage record.
        while (todaySchedule.hasNext()) {
            this.__renderOutageRecord(root, todaySchedule.next());

            // Don't add spacing after last outage record.
            if (todaySchedule.hasNext()) {
                ui.spacer().renderFor(root, 5);
            }
        }

        ui.present(root);
    }

    /**
     * Used to render individual outage record.
     * 
     * @param {ListWidget} root root widget.
     * @param {OutageRecord} outageRecord daily outage record.
     */
    __renderOutageRecord(root, outageRecord) {

        let outageIcon = ui.image();
        let outagePeriodText = ui.text();
        
        // Change styling of outages that may not occur.
        if (outageRecord.isProbable()) {
            outageIcon.icon("questionmark.square")
            outageIcon.yellowColor();
                
        } else {
            let iconCode = outageRecord.getOrder() + ".square.fill"
            outageIcon.icon(iconCode);
        }

        // Make outage record slightly transparent if it's already passed.
        if (outageRecord.isPassed()) {
            outageIcon.opacity(0.6);
            outagePeriodText.opacity(0.6);
        }

        let outageStack = ui.stack().renderFor(root);
        
        outageIcon
            .size(16)
            .renderFor(outageStack);
        
        ui.spacer().renderFor(outageStack, 2);
        
        outagePeriodText
            .content(outageRecord.toString())
            .blackFont(14)
            .renderFor(outageStack);
    }

    /**
     * Used to render indicator that shows whether there would
     * be outages tomorrow or not.
     * 
     * @param {ListWidget} root root widget.
     * @param {Schedule} tomorrowSchedule tomorrow schedule.
     */
    __renderTomorrowScheduleIndicator(root, tomorrowSchedule) {

        let indicatorColor = Color.green();

        if (tomorrowSchedule.hasNext()) {
            indicatorColor = Color.red();
        }

        ui.spacer().renderFor(root, 2);
            
        const newScheduleStack = ui.stack().renderFor(root);
        
        ui.spacer().renderFor(newScheduleStack, 3);
        ui.image()
            .icon("info.circle.fill")
            .size(10)
            .color(indicatorColor)
            .lightWeight()
            .opacity(0.7)
            .renderFor(newScheduleStack);

        ui.spacer().renderFor(newScheduleStack, 3);
        ui.text()
            .content("new")
            .blackRoundedFont(10)
            .opacity(0.9)
            .renderFor(newScheduleStack);
    }

    /**
     * Used to get alternative root widget.
     * This one ised when web view is not available.
     * 
     * @returns {ListWidget} root widget.
     */
    __getNotAvailableRootWidget() {

        const root = this.__createRootWidget();

        ui.spacer().renderFor(root);
        ui.image()
            .icon("network.slash")
            .size(46)
            .heavyWeight()
            .renderFor(root);
        ui.spacer().renderFor(root);
        
        return root;
    }

    /**
     * Wrapper to create root widget.
     * 
     * @returns {ListWidget} root widget.
     */
    __createRootWidget() {

        const root = ui.createRoot();
        
        if (conf.showGradient) {
            
            const gradient = new LinearGradient();
            conf.styleGradient(gradient);
            root.backgroundGradient = gradient;
        }
        
        return root;
    }
}

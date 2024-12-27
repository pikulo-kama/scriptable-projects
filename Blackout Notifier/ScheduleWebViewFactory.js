
/**
 * Should be used to get instance of ScheduleWebView.
 */
class ScheduleWebViewFactory {
    
    /**
     * Used to get instance of ScheduleWebView.
     * 
     * @returns {ScheduleWebView} schedule web view.
     */
    static getWebView() {
        
        if (conf.debug.enable) {
            return new DebugScheduleWebView();
        }
        
        return new OeIfScheduleWebView();
    }
}

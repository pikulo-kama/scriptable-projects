// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: moon;

const ui = importModule("UI");


const conf = {
    debug: {
        enable: false,

        forceWidget: false,
        forceIndicator: false,
        forceNoOutages: false,
        forceNotAvailable: false,
        forceAddress: false,

        address: "Івано-Франківськ,Стуса,10",
        currentHour: 17
    },
    
    showGradient: true,
    styleGradient: (gradient) => {
        
        gradient.locations = [0, 0.5];
        gradient.colors = [
            new Color("040059"),
            new Color("030037")
        ];
    }
};

//#include "Blackout Notifier/ScheduleWebView.js"
//#include "Blackout Notifier/ScheduleWebViewFactory.js"
//#include "Blackout Notifier/DebugScheduleWebView.js"
//#include "Blackout Notifier/OeIfScheduleWebView.js"
//#include "Blackout Notifier/Schedule.js"
//#include "Blackout Notifier/OutageRecord.js"
//#include "Blackout Notifier/ScheduleWidget.js"
//#include "Blackout Notifier/Time.js"

function getAddress() {

    let address = conf.debug.forceAddress ?
        conf.debug.address :
        args.widgetParameter
        
    if (!address) {
        throw new Error("Address was not provided.");
    }

    let addressComponents = address.split(",");

    if (addressComponents.length !== 3) {
        throw new Error("Address should contain city, street and building number separated by comma.");
    }

    let city = addressComponents[0];
    let street = addressComponents[1];
    let buildingNumber = addressComponents[2];
    let shortAddress = buildingNumber + ", " + street;

    return {
        address,
        city,
        street,
        buildingNumber,
        shortAddress
    };
}


// Needs to be initialized after config is initialized.
conf.address = getAddress();
let webView = ScheduleWebViewFactory.getWebView();

if (config.runsInWidget || conf.debug.forceWidget) {
    const widget = new ScheduleWidget();
    
    await webView.downloadSchedules();
    await widget.render(webView);

} else {
    await webView.present();
}

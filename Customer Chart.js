// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: users;

const { LinearChart } = importModule("Linear Chart");
const { present } = importModule("UI");
const { themed, ColorMode } = importModule("Config Util");
const { tr } = importModule("Localization");

const conf = {
    debug: {
        enabled: true
    },

    timeZone: tr("customerChart_timezone"),
    months: [
        tr("customerChart_january"),
        tr("customerChart_february"),
        tr("customerChart_march"),
        tr("customerChart_april"),
        tr("customerChart_may"),
        tr("customerChart_june"),
        tr("customerChart_july"),
        tr("customerChart_august"),
        tr("customerChart_september"),
        tr("customerChart_october"),
        tr("customerChart_november"),
        tr("customerChart_december")
    ]
};


class CalendarChartDataRepository {

    __FIRST_DAY_OF_MONTH = 1;
    
    async getChartData() {
  
        let dateRange = this.__getDateRange();
        let eventSet = [];
        
        const calendar = await Calendar.forEventsByTitle(conf.args.calendar);
        
        for (let rangeId = 0; rangeId + 1 < dateRange.length; rangeId++) {
                
            let startDate = dateRange[rangeId];
            let endDate = dateRange[rangeId + 1];
            
            const events = await CalendarEvent.between(
                startDate,
                endDate, 
                [calendar]
            );
            
            eventSet.push({
                month: conf.months[startDate.getMonth()],
                eventCount: events.length
            });
        }
        
        if (conf.args.skipBlank) {
        
            let eventSetCopy = eventSet;
            
            for (let eventId = eventSetCopy.length - 1; eventId >= 0; eventId--) {
            
                let event = eventSetCopy[eventId];

                if (event.eventCount > 0) {
                    break;
                }
                
                let idx = eventSet.indexOf(event);
                eventSet.splice(idx, 1);
            }
        }
    
        return eventSet;
    }
    
    __getDateRange() {
    
        let currentDate = new Date();
        let dates = new Array();
        let currentMonth = currentDate.getMonth();
        
        for (let monthIdx = conf.args.period - 1; monthIdx >= 0; monthIdx--) {
            
            let targetMonth = currentMonth - monthIdx;
            let monthStartDate = new Date(
                currentDate.getFullYear(),
                targetMonth,
                CalendarChartDataRepository.__FIRST_DAY_OF_MONTH
            );

            dates.push(monthStartDate);
        }
        
        dates.push(currentDate);
        
        return dates.map(date => 
            new Date(date.toLocaleString('en-US', {timeZone: conf.timeZone}))
        );
    }
}


function getArguments() {

    let arguments = JSON.parse(args.widgetParameter);

    if (conf.debug.enabled) {
        arguments = {
            // Period in months
            period: 5,
            calendar: "Робочий",
            mode: ColorMode.Dark,
            trimBlank: true
        };
    }

    if (!arguments.trimBlank) {
        arguments.trimBlank = false;
    }

    return arguments;
}

conf.args = getArguments();
const repository = new CalendarChartDataRepository();

const chart = new LinearChart({
    chart: {
        data: await repository.getChartData(),
        xField: "month",
        yField: "eventCount",
        showTooltips: true,
        tooltipFontSize: 30,
        gridLineWidth: 1,
        gridColor: themed(new Color("FEFBFA10"), new Color("707070")),
        tooltipColor: new Color("999")
    }
}, conf.args.mode);

if (conf.debug.enabled) {
    chart.getWidget().presentMedium();

} else {
    present(chart.getWidget());
}

Script.complete();

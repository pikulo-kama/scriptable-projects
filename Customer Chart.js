// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: users;

const { debugEnabled, debugFeatureEnabled, getFeature } = importModule("Feature");
const { LinearChart } = importModule("Linear Chart");
const { present } = importModule("UI");
const { themed, ColorMode } = importModule("Config Util");
const { tr } = importModule("Localization");


const parameters = getArguments();

/**
 * ENTRY POINT
 */
async function main() {

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
    }, parameters.mode);

    if (debugEnabled()) {
        chart.getWidget().presentMedium();

    } else {
        present(chart.getWidget());
    }
}


/**
 * Used to get arguments provided by user.
 *
 * period - amount of months that should be shown in chart
 * calendar - name of calendar from which events should be pulled
 * mode - color mode, used for color changing
 * trimBlank - whether trailing months without events should be displayed
 * 
 * @return {Object} user defined script configuration 
 */
function getArguments() {

    let arguments = JSON.parse(args.widgetParameter) ?? {};

    if (!arguments.trimBlank) {
        arguments.trimBlank = false;
    }

    if (!arguments.ColorMode) {
        arguments.mode = ColorMode.Dark;
    }

    if (!arguments.period) {
        arguments.period = 6;
    }

    if (debugFeatureEnabled("trimBlank")) {
        arguments.trimBlank = getFeature("trimBlank");
    }

    if (debugFeatureEnabled("period")) {
        arguments.period = getFeature("period");
    }

    if (debugFeatureEnabled("calendar")) {
        arguments.calendar = getFeature("calendar");
    }

    if (debugFeatureEnabled("forceLightMode")) {
        arguments.mode = ColorMode.Light;
    }

    if (!arguments.calendar) {
        throw new Error("Calendar was not provided");
    }

    return arguments;
}


/**
 * Used to retrieve events from
 * calendar.
 *
 * @class CalendarChartDataRepository
 */
class CalendarChartDataRepository {

    static #FIRST_DAY_OF_MONTH = 1;
    static #MONTH_NAMES = [
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
    ];

    /**
     * Used to get data from calendar
     * and then format it into a 
     * month name -> amount of event map.
     *
     * @return {Map<String, Number>} month -> amount map
     * @memberof CalendarChartDataRepository
     */
    async getChartData() {
  
        const monthNames = CalendarChartDataRepository.#MONTH_NAMES;
        let dateRange = this.#getDateRange();
        let eventSet = [];
        const calendar = await Calendar.forEventsByTitle(parameters.calendar);
        
        for (let rangeId = 0; rangeId + 1 < dateRange.length; rangeId++) {
                
            let startDate = dateRange[rangeId];
            let endDate = dateRange[rangeId + 1];

            const events = await CalendarEvent.between(
                startDate,
                endDate, 
                [calendar]
            );
            
            eventSet.push({
                month: monthNames[startDate.getMonth()],
                eventCount: events.length
            });
        }
        
        if (parameters.skipBlank) {
        
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
    
    /**
     * Used to get list of dates
     * which are always first day of a
     * certain month.
     * 
     * Dates are generated based on the 
     * provided configuration by user.
     *
     * @return {List<Date>} list of dates for which events should be found
     * @memberof CalendarChartDataRepository
     */
    #getDateRange() {
    
        let dates = new Array();
        
        for (let monthIdx = parameters.period - 1; monthIdx >= 0; monthIdx--) {
            
            let monthStartDate = new Date();
            monthStartDate.setMonth(monthStartDate.getMonth() - monthIdx);
            monthStartDate.setDate(CalendarChartDataRepository.#FIRST_DAY_OF_MONTH);

            dates.push(monthStartDate);
        }
        
        dates.push(new Date());
        
        return dates.map(date => 
            new Date(date.toLocaleString('en-US', {timeZone: tr("customerChart_timezone")}))
        );
    }
}


await main();
Script.complete();

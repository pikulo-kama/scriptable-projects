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

    timeZone: tr("timezone"),
    months: [
        tr("month_january"),
        tr("month_february"),
        tr("month_march"),
        tr("month_april"),
        tr("month_may"),
        tr("month_june"),
        tr("month_july"),
        tr("month_august"),
        tr("month_september"),
        tr("month_october"),
        tr("month_november"),
        tr("month_december")
    ]
};


class CalendarChartDataRepository {
    
    async getChartData() {
  
        let dateRange = this.__getDateRange();
        let dataset = [];
        
        const calendar = await Calendar.forEventsByTitle(conf.args.calendar);
        
        for (let i = 0; i + 1 < dateRange.length; i++) {
                
            let startDate = dateRange[i];
            let endDate = dateRange[i + 1];
            
            const events = await CalendarEvent.between(
                startDate,
                endDate, 
                [calendar]
            );
            
            dataset.push({
                month: conf.months[startDate.getMonth()],
                amount: events.length
            });
        }
        
        if (conf.args.skipBlank) {
        
            let datasetCopy = dataset;
            
            for (let i = datasetCopy.length - 1; i >= 0; i--) {
            
                if (datasetCopy[i].amount > 0) {
                    break;
                }
                
                let idx = dataset.indexOf(datasetCopy[i]);
                dataset.splice(idx, 1);
            }
        }
    
        return dataset;
    }
    
    __getDateRange() {
    
        let currentDate = new Date();
        let dates = new Array();
        let monthId = currentDate.getMonth();
        
        for (let i = conf.args.period - 1; i >= 0; i--) {
            
            let date = new Date(
                currentDate.getFullYear(),
                monthId - i,
                1
            );

            dates.push(date);
        }
        
        dates.push(currentDate);
        
        return dates.map(date => 
            new Date(date.toLocaleString(
                'en-US', {
                    timeZone: conf.timeZone
                })
            )
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
        yField: "amount",
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

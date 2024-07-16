// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: users;
const chart = importModule("Linear Chart")
const conf = importModule("Config Util")
const locale = importModule("Localization")

await locale.registerLabels({
  "timezone": "Europe/Kiev",
  "month_january": "Січ",
  "month_february": "Лют",
  "month_march": "Бер",
  "month_april": "Кві",
  "month_may": "Тра",
  "month_june": "Чер",
  "month_july": "Лип",
  "month_august": "Сер",
  "month_september": "Вер",
  "month_october": "Жов",
  "month_november": "Лис",
  "month_december": "Гру",
})

let arguments = JSON.parse(args.widgetParameter)

if (config.runsInApp) {
   arguments = {
    period: 5,
    calendar: "Робочий",
    mode: "dark",
    trimBlank: true
  }
}

const VISIBLE_PERIOD = arguments.period // months
const CALENDAR_NAME = arguments.calendar
const COLOR_MODE = arguments.mode
const TRIM_BLANK = arguments.trimBlank ?? false

const TIMEZONE = locale.getLabel("timezone")
const MONTHS = [
  locale.getLabel("month_january"),
  locale.getLabel("month_february"),
  locale.getLabel("month_march"),
  locale.getLabel("month_april"),
  locale.getLabel("month_may"),
  locale.getLabel("month_june"),
  locale.getLabel("month_july"),
  locale.getLabel("month_august"),
  locale.getLabel("month_september"),
  locale.getLabel("month_october"),
  locale.getLabel("month_november"),
  locale.getLabel("month_december")
]

const chartWidget = chart.generateChartWidget({
    chart: {
      data: await getChartData(TRIM_BLANK),
      xField: "month",
      yField: "amount",
      showTooltips: true,
      tooltipFontSize: 30,
      gridLineWidth: 1,
      gridColor: conf.get(new Color("FEFBFA10"), new Color("707070")),
      tooltipColor: new Color("999")
    }
}, COLOR_MODE)

Script.setWidget(chartWidget)
Script.complete()

async function getChartData(skipBlank) {
  
  let dateRange = getDateRange()
  let dataset = []
  
  const calendar = await Calendar.forEventsByTitle(CALENDAR_NAME)
  
  for (let i = 0; i + 1 < dateRange.length; i++) {
        
    let startDate = dateRange[i]
    let endDate = dateRange[i + 1]
    
    const events = await CalendarEvent.between(
          startDate,
          endDate, 
          [calendar]
      )
    
    dataset.push({
      month: MONTHS[startDate.getMonth()],
      amount: events.length
    })
  }
  
  if (skipBlank) {
    
    let datasetCopy = dataset
    
    for (let i = datasetCopy.length - 1; i >= 0; i--) {
      
      if (datasetCopy[i].amount > 0) {
        break
      }
      
      let idx = dataset.indexOf(datasetCopy[i])
      dataset.splice(idx, 1)
    }
  }

  return dataset
}

function getDateRange() {
  let currentDate = new Date()
  let dates = new Array()
  
  let monthId = currentDate.getMonth()
  
  for (let i = VISIBLE_PERIOD - 1; i >= 0; i--) {
    
    let date = new Date(
      currentDate.getFullYear(),
      monthId - i,
      1
    )
    dates.push(date)
  }
  
  dates.push(currentDate)
  
  return dates.map(date => 
    new Date(date.toLocaleString(
      'en-US', {
        timeZone: TIMEZONE
      })
    )
  )
}

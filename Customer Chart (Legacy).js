// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: users;

const THEME = Device.isUsingDarkAppearance() ? 
"" : "&bkg=white"
const HEIGHT = 150
const WIDTH = 300
const QUICKCHART_URL = `https://quickchart.io/chart?height=${HEIGHT}&width=${WIDTH}&c=`

const TIMEZONE = "Europe/Kiev"
const CALENDAR_NAME = "Work"
const MONTHS = [
  "Jan", "Feb", "Mar",
  "Apr", "May", "Jun",
  "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec"
]
const VISIBLE_PERIOD = 5 // months

const workCalendar = await Calendar.forEventsByTitle(CALENDAR_NAME
)

const chartData = await getChartData(workCalendar)

console.log(chartData)

const chart = await fetchChart(chartData)

QuickLook.present(chart)


const widget = new ListWidget();

const imageWidget = widget.addImage(chart)
imageWidget.centerAlignImage()
imageWidget.applyFillingContentMode()

Script.setWidget(widget)
Script.complete()

async function fetchChart(chartData) {
  
  const chartJson = JSON.stringify({
    type: "line",
    data: chartData,
    options: {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            stepSize: 1
          }
        }]
      }
    }
  })
  

  return await new Request(
    QUICKCHART_URL + 
    encodeURIComponent(chartJson)
    + THEME
    ).loadImage();
}

async function getChartData(workCalendar) {
  
  let dateRange = getDateRange()
  let labels = []
  let dataset = []
  
  for (let i = 0; 
       i + 1 < dateRange.length; i++) {
        
    let startDate = dateRange[i]
    let endDate = dateRange[i + 1]
    
    labels.push(
          MONTHS[startDate.getMonth()]
    )
    
    const events = await CalendarEvent.between(
          startDate,
          endDate, 
          [workCalendar]
      )
    
    dataset.push(events.length)
  }

  return {
    labels: labels,
    datasets: [{
      label: "Customers",
      data: dataset
    }]
  }
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


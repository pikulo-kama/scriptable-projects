// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: film;
const cacheUtil = importModule("Cache")
const circle = importModule("Circle")


const conf = {
  api: "https://episodate.com/api/show-details?q=",
  debug: false,
  mock: false,
  currentDate: new Date(),
  colors: {
    primary: get(new Color("#232622"), new Color("#d0d9d2")),
    primaryAlt: get(new Color("#252b24"), new Color("#a0b0a4")),
    secondary: get(new Color("#355e3b"), new Color("#6fb079")),
    black: Color.black(),
    text: {
      primary: get(new Color("#d8e3d8"), new Color("#080808")),
      secondary: get(new Color("#7d7d7d"), new Color("#252b24"))
    }
  }
}

const cacheConf = [
    {
        prop: "tvShow.name"
    },
    {
        prop: "tvShow.image_path",
        alias: "image",
        type: cacheUtil.types.IMAGE
    },
    {
        prop: "tvShow.status"
    },
    {
        prop: "tvShow.episodes",
        type: cacheUtil.types.LIST,
        mappings: [
            {
                prop: "air_date",
                alias: "airDate",
                transform: v => 
                  new Date(v.replace(" ", "T") + "Z")
            },
            {
                prop: "season"
            },
            {
                prop: "episode"
            }
        ]
    }
]

let serie = args.widgetParameter

if (conf.mock) {
  serie = "the-flash"
}

async function buildWidget(serieName) {
  const serie = await fetchSerie(serieName)
  const font = Font.boldMonospacedSystemFont(14)
  
  const root = new ListWidget()
  const entryStack = root.addStack()
  const imageStack = entryStack.addStack()
  
  const serieImageWidget = imageStack.addImage(serie.image)
  const contentStack = entryStack.addStack()
  const serieNameWidget = contentStack.addText(serie.name)
  const waitingForStack = contentStack.addStack()
  const nextTextWidget = waitingForStack.addText(serie.countdown.next)
  const timerTextWidget = waitingForStack.addText(serie.countdown.timer)
  const serieStack = contentStack.addStack()
  
  const circleImage = circle.generateCircleImage({
    data: serie.countdown.timerCircleData,
    size: 200,
    diameter: 120,
    circleLineWidth: 10
  })
  
  entryStack.size = new Size(315, 140)
  entryStack.backgroundColor = conf.colors.primary
  entryStack.cornerRadius = 15
  entryStack.spacing = 5
  entryStack.centerAlignContent()

  imageStack.size = new Size(150, 130)
  serieImageWidget.cornerRadius = 15

  contentStack.size = new Size(200, 130)
  contentStack.spacing = 5
  contentStack.layoutVertically()
  
  serieNameWidget.font = Font.blackRoundedSystemFont(14)
  serieNameWidget.textColor = conf.colors.text.primary

  waitingForStack.layoutHorizontally()
  
  nextTextWidget.font = font
  timerTextWidget.font = font

  serieStack.addSpacer(100)
  serieStack.addImage(circleImage)
  
  root.presentMedium()
  return root
}

function getCircleData(percentage) {
  return [
        {
          color: conf.colors.text.primary,
          percentage: percentage
        },
        {
          color: new Color("1C1C1E"),
          percentage: 100
        }
      ]
}

async function getMockData() {
  return {
    name: "Serie Name",
    image: await Photos.latestPhoto(),
    countdown: {
      timer: "...",
      timerCircleData: getCircleData(0),
      next: "Next episode in: "
    }
  }
}

async function fetchSerie (s) {
  
  let response = await getMockData()
  
  if (conf.debug) {
    return response
  }
  
  try {
    let serie = await cacheUtil.getRequest(cacheConf, conf.api + s)
    serie.countdown = await getCountdown(serie)
    serie.image = Image.fromFile(serie.image)
    
    response = serie
  } catch (error) {
    console.error("Failed to fetch series data: " + error)
  }
  
  return response
}

function getEpisodes(serie) {
  episodes = []
  
  for (let i = 0; i < serie.episodes.length; i++) {
    let episode = serie.episodes[i]
    let previousEpisode = i == 0 ? null : episodes[i - 1]
    episodes.push({
        previousEpisode: previousEpisode,
        tag: `s${episode.season}e${episode.episode} ➟ `,
        airDate: new Date(episode.airDate)
    })
  }
  return episodes
}

async function getCountdown(serie) {

  const formatter = new RelativeDateTimeFormatter()
  let countdown = (await getMockData()).countdown
  const episodes = getEpisodes(serie)

  const nextEpisode = episodes.find(episode =>
      episode.airDate > conf.currentDate
  )

  if (nextEpisode !== undefined) {
    
    let total = nextEpisode.airDate - 
      nextEpisode.previousEpisode.airDate
    
    let passed = nextEpisode.airDate -
      conf.currentDate
    
    countdown = {
      timer: formatter.string(nextEpisode.airDate, conf.currentDate),
      next: nextEpisode.tag,
      timerCircleData: getCircleData((total - passed) / total * 100)
    }
  } else {
    
    if (serie.status == "Ended") {
      countdown.next = "Series "
      countdown.timer = "Ended"
    } else {
      countdown.next = "Awaiting "
      countdown.timer = "Next Season"
    }
  }
  
  return countdown
}

function get(dark, light) {
  return Device.isUsingDarkAppearance()
       ? dark : light 
}

Script.setWidget(await buildWidget(serie))
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: chart-line;

// In order to use script just write
// importModule ("Linear Chart")
// Module exports 2 methods:
// - generateChartImage - used to generate graph and 
// return an image to user. User can provide
// config to overwrite fields in existing config
// - getThemeValue - accepts two parameters
// first whould be used if dark theme applied
// and second when white theme.

const root = {
  
  configImport: importModule("Config Util"),
  
  defaultConfig: () => ({
    // Fields related to canvas size
    widget: {
      height: 500,
      width: 1200,
      padding: {
        vertical: 100,
        horizontal: 150
      }
    },
    chart: {
      bgColor: root.configImport.get(new Color("1C1C1E"), new Color("FFF")),
      // Tells whether tooltips should
      // be shown on each chart point    
      showTooltips: false,
      // Tells whether only tooltips
      // which is not placed exactly on Y
      // axis should be displayed
      hideAxisPlacedTooltips: true,
      // Font size of tolltip 
      tooltipFontSize: 15,
      // Tooltip color
      tooltipColor: root.configImport.get(new Color("5D5D5D"), new Color("858585")),
      lineWidth: 6,
      lineColor: new Color("5777A5"),
      showDots: true,
      dotColor: new Color("5777A580"),
      showGrid: true,
      gridColor: root.configImport.get(new Color("1A1A1B"), new Color("EFEFEF40")),
      gridLineWidth: 4,
      pointSize: 15,
      yMax: 3,
      showLegend: true,
      legendColor: root.configImport.get(new Color("5D5D5D"), new Color("858585")),
      legendFontSize: 26
    }
  }),
  
  
  /**
  * Used to generate chart in widget
  * Almost the same as generateChartImage
  * but here image is being wrapped in 
  * ListWidget
  *
  * @param configIn Custom config that
  * will be used to overwrite default one
  *
  * @param modeIn - name of color mode
  * of chart
  *
  * @return rendered chart inside widget
  */
  generateChartWidget: (configIn, modeIn) => {
    const chartImage = root.generateChartImage(configIn, modeIn)
    const chartWidget = new ListWidget();
  
    const imageWidget = chartWidget.addImage(chartImage)
    imageWidget.centerAlignImage()
    
    chartWidget.backgroundColor = root.configImport.conf("chart.bgColor")
    
    QuickLook.present(chartImage)
    
    return chartWidget
  },
  
  
  /**
  * Used to generate chart image
  *
  * @param configIn - Custom config that
  * will be used to overwrite default one
  *
  * Required config parameters:
  *
  * - chart.data = JSON containing dataset
  * that should be rendered on chart. Each element 
  * should contain at least one number field (Y axis field)
  * and at least one string field (X axis field)
  * 
  * - chart.xField = name of field in dataset
  * that should be used as X axis field
  * 
  * - chart.yField = name of field in dataset
  * that should be used as Y axis field
  *
  * @param modeIn - name of color mode
  * of chart
  *
  * @return rendered graph
  */
  generateChartImage: (configIn, modeIn) => {
    root.configImport.store.userConfig = configIn
    root.configImport.store.config = root.defaultConfig()
    root.configImport.store.colorMode = modeIn
    
    const context = new DrawContext()
    context.opaque = false
    context.size = new Size(
        root.configImport.conf("widget.width"), 
        root.configImport.conf("widget.height")
    )
    
    const bgRectangle = root.getBackground()
    context.setFillColor(root.configImport.conf("chart.bgColor"))
    context.fill(bgRectangle)
    
    const chartPoints = root.getDataLocations()
  
    const gridPath = root.getGridPath(context, chartPoints)
    const linesPath = new Path()
    
    if (root.configImport.conf("chart.showTooltips")) {
      root.drawTooltips(context, chartPoints)
    }
  
    if (root.configImport.conf("chart.showGrid")) {
      
      context.setStrokeColor(root.configImport.conf("chart.gridColor"))
      context.setLineWidth(root.configImport.conf("chart.gridLineWidth"))
      
      context.addPath(gridPath)
      context.strokePath()
    }
    
    if (root.configImport.conf("chart.showDots")) {
      const dotsPath = root.getDotsPath(chartPoints)
      
      context.setFillColor(root.configImport.conf("chart.dotColor"))
      
      context.addPath(dotsPath)
      context.fillPath()
    }
    
    context.setStrokeColor(root.configImport.conf("chart.lineColor"))
    context.setLineWidth(root.configImport.conf("chart.lineWidth"))
  
    linesPath.addLines(chartPoints)
    context.addPath(linesPath)
    context.strokePath()
  
    return context.getImage()
  },
  
  
  /*
  * Used to get background rectangle
  *
  * @return rectangle
  */
  getBackground: () => new Rect(0, 0, 
      root.configImport.conf("widget.width"), 
      root.configImport.conf("widget.height")),
  
  
  /*
  * Used to get chart grid along with
  * axis labels
  *
  * @param context - instance of DrawContext
  * where grid should be written
  *
  * @param chartPoints - list of points
  * that represent data on chart (they are
  * used as orienters when building grid)
  *
  * @return grid
  */
  getGridPath: (context, chartPoints) => {
    let path = new Path()
    
    const showLegend = root.configImport.conf("chart.showLegend")
    
    const yAxisValues = root.getYAxisValues(root.configImport.conf("chart.data"))
    const yStep = (root.configImport.conf("widget.height") - 
                root.configImport.conf("widget.padding.vertical")) / root.configImport.conf("chart.yMax")
    
    let step = root.configImport.conf("widget.padding.vertical") / 2
    
    context.setTextColor(root.configImport.conf("chart.legendColor"))
    context.setFont(Font.heavyMonospacedSystemFont(
        root.configImport.conf("chart.legendFontSize")
    ))
    context.setTextAlignedCenter()
    
    for (let i = 0; i < chartPoints.length; i++) {
      
      let startPoint = new Point(chartPoints[i].x, root.configImport.conf("widget.padding.vertical") / 2)
      let endPoint = new Point(chartPoints[i].x, (root.configImport.conf("widget.height") - 
          root.configImport.conf("widget.padding.vertical") / 2))
      
      path.addLines([
        startPoint, endPoint
      ])
      
      endPoint.x -= 10
      endPoint.y += root.configImport.conf("chart.legendFontSize")
      
      if (showLegend) {
        context.drawText(root.configImport.conf("chart.data")[i][root.configImport.conf("chart.xField")], endPoint)
      }
    }
    
    for (let i = 0; i <= root.configImport.conf("chart.yMax"); i++, step += yStep) {
      let startPoint = new Point(root.configImport.conf("widget.padding.horizontal") / 2, step)
      let endPoint = new Point(root.configImport.conf("widget.width") - 
        root.configImport.conf("widget.padding.horizontal") / 2, step)
      
      path.addLines([
        startPoint, endPoint
      ])
      
      const value = yAxisValues[i]
      
      startPoint.x -= value.length * root.configImport.conf("chart.legendFontSize")
      startPoint.y -= 10
      
      if (showLegend) {
        context.drawText(value, startPoint)
      }
    }
    
    return path
  },
  
  
  /*
  * Used to get dots that will be 
  * displayed on the same place as
  * chart data points
  *
  * @param chartPoints - list of points
  * that represent data on chart (they are
  * used as orienters when adding dots)
  * 
  * @return dots
  */
  getDotsPath: (chartPoints) => {
    let path = new Path()
    
    chartPoints.forEach(point => {
      path.addEllipse(new Rect(point.x - (root.configImport.conf("chart.pointSize") / 2), 
                          point.y - (root.configImport.conf("chart.pointSize") / 2), 
                          root.configImport.conf("chart.pointSize"), 
                          root.configImport.conf("chart.pointSize")))
    
    })
    
    return path
  },
  
  
  /*
  * Used to draw tooltips above chart
  * points. 
  *
  * You could also hide 
  * tooltips which are placed on grid
  * by setting chart.hideAxisPlacedTooltips
  * to true
  *
  * @param context - instance of DrawContext
  * where tooltips should be written
  *
  * @param chartPoints - list of points
  * that represent data on chart (they are
  * used as orienters when adding tooltips)
  */
  drawTooltips: (context, chartPoints) => {
    context.setTextColor(root.configImport.conf("chart.tooltipColor"))
      context.setFont(Font.heavyMonospacedSystemFont(
        root.configImport.conf("chart.tooltipFontSize")
      ))
      
      const data = root.configImport.conf("chart.data")
      const axisValues = root.getYAxisValues(data)
      
      for (let i = 0; i < chartPoints.length; i++) {
        let point = chartPoints[i]
        let pointCopy = new Point(point.x, point.y)
        
        pointCopy.y -= root.configImport.conf("chart.tooltipFontSize") * 1.5
        pointCopy.x -= 10
        yFieldValue = String(data[i][root.configImport.conf("chart.yField")])
        
        if (root.configImport.conf("chart.hideAxisPlacedTooltips")
          && axisValues.includes(yFieldValue)) {
            continue
        }
        
        context.drawText(yFieldValue, pointCopy)
      }
  },
  
  
  /*
  * Used to get chart data poins
  *
  * @return list of points
  */
  getDataLocations: () => {
    const points = []
    const data = root.configImport.conf("chart.data")
  
    const xStep = (root.configImport.conf("widget.width") 
                   - root.configImport.conf("widget.padding.horizontal"))
                        / (data.length - 1)
    let currentStep = root.configImport.conf("widget.padding.horizontal") / 2
    
    const maxCustomersInMonth = root.getMaxProperty(data, root.configImport.conf("chart.yField"))
    
    const chartPercent = (root.configImport.conf("widget.height") - 
                          root.configImport.conf("widget.padding.vertical")) 
                            / maxCustomersInMonth
  
    const getDataPoint = (i, x) => {
      return new Point(x, 
        root.configImport.conf("widget.height") - 
        (root.configImport.conf("widget.padding.vertical") / 2)- 
        (data[i][root.configImport.conf("chart.yField")] * chartPercent))
    }
  
    for (let i = 0; i < data.length; i++, currentStep += xStep) {
      points.push(getDataPoint(i, currentStep))
    }
    
    return points
  },
  
  
  /*
  * Used to calculate and return
  * array of values that should be
  * displayed on Y axis
  *
  * @param data - array of objects
  *
  * @return Y axis fields
  */
  getYAxisValues: (data) => {
    const axisValues = []
    const iteration = root.getMaxProperty(data, root.configImport.conf("chart.yField")) 
      / root.configImport.conf("chart.yMax")
      
    const fixed = !Number.isInteger(iteration) ? 1 : 0
    
    for (let i = root.configImport.conf("chart.yMax"); i > 0; i--) {
      axisValues.push(Number(i * iteration).toFixed(fixed))
    }
    axisValues.push(String(0))
    return axisValues
  },
  
  
  /*
  * Used to get max property from 
  * array of objects
  *
  * @param data - array of objects
  *
  * @param property - name of property for 
  * which max value should be returned
  *
  * @return max value in array
  */
  getMaxProperty: (data, property) => {
    return Math.max.apply(
      Math, 
      data.map(function (record) {return record[property]})
    )
  }
}


module.exports.generateChartImage = root.generateChartImage
module.exports.generateChartWidget = root.generateChartWidget

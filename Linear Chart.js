// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: chart-line;

const { ConfigStore, ColorMode, themed } = importModule("Config Util");
const { rootWidget, image } = importModule("UI");

class LinearChart {

    static __DEFAULT_CONFIG = {
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
            bgColor: themed(new Color("1C1C1E"), new Color("FFF")),
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
            tooltipColor: themed(new Color("5D5D5D"), new Color("858585")),
            lineWidth: 6,
            lineColor: new Color("5777A5"),
            showDots: true,
            dotColor: new Color("5777A580"),
            showGrid: true,
            gridColor: themed(new Color("1A1A1B"), new Color("EFEFEF40")),
            gridLineWidth: 4,
            pointSize: 15,
            yMax: 3,
            showLegend: true,
            legendColor: themed(new Color("5D5D5D"), new Color("858585")),
            legendFontSize: 26
        }
    };

    constructor(userConfig, colorMode) {
        this.__configStore = new ConfigStore();
        this.__configStore.setConfig(LinearChart.__DEFAULT_CONFIG);
        this.__configStore.overrideConfig(userConfig);
        this.__configStore.setColorMode(ColorMode.of(colorMode));
    }

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
    getWidget() {

        const root = rootWidget()
            .color(this.__configStore.get("chart.bgColor"))
            .render();

        image()
            .image(this.getImage())
            .renderFor(root);
        
        return root;
    }

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
    getImage() {
        
        const context = new DrawContext();

        context.opaque = false;
        context.size = new Size(
            this.__configStore.get("widget.width"), 
            this.__configStore.get("widget.height")
        );

        const bgRectangle = this.__getBackground();

        context.setFillColor(this.__configStore.get("chart.bgColor"));
        context.fill(bgRectangle);

        const chartPoints = this.__getDataLocations();
    
        const gridPath = this.__getGridPath(context, chartPoints);
        const linesPath = new Path();
        
        if (this.__configStore.get("chart.showTooltips")) {
            this.__drawTooltips(context, chartPoints);
        }

        if (this.__configStore.get("chart.showGrid")) {
                
            context.setStrokeColor(this.__configStore.get("chart.gridColor"));
            context.setLineWidth(this.__configStore.get("chart.gridLineWidth"));
            
            context.addPath(gridPath);
            context.strokePath();
        }
        
        if (this.__configStore.get("chart.showDots")) {

            const dotsPath = this.__getDotsPath(chartPoints);
            
            context.setFillColor(this.__configStore.get("chart.dotColor"));
            context.addPath(dotsPath);
            context.fillPath();
        }

        context.setStrokeColor(this.__configStore.get("chart.lineColor"));
        context.setLineWidth(this.__configStore.get("chart.lineWidth"));
    
        linesPath.addLines(chartPoints);
        context.addPath(linesPath);
        context.strokePath();
    
        return context.getImage();
    }

    /*
    * Used to get background rectangle
    *
    * @return rectangle
    */
    __getBackground() { 
        return new Rect(0, 0, 
            this.__configStore.get("widget.width"), 
            this.__configStore.get("widget.height")
        );
    }

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
    __getGridPath(context, chartPoints) {
        
        let path = new Path();
        const showLegend = this.__configStore.get("chart.showLegend");

        const yAxisValues = this.__getYAxisValues(this.__configStore.get("chart.data"));
        const yStep = (this.__configStore.get("widget.height") - 
                    this.__configStore.get("widget.padding.vertical")) / this.__configStore.get("chart.yMax");

        let step = this.__configStore.get("widget.padding.vertical") / 2;

        context.setTextColor(this.__configStore.get("chart.legendColor"));
        context.setFont(Font.heavyMonospacedSystemFont(
            this.__configStore.get("chart.legendFontSize")
        ));

        context.setTextAlignedCenter();

        for (let i = 0; i < chartPoints.length; i++) {

            let startPoint = new Point(chartPoints[i].x, this.__configStore.get("widget.padding.vertical") / 2);
            let endPoint = new Point(chartPoints[i].x, (this.__configStore.get("widget.height") - 
                this.__configStore.get("widget.padding.vertical") / 2));

            path.addLines([
                startPoint, endPoint
            ]);

            endPoint.x -= 10;
            endPoint.y += this.__configStore.get("chart.legendFontSize");

            if (showLegend) {
                context.drawText(this.__configStore.get("chart.data")[i][this.__configStore.get("chart.xField")], endPoint);
            }
        }

        for (let i = 0; i <= this.__configStore.get("chart.yMax"); i++, step += yStep) {
            
            let startPoint = new Point(this.__configStore.get("widget.padding.horizontal") / 2, step);
            let endPoint = new Point(this.__configStore.get("widget.width") - 
                this.__configStore.get("widget.padding.horizontal") / 2, step
            );
            
            path.addLines([
                startPoint, endPoint
            ]);

            const value = yAxisValues[i];
            
            startPoint.x -= value.length * this.__configStore.get("chart.legendFontSize");
            startPoint.y -= 10;
            
            if (showLegend) {
                context.drawText(value, startPoint);
            }
        }
        
        return path;
    }

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
    __getDotsPath(chartPoints) {

        let path = new Path();

        chartPoints.forEach(point => {
            path.addEllipse(
                new Rect(
                    point.x - (this.__configStore.get("chart.pointSize") / 2),
                    point.y - (this.__configStore.get("chart.pointSize") / 2),
                    this.__configStore.get("chart.pointSize"), 
                    this.__configStore.get("chart.pointSize")
                )
            )
        });
        
        return path;
    }

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
    __drawTooltips(context, chartPoints) {

        context.setTextColor(this.__configStore.get("chart.tooltipColor"));
        context.setFont(Font.heavyMonospacedSystemFont(
            this.__configStore.get("chart.tooltipFontSize")
        ));
        
        const data = this.__configStore.get("chart.data");
        const axisValues = this.__getYAxisValues(data);
        
        for (let i = 0; i < chartPoints.length; i++) {

            let point = chartPoints[i];
            let pointCopy = new Point(point.x, point.y);

            pointCopy.y -= this.__configStore.get("chart.tooltipFontSize") * 1.5;
            pointCopy.x -= 10;
            let yFieldValue = String(data[i][this.__configStore.get("chart.yField")]);
            
            if (this.__configStore.get("chart.hideAxisPlacedTooltips")
                && axisValues.includes(yFieldValue)
            ) {
                continue;
            }
            
            context.drawText(yFieldValue, pointCopy);
        }
    }

    /*
    * Used to get chart data poins
    *
    * @return list of points
    */
    __getDataLocations() {

        const points = [];
        const data = this.__configStore.get("chart.data");
        const xStep = (this.__configStore.get("widget.width") - 
            this.__configStore.get("widget.padding.horizontal")) / (data.length - 1);

        let currentStep = this.__configStore.get("widget.padding.horizontal") / 2;
        const maxCustomersInMonth = this.__getMaxProperty(data, this.__configStore.get("chart.yField"));

        const chartPercent = (this.__configStore.get("widget.height") - 
            this.__configStore.get("widget.padding.vertical")) / maxCustomersInMonth;

        const getDataPoint = (i, x) => {
            return new Point(x,
                this.__configStore.get("widget.height") - 
                (this.__configStore.get("widget.padding.vertical") / 2) - 
                (data[i][this.__configStore.get("chart.yField")] * chartPercent)
            );
        }
        
        for (let i = 0; i < data.length; i++, currentStep += xStep) {
            points.push(getDataPoint(i, currentStep));
        }
        
        return points;
    }

    /*
    * Used to calculate and return
    * array of values that should be
    * displayed on Y axis
    *
    * @param data - array of objects
    *
    * @return Y axis fields
    */
    __getYAxisValues(data) {

        const axisValues = [];
        const iteration = this.__getMaxProperty(data, this.__configStore.get("chart.yField")) / 
            this.__configStore.get("chart.yMax");

        const fixed = !Number.isInteger(iteration) ? 1 : 0;
        
        for (let i = this.__configStore.get("chart.yMax"); i > 0; i--) {
            axisValues.push(Number(i * iteration).toFixed(fixed));
        }

        axisValues.push(String(0));
        return axisValues;
    }

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
    __getMaxProperty(data, property) {
        return Math.max.apply(
            Math, 
            data.map(function (record) {return record[property]})
        );
    }
}

module.exports = {
    LinearChart
};

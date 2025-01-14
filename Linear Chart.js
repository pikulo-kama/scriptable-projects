// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: chart-line;

const { ConfigStore, ColorMode, themed } = importModule("Config Util");
const { rootWidget, image } = importModule("UI");


/**
 * Used to generate linear charts.
 *
 * @class LinearChart
 */
class LinearChart {

    static #DEFAULT_CONFIG = {
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

    #store = new ConfigStore();

    /**
     * Creates an instance of LinearChart.
     * 
     * @param {Object} userConfig JSON configuration of the chart
     * @param {ColorMode} colorMode color mode in which chart should be created
     * @memberof LinearChart
     */
    constructor(userConfig, colorMode) {
        this.#store.setConfig(LinearChart.#DEFAULT_CONFIG);
        this.#store.overrideConfig(userConfig);
        this.#store.setColorMode(ColorMode.of(colorMode));
    }

    
    /**
     * Used to create widget with chart image in it.
     * Image takes all available space.
     *
     * @return {ListWidget} root widget with chart
     * @memberof LinearChart
     */
    getWidget() {

        const root = rootWidget()
            .color(this.#store.get("chart.bgColor"))
            .render();

        image()
            .image(this.getImage())
            .renderFor(root);
        
        return root;
    }

    
    /**
     * Used to generate chart image
     * using provided and default configurations.
     *
     * @return {Image} image of linear chart
     * @memberof LinearChart
     */
    getImage() {
        
        const context = new DrawContext();

        context.opaque = false;
        context.size = new Size(
            this.#store.get("widget.width"), 
            this.#store.get("widget.height")
        );

        const bgRectangle = this.#getBackground();

        context.setFillColor(this.#store.get("chart.bgColor"));
        context.fill(bgRectangle);

        const chartPoints = this.#getDataLocations();
    
        const gridPath = this.#getGridPath(context, chartPoints);
        const linesPath = new Path();
        
        if (this.#store.get("chart.showTooltips")) {
            this.#drawTooltips(context, chartPoints);
        }

        if (this.#store.get("chart.showGrid")) {
                
            context.setStrokeColor(this.#store.get("chart.gridColor"));
            context.setLineWidth(this.#store.get("chart.gridLineWidth"));
            
            context.addPath(gridPath);
            context.strokePath();
        }
        
        if (this.#store.get("chart.showDots")) {

            const dotsPath = this.#getDotsPath(chartPoints);
            
            context.setFillColor(this.#store.get("chart.dotColor"));
            context.addPath(dotsPath);
            context.fillPath();
        }

        context.setStrokeColor(this.#store.get("chart.lineColor"));
        context.setLineWidth(this.#store.get("chart.lineWidth"));
    
        linesPath.addLines(chartPoints);
        context.addPath(linesPath);
        context.strokePath();
    
        return context.getImage();
    }

    
    /**
     * Used to create chart canvas.
     *
     * @return {Rect} chart canvas
     * @memberof LinearChart
     */
    #getBackground() { 
        return new Rect(0, 0, 
            this.#store.get("widget.width"), 
            this.#store.get("widget.height")
        );
    }

    /**
    * Used to create chart grid along with
    * axis labels.
    *
    * @param {DrawContext} context instance of DrawContext where grid should be written
    * @param {List<Point>} chartPoints list of points that represent data on chart (they are
    * used as orienters when building grid)
    * @return {Path} grid
    * @memberof LinearChart
    */
    #getGridPath(context, chartPoints) {
        
        const path = new Path();
        const showLegend = this.#store.get("chart.showLegend");

        const yAxisValues = this.#getYAxisValues(this.#store.get("chart.data"));
        const yStep = (this.#store.get("widget.height") - 
                    this.#store.get("widget.padding.vertical")) / this.#store.get("chart.yMax");

        let step = this.#store.get("widget.padding.vertical") / 2;

        context.setTextColor(this.#store.get("chart.legendColor"));
        context.setFont(Font.heavyMonospacedSystemFont(
            this.#store.get("chart.legendFontSize")
        ));

        context.setTextAlignedCenter();

        for (let i = 0; i < chartPoints.length; i++) {

            const startPoint = new Point(chartPoints[i].x, this.#store.get("widget.padding.vertical") / 2);
            const endPoint = new Point(chartPoints[i].x, (
                this.#store.get("widget.height") - this.#store.get("widget.padding.vertical") / 2
            ));

            path.addLines([
                startPoint, endPoint
            ]);

            endPoint.x -= 10;
            endPoint.y += this.#store.get("chart.legendFontSize");

            if (showLegend) {
                context.drawText(this.#store.get("chart.data")[i][this.#store.get("chart.xField")], endPoint);
            }
        }

        for (let i = 0; i <= this.#store.get("chart.yMax"); i++, step += yStep) {
            
            const startPoint = new Point(this.#store.get("widget.padding.horizontal") / 2, step);
            const endPoint = new Point(
                this.#store.get("widget.width") - this.#store.get("widget.padding.horizontal") / 2, step
            );
            
            path.addLines([
                startPoint, endPoint
            ]);

            const value = yAxisValues[i];
            
            startPoint.x -= value.length * this.#store.get("chart.legendFontSize");
            startPoint.y -= 10;
            
            if (showLegend) {
                context.drawText(value, startPoint);
            }
        }
        
        return path;
    }

    /**
    * Used to get dots that will be 
    * displayed on the same place as
    * chart data points
    *
    * @param {List<Point>} chartPoints list of points
    * that represent data on chart (they are
    * used as orienters when adding dots)
    * @return {Path} dots
    * @memberof LinearChart
    */
    #getDotsPath(chartPoints) {

        const path = new Path();

        chartPoints.forEach(point => {
            path.addEllipse(
                new Rect(
                    point.x - (this.#store.get("chart.pointSize") / 2),
                    point.y - (this.#store.get("chart.pointSize") / 2),
                    this.#store.get("chart.pointSize"), 
                    this.#store.get("chart.pointSize")
                )
            )
        });
        
        return path;
    }

    /**
    * Used to draw tooltips above chart
    * points. 
    *
    * You could also hide 
    * tooltips which are placed on grid
    * by setting chart.hideAxisPlacedTooltips
    * to true
    *
    * @param {DrawContext} context instance of DrawContext
    * where tooltips should be written
    * @param {List<Point>} chartPoints list of points
    * that represent data on chart (they are
    * used as orienters when adding tooltips)
    * @memberof LinearChart
    */
    #drawTooltips(context, chartPoints) {

        context.setTextColor(this.#store.get("chart.tooltipColor"));
        context.setFont(Font.heavyMonospacedSystemFont(
            this.#store.get("chart.tooltipFontSize")
        ));
        
        const data = this.#store.get("chart.data");
        const axisValues = this.#getYAxisValues(data);
        
        for (let i = 0; i < chartPoints.length; i++) {

            const point = chartPoints[i];
            const pointCopy = new Point(point.x, point.y);

            pointCopy.y -= this.#store.get("chart.tooltipFontSize") * 1.5;
            pointCopy.x -= 10;
            
            const yFieldValue = String(data[i][this.#store.get("chart.yField")]);
            
            if (this.#store.get("chart.hideAxisPlacedTooltips")
                && axisValues.includes(yFieldValue)
            ) {
                continue;
            }
            
            context.drawText(yFieldValue, pointCopy);
        }
    }

    /**
    * Used to get chart data poins.
    *
    * @return {List<Point>} list of points
    * @memberof LinearChart
    */
    #getDataLocations() {

        const points = [];
        const data = this.#store.get("chart.data");
        const xStep = (this.#store.get("widget.width") - 
            this.#store.get("widget.padding.horizontal")) / (data.length - 1);

        let currentStep = this.#store.get("widget.padding.horizontal") / 2;
        const maxValueY = this.#getMaxProperty(data, this.#store.get("chart.yField"));

        const chartPercent = (this.#store.get("widget.height") - 
            this.#store.get("widget.padding.vertical")) / maxValueY;

        const getDataPoint = (i, x) => {
            return new Point(x,
                this.#store.get("widget.height") - 
                (this.#store.get("widget.padding.vertical") / 2) - 
                (data[i][this.#store.get("chart.yField")] * chartPercent)
            );
        }
        
        for (let i = 0; i < data.length; i++, currentStep += xStep) {
            points.push(getDataPoint(i, currentStep));
        }
        
        return points;
    }

    /**
    * Used to calculate and return
    * array of values that should be
    * displayed on Y axis.
    *
    * @param {List<Object>} data chart data
    * @return {List<Number>} Y axis fields
    * @memberof LinearChart
    */
    #getYAxisValues(data) {

        const axisValues = [];
        const iteration = this.#getMaxProperty(data, this.#store.get("chart.yField")) / this.#store.get("chart.yMax");
        const fixed = Number.isInteger(iteration) ? 0 : 1;
        
        for (let i = this.#store.get("chart.yMax"); i > 0; i--) {
            axisValues.push(Number(i * iteration).toFixed(fixed));
        }

        axisValues.push(String(0));
        return axisValues;
    }

    /**
    * Used to get max property from 
    * chart data array.
    *
    * @param {List<Object>} data chart data
    * @param {String} property name of property for 
    * which max value should be returned
    * @return {Number} max value in array
    * @memberof LinearChart
    */
    #getMaxProperty(data, property) {
        return Math.max(...data.map((record) => record[property]));
    }
}


module.exports = {
    LinearChart
};

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: circle-notch;

const { ConfigStore } = importModule("Config Util");

/**
 * Used to generate circular chart.
 *
 * @class Circle
 */
class Circle {

    static #DEFAULT_CONFIG = {
        size: 400,
        steps: 180,
        diameter: 350,
        fill: false,
        circleLineWidth: 40,
        data: [
            {
                color: Color.gray(),
                percentage: 100
            }
        ]
    };

    #configStore = new ConfigStore();

    /**
     * Creates an instance of Circle.
     * 
     * @param {Object} userConfig circle configuration
     * @memberof Circle
     */
    constructor(userConfig) {
        this.#configStore.setConfig(Circle.#DEFAULT_CONFIG);
        this.#configStore.overrideConfig(userConfig);
    }

    /**
     * Used to generate image with circular chart.
     *
     * @return {Image} chart image
     * @memberof Circle
     */
    image() {

        const context = new DrawContext();
        context.opaque = false;
        
        const size = this.#configStore.get("size");
        context.size = new Size(size, size);
        
        context.setLineWidth(this.#configStore.get("circleLineWidth"));
        
        let circleData = [{
            color: null,
            percentage: 0
        }].concat(this.#configStore.get("data"));
        
        for (let i = 0; i + 1 < circleData.length; i++) {

            let from = circleData[i];
            let to = circleData[i + 1];
            
            let segment = this.#getSegment(
                from.percentage, 
                to.percentage
            );
            
            context.setFillColor(to.color);
            context.setStrokeColor(to.color);
            context.addPath(segment);
            
            if (this.#configStore.get("fill")) {
                context.fillPath();

            } else {
                context.strokePath();
            };
        }
        
        return context.getImage();
    }

    /**
     * Used to generate chart segment.
     *
     * @param {Number} from starting percentage
     * @param {Number} to ending percentage
     * @return {Path} segment
     * @memberof Circle
     */
    #getSegment(from, to) {

        let step = Math.PI * 2 / this.#configStore.get("steps");
        let points = [];
        
        const size = this.#configStore.get("size") + 1;
        const origin = size / 2;
        
        let radius = this.#configStore.get("diameter") / 2;
        
        if (this.#configStore.get("fill")) {
            points.push(new Point(origin, origin));
        }
        
        for (let theta = Math.PI * (from * 2 / 100); theta < Math.PI * (to * 2 / 100); theta += step) {
            let x = origin + Math.sin(theta) * radius;
            let y = origin - Math.cos(theta) * radius;

            points.push(new Point(x, y));
        }
        
        const path = new Path();
        path.addLines(points);
        
        return path;
    }
};


module.exports = {
    Circle
};

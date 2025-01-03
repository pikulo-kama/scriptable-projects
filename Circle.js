// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: circle-notch;

const { ConfigStore } = importModule("Config Util");

class Circle {

    static __DEFAULT_CONFIG = {
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

    constructor(userConfig) {
        this.__configStore = new ConfigStore();
        this.__configStore.setConfig(Circle.__DEFAULT_CONFIG);
        this.__configStore.overrideConfig(userConfig);
    }

    image() {

        const context = new DrawContext();
        context.opaque = false;
        
        const size = this.__configStore.get("size");
        context.size = new Size(size, size);
        
        context.setLineWidth(this.__configStore.get("circleLineWidth"));
        
        let circleData = [{
            color: null,
            percentage: 0
        }].concat(this.__configStore.get("data"));
        
        for (let i = 0; i + 1 < circleData.length; i++) {

            let from = circleData[i];
            let to = circleData[i + 1];
            
            let segment = this.__getSegment(
                from.percentage, 
                to.percentage
            );
            
            context.setFillColor(to.color);
            context.setStrokeColor(to.color);
            context.addPath(segment);
            
            if (this.__configStore.get("fill")) {
                context.fillPath();

            } else {
                context.strokePath();
            };
        }
        
        return context.getImage();
    }

    __getSegment(from, to) {

        let step = Math.PI * 2 / this.__configStore.get("steps");
        let points = [];
        
        const size = this.__configStore.get("size") + 1;
        const origin = size / 2;
        
        let radius = this.__configStore.get("diameter") / 2;
        
        if (this.__configStore.get("fill")) {
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

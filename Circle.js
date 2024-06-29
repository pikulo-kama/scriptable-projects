// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: circle-notch;
const configImport = importModule("Config Util")

const root = {
    
    defaultConfig: {
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
    },
    
    generateCircleImage: configIn => {
    
        configImport.store.config = root.defaultConfig
        configImport.store.userConfig = configIn
        
        const context = new DrawContext()
        context.opaque = false
        
        const size = configImport.conf("size")
        context.size = new Size(size, size)
        
        context.setLineWidth(configImport.conf("circleLineWidth"))
        
        let circleData = [{
            color: null,
            percentage: 0
        }].concat(configImport.conf("data"))
        
        for (let i = 0; i + 1 < circleData.length; i++) {
            let from = circleData[i]
            let to = circleData[i + 1]
            
            let segment = root.getSegment(
                from.percentage, 
                to.percentage
            )
            
            context.setFillColor(to.color)
            context.setStrokeColor(to.color)
            context.addPath(segment)
            
            if (configImport.conf("fill")) {
                context.fillPath()
            } else {
                context.strokePath()
            }
        }
        
        return context.getImage()
    },
    
    getSegment: (from, to) => {

        let step = Math.PI * 2 / configImport.conf("steps")
        let points = []
        
        const size = configImport.conf("size") + 1
        const origin = size / 2
        
        let radius = configImport.conf("diameter") / 2
        
        if (configImport.conf("fill")) {
            points.push(new Point(origin, origin))
        }
        
        for (let theta = Math.PI * (from * 2 / 100); theta < Math.PI * (to * 2 / 100); theta += step) {
            let x = origin + Math.sin(theta) * radius
            let y = origin - Math.cos(theta) * radius
            
            points.push(new Point(x, y))
        }
        
        const path = new Path()
        path.addLines(points)
        return path
    }
}

module.exports.generateCircleImage = root.generateCircleImage

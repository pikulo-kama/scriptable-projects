// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

const { 
    Classes, 
    addToState, 
    getFromState, 
    getState 
} = importModule("Core");

/**
 * Spacer builder.
 *
 * @class SpacerWidgetBuilder
 */
class SpacerWidgetBuilder {

    /**
     * Used to render spacer.
     * If length is not provided -
     * spacer will take all available space.
     *
     * @param {*} parent parent widget
     * @param {Number} length length of spacer
     * @return {WidgetSpacer} spacer
     * @memberof SpacerWidgetBuilder
     */
    renderFor(parent, length) {
        return parent.addSpacer(length);
    }
}


/**
 * Mixin for setting color.
 *
 * @class ColorBuilder
 */
class ColorBuilder {

    /**
     * Used to set widget color.
     *
     * @param {Color} color text color
     * @return {*} current instance of builder
     * @memberof ColorBuilder
     */
    color(color) {
        addToState(this, {color});
        // this.#color = color;
        return this;
    }
}

/**
 * Mixin for setting opacity.
 *
 * @class OpacityBuilder
 */
class OpacityBuilder {
    
    /**
     * Used to set widget opacity.
     *
     * @param {Number} opacity widget opacity
     * @return {*} current instance of builder
     * @memberof OpacityBuilder
     */
    opacity(opacity) {
        addToState(this, {opacity});
        return this;
    }    
}

/**
 * Mixin for setting layout
 *
 * @class LayoutBuilder
 */
class LayoutBuilder {

    /**
     * Used to align self on center.
     *
     * @return {*} current instance of builder
     * @memberof LayoutBuilder
     */
    centerAlign() {
        this.leftAlign();
        this.rightAlign();
        return this;
    }
    
    /**
     * Used to align self on left.
     *
     * @return {*} current instance of builder
     * @memberof LayoutBuilder
     */
    leftAlign() {
        addToState(this, {leftAlign: true})
        return this;
    }

    /**
     * Used to align self on right.
     *
     * @return {*} current instance of builder
     * @memberof LayoutBuilder
     */
    rightAlign() {

        addToState(this, {
            parentTransform: (parent) => {

                const stackWrapperStack = parent.addStack();
                stackWrapperStack.addSpacer();

                return stackWrapperStack;
            }
        });
        return this;
    }
}

/**
 * Mixin used to set widget content and font
 *
 * @class TextBuilder
 */
class TextBuilder {

    #aligningFunction = (widget) => widget.centerAlignText();

    /**
     * Used to set widget content.
     *
     * @param {String} content widget content
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    content(content) {
        addToState(this, {content});
        return this;
    }

    /**
     * Used to apply 'Black Rounded' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    blackRoundedFont(size) {
        addToState(this, {font: Font.blackRoundedSystemFont(size)});
        return this;
    }

    /**
     * Used to apply 'Bold Monospaced' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    boldMonospacedFont(size) {
        addToState(this, {font: Font.boldMonospacedSystemFont(size)});
        return this;
    }

    /**
     * Used to apply 'Black Monospaced' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    blackMonospacedFont(size) {
        addToState(this, {font: Font.blackMonospacedSystemFont(size)});
        return this;
    }
    
    /**
     * Used to apply 'Black' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    blackFont(size) {
        addToState(this, {font: Font.blackSystemFont(size)});
        return this;
    }
}


/**
 * Stack builder.
 *
 * @class StackWidgetBuilder
 */
class StackWidgetBuilder extends Classes(LayoutBuilder, ColorBuilder) {

    #width = 0;
    #height = 0;
    #borderColor;
    #borderWidth;
    #paddingTop;
    #paddingRight;
    #paddingBottom;
    #paddingLeft;
    #radius;

    #layoutFunction = (widget) => widget.layoutHorizontally();
    #aligningFunction = (widget) => widget.centerAlignContent();

    /**
     * Sets stack direction to
     * be vertical.
     * 
     * By default horizontal.
     *
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    vertical() {
        this.#layoutFunction = (widget) => widget.layoutVertically();
        return this;
    }
    
    /**
     * Used to set width of stack.
     *
     * @param {Number} width stack width
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    width(width) {
        this.#width = width;
        return this;
    }
    
    /**
     * Used to set height of stack.
     *
     * @param {Number} height stack height
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    height(height) {
        this.#height = height;
        return this;
    }
    
    /**
     * Used to set stack border color.
     *
     * @param {Color} color border color
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    borderColor(color) {
        this.#borderColor = color;
        return this;
    }
    
    /**
     * Used to set stack border width.
     *
     * @param {Number} color border width
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    borderWidth(width) {
        this.#borderWidth = width;
        return this;
    }

    /**
     * Used to paddings for stack.
     * Only top is mandatory for padding
     * to take effect.
     *
     * @param {Number} top top padding
     * @param {Number} right right padding
     * @param {Number} bottom bottom padding
     * @param {Number} left left padding
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    padding(top, right, bottom, left) {

        if (!right) {
            right = top;
        }

        if (!bottom) {
            bottom = top;
        }

        if (!left) {
            left = right;
        }

        this.#paddingTop = top;
        this.#paddingRight = right;
        this.#paddingBottom = bottom;
        this.#paddingLeft = left;

        return this;
    }

    /**
     * Used to set corner radius of stack.
     *
     * @param {Number} radius stack corner radius
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    radius(radius) {
        this.#radius = radius;
        return this;
    }

    /**
     * Used to render stack.
     *
     * @param {*} parent stack parent widget
     * @return {WidgetStack} stack
     * @memberof StackWidgetBuilder
     */
    renderFor(parent) {

        const color = getFromState(this, "color");
        const leftAlign = getFromState(this, "leftAlign", false);
        const parentTransform = getFromState(this, "parentTransform", (parent) => parent);

        parent = parentTransform(parent);

        let stack = parent.addStack();
        stack.size = new Size(this.#width, this.#height);
        
        if (leftAlign) {
            parent.addSpacer();
        }

        if (this.#paddingTop) {
            stack.setPadding(
                this.#paddingTop, 
                this.#paddingRight, 
                this.#paddingBottom, 
                this.#paddingLeft
            );
        }

        if (this.#radius) {
            stack.cornerRadius = this.#radius;
        }

        if (color) {
            stack.backgroundColor = color;
        }
        
        if (this.#borderColor) {
            stack.borderColor = this.#borderColor;
        }
        
        if (this.#borderWidth) {
            stack.borderWidth = this.#borderWidth;
        }
        
        this.#aligningFunction(stack);
        this.#layoutFunction(stack);

        return stack;
    }
}


/**
 * Text widget builder.
 *
 * @class TextWidgetBuilder
 */
class TextWidgetBuilder extends Classes(
    TextBuilder, 
    LayoutBuilder,
    ColorBuilder, 
    OpacityBuilder
) {

    #limit;
    
    /**
     * Set max length of content.
     * If content exceeds defined limit
     * content would be trimmed.
     *
     * @param {Number} maxLength max possible content length
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
     */
    limit(maxLength) {
        this.#limit = maxLength;
        return this;
    }
    
    /**
     * Used to render text widget.
     *
     * @param {*} parent parent widget
     * @return {WidgetText} text widget
     * @memberof TextWidgetBuilder
     */
    renderFor(parent) {

        if (!parent) {
            throw new Error("Invalid parent widget provided.");
        }
        
        const {
            color,
            opacity,
            content,
            font
        } = getState(this);

        const leftAlign = getFromState(this, "leftAlign", false);
        const parentTransform = getFromState(this, "parentTransform", (parent) => parent);
        const aligningFunction = getFromState(this, "aligningFunction", (widget) => widget.centerAlignText());

        let text = content;
        parent = parentTransform(parent);
        
        if (this.#limit) {
            text = this.#truncate(text, this.#limit);
        }

        let textWidget = parent.addText(text);
        
        if (leftAlign) {
            parent.addSpacer();
        }
        
        if (font) {
            textWidget.font = font;
        }

        if (color) {
            textWidget.textColor = color;
        }

        if (opacity) {
            textWidget.textOpacity = opacity;
        }
        
        aligningFunction(textWidget);
        return textWidget;
    }
    
    /**
     * Truncates text to provided length.
     * 
     * @param {String} text text to truncate.
     * @param {Number} maxLength maximum final text length.
     * @returns {String} truncated text.
     */
    #truncate(text, maxLength) {

        if (text.length > maxLength) {
            
            let truncated = text.substring(0, maxLength - 2);
            text = truncated + "..";
        }

        return text;
    }
}

/**
 * Used to build image widget.
 *
 * @class ImageWidgetBuilder
 */
class ImageWidgetBuilder extends Classes(
    LayoutBuilder, 
    ColorBuilder, 
    OpacityBuilder
) {

    #aligningFunction = (widget) => widget.centerAlignImage();
    #applyIconWeight = () => {};

    #iconCode;
    #image;
    #width;
    #height;
    #radius;

    /**
     * Used to set SF symbol code.
     * For scenarios when icon should
     * be displayed as image.
     *
     * @param {String} iconCode SF symbol code
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    icon(iconCode) {
        this.#iconCode = iconCode;
        return this;
    }
    
    /**
     * Used to set image that should be displayed.
     *
     * @param {Image} image image to display
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    image(image) {
        this.#image = image;
        return this;
    }
    
    /**
     * Used to set SF symbol icon weight to light.
     *
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    lightWeight() {
        this.#applyIconWeight = icon => {
            icon.applyLightWeight();
        };
        return this;
    }
    
    /**
     * Used to set SF symbol icon weight to regular.
     *
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    regularWeight() {
        this.#applyIconWeight = icon => {
            icon.applyRegularWeight();
        };
        return this;
    }
    
    /**
     * Used to set SF symbol icon weight to heavy.
     *
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    heavyWeight() {
        this.#applyIconWeight = icon => {
            icon.applyHeavyWeight();
        };
        return this;
    }
    
    /**
     * Used to set size of image.
     * If height is not provided
     * width would be used for both
     * dimensions.
     *
     * @param {Number} width image width
     * @param {Number} height image height
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    size(width, height) {

        if (!height) {
            height = width;
        }

        this.#width = width;
        this.#height = height;
        return this;
    }

    /**
     * Used to set image corner radius.
     *
     * @param {Number} radius image corner radius
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    radius(radius) {
        this.#radius = radius;
        return this;
    }
    
    /**
     * Used to render image widget.
     *
     * @param {*} parent parent widget
     * @return {WidgetImage} image widget
     * @memberof ImageWidgetBuilder
     */
    renderFor(parent) {

        if (!parent) {
            throw new Error("Invalid parent widget provided.");
        }

        const {
            color,
            opacity
        } = getState(this);

        const leftAlign = getFromState(this, "leftAlign", false);
        const parentTransform = getFromState(this, "parentTransform", (parent) => parent);
        
        let image = this.#image;
        let iconCode = this.#iconCode;
        
        if (!image && iconCode) {
            let icon = SFSymbol.named(iconCode);
            this.#applyIconWeight(icon);
            
            image = icon.image;
        }

        parent = parentTransform(parent);
        let imageWidget = parent.addImage(image);

        if (leftAlign) {
            parent.addSpacer();
        }
        
        if (this.#width) {
            imageWidget.imageSize = new Size(
                this.#width,
                this.#height
            );
        }
        
        if (color) {
            imageWidget.tintColor = color;
        }

        if (opacity) {
            imageWidget.imageOpacity = opacity;
        }

        if (this.#radius) {
            imageWidget.cornerRadius = this.#radius;
        }
        
        this.#aligningFunction(imageWidget);
        return imageWidget;
    }
}

/**
 * Used to render date as text widget.
 *
 * @class DateWidgetBuilder
 */
class DateWidgetBuilder extends Classes(
    TextBuilder, 
    LayoutBuilder, 
    ColorBuilder, 
    OpacityBuilder
) {

    /**
     * Used to render date as text widget.
     *
     * @param {*} parent parent widget
     * @return {WidgetDate} date widget
     * @memberof DateWidgetBuilder
     */
    renderFor(parent) {

        if (!parent) {
            throw new Error("Invalid parent widget provided.");
        }

        const {
            color,
            opacity,
            content,
            font
        } = getState(this);

        const leftAlign = getFromState(this, "leftAlign", false);
        const parentTransform = getFromState(this, "parentTransform", (parent) => parent);
        const aligningFunction = getFromState(this, "aligningFunction", (widget) => widget.centerAlignText());
        
        parent = parentTransform(parent);
        let dateWidget = parent.addDate(content);

        if (leftAlign) {
            parent.addSpacer();
        }

        if (font) {
            dateWidget.font = font;
        }
        
        if (color) {
            dateWidget.textColor = color;
        }

        if (opacity) {
            dateWidget.textOpacity = opacity;
        }
        
        aligningFunction(dateWidget);
        return dateWidget;
    }
}

/**
 * Used to create LinearGradient.
 *
 * @class GradientBuilder
 */
class GradientBuilder {

    #parentBuilder;
    #locations = [];
    #colors = [];
    #startPoint;
    #endPoint;

    /**
     * Creates an instance of GradientBuilder.
     * 
     * @param {*} parentBuilder builder to which gradient should be set
     * @memberof GradientBuilder
     */
    constructor(parentBuilder) {
        this.#parentBuilder = parentBuilder;
    }

    /**
     * Used to set gradient color and its location.
     *
     * @param {Number} location gradient location (0..1)
     * @param {Color} color gradient color
     * @return {GradientBuilder} current instance of builder
     * @memberof GradientBuilder
     */
    color(location, color) {
        this.#locations.push(location);
        this.#colors.push(color);
        return this;
    }

    /**
     * Used to set gradient direction from left to right.
     *
     * @return {GradientBuilder} current instance of builder
     * @memberof GradientBuilder
     */
    leftToRight() {
        this.#startPoint = new Point(0, 1);
        this.#endPoint = new Point(1, 1);
        return this;
    }
    
    /**
     * Used to set gradient direction from top to bottom.
     *
     * @return {GradientBuilder} current instance of builder
     * @memberof GradientBuilder
     */
    topToBottom() {
        this.#startPoint = new Point(1, 0);
        this.#endPoint = new Point(1, 1);
        return this;
    }

    /**
     * Used to build linear gradient
     * and set it into parent builder.
     *
     * @return {*} parent builder
     * @memberof GradientBuilder
     */
    create() {

        const gradient = new LinearGradient();

        if (this.#colors.length > 0) {
            gradient.colors = this.#colors;
            gradient.locations = this.#locations;
        }

        if (this.#startPoint) {
            gradient.startPoint = this.#startPoint;
        }

        if (this.#endPoint) {
            gradient.endPoint = this.#endPoint;
        }

        addToState(this.#parentBuilder, {gradient});
        return this.#parentBuilder;
    }
}

/**
 * Used to build root widget.
 *
 * @class RootWidgetBuilder
 * @extends {ColorBuilder}
 */
class RootWidgetBuilder extends ColorBuilder {

    /**
     * Used to add linear gradient to root widget.
     *
     * @return {RootWidgetBuilder} current instance of builder
     * @memberof RootWidgetBuilder
     */
    gradient() {
        return new GradientBuilder(this);
    }

    /**
     * Used to create root widget.
     *
     * @return {ListWidget} root widget
     * @memberof RootWidgetBuilder
     */
    render() {

        const {
            color,
            gradient
        } = getState(this);

        const rootWidget = new ListWidget();

        if (color) {
            rootWidget.backgroundColor = color;
        }

        if (gradient) {
            rootWidget.backgroundGradient = gradient;
        }

        return rootWidget;
    }
}

function spacer() {
    return new SpacerWidgetBuilder();
}

function stack() {
    return new StackWidgetBuilder();
}

function text() {
    return new TextWidgetBuilder();;
}

function image() {
    return new ImageWidgetBuilder();
}

function date() {
    return new DateWidgetBuilder();
}

function rootWidget() {
    return new RootWidgetBuilder();
}

/**
* Used to present root widget.
* 
* @param {ListWidget} rootWidget root widget.
*/
function present(rootWidget) {
    QuickLook.present(rootWidget);
    Script.setWidget(rootWidget);
}

module.exports = {
    spacer,
    stack,
    text,
    image,
    date,
    rootWidget,
    present
};
 
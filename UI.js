// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

const { Classes } = importModule("Core");

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
        this.__color = color;
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
        this.__opacity = opacity;
        return this;
    }    
}

/**
 * Mixing for setting layout
 *
 * @class LayoutBuilder
 */
class LayoutBuilder {

    __leftAlign = false;
    __parentTransform = (parent) => parent;

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
        this.__leftAlign = true;
        return this;
    }

    /**
     * Used to align self on right.
     *
     * @return {*} current instance of builder
     * @memberof LayoutBuilder
     */
    rightAlign() {
        this.__parentTransform = (parent) => {

            const stackWrapperStack = parent.addStack();
            stackWrapperStack.addSpacer();

            return stackWrapperStack;
        };
        return this;
    }
}

/**
 * Mixin used to set widget content and font
 *
 * @class TextBuilder
 */
class TextBuilder {

    __aligningFunction = (widget) => widget.centerAlignText();

    /**
     * Used to set widget content.
     *
     * @param {String} content widget content
     * @return {*} current instance of builder
     * @memberof TextBuilder
     */
    content(content) {
        this.__content = content;
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
        this.__font = Font.blackRoundedSystemFont(size);
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
        this.__font = Font.boldMonospacedSystemFont(size);
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
        this.__font = Font.blackMonospacedSystemFont(size);
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
        this.__font = Font.blackSystemFont(size);
        return this;
    }
}


/**
 * Stack builder.
 *
 * @class StackWidgetBuilder
 */
class StackWidgetBuilder extends Classes(LayoutBuilder, ColorBuilder) {

    __width = 0;
    __height = 0;

    __layoutFunction = (widget) => widget.layoutHorizontally();
    __aligningFunction = (widget) => widget.centerAlignContent();

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
        this.__layoutFunction = (widget) => widget.layoutVertically();
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
        this.__width = width;
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
        this.__height = height;
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
        this.__borderColor = color;
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
        this.__borderWidth = width;
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

        this.__paddingTop = top;
        this.__paddingRight = right;
        this.__paddingBottom = bottom;
        this.__paddingLeft = left;

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
        this.__radius = radius;
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

        parent = this.__parentTransform(parent);

        let stack = parent.addStack();
        stack.size = new Size(this.__width, this.__height);
        
        if (this.__leftAlign) {
            parent.addSpacer();
        }

        if (this.__paddingTop) {
            stack.setPadding(
                this.__paddingTop, 
                this.__paddingRight, 
                this.__paddingBottom, 
                this.__paddingLeft
            );
        }

        if (this.__radius) {
            stack.cornerRadius = this.__radius;
        }

        if (this.__color) {
            stack.backgroundColor = this.__color;
        }
        
        if (this.__borderColor) {
            stack.borderColor = this.__borderColor;
        }
        
        if (this.__borderWidth) {
            stack.borderWidth = this.__borderWidth;
        }
        
        this.__aligningFunction(stack);
        this.__layoutFunction(stack);

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
        this.__limit = maxLength;
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
        
        let text = this.__content;
        parent = this.__parentTransform(parent);
        
        if (this.__limit) {
            text = this.__truncate(text, this.__limit);
        }

        let textWidget = parent.addText(text);
        
        if (this.__leftAlign) {
            parent.addSpacer();
        }
        
        if (this.__font) {
            textWidget.font = this.__font;
        }

        if (this.__color) {
            textWidget.textColor = this.__color;
        }

        if (this.__opacity) {
            textWidget.textOpacity = this.__opacity;
        }
        
        this.__aligningFunction(textWidget);
        return textWidget;
    }
    
    /**
     * Truncates text to provided length.
     * 
     * @param {String} text text to truncate.
     * @param {Number} maxLength maximum final text length.
     * @returns {String} truncated text.
     */
    __truncate(text, maxLength) {

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

    __aligningFunction = (widget) => widget.centerAlignImage();
    __applyIconWeight = () => {};

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
        this.__iconCode = iconCode;
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
        this.__image = image;
        return this;
    }
    
    /**
     * Used to set SF symbol icon weight to light.
     *
     * @return {ImageWidgetBuilder} current instance of builder
     * @memberof ImageWidgetBuilder
     */
    lightWeight() {
        this.__applyIconWeight = icon => {
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
        this.__applyIconWeight = icon => {
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
        this.__applyIconWeight = icon => {
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

        this.__width = width;
        this.__height = height;
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
        this.__radius = radius;
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
        
        let image = this.__image;
        let iconCode = this.__iconCode;
        
        if (!image && iconCode) {
            let icon = SFSymbol.named(iconCode);
            this.__applyIconWeight(icon);
            
            image = icon.image;
        }

        parent = this.__parentTransform(parent);
        let imageWidget = parent.addImage(image);
        
        if (this.__width) {
            imageWidget.imageSize = new Size(
                this.__width,
                this.__height
            );
        }
        
        if (this.__color) {
            imageWidget.tintColor = this.__color;
        }

        if (this.__opacity) {
            imageWidget.imageOpacity = this.__opacity;
        }

        if (this.__radius) {
            imageWidget.cornerRadius = this.__radius;
        }
        
        this.__aligningFunction(imageWidget);
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
        
        parent = this.__parentTransform(parent);
        let dateWidget = parent.addDate(this.__content);

        if (this.__font) {
            dateWidget.font = this.__font;
        }
        
        if (this.__color) {
            dateWidget.textColor = this.__color;
        }

        if (this.__opacity) {
            dateWidget.textOpacity = this.__opacity;
        }
        
        this.__aligningFunction(dateWidget);
        return dateWidget;
    }
}

/**
 * Used to create LinearGradient.
 *
 * @class GradientBuilder
 */
class GradientBuilder {

    /**
     * Creates an instance of GradientBuilder.
     * 
     * @param {*} parentBuilder builder to which gradient should be set
     * @memberof GradientBuilder
     */
    constructor(parentBuilder) {
        this.__parentBuilder = parentBuilder;
        this.__locations = [];
        this.__colors = [];
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
        this.__locations.push(location);
        this.__colors.push(color);
        return this;
    }

    /**
     * Used to set gradient direction from left to right.
     *
     * @return {GradientBuilder} current instance of builder
     * @memberof GradientBuilder
     */
    leftToRight() {
        this.__startPoint = new Point(0, 1);
        this.__endPoint = new Point(1, 1);
        return this;
    }
    
    /**
     * Used to set gradient direction from top to bottom.
     *
     * @return {GradientBuilder} current instance of builder
     * @memberof GradientBuilder
     */
    topToBottom() {
        this.__startPoint = new Point(1, 0);
        this.__endPoint = new Point(1, 1);
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

        if (this.__colors.length > 0) {
            gradient.colors = this.__colors;
            gradient.locations = this.__locations;
        }

        if (this.__startPoint) {
            gradient.startPoint = this.__startPoint;
        }

        if (this.__endPoint) {
            gradient.endPoint = this.__endPoint;
        }

        this.__parentBuilder.__gradient = gradient;
        return this.__parentBuilder;
    }
}

/**
 * Used to build root widget.
 *
 * @class RootWidgetBuilder
 * @extends {ColorBuilder}
 */
class RootWidgetBuilder extends ColorBuilder {

    __gradient;

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

        const rootWidget = new ListWidget();

        if (this.__color) {
            rootWidget.backgroundColor = this.__color;
        }

        if (this.__gradient) {
            rootWidget.backgroundGradient = this.__gradient;
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
 
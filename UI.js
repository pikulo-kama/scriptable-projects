// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

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
 * Stack builder.
 *
 * @class StackWidgetBuilder
 */
class StackWidgetBuilder {

    __width = 0;
    __height = 0;
    __leftAlign = false;

    __parentTransform = (parent) => parent;
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
     * Used to align self on center.
     *
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    centerAlign() {
        this.leftAlign();
        this.rightAlign();
        return this;
    }
    
    /**
     * Used to align self on left.
     *
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    leftAlign() {
        this.__leftAlign = true;
        return this;
    }

    /**
     * Used to align self on right.
     *
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    rightAlign() {
        this.__parentTransform = (parent) => {

            const stackWrapperStack = parent.addStack();
            stackWrapperStack.addSpacer();

            return stackWrapperStack;
        };
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
     * Used to set stack background color.
     *
     * @param {Color} color background color
     * @return {StackWidgetBuilder} current instance of builder
     * @memberof StackWidgetBuilder
     */
    color(color) {
        this.__color = color;
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
class TextWidgetBuilder {

    __parentTransform = (parent) => parent;
    __aligningFunction = (widget) => widget.centerAlignText();

    /**
     * Used to set widget content.
     *
     * @param {String} content widget content
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
     */
    content(content) {
        this.__content = content;
        return this;
    }
    
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
     * Used to apply 'Black Rounded' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
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
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
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
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
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
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
     */
    blackFont(size) {
        this.__font = Font.blackSystemFont(size);
        return this;
    }
    
    /**
     * Used to set text color.
     *
     * @param {Color} color text color
     * @return {TextWidgetBuilder} current instance of builder
     * @memberof TextWidgetBuilder
     */
    color(color) {
        this.__color = color;
        return this;
    }
    
    opacity(opacity) {
        this.__opacity = opacity;
        return this;
    }
    
    centerAlign() {
        this.leftAlign();
        this.rightAlign()
        return this;
    }
    
    leftAlign() {
        this.__leftAlign = true;
        return this;
    }

    rightAlign() {
        this.__parentTransform = (parent) => {

            const textWrapperStack = parent.addStack();
            textWrapperStack.addSpacer();

            return textWrapperStack;
        };
        return this;
    }
    
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

class ImageWidgetBuilder {

    __parentTransform = (parent) => parent;
    __aligningFunction = (widget) => widget.centerAlignImage();
    __applyIconWeight = () => {};

    icon(iconCode) {
        this.__iconCode = iconCode;
        return this;
    }
    
    image(image) {
        this.__image = image;
        return this;
    }
    
    lightWeight() {
        this.__applyIconWeight = icon => {
            icon.applyLightWeight();
        };
        return this;
    }
    
    regularWeight() {
        this.__applyIconWeight = icon => {
            icon.applyRegularWeight();
        };
        return this;
    }
    
    heavyWeight() {
        this.__applyIconWeight = icon => {
            icon.applyHeavyWeight();
        };
        return this;
    }
    
    size(width, height) {

        if (!height) {
            height = width;
        }

        this.__width = width;
        this.__height = height;
        return this;
    }
    
    color(color) {
        this.__color = color;
        return this;
    }
    
    opacity(opacity) {
        this.__opacity = opacity;
        return this;
    }

    radius(radius) {
        this.__radius = radius;
        return this;
    }
    
    rightAlign() {
        this.__parentTransform = (parent) => {

            const imageWrapperStack = parent.addStack();
            imageWrapperStack.addSpacer();

            return imageWrapperStack;
        };
        return this;
    }
    
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

class DateWidgetBuilder {

    __parentTransform = (parent) => parent;
    __aligningFunction = (widget) => widget.centerAlignText();
    __applyIconWeight = () => {};

    content(date) {
        this.__date = date;
        return this;
    }

    /**
     * Used to apply 'Black' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {DateWidgetBuilder} current instance of builder
     * @memberof DateWidgetBuilder
     */
    blackRoundedFont(size) {
        this.__font = Font.blackRoundedSystemFont(size);
        return this;
    }

    /**
     * Used to apply 'Black' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {DateWidgetBuilder} current instance of builder
     * @memberof DateWidgetBuilder
     */
    boldMonospacedFont(size) {
        this.__font = Font.boldMonospacedSystemFont(size);
        return this;
    }
    
    /**
     * Used to apply 'Black' font
     * to the text.
     *
     * @param {Number} size font size
     * @return {DateWidgetBuilder} current instance of builder
     * @memberof DateWidgetBuilder
     */
    blackFont(size) {
        this.__font = Font.blackSystemFont(size);
        return this;
    }
    
    color(color) {
        this.__color = color;
        return this;
    }
    
    opacity(opacity) {
        this.__opacity = opacity;
        return this;
    }

    rightAlign() {
        this.__parentTransform = (parent) => {

            const dateWrapperStack = parent.addStack();
            dateWrapperStack.addSpacer();

            return dateWrapperStack;
        };
        return this;
    }

    renderFor(parent) {

        if (!parent) {
            throw new Error("Invalid parent widget provided.");
        }
        
        parent = this.__parentTransform(parent);
        let dateWidget = parent.addDate(this.__date);

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

class GradientBuilder {

    constructor(parentBuilder) {
        this.__parentBuilder = parentBuilder;
        this.__locations = [];
        this.__colors = [];
    }

    color(location, color) {
        this.__locations.push(location);
        this.__colors.push(color);
        return this;
    }

    leftToRight() {
        this.__startPoint = new Point(0, 1);
        this.__endPoint = new Point(1, 1);
        return this;
    }
    
    topToBottom() {
        this.__startPoint = new Point(1, 0);
        this.__endPoint = new Point(1, 1);
        return this;
    }

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

class RootWidgetBuilder {

    __gradient;

    color(color) {
        this.__color = color;
        return this;
    }

    gradient() {
        return new GradientBuilder(this);
    }

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
 
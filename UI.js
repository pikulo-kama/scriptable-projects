// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: mobile-alt;

const root = {
    
    spacer: () => {
        
        const spacerBulder = {
            renderFor: (parent, length) => {
                return parent.addSpacer(length);
            }
        };
        
        return spacerBulder;
    },
    
    stack: () => {
        
        const stackBuilder = {

            vertical: () => {
                stackBuilder.__layout = (widget) => widget.layoutVertically();
                return stackBuilder;
            },

            rightAlign: () => {
                stackBuilder.__parentTransform = (parent) => {

                    const stackWrapperStack = parent.addStack();
                    stackWrapperStack.addSpacer();

                    return stackWrapperStack;
                };
                return stackBuilder;
            },

            color: (color) => {
                stackBuilder.__color = color;
                return stackBuilder;
            },

            padding: (top, right, bottom, left) => {
                stackBuilder.__paddingTop = top;
                stackBuilder.__paddingRight = right;
                stackBuilder.__paddingBottom = bottom;
                stackBuilder.__paddingLeft = left;

                return stackBuilder;
            },

            radius: (radius) => {
                stackBuilder.__radius = radius;
                return stackBuilder;
            },

            renderFor: (parent) => {

                let paddingTop = stackBuilder.__paddingTop;
                let radius = stackBuilder.__radius;
                let color = stackBuilder.__color;

                let aligningFunc = stackBuilder.__aligning;
                let layoutFunc = stackBuilder.__layout;
                let parentTransformFunc = stackBuilder.__parentTransform;

                if (parentTransformFunc) {
                    parent = parentTransformFunc(parent);
                }
                
                let stack = parent.addStack();

                if (paddingTop) {
                    stackBuilder.__setPaddings(stack);
                }

                if (radius) {
                    stack.cornerRadius = radius;
                }

                if (color) {
                    stack.backgroundColor = color;
                }

                if (!aligningFunc) {
                    aligningFunc = (widget) => widget.centerAlignContent();
                }

                if (!layoutFunc) {
                    layoutFunc = (widget) => widget.layoutHorizontally();
                }
                
                aligningFunc(stack);
                layoutFunc(stack);
                return stack;
            },

            __setPaddings: (stack) => {

                let top = stackBuilder.__paddingTop;
                let right = stackBuilder.__paddingRight;
                let bottom = stackBuilder.__paddingBottom;
                let left = stackBuilder.__paddingLeft;

                if (!right) {
                    right = top;
                }

                if (!bottom) {
                    bottom = top;
                }

                if (!left) {
                    left = right;
                }

                stack.setPadding(top, right, bottom, left);
            }
        };

        return stackBuilder;
    },
    
    text: () => {
        
        textBuilder = {
            
            content: content => {
                textBuilder.__content = content;
                return textBuilder;
            },
            
            limit: maxLength => {
                textBuilder.__limit = maxLength;
                return textBuilder;
            },
            
            blackRoundedFont: (size) => {
                textBuilder.__font = Font.blackRoundedSystemFont(size);
                return textBuilder;
            },

            boldMonospacedFont: (size) => {
                textBuilder.__font = Font.boldMonospacedSystemFont(size);
                return textBuilder;
            },

            blackMonospacedFont: (size) => {
                textBuilder.__font = Font.blackMonospacedSystemFont(size);
                return textBuilder;
            },
            
            blackFont: (size) => {
                textBuilder.__font = Font.blackSystemFont(size);
                return textBuilder;
            },
            
            color: color => {
                textBuilder.__color = color;
                return textBuilder;
            },
            
            yellowColor: () => {
                return textBuilder.color(Color.yellow());
            },
            
            opacity: opacity => {
                textBuilder.__opacity = opacity;
                return textBuilder;
            },

            rightAlign: () => {
                textBuilder.__parentTransform = (parent) => {

                    const textWrapperStack = parent.addStack();
                    textWrapperStack.addSpacer();

                    return textWrapperStack;
                };
                return textBuilder;
            },
            
            renderFor: (parent) => {

                if (!parent) {
                    throw new Error("Invalid parent widget provided.");
                }
                
                let text = textBuilder.__content;
                let maxLength = textBuilder.__limit;
                let font = textBuilder.__font;
                let color = textBuilder.__color;
                let opacity = textBuilder.__opacity;
                let aligningFunc = textBuilder.__aligning;
                let parentTransformFunc = textBuilder.__parentTransform;
                
                if (!aligningFunc) {
                    
                    aligningFunc = widget =>
                        widget.centerAlignText();
                }

                if (parentTransformFunc) {
                    parent = parentTransformFunc(parent);
                }
                
                if (maxLength) {
                    text = textBuilder.__truncate(text, maxLength);
                }
        
                let textWidget = parent.addText(text);
        
                if (font) {
                    textWidget.font = font;
                }
        
                if (color) {
                    textWidget.textColor = color;
                }
        
                if (opacity) {
                    textWidget.textOpacity = opacity;
                }
                
                aligningFunc(textWidget);
                return textWidget;
            },
            
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
        };

        return textBuilder;
    },
    
    image: () => {
        
        const imageBuilder = {
            
            icon: (iconCode) => {
                imageBuilder.__iconCode = iconCode;
                return imageBuilder;
            },
            
            image: (image) => {
                imageBuilder.__image = image;
                return imageBuilder;
            },
            
            lightWeight: () => {
                imageBuilder.__applyIconWeight = icon => {
                    icon.applyLightWeight();
                };
                return imageBuilder;
            },
            
            regularWeight: () => {
                imageBuilder.__applyIconWeight = icon => {
                    icon.applyRegularWeight();
                };
                return imageBuilder;
            },
            
            heavyWeight: () => {
                imageBuilder.__applyIconWeight = icon => {
                    icon.applyHeavyWeight();
                };
                return imageBuilder;
            },
            
            size: (width, height) => {
                imageBuilder.__width = width;
                imageBuilder.__height = height;
                return imageBuilder;
            },
            
            color: (color) => {
                imageBuilder.__color = color;
                return imageBuilder;
            },
            
            yellowColor: () => {
                return imageBuilder.color(Color.yellow());
            },
            
            opacity: (opacity) => {
                imageBuilder.__opacity = opacity;
                return imageBuilder;
            },

            radius: (radius) => {
                imageBuilder.__radius = radius;
                return imageBuilder;
            },
            
            rightAlign: () => {
                imageBuilder.__parentTransform = (parent) => {

                    const imageWrapperStack = parent.addStack();
                    imageWrapperStack.addSpacer();

                    return imageWrapperStack;
                };
                return imageBuilder;
            },
            
            renderFor: (parent) => {

                if (!parent) {
                    throw new Error("Invalid parent widget provided.");
                }
                
                let image = imageBuilder.__image;
                let iconCode = imageBuilder.__iconCode;
                let width = imageBuilder.__width;
                let height = imageBuilder.__height;
                let color = imageBuilder.__color;
                let opacity = imageBuilder.__opacity;
                let radius = imageBuilder.__radius;

                let iconWeightFunc = imageBuilder.__applyIconWeight;
                let aligningFunc = imageBuilder.__aligning;
                let parentTransformFunc = imageBuilder.__parentTransform;
                
                if (!aligningFunc) {
                    aligningFunc = widget => {
                        widget.centerAlignImage();
                    };
                }
                
                if (parentTransformFunc) {
                    parent = parentTransformFunc(parent);
                }

                if (!image && iconCode) {
                    let icon = SFSymbol.named(iconCode);
                    
                    if (iconWeightFunc) {
                        iconWeightFunc(icon);
                    }
                    
                    image = icon.image;
                }
        
                let imageWidget = parent.addImage(image);
                
                if (width) {

                    if (!height) {
                        height = width;
                    }

                    imageWidget.imageSize = new Size(
                        width,
                        height
                    );
                }
                
                if (color) {
                    imageWidget.tintColor = color;
                }
        
                if (opacity) {
                    imageWidget.imageOpacity = opacity;
                }

                if (radius) {
                    imageWidget.cornerRadius = radius;
                }
                
                aligningFunc(imageWidget);
                return imageWidget;
            }
        };

        return imageBuilder;
    },

    date: () => {

        const dateBuilder = {

            content: (date) => {
                dateBuilder.__date = date;
                return dateBuilder;
            },

            blackRoundedFont: (size) => {
                dateBuilder.__font = Font.blackRoundedSystemFont(size);
                return dateBuilder;
            },

            boldMonospacedFont: (size) => {
                dateBuilder.__font = Font.boldMonospacedSystemFont(size);
                return dateBuilder;
            },
            
            blackFont: (size) => {
                dateBuilder.__font = Font.blackSystemFont(size);
                return dateBuilder;
            },
            
            color: color => {
                dateBuilder.__color = color;
                return dateBuilder;
            },
            
            yellowColor: () => {
                return dateBuilder.color(Color.yellow());
            },
            
            opacity: opacity => {
                dateBuilder.__opacity = opacity;
                return dateBuilder;
            },

            rightAlign: () => {
                dateBuilder.__parentTransform = (parent) => {

                    const dateWrapperStack = parent.addStack();
                    dateWrapperStack.addSpacer();

                    return dateWrapperStack;
                };
                return dateBuilder;
            },

            renderFor: (parent) => {

                if (!parent) {
                    throw new Error("Invalid parent widget provided.");
                }
                
                let date = dateBuilder.__date;
                let color = dateBuilder.__color;
                let font = dateBuilder.__font;
                let opacity = dateBuilder.__opacity;
                
                let aligningFunc = dateBuilder.__aligning;
                let parentTransformFunc = dateBuilder.__parentTransform;
                
                if (!aligningFunc) {
                    aligningFunc = widget => {
                        widget.centerAlignText();
                    };
                }

                if (parentTransformFunc) {
                    parent = parentTransformFunc(parent);
                }
                
                let dateWidget = parent.addDate(date);

                if (font) {
                    dateWidget.font = font;
                }
                
                if (color) {
                    dateWidget.textColor = color;
                }
        
                if (opacity) {
                    dateWidget.textOpacity = opacity;
                }
                
                aligningFunc(dateWidget);
                return dateWidget;
            }
        };

        return dateBuilder;
    },

    rootWidget: () => {

        const rootBuilder = {

            color: (color) => {
                rootBuilder.__color = color;
                return rootBuilder;
            },

            gradient: () => {

                const gradientBuilder = {

                    __colors: [],
                    __locations: [],

                    color: (location, color) => {
                        gradientBuilder.__locations.push(location);
                        gradientBuilder.__colors.push(color);
                        return gradientBuilder;
                    },

                    leftToRight: () => {
                        gradientBuilder.__startPoint = new Point(0, 1);
                        gradientBuilder.__endPoint = new Point(1, 1);
                        return gradientBuilder;
                    },

                    create: () => {

                        const colors = gradientBuilder.__colors;
                        const locations = gradientBuilder.__locations;
                        const startPoint = gradientBuilder.__startPoint;
                        const endPoint = gradientBuilder.__endPoint;

                        const gradient = new LinearGradient();

                        if (colors.length > 0) {
                            gradient.colors = colors;
                            gradient.locations = locations;
                        }

                        if (startPoint) {
                            gradient.startPoint = startPoint;
                        }

                        if (endPoint) {
                            gradient.endPoint = endPoint;
                        }

                        rootBuilder.__gradient = gradient;
                        return rootBuilder;
                    }
                };

                return gradientBuilder;
            },

            render: () => {

                const color = rootBuilder.__color;
                const gradient = rootBuilder.__gradient;

                const rootWidget = new ListWidget();

                if (color) {
                    rootWidget.backgroundColor = color;
                }

                if (gradient) {
                    rootWidget.backgroundGradient = gradient;
                }

                return rootWidget;
            }
        };

        return rootBuilder;
    },
    
    /**
    * Used to present root widget.
    * 
    * @param {ListWidget} rootWidget root widget.
    */
    present: (rootWidget) => {
        QuickLook.present(rootWidget);
        Script.setWidget(rootWidget);
    }
};

module.exports.spacer = root.spacer;
module.exports.stack = root.stack;
module.exports.text = root.text;
module.exports.image = root.image;
module.exports.date = root.date;
module.exports.rootWidget = root.rootWidget;
module.exports.present = root.present;
 
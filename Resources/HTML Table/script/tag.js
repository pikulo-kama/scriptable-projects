
const Tr = buildTagObject("tr");
const Td = buildTagObject("td");


function buildTagObject(tagName) {

    return (content) => {

        if (typeof content !== 'object') {
            content = [content];
        }

        return content
            .map(element => `<${tagName}>${element}</${tagName}>`)
            .join("\n");
    };
}

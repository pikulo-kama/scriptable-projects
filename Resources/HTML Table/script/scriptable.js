

window.tableData = [];
window.tableMetadata = [];


window.onScriptableMessage = (data) => {
    
    window.tableData = JSON.parse(data);
    window.tableMetadata = [
        {
            "name": "serieName",
            "type": "text"
        },
    ];

    const renderer = new TableRenderer();
    renderer.render();
};

window.sendMessageToScriptable = (data) => {
    completion(JSON.stringify(data));
};

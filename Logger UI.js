// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: file-alt;

const { Files } = importModule("Files");
const { LogLevel } = importModule("Logger");
const { tr } = importModule("Localization");
const {
    TextDataField,
    UIDataTable,
    UIForm,
    UIFormField,
    UIFormAction,
    UIDeleteRowField
} = importModule("CRUD Module");


LOGGER_SCRIPT_NAME = "Logger";
LEVELS_FILE_NAME = "levels.json";

/**
 * ENTRY POINT
 */
async function main() {

    const tableBuilder = new LoggingTable();
    const table = tableBuilder.build();

    await table.present();
}


/**
 * Used to render table used to edit log levels
 * for services.
 *
 * @class LoggingTable
 */
class LoggingTable {

    #serviceNameDataField = new TextDataField("service", "Service");
    #logLevelDataField = new TextDataField("level", LogLevel.OFF);

    /**
     * Used to build UI table.
     *
     * @return {UITable} table
     * @memberof LoggingTable
     */
    build() {

        const table = new UIDataTable();
        table.title = tr("loggerUI_tableTitle");

        table.allowCreation();
        table.showSeparators();

        table.setTableData(Files.readJson(LOGGER_SCRIPT_NAME, LEVELS_FILE_NAME, []));
        table.onDataModification((levels) => Files.updateJson(LOGGER_SCRIPT_NAME, LEVELS_FILE_NAME, levels));

        table.setDataFields([this.#serviceNameDataField, this.#logLevelDataField]);
        table.setUIFields(this.#getUIFields());

        return table;
    }

    /**
     * Used to get list of UI fields that needs to be
     * displayed in table.
     *
     * @return {List<UIField>} list of UI fields
     * @memberof LoggingTable
     */
    #getUIFields() {

        // Service Name Field
        const serviceNameUIField = new UIForm((log) => log.service, 70);
        serviceNameUIField.setFormTitleFunction(() => tr("loggerUI_serviceNameFormTitle"));
        const serviceNameFormField = new UIFormField(this.#serviceNameDataField, tr("loggerUI_serviceNameFieldFormLabel"));

        serviceNameUIField.addDefaultAction(tr("loggerUI_updateServiceNameAction"));
        serviceNameUIField.addFormField(serviceNameFormField);

        // Logging Level Field
        const logLevelUIField = new UIForm((log) => log.level, 30);
        logLevelUIField.setFormTitleFunction(() => tr("loggerUI_logLevelFormTitle"));

        const turnOffAction = new UIFormAction(LogLevel.OFF);
        const setToInfoAction = new UIFormAction(LogLevel.INFO);
        const setToWarnAction = new UIFormAction(LogLevel.WARN);
        const setToErrorAction = new UIFormAction(LogLevel.ERROR);
        const setToDebugAction = new UIFormAction(LogLevel.DEBUG);

        turnOffAction.addCallback(this.#logLevelDataField, (log) => log.level = LogLevel.OFF);
        setToInfoAction.addCallback(this.#logLevelDataField, (log) => log.level = LogLevel.INFO);
        setToWarnAction.addCallback(this.#logLevelDataField, (log) => log.level = LogLevel.WARN);
        setToErrorAction.addCallback(this.#logLevelDataField, (log) => log.level = LogLevel.ERROR);
        setToDebugAction.addCallback(this.#logLevelDataField, (log) => log.level = LogLevel.DEBUG);

        logLevelUIField.addFormAction(turnOffAction);
        logLevelUIField.addFormAction(setToInfoAction);
        logLevelUIField.addFormAction(setToWarnAction);
        logLevelUIField.addFormAction(setToErrorAction);
        logLevelUIField.addFormAction(setToDebugAction);

        // Delete Field
        const deleteUIField = new UIDeleteRowField(() => tr("loggerUI_deleteFieldLabel"), 15);

        return [
            serviceNameUIField,
            logLevelUIField,
            deleteUIField
        ];
    }
}


await main();
Script.complete();

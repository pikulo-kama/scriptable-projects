// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;

const { tr } = importModule("Localization");
const { FileUtil } = importModule("File Util");
const { modal, showWarning } = importModule("Modal");
const {
    BoolDataField,
    TextDataField,
    UIForm,
    UIFormAction,
    UIDeleteRowField,
    UIFormField,
    UIDataTable
} = importModule("CRUD Module");

/**
 * ENTRY POINT
 */
async function main() {
    
    const selectedScript = await ScriptSelector.selectScript();

    if (selectedScript) {

        const tableBuilder = new DebugConfigTable(selectedScript);
        const table = await tableBuilder.build();
        await table.present();
    }
}


class FeatureType {

    static Bool = "boolean";
    static Text = "string";
    static Number = "number";
}


class ScriptSelector {

    static async selectScript() {

        const debugDirectories = FileUtil.findFeatureDirectories()
            .sort();
        const actions = [];

        for (let directoryName of debugDirectories) {

            if (!FileUtil.featureFileExists(directoryName)) {
                console.warn(`Script ${directoryName} doesn't have debug configuration.`);
                continue;
            }

            actions.push(directoryName);
        }

        if (actions.length == 0) {
            await showWarning(tr("featureUI_noScriptsWithFeatureFileWarning"));
            return;
        }

        const result = await modal()
            .title(tr("featureUI_scriptSelectionModalTitle"))
            .actions(actions)
            .present();

        if (result.isCancelled()) {
            return;
        }

        return result.choice();
    }
}

class DebugConfigTable {

    static #FEATURE_NAME_FIELD = "featureName";
    static #FEATURE_STATE_FIELD = "__enabled";
    static #FEATUTE_TYPE_FIELD = "__type";
    static #FEATURE_VALUE_FIELD = "value";

    #selectedScript;

    #featureNameDataField = new TextDataField(DebugConfigTable.#FEATURE_NAME_FIELD, "feature");
    #featureStateDataField = new BoolDataField(DebugConfigTable.#FEATURE_STATE_FIELD, false);
    #featureTypeDataField = new TextDataField(DebugConfigTable.#FEATUTE_TYPE_FIELD, FeatureType.Number);
    #featureValueDataField = new TextDataField(DebugConfigTable.#FEATURE_VALUE_FIELD, "123");

    constructor(selectedScript) {
        this.#selectedScript = selectedScript;
    }

    async build() {

        const dataFields = [
            this.#featureNameDataField,
            this.#featureStateDataField,
            this.#featureTypeDataField,
            this.#featureValueDataField
        ];

        const table = new UIDataTable();
        table.title = tr("featureUI_tableTitle", this.#selectedScript);
        table.rowHeight = 55;

        table.allowCreation();
        table.showSeparators();

        table.setTableData(this.#retrieveDebugConfiguration());
        table.onDataModification(this.#getOnLocaleModificationCallback());
        table.onFieldChange(this.#onFieldChange);

        table.setDataFields(dataFields);
        table.setUIFields(this.#getUIFields());

        return table;
    }

    #onFieldChange(feature, field, newType) {

        const isFeatureTypeField = field.getName() === DebugConfigTable.#FEATUTE_TYPE_FIELD;

        if (isFeatureTypeField && newType === FeatureType.Bool) {
            feature[DebugConfigTable.#FEATURE_VALUE_FIELD] = undefined;
        }
    }

    #getUIFields() {

        // Feature Enabled Field
        const featureEnabledUIField = new UIForm(this.#getFeatureStateFieldLabel, 20);
        featureEnabledUIField.setFormTitleFunction(() => tr("featureUI_swapStateConfirmMessage"));
        const swapStateAction = new UIFormAction(tr("featureUI_swapStateActionName"));
        swapStateAction.addCallback(this.#featureStateDataField, (feature) => 
            !feature[DebugConfigTable.#FEATURE_STATE_FIELD]
        );

        featureEnabledUIField.addFormAction(swapStateAction);

        // Feature Type Field
        const featureTypeUIField = new UIForm(this.#getFeatureTypeFieldLabel, 20);
        featureTypeUIField.setFormTitleFunction(() => tr("featureUI_featureTypeChangeTypeFormMessage"));

        const changeToTextAction = new UIFormAction(tr("featureUI_changeTypeToTextAction"));
        const changeToBoolAction = new UIFormAction(tr("featureUI_changeTypeToBoolAction"));
        const changeToNumberAction = new UIFormAction(tr("featureUI_changeTypeToNumberAction"));

        changeToTextAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[DebugConfigTable.#FEATUTE_TYPE_FIELD] = FeatureType.Text
        );

        changeToBoolAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[DebugConfigTable.#FEATUTE_TYPE_FIELD] = FeatureType.Bool
        );

        changeToNumberAction.addCallback(this.#featureTypeDataField, (feature) => 
            feature[DebugConfigTable.#FEATUTE_TYPE_FIELD] = FeatureType.Number
        );

        featureTypeUIField.addFormAction(changeToTextAction);
        featureTypeUIField.addFormAction(changeToBoolAction);
        featureTypeUIField.addFormAction(changeToNumberAction);

        // Feature Name Field
        const featureNameUIField = new UIForm((feature) => feature.featureName, 70);
        featureNameUIField.setFormTitleFunction(() => tr("featureUI_changeFeatureNameModalTitle"));
        const featureNameFormField = new UIFormField(this.#featureNameDataField, tr("featureUI_featureNameFormFieldPlaceholder"));

        featureNameUIField.addDefaultAction(tr("featureUI_featureNameValueUpdateAction"));
        featureNameUIField.addFormField(featureNameFormField);

        // Feature Value Field
        const featureValueUIField = new UIForm(this.#getFeatureValueFieldLabel, 70);
        featureValueUIField.setFormTitleFunction(() => tr("featureUI_changeFeatureValueModalTitle"));
        featureValueUIField.centerAligned();
        const featureValueFormField = new UIFormField(this.#featureValueDataField, tr("featureUI_featureValueFormFieldPlaceholder"));

        featureValueUIField.addDefaultAction(tr("featureUI_featureNameValueUpdateAction"));
        featureValueUIField.addFormField(featureValueFormField);

        // Delete field
        const deleteUIField = new UIDeleteRowField(() => tr("featureUI_removeFeatureFieldLabel"), 15);
        deleteUIField.setMessage(tr("featureUI_removeFeatureConfirmationMessage"));

        return [
            featureEnabledUIField,
            featureTypeUIField,
            featureNameUIField,
            featureValueUIField,
            deleteUIField
        ];
    }

    #getFeatureValueFieldLabel(feature) {

        const isBool = feature[DebugConfigTable.#FEATUTE_TYPE_FIELD] === FeatureType.Bool;

        if (isBool) {
            return tr("featureUI_boolFieldValuePlaceholder");
        }

        return feature[DebugConfigTable.#FEATURE_VALUE_FIELD];
    }

    #getFeatureStateFieldLabel(feature) {
        return feature[DebugConfigTable.#FEATURE_STATE_FIELD] ?
            tr("featureUI_featureStateOnLabel") : 
            tr("featureUI_featureStateOffLabel");
    }

    #getFeatureTypeFieldLabel(feature) {

        switch (feature[DebugConfigTable.#FEATUTE_TYPE_FIELD]) {

            case FeatureType.Text:
                return tr("featureUI_featureTypeTextLabel");

            case FeatureType.Bool:
                return tr("featureUI_featureTypeBoolLabel");

            case FeatureType.Number:
                return tr("featureUI_featureTypeNumberLabel")
        }
    }

    #retrieveDebugConfiguration() {

        const formattedData = [];
        const debugConfiguration = FileUtil.readFeatureFile(this.#selectedScript);
        let id = 1;

        for (let featureName of Object.keys(debugConfiguration)) {

            let feature = debugConfiguration[featureName];

            let featureValue = feature[DebugConfigTable.#FEATURE_VALUE_FIELD];
            let featureState = feature[DebugConfigTable.#FEATURE_STATE_FIELD];
            let featureType = feature[DebugConfigTable.#FEATUTE_TYPE_FIELD];

            formattedData.push({
                id: id++,
                [DebugConfigTable.#FEATURE_NAME_FIELD]: featureName,
                [DebugConfigTable.#FEATURE_VALUE_FIELD]: String(featureValue),
                [DebugConfigTable.#FEATURE_STATE_FIELD]: featureState,
                [DebugConfigTable.#FEATUTE_TYPE_FIELD]: featureType
            });
        }

        return formattedData;
    }

    #getOnLocaleModificationCallback() {

        const that = this;

        return (featuresList) => {

            const featuresObject = {};

            for (let feature of featuresList) {
                
                let featureName = feature[DebugConfigTable.#FEATURE_NAME_FIELD];
                let featureValue = feature[DebugConfigTable.#FEATURE_VALUE_FIELD];
                let isEnabled = feature[DebugConfigTable.#FEATURE_STATE_FIELD];
                let featureType = feature[DebugConfigTable.#FEATUTE_TYPE_FIELD];

                featuresObject[featureName] = {
                    [DebugConfigTable.#FEATURE_VALUE_FIELD]: featureValue,
                    [DebugConfigTable.#FEATURE_STATE_FIELD]: isEnabled,
                    [DebugConfigTable.#FEATUTE_TYPE_FIELD]: featureType
                };
            }

            FileUtil.updateFeatureFile(that.#selectedScript, featuresObject);
        };
    }
}


await main();
Script.complete();
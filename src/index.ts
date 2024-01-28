import { Hass, Scopped } from '@types';
import { createScoppedFunctions } from '@utilities';

export default class HomeAssistantJavaScriptTemplates {

    constructor(hass: Hass, throwErrors = false) {
        this._scopped = createScoppedFunctions(hass);
        this._errors = throwErrors;
    }

    private _scopped: Scopped;
    private _errors: boolean;

    public renderTemplate(template: string): string {

        const functionBody = template.includes('return')
            ? template
            : `return ${template}`;

        const templateFunction = new Function(
            'hass',
            'states',
            'is_state',
            'state_attr',
            'is_state_attr',
            'has_value',
            'device_attr',
            'is_device_attr',
            'device_id',
            'areas',
            'area_id',
            'area_name',
            'area_entities',
            'area_devices',
            functionBody
        );

        try {

            return templateFunction(
                this._scopped.hass,
                this._scopped.states,
                this._scopped.is_state.bind(this._scopped),
                this._scopped.state_attr.bind(this._scopped),
                this._scopped.is_state_attr.bind(this._scopped),
                this._scopped.has_value.bind(this._scopped),
                this._scopped.device_attr.bind(this._scopped),
                this._scopped.is_device_attr.bind(this._scopped),
                this._scopped.device_id.bind(this._scopped),
                this._scopped.areas.bind(this._scopped),
                this._scopped.area_id.bind(this._scopped),
                this._scopped.area_name.bind(this._scopped),
                this._scopped.area_entities.bind(this._scopped),
                this._scopped.area_devices.bind(this._scopped)
            );

        } catch (error) {
            if (this._errors) {
                throw error;
            } else {
                console.warn(error);
                return undefined;
            }
        }

    }
}

export { Hass };
import {
    HomeAssistant,
    Hass,
    Scopped,
    Tracked
} from '@types';
import { STRICT_MODE } from '@constants';
import { createScoppedFunctions } from '@utilities';

export default class HomeAssistantJavaScriptTemplates {

    constructor(ha: HomeAssistant, throwErrors = false) {
        this._scopped = createScoppedFunctions(ha);
        this._errors = throwErrors;
    }

    private _scopped: Scopped;
    private _errors: boolean;

    public renderTemplate(template: string): any {

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
            'user_name',
            'user_is_admin',
            'user_is_owner',
            `${STRICT_MODE} ${functionBody}`
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
                this._scopped.area_devices.bind(this._scopped),
                this._scopped.user_name,
                this._scopped.user_is_admin,
                this._scopped.user_is_owner
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

    public get tracked(): Tracked {
        return this._scopped.tracked;
    }

    public cleanTrackedEntities(): void {
        this._scopped.cleanTrackedEntities();
    }

    public cleanTrackedDomains(): void {
        this._scopped.cleanTrackedDomains();
    }

    public cleanTracked(): void {
        this._scopped.cleanTrackedEntities();
        this._scopped.cleanTrackedDomains();
    }

}

export { HomeAssistant, Hass };
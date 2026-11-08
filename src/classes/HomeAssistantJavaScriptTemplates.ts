import { getPromisableResult } from 'get-promisable-result';
import {
    HomeAssistant,
    Hass,
    Options
} from '@types';
import { HomeAssistantJavaScriptTemplatesRenderer } from './HomeAssistantJavaScriptTemplatesRenderer';

export class HomeAssistantJavaScriptTemplates {
    constructor(
        ha: HomeAssistant,
        options: Options = {}
    ) {
        this._renderer = getPromisableResult(
            () => ha.hass,
            (hass: Hass): boolean => !!(
                hass &&
                hass.areas &&
                hass.devices &&
                hass.entities &&
                hass.states &&
                hass.user
            ),
            {
                retries: 100,
                delay: 50,
                rejectMessage: 'The provided element doesn\'t contain a proper or initialised hass object'
            }
        )
            .then(() => new HomeAssistantJavaScriptTemplatesRenderer(ha, options))
    }

    private _renderer: Promise<HomeAssistantJavaScriptTemplatesRenderer>;

    getRenderer(): Promise<HomeAssistantJavaScriptTemplatesRenderer> {
        return this._renderer;
    }
}

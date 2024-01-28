import HomeAssistantJavaScriptTemplates from '../src';
import { HomeAssistant } from '../src/types';
import { HASS } from './constants';

describe('Function tests', () => {

    let compiler: HomeAssistantJavaScriptTemplates;
    
    beforeEach(() => {
        compiler = new HomeAssistantJavaScriptTemplates({ hass: HASS } as HomeAssistant);
    });

    const methods = [
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
        'area_devices'
    ];

    methods.forEach((method: string): void => {
        it(method, () => {
            expect(
                compiler.renderTemplate(method)
            ).toBeInstanceOf(Function);    
        });
    });

});
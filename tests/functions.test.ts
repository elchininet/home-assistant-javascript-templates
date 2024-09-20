import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('Function tests', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
    });

    const methods = [
        'states',
        'is_state',
        'state_attr',
        'is_state_attr',
        'has_value',
        'entities',
        'entity_prop',
        'is_entity_prop',
        'devices',
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
        it(`${method} should be a function`, () => {
            expect(
                compiler.renderTemplate(method)
            ).toBeInstanceOf(Function);    
        });
    });

});
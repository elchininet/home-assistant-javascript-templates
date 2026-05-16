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
        'state_translated',
        'is_state',
        'state_attr',
        'state_attr_translated',
        'is_state_attr',
        'has_value',
        'entities',
        'entity_prop',
        'is_entity_prop',
        'devices',
        'device_attr',
        'is_device_attr',
        'device_id',
        'device_name',
        'areas',
        'area_id',
        'area_name',
        'area_entities',
        'area_devices'
    ];

    const propertiesMap = new Map([
        ['user_name', 'string'],
        ['user_is_admin', 'boolean'],
        ['user_is_owner', 'boolean'],
        ['user_agent', 'string']
    ]);

    methods.forEach((method: string): void => {
        it(`${method} should be a function`, () => {
            expect(
                compiler.renderTemplate(method)
            ).toBeInstanceOf(Function);    
        });
    });

    propertiesMap.forEach((type, property) => {
        it(`${property} should be of type ${type}`, () => {
            expect(
                compiler.renderTemplate(`typeof ${property}`)
            ).toBe(type);    
        });
    });

});
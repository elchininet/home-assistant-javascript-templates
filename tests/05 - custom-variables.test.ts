import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('Custom variables', () => {

    let renderer: HomeAssistantJavaScriptTemplatesRenderer;

    const variables = {
        MY_STRING: 'CUSTOM_VALUE',
        MY_NUMBER: 100,
        MY_REGEXP: /^(\w+)-([A-Za-z]+)$/,
        MY_OBJECT: {
            prop: 'custom_prop'
        },
        MY_FUNCTION: (value: unknown) => typeof value === 'number'
            ? value * 2
            : `${value}_DOUBLE`,
    };
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn(
                    () => Promise.resolve(
                        jest.fn()
                    )
                )
            }
        });        
        renderer = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, { variables }).getRenderer();
        renderer.init();
        await new Promise(process.nextTick);
    });

    it('strig variable should be retrieved correctly', () => {
        const renderingFunction = jest.fn();
        expect(
            renderer.renderTemplate('return MY_STRING + "_modified"')
        ).toBe(
            `${variables.MY_STRING}_modified`
        );
        renderer.trackTemplate(
            `
                if (is_state("light.woonkamer_lamp", "off")) {
                    return MY_STRING + "_modified";
                }
                return 'NONE';
            `,
            renderingFunction
        );
        expect(renderingFunction).toHaveBeenCalledWith(
            `${variables.MY_STRING}_modified`
        );
    });

    it('number variable should be retrieved cocrrectly', () => {
        const renderingFunction = jest.fn();
        expect(
            renderer.renderTemplate('return MY_NUMBER / 2')
        ).toBe(50);
        renderer.trackTemplate(
            `
                if (is_state("light.woonkamer_lamp", "off")) {
                    return MY_NUMBER / 2;
                }
                return 0;
            `,
            renderingFunction
        );
        expect(renderingFunction).toHaveBeenCalledWith(50);
    });

    it('regular expression variable should be retrieved cocrrectly', () => {
        expect(
            renderer.renderTemplate('MY_REGEXP.test("word_100")')
        ).toBe(false);
        expect(
            renderer.renderTemplate('return MY_REGEXP.test("correct-word")')
        ).toBe(true);
        expect(
            renderer.renderTemplate(`
                const str = "100-words";
                const replaced = str.replace(MY_REGEXP, "$2-$1");
                return replaced;
            `)
        ).toBe('words-100');
    });

    it('object variable should be retrieved cocrrectly', () => {
        expect(
            renderer.renderTemplate(`
                if ('prop' in MY_OBJECT) {
                    return MY_OBJECT.prop;
                }
                return 'prop not found';
            `)
        ).toBe('custom_prop');
    });

    it('function variable should be retrieved cocrrectly', () => {
        expect(
            renderer.renderTemplate('MY_FUNCTION(5)')
        ).toBe(10);
        expect(
            renderer.renderTemplate('MY_FUNCTION("STRING")')
        ).toBe('STRING_DOUBLE');
    });

    it('retrieving the variables properties should return the same object sent in the HomeAssistantJavaScriptTemplates instance', () => {
        expect(renderer.variables).toEqual(variables);
    });

    it('setting variables should override the global variables', () => {
        const overrideVariables = {
            ONLY_ONE: 'OVERRIDE'
        };
        renderer.variables = overrideVariables;
        expect(renderer.variables).not.toMatchObject(variables);
        expect(renderer.variables).toEqual(overrideVariables);
        expect(renderer.renderTemplate('ONLY_ONE')).toBe('OVERRIDE');
    });

    it('variables sent in the methods should be available in the templates', () => {

        const renderingFunction = jest.fn();

        const extraVariables = {
            EXTRA_VAR: 'CUSTOM_EXTRA_VALUE'
        };
        const result = renderer.renderTemplate(
            'return MY_STRING + "/" + EXTRA_VAR',
            {
                variables: extraVariables
            }
        );
        expect(result).toBe('CUSTOM_VALUE/CUSTOM_EXTRA_VALUE');

        renderer.trackTemplate(
            `
                if (is_state("light.woonkamer_lamp", "off")) {
                    return MY_STRING + "_modified_" + EXTRA_VAR;
                }
                return 'NONE';
            `,
            renderingFunction,
            {
                variables: extraVariables
            }
        );
        expect(renderingFunction).toHaveBeenCalledWith(
            `${variables.MY_STRING}_modified_${extraVariables.EXTRA_VAR}`
        );
    });

});
import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('ref and unref without errors', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnMock.mockRestore();
    });

    describe('renderTemplate with refs', () => {

        it('ref value should be undefined by default', () => {
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return myRef.value;
                `)
            ).toBeUndefined();
        });

        it('if a value is assigned to a ref it should return that value', () => {
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.value = 'Assigned';
                    return myRef.value;
                `)
            ).toBe('Assigned');
        });

        it('two refs with the same name should make reference to the same object', () => {
            expect(
                compiler.renderTemplate(`
                    const one = ref('custom');
                    const two = ref('custom');
                    return one === two;
                `)
            ).toBe(true);
        });

        it('a ref created in a template should be accesed from another template', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.value = 'changed';
                return true;
            `);
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return myRef.value;
                `)
            ).toBe('changed');
        });

        it('a ref should support objects', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.value = { prop: 'refProp' };
                return true;
            `);
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.value.prop = 'changed';
                    return myRef.value;
                `)
            ).toEqual({ prop: 'changed' });
        });

        it('a ref should support arrays', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.value = [1, 2, 3];
                return true;
            `);
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.value.push(4);
                    return myRef.value;
                `)
            ).toEqual([1, 2, 3, 4]);
        });

        it('refs should not allow to access other properties but value', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                return myRef.customProp;
            `);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError('customProp is not a valid ref property. A ref only exposes a "value" property'));
        });

        it('refs should not allow to assign other properties but value', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.customProp = 'changed';
                return true;
            `);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError('property "customProp" cannot be set in a ref'));
        });

        it('refs without a value should be serialized as undefined', () => {
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return JSON.stringify(myRef);
                `)
            ).toBeUndefined();
        });

        it('refs with a value should be serialized correctly', () => {
            const customValue = JSON.stringify({
                propObject: {a: 'A'},
                propArray: [1, 2, 3],
                propBoolean: true,
                propNumber: 100
            });
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.value = ${customValue};
                    return JSON.stringify(myRef);
                `)
            ).toBe(customValue);
        });

    });

    describe('renderTemplate with unrefs', () => {

        it('unref should remove the ref', () => {
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.value = 'changed';
                    unref('custom');
                    return ref('custom').value;
                `)
            ).toBeUndefined();
        });

        it('unref in one template should remove the ref also in other templates', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.value = 'changed';
                unref('custom');
                return true;
            `);
            expect(
                compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return myRef.value;
                `)
            ).toBeUndefined();
        });

        it('after unref, two refs with the same name do not reference the same object', () => {
            expect(
                compiler.renderTemplate(`
                    const one = ref('custom');
                    unref('custom');
                    const two = ref('custom');
                    return one === two;
                `)
            ).toBe(false);
        });

        it('trying to unref a non defined ref should not be allowed', () => {
            compiler.renderTemplate(`
                unref('custom');
                return true;
            `);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError('custom is not a ref or it has been unrefed already'));
        });

    });

    describe('trackTemplate with refs', () => {

        it('changing the value of a ref in a template should rerender all templates using it', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();

            compiler.trackTemplate(
                `
                    const one = ref('one');
                    if (one.value) {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );

            compiler.trackTemplate(
                `
                    const two = ref('two');
                    return two.value;
                `,
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, undefined);
            expect(renderingFunction3).not.toHaveBeenCalled();

            compiler.trackTemplate(
                `
                    const one = ref('one');
                    const two = ref('two');
                    one.value = 'one';
                    two.value = 'two';
                    return one.value + '/' + two.value;
                `,
                renderingFunction3
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'two');
            expect(renderingFunction3).toHaveBeenNthCalledWith(1, 'one/two');

        });

    });

    describe('trackTemplate with unrefs', () => {

        it('after unref a ref, templates that were using it should not trigger anymore', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();

            compiler.trackTemplate(
                `
                    const myRef = ref('custom');
                    if (myRef.value) {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'no');
            expect(renderingFunction2).not.toHaveBeenCalled();
            expect(renderingFunction3).not.toHaveBeenCalled();

            compiler.trackTemplate(
                `
                    const myRef = ref('custom');
                    myRef.value = 'changed';
                    return myRef.value;
                `,
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'changed');
            expect(renderingFunction3).not.toHaveBeenCalled();

            compiler.trackTemplate(
                `
                    unref('custom');
                    const myRef = ref('custom');
                    myRef.value = 're-changed';
                    return myRef.value;
                `,
                renderingFunction3
            );

            expect(renderingFunction1).not.toHaveBeenCalledTimes(3);
            expect(renderingFunction2).not.toHaveBeenCalledTimes(2);
            expect(renderingFunction3).toHaveBeenNthCalledWith(1, 're-changed');

        });

    });

});

describe('ref and unref with errors', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(
            HOME_ASSISTANT_ELEMENT,
            {
                throwErrors: true
            }
        ).getRenderer();
    });

    describe('renderTemplate with refs', () => {

        it('refs should not allow to access other properties but value', () => {
            expect(
                () => compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return myRef.customProp;
                `)
            ).toThrow('customProp is not a valid ref property. A ref only exposes a "value" property');
        });

        it('refs should not allow to assign other properties but value', () => {
            expect(
                () => compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.customProp = 'changed';
                    return true;
                `)
            ).toThrow('property "customProp" cannot be set in a ref');
        });

        it('refs should be serializable without errors', () => {
            expect(
                () => compiler.renderTemplate(`
                    const myRef = ref('custom');
                    return JSON.stringify(myRef);
                `)
            ).not.toThrow();
        });

    });

    describe('renderTemplate with unrefs', () => {

        it('trying to unref a non defined ref should not be allowed', () => {

            expect(
                () => compiler.renderTemplate(`
                    unref('custom');
                    return true;
                `)
            ).toThrow('custom is not a ref or it has been unrefed already');

        });

    });

});

describe('ref and unref without errors and with warnings disabled', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(
            HOME_ASSISTANT_ELEMENT,
            {
                throwWarnings: false
            }
        ).getRenderer();
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        consoleWarnMock.mockRestore();
    });

    describe('renderTemplate with refs', () => {

        it('refs should not allow to access other properties but value', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                return myRef.customProp;
            `);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

        it('refs should not allow to assign other properties but value', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.customProp = 'changed';
                return true;
            `);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

        it('refs should be serializable without errors', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                return JSON.stringify(myRef);
            `);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

    });

    describe('renderTemplate with unrefs', () => {

        it('trying to unref a non defined ref should not be allowed', () => {

            compiler.renderTemplate(`
                unref('custom');
                return true;
            `);
            expect(consoleWarnMock).not.toHaveBeenCalled();

        });

    });

});

describe('ref variables', () => {

    const refs = {
        MY_STRING: 'CUSTOM_VALUE',
        MY_NUMBER: 100,
        MY_REGEXP: /^(\w+)-([A-Za-z]+)$/,
        MY_OBJECT: {
            prop: 'custom_prop'
        },
        MY_ARRAY: [0, 1, 2, 3],
        MY_FUNCTION: (value: unknown) => typeof value === 'number'
            ? value * 2
            : `${value}_DOUBLE`,
    };

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(
            HOME_ASSISTANT_ELEMENT,
            {
                refs,
                throwWarnings: false
            }
        ).getRenderer();
    });


    describe('renderTemplate with refs variables', () => {

        it('refs should be defined', () => {
            expect(
                compiler.renderTemplate('refs')
            ).toBeDefined()
        });

        it('refs property should return an object with the initial ref values', () => {
            Object.entries(refs).forEach((entry: [string, unknown]): void => {
                const [property, value] = entry;
                expect(compiler.refs[property]).toEqual(value);
            });
        });

        it('refs property should override the refs object', () => {
            Object.keys(refs).forEach((name: string): void => {
                expect(
                    compiler.renderTemplate(`refs.${name}`)
                ).toBeDefined();
            });
            compiler.refs = {
                OVERRIDE: 'OVERRIDE'
            };
            Object.keys(refs).forEach((name: string): void => {
                expect(
                    compiler.renderTemplate(`refs.${name}`)
                ).toBeUndefined();
            });
            expect(
                compiler.renderTemplate('refs.OVERRIDE')
            ).toBe('OVERRIDE');
        });

        describe.each([
            ['refs.MY_STRING', 'CUSTOM_VALUE'],
            ['refs.MY_NUMBER', 100],
            ['refs.MY_REGEXP.toString()', '/^(\\w+)-([A-Za-z]+)$/'],
            ['refs.MY_OBJECT.prop', 'custom_prop'],
            ['refs.MY_ARRAY[2]', 2],
            ['refs.MY_FUNCTION(2)', 4],
            ['refs.MY_FUNCTION("2")', '2_DOUBLE']
        ])('template %s should return %s', (template: string, expected: unknown): void => {
            it('refs variables should have the proper value', () => {
                expect(
                    compiler.renderTemplate(template)
                ).toBe(expected);
            });
        });

        describe.each([
            {
                variable: 'MY_STRING',
                templateAssign: 'refs.MY_STRING = "CUSTOM_VALUE_ASSIGNED"',
                templateReturn: 'refs.MY_STRING',
                expected: 'CUSTOM_VALUE_ASSIGNED'
            },
            {
                variable: 'MY_NUMBER',
                templateAssign: 'refs.MY_NUMBER = 200',
                templateReturn: 'refs.MY_NUMBER',
                expected: 200
            },
            {
                variable: 'MY_REGEXP',
                templateAssign: 'refs.MY_REGEXP = /^\\d{2}-\\d{2}-\\d{4}/',
                templateReturn: 'refs.MY_REGEXP.test("01-05-2024")',
                expected: true
            },
            {
                variable: 'MY_OBJECT',
                templateAssign: 'refs.MY_OBJECT.prop = "custom_prop_assigned"',
                templateReturn: 'refs.MY_OBJECT.prop',
                expected: 'custom_prop_assigned'
            },
            {
                variable: 'MY_ARRAY',
                templateAssign: 'refs.MY_ARRAY[2] = 100',
                templateReturn: 'refs.MY_ARRAY[2]',
                expected: 100
            },
            {
                variable: 'MY_FUNCTION',
                templateAssign: `
                    refs.MY_FUNCTION = (value) => {
                        if (typeof value === 'number') {
                            return value / 2;
                        }
                        return value + "_HALF";
                    };
                `,
                templateReturn: 'refs.MY_FUNCTION(2)',
                expected: 1
            },
            {
                variable: 'MY_FUNCTION',
                templateAssign: `
                    refs.MY_FUNCTION = (value) => {
                        if (typeof value === 'number') {
                            return value / 2;
                        }
                        return value + "_HALF"
                    };
                `,
                templateReturn: 'refs.MY_FUNCTION("2")',
                expected: '2_HALF'
            }
        ])('Assign value to the ref variable $variable and retrieve it from another template', ({ templateAssign, templateReturn, expected }) => {
            it(`should return ${expected}`, () => {
                compiler.renderTemplate(templateAssign);
                expect(
                    compiler.renderTemplate(templateReturn)
                ).toBe(expected);
            });
        });

        it('changing a ref variable through the class property should be reflected in the templates', () => {
            compiler.refs.MY_STRING = 'CUSTOM_VALUE_ASSIGNED';
            compiler.refs.MY_NUMBER = 200;
            compiler.refs.MY_REGEXP = /^\d{2}-\d{2}-\d{4}/;
            compiler.refs.MY_OBJECT.prop = 'custom_prop_assigned';
            compiler.refs.MY_ARRAY[2] = 100;
            compiler.refs.MY_FUNCTION = (value: unknown) => {
                if (typeof value === 'number') {
                    return value / 2;
                }
                return value + '_HALF';
            };

            expect(
                compiler.renderTemplate('refs.MY_STRING')
            ).toBe('CUSTOM_VALUE_ASSIGNED');

            expect(
                compiler.renderTemplate('refs.MY_NUMBER')
            ).toBe(200);

            expect(
                compiler.renderTemplate('refs.MY_REGEXP.test("01-05-2024")')
            ).toBe(true);

            expect(
                compiler.renderTemplate('refs.MY_OBJECT.prop')
            ).toBe('custom_prop_assigned');

            expect(
                compiler.renderTemplate('refs.MY_ARRAY[2]')
            ).toBe(100);

            expect(
                compiler.renderTemplate('refs.MY_FUNCTION(2)')
            ).toBe(1);

            expect(
                compiler.renderTemplate('refs.MY_FUNCTION("2")')
            ).toBe('2_HALF');
        });

    });

    describe('renderTemplate with extra refs variables', () => {

        it('extra refs variables should be available in the templates', () => {
            expect(
                compiler.renderTemplate('return `${refs.MY_STRING}_${refs.EXTRA_REF_VARIABLE}`',
                    {
                        refs: {
                            EXTRA_REF_VARIABLE: 'EXTRA'
                        }
                    }
                )
            ).toBe('CUSTOM_VALUE_EXTRA');
        });

        it('extra refs variables set in one template should be available in another template', () => {
            expect(
                compiler.renderTemplate('refs.MY_STRING',
                    {
                        refs: {
                            EXTRA_REF_VARIABLE: 'EXTRA'
                        }
                    }
                )
            ).toBe('CUSTOM_VALUE');
            expect(
                compiler.renderTemplate('refs.EXTRA_REF_VARIABLE')
            ).toBe('EXTRA');
        });

        it('extra refs variables with the same name of a previous variable should override it', () => {
            expect(
                compiler.renderTemplate('refs.MY_STRING',
                    {
                        refs: {
                            MY_NUMBER: 200
                        }
                    }
                )
            ).toBe('CUSTOM_VALUE');
            expect(
                compiler.renderTemplate('refs.MY_NUMBER')
            ).toBe(200);
        });

    });

    describe('trackTemplate with refs variables', () => {

        it('changing the value of a ref variable in a template should rerender all templates using it', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();

            compiler.trackTemplate(
                `
                    if (refs.MY_STRING === 'CUSTOM_VALUE') {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );

            compiler.trackTemplate(
                'return refs.MY_NUMBER * 2',
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 200);
            expect(renderingFunction3).not.toHaveBeenCalled();

            compiler.trackTemplate(
                `
                    refs.MY_STRING = 'CUSTOM_VALUE_CHANGED';
                    refs.MY_NUMBER = 200;
                    return refs.MY_STRING + '/' + refs.MY_NUMBER;
                `,
                renderingFunction3
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 400);
            expect(renderingFunction3).toHaveBeenNthCalledWith(1, 'CUSTOM_VALUE_CHANGED/200');

        });

        it('changing the value of a ref variable through the class property should rerender all templates using it', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();

            compiler.trackTemplate(
                `
                    if (refs.MY_STRING === 'CUSTOM_VALUE') {
                        return 'yes';
                    }
                    return 'no';
                `,
                renderingFunction1
            );

            compiler.trackTemplate(
                'return refs.MY_NUMBER * 2',
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, 'yes');
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 200);

            compiler.refs.MY_STRING = 'CUSTOM_VALUE_CHANGED';
            compiler.refs.MY_NUMBER = 200;

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'no');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 400);

        });

    });

    describe('trackTemplate with extra refs variables', () => {

        it('changing the value of an extra ref variable in a template should rerender all templates that were using it', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();
            const renderingFunction3 = jest.fn();

            compiler.trackTemplate(
                'refs.EXTRA_REF_VARIABLE',
                renderingFunction1
            );

            compiler.trackTemplate(
                'return refs.EXTRA_REF_VARIABLE + "_APPEND"',
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, undefined);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'undefined_APPEND');
            expect(renderingFunction3).not.toHaveBeenCalled();

            compiler.trackTemplate(
                `
                    refs.EXTRA_REF_VARIABLE = 'EXTRA';
                    return refs.EXTRA_REF_VARIABLE;
                `,
                renderingFunction3
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'EXTRA');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'EXTRA_APPEND');
            expect(renderingFunction3).toHaveBeenNthCalledWith(1, 'EXTRA');

        });

        it('changing the value of an extra ref variable through the class property should rerender all templates that were using it', () => {

            const renderingFunction1 = jest.fn();
            const renderingFunction2 = jest.fn();

            compiler.trackTemplate(
                'refs.EXTRA_REF_VARIABLE',
                renderingFunction1
            );

            compiler.trackTemplate(
                'return refs.EXTRA_REF_VARIABLE + "_APPEND"',
                renderingFunction2
            );

            expect(renderingFunction1).toHaveBeenNthCalledWith(1, undefined);
            expect(renderingFunction2).toHaveBeenNthCalledWith(1, 'undefined_APPEND');

            compiler.refs.EXTRA_REF_VARIABLE = 'EXTRA';

            expect(renderingFunction1).toHaveBeenNthCalledWith(2, 'EXTRA');
            expect(renderingFunction2).toHaveBeenNthCalledWith(2, 'EXTRA_APPEND');

        });

    });

});

describe('ref variables with custom name', () => {

    const refs = {
        MY_STRING: 'CUSTOM_VALUE',
        MY_NUMBER: 100,
        MY_REGEXP: /^(\w+)-([A-Za-z]+)$/,
        MY_OBJECT: {
            prop: 'custom_prop'
        },
        MY_ARRAY: [0, 1, 2, 3],
        MY_FUNCTION: (value: unknown) => typeof value === 'number'
            ? value * 2
            : `${value}_DOUBLE`,
    };

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        compiler = await new HomeAssistantJavaScriptTemplates(
            HOME_ASSISTANT_ELEMENT,
            {
                refs,
                refsVariableName: 'vars',
                throwWarnings: false
            }
        ).getRenderer();
    });


    describe('renderTemplate with refs variables', () => {

        it('refs should not be defined', () => {
            expect(
                compiler.renderTemplate('refs')
            ).toBeUndefined()
        });

        it('vars should be defined', () => {
            expect(
                compiler.renderTemplate('vars')
            ).toBeDefined()
        });

        describe.each([
            ['vars.MY_STRING', 'CUSTOM_VALUE'],
            ['vars.MY_NUMBER', 100],
            ['vars.MY_REGEXP.toString()', '/^(\\w+)-([A-Za-z]+)$/'],
            ['vars.MY_OBJECT.prop', 'custom_prop'],
            ['vars.MY_ARRAY[2]', 2],
            ['vars.MY_FUNCTION(2)', 4],
            ['vars.MY_FUNCTION("2")', '2_DOUBLE']
        ])('template %s should return %s', (template: string, expected: unknown): void => {
            it('ref variables should have the proper value', () => {
                expect(
                    compiler.renderTemplate(template)
                ).toBe(expected);
            });
        });

        describe.each([
            {
                variable: 'MY_STRING',
                templateAssign: 'vars.MY_STRING = "CUSTOM_VALUE_ASSIGNED"',
                templateReturn: 'vars.MY_STRING',
                expected: 'CUSTOM_VALUE_ASSIGNED'
            },
            {
                variable: 'MY_NUMBER',
                templateAssign: 'vars.MY_NUMBER = 200',
                templateReturn: 'vars.MY_NUMBER',
                expected: 200
            },
            {
                variable: 'MY_REGEXP',
                templateAssign: 'vars.MY_REGEXP = /^\\d{2}-\\d{2}-\\d{4}/',
                templateReturn: 'vars.MY_REGEXP.test("01-05-2024")',
                expected: true
            },
            {
                variable: 'MY_OBJECT',
                templateAssign: 'vars.MY_OBJECT.prop = "custom_prop_assigned"',
                templateReturn: 'vars.MY_OBJECT.prop',
                expected: 'custom_prop_assigned'
            },
            {
                variable: 'MY_ARRAY',
                templateAssign: 'vars.MY_ARRAY[2] = 100',
                templateReturn: 'vars.MY_ARRAY[2]',
                expected: 100
            },
            {
                variable: 'MY_FUNCTION',
                templateAssign: `
                    vars.MY_FUNCTION = (value) => {
                        if (typeof value === 'number') {
                            return value / 2;
                        }
                        return value + "_HALF"
                    };
                `,
                templateReturn: 'vars.MY_FUNCTION(2)',
                expected: 1
            },
            {
                variable: 'MY_FUNCTION',
                templateAssign: `
                    vars.MY_FUNCTION = (value) => {
                        if (typeof value === 'number') {
                            return value / 2;
                        }
                        return value + "_HALF"
                    };
                `,
                templateReturn: 'vars.MY_FUNCTION("2")',
                expected: '2_HALF'
            }
        ])('Assign value to the ref variable $variable and retrieve it from another template', ({ templateAssign, templateReturn, expected }) => {
            it(`should return ${expected}`, () => {
                compiler.renderTemplate(templateAssign);
                expect(
                    compiler.renderTemplate(templateReturn)
                ).toBe(expected);
            });
        });

        it('changing a ref variable through the class property should be reflected in the templates', () => {
            compiler.refs.MY_STRING = 'CUSTOM_VALUE_ASSIGNED';
            compiler.refs.MY_NUMBER = 200;
            compiler.refs.MY_REGEXP = /^\d{2}-\d{2}-\d{4}/;
            compiler.refs.MY_OBJECT.prop = 'custom_prop_assigned';
            compiler.refs.MY_ARRAY[2] = 100;
            compiler.refs.MY_FUNCTION = (value: unknown) => {
                if (typeof value === 'number') {
                    return value / 2;
                }
                return value + '_HALF';
            };

            expect(
                compiler.renderTemplate('vars.MY_STRING')
            ).toBe('CUSTOM_VALUE_ASSIGNED');

            expect(
                compiler.renderTemplate('vars.MY_NUMBER')
            ).toBe(200);

            expect(
                compiler.renderTemplate('vars.MY_REGEXP.test("01-05-2024")')
            ).toBe(true);

            expect(
                compiler.renderTemplate('vars.MY_OBJECT.prop')
            ).toBe('custom_prop_assigned');

            expect(
                compiler.renderTemplate('vars.MY_ARRAY[2]')
            ).toBe(100);

            expect(
                compiler.renderTemplate('vars.MY_FUNCTION(2)')
            ).toBe(1);

            expect(
                compiler.renderTemplate('vars.MY_FUNCTION("2")')
            ).toBe('2_HALF');
        });

    });

});
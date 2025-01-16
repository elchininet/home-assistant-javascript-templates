import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT, HASS } from './constants';

describe('ref and unref without errors', () => {

    let compiler: HomeAssistantJavaScriptTemplatesRenderer;
    let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
    
    beforeEach(async () => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
        compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
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
            ).toBe(undefined);
        });

        it('if a value is assigned to a refit should return that value', () => {
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
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError('customProp is not a valid ref property. A ref only exposes a value property'));
        });

        it('refs should not allow to assign other properties but value', () => {
            compiler.renderTemplate(`
                const myRef = ref('custom');
                myRef.customProp = 'changed';
                return true;
            `);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError('property customProp cannot be set in a ref'));
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
            ).toBe(undefined);
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
            ).toBe(undefined);
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
            ).toThrow('customProp is not a valid ref property. A ref only exposes a value property');
        });

        it('refs should not allow to assign other properties but value', () => {
            expect(
                () => compiler.renderTemplate(`
                    const myRef = ref('custom');
                    myRef.customProp = 'changed';
                    return true;
                `)
            ).toThrow('property customProp cannot be set in a ref');
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
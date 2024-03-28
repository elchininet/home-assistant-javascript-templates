import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';
import { NAMESPACE } from '../src/constants';

describe('Templates with errors', () => {

    const syntaxErrorCode = 'const a = ; return a';
    const typeErrorCode1 = 'states["binary_sensor.koffiezetapparaat_verbonden"].state.toFixed(16)';
    const typeErrorCode2 = 'states("battery")';
    const syntaxErrorMessage = 'Unexpected token \';\'';
    const typeErrorMessage1 = 'states.binary_sensor.koffiezetapparaat_verbonden.state.toFixed is not a function';
    const typeErrorMessage2 = `${NAMESPACE}: states method cannot be used with a domain, use it as an object instead.`;

    describe('Error as a console warning', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
        let compiler: HomeAssistantJavaScriptTemplates;

        beforeEach(() => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
            compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('SyntaxError during instantiation', () => {
            expect(
                compiler.renderTemplate(syntaxErrorCode)
            ).toBe(undefined);    
            expect(consoleWarnMock).toHaveBeenCalledWith(new TypeError(syntaxErrorMessage));    
        });

        it('TypeError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode1)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new TypeError(typeErrorMessage1));
        });

        it('SyntaxError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode2)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError(typeErrorMessage2));
        });

    });

    describe('Error as an error', () => {

        let compiler: HomeAssistantJavaScriptTemplates;

        beforeEach(() => {
            compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, true);
        });

        it('SyntaxError during instantiation', () => {
            expect(
                () => compiler.renderTemplate(syntaxErrorCode)
            ).toThrow(syntaxErrorMessage);
        });

        it('TypeError during the execution', () => {
            expect(
                () => compiler.renderTemplate(typeErrorCode1)
            ).toThrow(typeErrorMessage1);
        });

        it('SyntaxError during the execution', () => {
            expect(
                () => compiler.renderTemplate(typeErrorCode2)
            ).toThrow(typeErrorMessage2);
        });

    });

});
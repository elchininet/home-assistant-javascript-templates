import HomeAssistantJavaScriptTemplates, { HomeAssistantJavaScriptTemplatesRenderer } from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';
import { NAMESPACE } from '../src/constants';

describe('Templates with errors', () => {

    beforeEach(() => {
        window.hassConnection = Promise.resolve({
            conn: {
                subscribeMessage: jest.fn()
            }
        });
    });

    const syntaxErrorCode = 'const a = ; return a';
    const typeErrorCode1 = 'states["binary_sensor.koffiezetapparaat_verbonden"].state.toFixed(16)';
    const typeErrorCode2 = 'states("battery")';
    const typeErrorCode3 = 'devices("battery.my_battery")';
    const typeErrorCode4 = 'devices["battery.my_battery"]';
    const syntaxErrorMessage = 'Unexpected token \';\'';
    const typeErrorMessage1 = 'states.binary_sensor.koffiezetapparaat_verbonden.state.toFixed is not a function';
    const typeErrorMessage2 = `${NAMESPACE}: states method cannot be used with a domain, use it as an object instead.`;
    const typeErrorMessage3 = `${NAMESPACE}: devices method cannot be used with an entity id, you should use a device id instead.`;
    const typeErrorMessage4 = `${NAMESPACE}: devices cannot be accesed using an entity id, you should use a device id instead.`;

    describe('Error as a console warning', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
        let compiler: HomeAssistantJavaScriptTemplatesRenderer;

        beforeEach(async () => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
            compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('should return a SyntaxError during instantiation', () => {
            expect(
                compiler.renderTemplate(syntaxErrorCode)
            ).toBe(undefined);    
            expect(consoleWarnMock).toHaveBeenCalledWith(new TypeError(syntaxErrorMessage));    
        });

        it('should return a TypeError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode1)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new TypeError(typeErrorMessage1));
        });

        it('should return a SyntaxError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode2)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError(typeErrorMessage2));
            expect(
                compiler.renderTemplate(typeErrorCode3)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError(typeErrorMessage3));
            expect(
                compiler.renderTemplate(typeErrorCode4)
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith(new SyntaxError(typeErrorMessage4));
        });

    });

    describe('With warnings disabled', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
        let compiler: HomeAssistantJavaScriptTemplatesRenderer;

        beforeEach(async () => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
            compiler = await new HomeAssistantJavaScriptTemplates(
                HOME_ASSISTANT_ELEMENT,
                {
                    throwWarnings: false
                }
            ).getRenderer();
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('should return a SyntaxError during instantiation', () => {
            expect(
                compiler.renderTemplate(syntaxErrorCode)
            ).toBe(undefined);    
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

        it('should return a TypeError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode1)
            ).toBe(undefined);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

        it('should return a SyntaxError during the execution', () => {
            expect(
                compiler.renderTemplate(typeErrorCode2)
            ).toBe(undefined);
            expect(consoleWarnMock).not.toHaveBeenCalled();
            expect(
                compiler.renderTemplate(typeErrorCode3)
            ).toBe(undefined);
            expect(consoleWarnMock).not.toHaveBeenCalled();
            expect(
                compiler.renderTemplate(typeErrorCode4)
            ).toBe(undefined);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

    });

    describe('Error as an error', () => {

        let compiler: HomeAssistantJavaScriptTemplatesRenderer;

        beforeEach(async () => {
            compiler = await new HomeAssistantJavaScriptTemplates(
                HOME_ASSISTANT_ELEMENT,
                { throwErrors: true }
            ).getRenderer();
        });

        it('should return a SyntaxError during instantiation', () => {
            expect(
                () => compiler.renderTemplate(syntaxErrorCode)
            ).toThrow(syntaxErrorMessage);
        });

        it('should return a TypeError during the execution', () => {
            expect(
                () => compiler.renderTemplate(typeErrorCode1)
            ).toThrow(typeErrorMessage1);
        });

        it('should return a SyntaxError during the execution', () => {
            expect(
                () => compiler.renderTemplate(typeErrorCode2)
            ).toThrow(typeErrorMessage2);
            expect(
                () => compiler.renderTemplate(typeErrorCode3)
            ).toThrow(typeErrorMessage3);
            expect(
                () => compiler.renderTemplate(typeErrorCode4)
            ).toThrow(typeErrorMessage4);
        });

    });

    describe('Using non-existing entity ids', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;

        beforeEach(async () => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('Should throw a warning if a non-existing entity id is used', async () => {
            const compiler = await new HomeAssistantJavaScriptTemplates(
                HOME_ASSISTANT_ELEMENT
            ).getRenderer();
            compiler.renderTemplate('is_state("light.non_existing", "on")');
            expect(consoleWarnMock).toHaveBeenCalledWith('Entity light.non_existing used in a JavaScript template doesn\'t exist');
        });

        it('Should not throw a warning if a non-existing entity id is used', async () => {
            const compiler = await new HomeAssistantJavaScriptTemplates(
                HOME_ASSISTANT_ELEMENT,
                { throwWarnings: false }
            ).getRenderer();
            compiler.renderTemplate('is_state("light.non_existing", "on")');
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });
        
    });

    describe('trying to access other clientSide variables', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
        let compiler: HomeAssistantJavaScriptTemplatesRenderer;

        beforeEach(async () => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
            compiler = await new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT).getRenderer();
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('accesing a variable inside clientSide', () => {
            expect(
                compiler.renderTemplate('return clientSide.non_existent')
            ).toBe(undefined);
            expect(consoleWarnMock).toHaveBeenCalledWith('clientSideProxy should only be used to access these variables: panel_url');
        });

    });

    describe('trying to access other clientSide variables with warnings disabled', () => {

        let consoleWarnMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
        let compiler: HomeAssistantJavaScriptTemplatesRenderer;

        beforeEach(async () => {
            consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();
            compiler = await new HomeAssistantJavaScriptTemplates(
                HOME_ASSISTANT_ELEMENT,
                { throwWarnings: false }
            ).getRenderer();
        });

        afterEach(() => {
            consoleWarnMock.mockRestore();
        });

        it('accesing a variable inside clientSide', () => {
            expect(
                compiler.renderTemplate('return clientSide.non_existent')
            ).toBe(undefined);
            expect(consoleWarnMock).not.toHaveBeenCalled();
        });

    });

});
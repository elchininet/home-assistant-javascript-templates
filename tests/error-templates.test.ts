import HomeAssistantJavaScriptTemplates from '../src';
import { HOME_ASSISTANT_ELEMENT } from './constants';

describe('Templates with errors', () => {

    const errorMessage = 'states.binary_sensor.koffiezetapparaat_verbonden.state.toFixed is not a function';

    it('Error as a console log', () => {

        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT);
        const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();

        expect(
            compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state.toFixed(16)')
        ).toBe(undefined);

        expect(consoleWarnMock).toHaveBeenCalledWith(new TypeError(errorMessage));

        consoleWarnMock.mockRestore();

    });

    it('Error as an error', () => {

        const compiler = new HomeAssistantJavaScriptTemplates(HOME_ASSISTANT_ELEMENT, true);

        expect(
            () => compiler.renderTemplate('states["binary_sensor.koffiezetapparaat_verbonden"].state.toFixed(16)')
        ).toThrow(errorMessage);

        expect(
            () => compiler.renderTemplate('states("battery")')
        ).toThrow('states method cannot be used with a domain, use it as an object instead');

    });

});
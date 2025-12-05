# home-assistant-javascript-templates

A JavaScript utility to render Home Assistant JavaScript templates.

[![Deployment Status](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml/badge.svg)](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml)
[![Tests](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/test.yaml/badge.svg)](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/test.yaml)
[![Coverage Status](https://coveralls.io/repos/github/elchininet/home-assistant-javascript-templates/badge.svg?branch=master)](https://coveralls.io/github/elchininet/home-assistant-javascript-templates?branch=master)
[![npm version](https://badge.fury.io/js/home-assistant-javascript-templates.svg)](https://badge.fury.io/js/home-assistant-javascript-templates)

## Install

#### npm

```bash
npm install home-assistant-javascript-templates
```

#### yarn

```bash
yarn add home-assistant-javascript-templates
```

#### PNPM

```bash
pnpm add home-assistant-javascript-templates
```

## Basic Usage

#### Usage with commonJS

```javascript
const HomeAssistantJavaScriptTemplates = require('home-assistant-javascript-templates');

const haJsTemplates = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

haJsTemplates.getRenderer()
    then((renderer) => {
        renderer.renderTemplate('... template string ...');
        renderer.trackTemplate('... template string ...', () => {
            // execute this function every time that en entity used in the template changes
        });
    });
```

#### Usage with ES6 modules

```javascript
import HomeAssistantJavaScriptTemplates from 'home-assistant-javascript-templates';

const haJsTemplates = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

haJsTemplates.getRenderer()
    then((renderer) => {
        renderer.renderTemplate('... template string ...');
        renderer.trackTemplate('... template string ...', () => {
            // execute this function every time that en entity used in the template changes
        });
    });
```

## API

The package exposes a class that needs to be instantiated and the resolved promise that returns the `getRenderer` method of this instance is what you need to use in your code to render `JavaScript` templates.

### HomeAssistantJavaScriptTemplates class

Main class of the library, it is the `default` export in the package.

```typescript
new HomeAssistantJavaScriptTemplates(
    ha,
    options
);
```

| Parameter          | Optional      | Description                                        |
| ------------------ | ------------- | -------------------------------------------------- |
| `ha`               | no            | An HTML element that has the `hass` object as a property (e.g. the `home-assistant` custom element). |
| `options`          | yes           | An object containing the configuration options. |

#### Configuration options

| Parameter          | Optional      | Default | Description                                        |
| ------------------ | ------------- | ------- | -------------------------------------------------- |
| `throwErrors`      | yes           | false   | Indicates if the library should throw if the template contains any error. If not, it will log the errors as a warning in the console and return `undefined` instead. |
| `throwWarnings`    | yes           | true    | Indicates if the library should throw warnings in the console, either when there is an error in the templates and `throwErrors` is configured in `false`, or when a non-existent entity or domain is used in the templates. |
| `variables`        | yes           | `{}`    | An object holding custom global variables to be used inside all the templates. The values could be of any type |
| `refs`             | yes           | `{}`    | An object holding custom global refs variables to be used inside all the templates. The values could be of any type. Consult the [refs variables](#refs-variables) section for more info |
| `refsVariableName` | yes           | `refs`  | The name in the template of the object holding the `refs` variables. Consult the [refs variables](#refs-variables) section for more info |
| `autoReturn`       | yes           | true    | Indicates if the library should add a `return` statement at the beginning of a template code if no `return` statements are contained in the code|

### Methods

#### getRenderer

Returns a `Promise` than once it resolved returns an instance of the [HomeAssistantJavaScriptTemplatesRenderer](#homeassistantjavascripttemplatesrenderer-class) class.

### HomeAssistantJavaScriptTemplatesRenderer class

This class is only exported as a type in the package, you cannot import it directly. An instance of this class will be returned by the promise that is returned by the [getRenderer method](#getrenderer) of the [HomeAssistantJavaScriptTemplates class](#homeassistantjavascripttemplates-class).

### Properties

#### variables

This property gets and sets the global variables that will be available in all the templates.

#### refs

This property gets and sets the global refs variables that will be available in all the templates. If you assign a new `refs`, the previous `refs` variables and the template trackings that were using them will be cleaned. Consult the [refs variables](#refs-variables) section for more info.

### Methods

#### renderTemplate

```typescript
renderTemplate(
    template: string,
    extras?: {
        variables?: Record<string, unknown>,
        refs?: Record<string, unknown>,
    }
): any
```

This method renders a `JavaScript` template and return its result. It needs a string as a parameter. Inside this string you can use [several objects and methods](#objects-and-methods-available-in-the-templates). It returns whatever the `JavaScript` code returns, because of that it is typed as `any`.

>[!NOTE]
>This method accepts an optional second parameter with an object. In this object it is possible to send a `variables` object, containing extra variables that will be appended to [the global variables](#variables) and a `refs` object, containing extra [refs variables](#refs-variables). The extra `refs` variables will be appended to the global ones, making them available even in templates that weere declared before the call to this method. You need to be aware, that if a ref variable already exists, sending it again in this method will override it.

#### trackTemplate

```typescript
trackTemplate(
    template: string,
    renderingFunction: (result?: any) => void,
    extras?: {
        variables?: Record<string, unknown>,
        refs?: Record<string, unknown>,
    }
): () => void
```

This method registers a template tracking. It executes the `renderingFunction` sent to the method with the result of the rendered `template` and will execute `renderingFunction` with an updated result of the rendered `template` every time that the entities used in the template update. You can use [several objects and methods](#objects-and-methods-available-in-the-templates) inside the `template` string.

If some entity was not reached in the template code because it was inside a condition that never met, then it will not be tracked, so if its state changes it will not trigger the `renderingFunction` again. Only those entities that were called during the rendering using [states](#states), [state_translated](#state_translated), [is_state](#is_state), [state_attr](#state_attr), [is_state_attr](#is_state_attr), [has_value](#has_value) [entities](#entities), [entity_prop](#entity_prop), [is_entity_prop](#is_entity_prop) or [device_id](#device_id), [device_attr](#device_attr), [is_device_attr](#is_device_attr), [device_id](#device_id), [device_name](#device_name), [area_id](#area_id), and [area_name](#area_name) will be included.

This method will return a function. When this function is executed, the tracking of that template/rendering function is removed and subsecuent changes in the entities of the template will not call the `renderingFunction`.

>[!NOTE]
>This method accepts an optional third parameter with an object. In this object it is possible to send a `variables` object, containing extra variables that will be appended to [the global variables](#variables) and a `refs` object, containing extra [refs variables](#refs-variables). The extra `refs` variables will be appended to the global ones, making them available even in templates that weere declared before the call to this method. You need to be aware, that if a ref variable already exists, sending it again in this method will override it.

#### cleanTracked

```typescript
cleanTracked(entityId?: string): void
```

This method will clean the template tracking for a specific entity or will clean all the template trackings if no entity id is specified.

>[!NOTE]
>With this method, it is possible to clean `refs` variables. To do so, you just need to send as the name of the entity the value of `refsVariableName` (by default `refs`) and the name of the variable separated by a dot, e.g `refs.my_variable`.

### Objects and methods available in the templates

#### hass

The `hass` object

#### states

`states` could be used in two ways, as a function or as an object. When using it as function it allows an entity id (containing the domain) and an optional options object as parameters and it will return the state of that entity. As an object it allows you to access a domain or the full entity state object.

>[!IMPORTANT]
>If you try to use `states` as a function sending a domain it will throw an error.

```javascript
// Using states as a function (for a state with value 17.456 and unit ºC)
states('sensor.slaapkamer_temperatuur') // 17.456
states('sensor.slaapkamer_temperatuur', { with_unit: true }) // 17.456 ºC
states('sensor.slaapkamer_temperatuur', { with_unit: true, rounded: true }) // 17.5 ºC
states('sensor.slaapkamer_temperatuur', { rounded: true }) // 17.5
states('sensor.slaapkamer_temperatuur', { rounded: 2 }) // 17.46

// Using states as an object (for a state with value 17.456 and unit ºC)
states['sensor.slaapkamer_temperatuur'].state // 17.456
states['sensor.slaapkamer_temperatuur'].state_with_unit // 17.5 ºC
states.sensor.slaapkamer_temperatuur.state // 17.456
states.sensor.slaapkamer_temperatuur.state_with_unit // 17.5 ºC
states.sensor // returns an object containing all the entities states of the 'sensor' domain
```

>[!TIP]
>Avoid using `states['sensor.slaapkamer_temperatuur'].state` or `states.sensor.slaapkamer_temperatuur.state`. Use `states('sensor.slaapkamer_temperatuur')` instead, which will return `undefined` if the device id doesn‘t exist or the entity isn’t ready yet (the former will throw an error). If you still want to use them it is advisable to use the [Optional chaining operator], e.g. `states['sensor.slaapkamer_temperatuur']?.state` or `states.sensor?.slaapkamer_temperatuur?.state`.

#### state_translated

Method to return a translated state of an entity using a language that is currently configured in the general settings. If the entity id doesn‘t exist it returns `undefined`.

```javascript
states('device_tracker.paulus'); // not_home
state_translated('device_tracker.paulus') // Away
```

#### is_state

Method to check if the state of an entity is equal to a certain value or it is contained inside a list of values. It returns a `boolean`. If the entity id doesn‘t exist it returns `false`.

```javascript
is_state('device_tracker.paulus', 'not_home') // check for a single value
is_state('device_tracker.paulus', ['not_home', 'work']) // check for a list of values
```

#### state_attr

Method to return the value of the state attribute or `undefined` if it doesn’t exist.

```javascript
state_attr('device_tracker.paulus', 'battery')
```

#### is_state_attr

Method to test if the given entity attribute is the specified state. It returns a `boolean`, if the entity doesn‘t exist it returns `false`.

```javascript
is_state_attr('device_tracker.paulus', 'battery', 40)
```

#### has_value

Method to test if the given entity is not unknown or unavailable. It returns a `boolean`, if the entity doesn‘t exist it returns `false`.

```javascript
has_value('sensor.my_sensor')
```

#### entities

`entities` could be used in two ways, as a function or as an object.

```javascript
// Using entities as a function
entities() // return all the entities
entities('device_tracker') // returns an object containing all the entities of the 'device_tracker' domain
entities('device_tracker.paulus') // returns the entity 'device_tracker.paulus'

// Using entities as an object
entities.device_tracker // returns an object containing all the entities of the 'device_tracker' domain
entities['device_tracker.paulus'] // returns the entity 'device_tracker.paulus'
entities.device_tracker.paulus // returns the entity 'device_tracker.paulus'
```

#### entity_prop

Method that returns the value of a property of an entity or `undefined` if it doesn’t exist.

```javascript
entity_prop('device_tracker.paulus', 'platform')
```

#### is_entity_prop

Method to test if the value of an entity property matches a value. It returns a `boolean`, if the entity id or the property don‘t exist it returns `false`.

```javascript
is_entity_prop('device_tracker.paulus', 'platform', 'hacs')
```

#### devices

`devices` could be used in two ways, as a function or as an object.

```javascript
// Using devices as a function
devices() // returns all the devices
devices('706ad0ebe27e105d7cd0b73386deefdd') // returns the device that matches the device id

// Using devices as an object
devices['706ad0ebe27e105d7cd0b73386deefdd'] // returns the device that matches the device id
```

#### device_attr

Method that returns the value of an attribute for the given entity or device id. It returns `undefined` if the entity or the device doesn’t exist.

```javascript
device_attr('sensor.my_sensor', 'manufacturer')
device_attr('706ad0ebe27e105d7cd0b73386deefdd', 'manufacturer')
```

#### is_device_attr

Method to test if the value of a device attribute matches a value for a given entity or device id. It returns a `boolean`, if the entity or device doesn‘t exist it returns `false`.

```javascript
is_device_attr('sensor.my_sensor', 'manufacturer', 'Synology')
is_device_attr('706ad0ebe27e105d7cd0b73386deefdd', 'manufacturer', 'Synology')
```

#### device_id

Method to return the device id for a given entity id or device name. It returns `undefined` if the entity or name doesn‘t exist. 

```javascript
device_id('sensor.my_sensor')
device_id('My lamp')
```

#### device_name

Method to return the device name for a given device id or entity id. It returns `undefined` if the entity or device doesn‘t exist. 

```javascript
device_name('sensor.my_sensor')
device_name('706ad0ebe27e105d7cd0b73386deefdd')
```

#### areas

Method to return an array with all the areas ids.

```javascript
areas()
```

#### area_id

Method to return the area id for a given device id, entity id, or area name. It returns `undefined` if the area doesn‘t exist.

```javascript
area_id('b8c1c9dd23cb82bbfa09b5657f41d04f')
area_id('sensor.my_sensor')
area_id('Woonkamer')
```

#### area_name

Method to return the area name for a given device id, entity id, or area id. It returns `undefined` if the area doesn‘t exist.

```javascript
area_name('b8c1c9dd23cb82bbfa09b5657f41d04f')
area_name('sensor.my_sensor')
area_name('woonkamer')
```

#### area_entities

Method to return an array of entity ids tied to a given area id or area name. If the area doesn‘t exist it returns an empty array.

```javascript
area_entities('woonkamer')
area_entities('Woonkamer')
```

#### area_devices

Method to return an array of device ids tied to a given area id or area name. If the area doesn‘t exist it returns an empty array.

```javascript
area_devices('woonkamer')
area_devices('Woonkamer')
```

#### user_name

Property to return the name of the user logged in in Home Assistant. It returns a `string`.

```javascript
user_name
```

#### user_is_admin

Property to return if the user logged in in Home Assistant is admin or not. It returns a `boolean`.

```javascript
user_is_admin
```

#### user_is_owner

Property to return if the user logged in in Home Assistant is the owner. It returns a `boolean`.

```javascript
user_is_owner
```

#### user_agent

Property to return the user agent of the browser in which Home Assistant is running.

```javascript
user_agent
```

#### panel_url

Property to return the current Home Assistant panel URL (`window.location.pathname`).

```javascript
panel_url
```

#### lang

Property to return the language that the logged user has configured in their profile.

```javascript
lang
```

#### ref and unref

`ref` and `unref` method allows to work with reactive variables. Reactive variables are variables that can be accessed globally from any template and changing their values in any template will trigger a re-render in the tracked templates using them.

```javascript
// create a ref to a variable named name
const name = ref('name');

// Changing the value of the ref name
// This will re-evaluate any template in which ref('name') has been used
name.value = 'ElChiniNet';

// Accesing the value of the ref name
const myName = name.value;

// Remove the ref name
// This will stop any re-evaluation of this reactive variable in any template
unref('name');
```

>[!IMPORTANT]
>1. A `ref` has only one property, and it is `value`. Trying to access or assign another property than value will throw an error.
>2. `unref` should be called if a `ref` has been created previously or if it has not been already _unrefed_. Trying to call `unref` in a non-existent `ref` will throw an error.

## Examples

#### Get a device attribute and return a formatted text with it

```javascript
import HomeAssistantJavaScriptTemplates  from 'home-assistant-javascript-templates';

const haJsTemplates = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

/**
 * Get the device id of an entity
 * With the device id get an attribute of the device
 * Return the value of the attribute prefixed with "sn: "
 * It will return something like "sn: 123456"
 */
haJsTemplates.getRenderer()
    .then((renderer) => {
        const result = renderer.renderTemplate(`
            const deviceId = device_id("binary_sensor.koffiezetapparaat_aan");
            const serialNumber = device_attr(deviceId, "serial_number");
            return "sn:" + serialNumber;
        `);
        console.log(result);
    });

```

#### Get all the available updates and update an HTML element with the result with entity changes

```javascript
import HomeAssistantJavaScriptTemplates  from 'home-assistant-javascript-templates';

const haJsTemplates = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant'),
    {
        variables: {
            PREFIX: 'Updates:'
        }
    }
);

haJsTemplates.getRenderer()
    .then((renderer) => {
        const element = document.querySelector('#my-element');
        const untrack = renderer.trackTemplate(
            `
            const udatesEntities = states.update;
            const updateEntitiesValues = Object.values(udatesEntities);
            const updatesEntitiesOn = updateEntitiesValues.filter((entity) => entity.state === 'on');
            return \`${PREFIX} ${updatesEntitiesOn.length}\`;
            `,
            (result) => {
                element.innerHTML = result;
            }
        );

        // Later if one wants to untrack the template
        untrack();

    });

```

### Refs variables

`Refs` refers to "reactive variables", for each variable inside `refs`, [a ref object](#ref-and-unref) is registered behind the scenes. If you use a reactive variable in a template, this template will get re-render if the value of that reactive variable changes. To access reactive variables in a template you just need to access the `refs` object. The name of this object can be changed through the `refsVariableName` option of the [HomeAssistantJavaScriptTemplates class](#homeassistantjavascripttemplates-class).

#### Declaring a global reactive variable

```javascript
const haJsTemplates = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant'),
    {
        refs: {
            MY_VARIABLE: 'REACTIVE'
        }
    }
);
```

#### Accessing and modifying refs variables in the templates

```javascript
haJsTemplates.getRenderer()
    .then((renderer) => {
        // Render the initial value
        const result = renderer.renderTemplate('refs.MY_VARIABLE');
        console.log(result); // REACTIVE
        
        // Track changes in a template with a reactive variable
        const untrack = renderer.trackTemplate(
            'return refs.MY_VARIABLE + "_RETURNED"',
            (result) => {
                console.log(result); // REACTIVE_RETURNED
            }
        );

        // the renderingFunction above will be executed with REACTIVE_MODIFIED_RETURNED
        renderer.renderTemplate('refs.MY_VARIABLE = "REACTIVE_MODIFIED"');

    });
```

[Optional chaining operator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
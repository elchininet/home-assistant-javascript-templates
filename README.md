# home-assistant-javascript-templates

A JavaScript utility to render Home Assistant JavaScript templates.

[![Deployment Status](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml/badge.svg)](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml)
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

const renderer = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

renderer.renderTemplate('... template string ...');
```

#### Usage with ES6 modules

```javascript
import HomeAssistantJavaScriptTemplates from 'home-assistant-javascript-templates';

const renderer = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

renderer.renderTemplate('... template string ...');
```

## API

The package exposes a class that needs to be instantiated and is this instance the one that you need to use in your code.

### HomeAssistantJavaScriptTemplates class

Main class of the library, it is the `default` export in the package.

```typescript
new HomeAssistantJavaScriptTemplates(ha, throwErrors = false);
```

| Parameter     | Optional      | Description                                        |
| ------------- | ------------- | -------------------------------------------------- |
| `ha`          | no            | An HTML element that has the `hass` object as a property (e.g. the `home-assistant` custom element). |
| `throwErrors` | yes           | Indicates if the library should throw if the template contains any error. If not it will log the errors as a warning in the console and return `undefined` instead. |

### Properties

#### tracked

```typescript
interface Tracked {
    entities: string[];
    domains: string[];
}

get tracked(): Tracked
```

This property will return an object with two properties (`entities` and `domains`). Each of these properties will be an array containing the entities or ids that have been tracked when the templates have been rendered. If some domain or entity was not reached because it was inside a condition that never met, then it will not be included in the `tracked` property. Only those entities or domains that were called during the rendering by the code using [states](#states), [is_state](#is_state), [state_attr](#state_attr), [is_state_attr](#is_state_attr) or [has_value](#has_value) will be included.

>Note: take into account that the domains will be only tracked if the `states` object is used accesing a domain. For example `states('device_tracker.paulus')` or `states['device_tracker.paulus']` will track the entity `device_tracker.paulus` but not the domain `device_tracker` but `states.device_tracker.paulus` will track both, the domain `device_tracker` and the entity `device_tracker.paulus`. The rest of the methods will track only entities.

### Methods

#### renderTemplate

```typescript
renderTemplate(template: string): any
```

This is the main method to render `JavaScript` templates, it needs a string as a parameter. Inside this string you can use [several objects and methods](#objects-and-methods-available-in-the-templates). It returns whatever the `JavaScript` code returns, because of that it is typed as `any`.

#### cleanTrackedEntities

```typescript
cleanTrackedEntities(): void
```

This method will clean all the tracked entities until the moment, so after being called, the `tracked` property will return an empty array as `entities`.

#### cleanTrackedDomains

```typescript
cleanTrackedDomains(): void
```

This method will clean all the tracked domains until the moment, so after being called, the `tracked` property will return an empty array as `domains`.

#### cleanTracked

```typescript
cleanTracked(): void
```

This method will clean all the tracked entities and domains until the moment. It is the same as calling `cleanTrackedEntities` and `cleanTrackedDomains` consecutively.

### Objects and methods available in the templates

#### hass

The `hass` object

#### states

`states` could be used in two ways, as a function or as an object. When using it as function it only allows an entity id (containing the domain) as a parameter and it will return the state of that entity. As an object it allows you to access a domain or the full entity id.

>Note: If you try to use `states` as a function sending a domain it will throw an error.

```javascript
// Using states as a function
states('device_tracker.paulus') // returns the state of the entity id 'device_tracker.paulus'

// Using states as an object
states['device_tracker.paulus'].state // returns the state of the entity id 'device_tracker.paulus'
states.device_tracker.paulus.state // returns the state of the entity id 'device_tracker.paulus'
states.device_tracker // returns an object constaining all the entities of the 'device_tracker' domain
```

>Note: Avoid using `states['device_tracker.paulus'].state` or `states.device_tracker.paulus.state`, instead use `states('device_tracker.paulus')` which will return `undefined` if the device id doesn‘t exist or the entity isn’t ready yet (the former will throw an error). If you still want to use them it is advisable to use the [Optional chaining operator], e.g. `states['device_tracker.paulus']?.state` or `states.device_tracker?.paulus?.state`.

#### is_state

Method to check if the state of an entity is equal to a certain value. It returns a `boolean`. If the entity id doesn‘t exist it returns `false`.

```javascript
is_state('device_tracker.paulus', 'not_home')
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

#### device_attr

Method that returns the value of an attribute for the given device id or `undefined` if it doesn’t exist.

```javascript
device_attr('706ad0ebe27e105d7cd0b73386deefdd', 'manufacturer')
```

#### is_device_attr

Method to test if the value of a device attribute matches a value. It returns a `boolean`, if the device id doen‘t exist it returns `false`.

```javascript
is_device_attr('706ad0ebe27e105d7cd0b73386deefdd', 'manufacturer', 'Synology')
```

#### device_id

Method to return the device id for a given entity id or `undefined` if the entity doesn‘t exist. 

```javascript
device_id('sensor.my_sensor')
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

## Examples

#### Get a device attribute and return a formatted text with it

```javascript
import HomeAssistantJavaScriptTemplates  from 'home-assistant-javascript-templates';

const renderer = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

/**
 * Get the device id of an entity
 * With the device id get an attribute of the device
 * Return the value of the attribute prefixed with "sn: "
 * It will return something like "sn: 123456"
 */
renderer.renderTemplate(`
    const deviceId = device_id("binary_sensor.koffiezetapparaat_aan");
    const serialNumber = device_attr(deviceId, "serial_number");
    return "sn:" + serialNumber;
`);
```

#### Get all the available updates

```javascript
import HomeAssistantJavaScriptTemplates  from 'home-assistant-javascript-templates';

const renderer = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant')
);

renderer.renderTemplate(`
    const udatesEntities = states.update;
    const updateEntitiesValues = Object.values(udatesEntities);
    const updatesEntitiesOn = updateEntitiesValues.filter((entity) => entity.state === 'on');
    return updatesEntitiesOn.length;
`);
```

[Optional chaining operator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
# home-assistant-frontend-templates

A JavaScript utility to render Home Assistant JavaScript templates.

[![Deployment Status](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml/badge.svg)](https://github.com/elchininet/home-assistant-javascript-templates/actions/workflows/deploy.yaml) &nbsp; [![Coverage Status](https://coveralls.io/repos/github/elchininet/home-assistant-javascript-templates/badge.svg?branch=master)](https://coveralls.io/github/elchininet/home-assistant-javascript-templates?branch=master) &nbsp; [![npm version](https://badge.fury.io/js/home-assistant-javascript-templates.svg)](https://badge.fury.io/js/home-assistant-javascript-templates)

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
    document.querySelector('home-assistant').hass
);

renderer.renderTemplate('... template string ...');
```

#### Usage with ES6 modules

```javascript
import HomeAssistantJavaScriptTemplates  from 'home-assistant-javascript-templates';

const renderer = new HomeAssistantJavaScriptTemplates(
    document.querySelector('home-assistant').hass
);

renderer.renderTemplate('... template string ...');
```

## API

The package exposes a class that needs to be instantiated and is this isntance the one that you need to use in your code.

### HomeAssistantJavaScriptTemplates class

Main class of the library, it is the `default` export in the package.

```typescript
new HomeAssistantJavaScriptTemplates(hass, throwErrors = false);
```

| Parameter     | Optional      | Description                                        |
| ------------- | ------------- | -------------------------------------------------- |
| `hass`        | no            | A valid `hass` object                              |
| `throwErrors` | yes           | Indicates if the library should throw if the template contains any error. If not it will log the errors as a warning in the console. |

### renderTemplate method

This is the main method to render `JavaScript` templates, it needs a string as a parameter. Inside this string you can use several objects and methods.

### Objects and methods available in the templates

#### hass

The same `hass` object that was sent to the class

#### states

States could be used in two ways, as a function or as an object.

```javascript
// Using states as a function
states('device_tracker.paulus')

// Using states as an object
states['device_tracker.paulus'].state
```

#### is_state

Method to check if the state of an entity is equal to a certain value. It returns a `boolean`. If the entity id doesn‘t exist it returns `false`.

```javascript
is_state('device_tracker.paulus', 'not_home')
```

#### state_attr

Method to return the value of the state attribute or `None` if it doesn’t exist.

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

Method that returns the value of an attribute for the given device id or `None` if it doesn’t exist.

```javascript
device_attr('706ad0ebe27e105d7cd0b73386deefdd')
```

#### is_device_attr

Method to test if the value of a device attribute matches a value. It returns a `boolean`, if the device id doen‘t exist it returns `false`.

```javascript
is_device_attr('706ad0ebe27e105d7cd0b73386deefdd', 'manufacturer', 'Synology')
```

#### device_id

Method to return the device id for a given entity id or `None` if the entity doesn‘t exist. 

```javascript
device_id('sensor.my_sensor')
```

#### areas

Method to return an array with all the areas ids.

```javascript
areas()
```

#### area_id

Method to return the area id for a given device id, entity id, or area name. It returns `None` if the area doesn‘t exist.

```javascript
area_id('b8c1c9dd23cb82bbfa09b5657f41d04f')
area_id('sensor.my_sensor')
area_id('Woonkamer')
```

#### area_name

Method to return the area name for a given device id, entity id, or area id. It returns `None` if the area doesn‘t exist.

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
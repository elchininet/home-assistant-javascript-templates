# Changelog

## [5.9.0] - 2025-07-13

- Add a new method `state_translated` to return the translated state value of an entity
- Improve the `is_state` function to accept also an array as a value to compare

## [5.8.0] - 2025-06-24

- Improve the `states` function with an optional object with options (`with_unit` and `rounded`)
- Improve the `states` object with an optional property to return a rounded number with units using the `state_with_unit` property

## [5.7.1] - 2025-03-30

- Add proper type to the `subscribeMessage` method of `home-assistant-js-websocket`. It should return a promise that is resolved to a function that will cancel the subscription once called

## [5.7.0] - 2025-03-09

- Add a new parameter to the `renderTemplate` method to send extra variables

## [5.6.1] - 2025-02-22

- Make it possible to serialize refs without errors

## [5.6.0] - 2025-01-16

- Add two new functions to the templates to work with reactive variables (`ref` and `unref`)

## [5.5.1] - 2024-12-14

- Fix a bug about panel_url registering all the entity_ids of all registered templates

## [5.5.0] - 2024-11-10

- Add a new option `autoReturn` to manage the feature of adding `return` statements at the beginning of the templates

## [5.4.2] - 2024-11-10

- Set the `get-promisable-result` package as a dependency

## [5.4.1] - 2024-11-10

- Remove `getPromisableElement` utility and replace it by the `getPromisableResult` from `get-promisable-result` package

## [5.4.0] - 2024-10-26

- Create a variable property in the `HomeAssistantJavaScriptTemplatesRenderer` class

## [5.3.2] - 2024-10-26

- Refactor variables retrieval

## [5.3.1] - 2024-10-25

- Fix templates with spaces at the beginning

## [5.3.0] - 2024-10-25

- New option to send custom variables to be rendered in the templates

## [5.2.1] - 2024-10-25

- Fix `panel_url`, it should be updated also when the views change

## [5.2.0] - 2024-10-24

- New property available in the templates `panel_url` which will return the `window.location.pathname`

## [5.1.0] - 2024-10-24

- Fix an issue about calling `trackTemplate` with the same template but with different `renderingFunctions` was registering only the first one.
- The `trackTemplate` method now returns a function that will clean the tracking of that template/rendering function when called

## [5.0.0] - 2024-09-19

- Complete refactor of the library
    * The library now returns a promise and the result of the promise is the renderer
    * Removed the `trackNonExistent` parameter
    * The options of the library are provided now with an options object
    * New `trackTemplate` method to execute rendering functions when entities change
    * Removed `tracked` property
    * Removed `cleanTrackedEntities` method
    * Removed `cleanTrackedDomains` method
    * Changed the function of the `cleanTracked` method

## [4.0.0] - 2024-08-31

- New methods, objects and properties
    * entities method
    * entities object
    * entity_attr method
    * is_entity_attr method
    * devices method
    * devices object
    * user_agent property
- New parameter to track non-existent entities and domains
- Fix a bug of device_id not tracking the entity id

## [3.1.0] - 2024-02-11

- Create entities and domains tracker

## [3.0.1] - 2024-02-10

- Fix a bug that was returning the wrong result with `states.any_entity_with_underscores`

## [3.0.0] - 2024-01-29

[BREAKING CHANGE]:
    - `states` as an object will not return an array if a domain is used. In its place it will return an object with all the entities ids as keys.

## [2.0.0] - 2024-01-28

[BREAKING CHANGE]:
    - The main class doesn‘t accept a `hass` object anymore. It needs an HTML element that contains the `hass` object as a property. This is to solve a bug that the templates were returining always the old version of the states.

## [1.2.0] - 2024-01-28

- Rollback the `None` returns and return `undefined` in these cases.
- Throw an error if the `states` method is used with a domain

## [1.1.0] - 2024-01-28

- Added `user` to `Hass` interface
- New properties to get user data (`user_name`, `user_is_admin`, `user_is_owner`)
- Add `strict mode` to the compiled code

## [1.0.1] - 2024-01-28

- Exports the `Hass` interface

## [1.0.0] - 2024-01-28

- Release of `home-assistant-javascript-templates`
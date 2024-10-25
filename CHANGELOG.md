# Changelog

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
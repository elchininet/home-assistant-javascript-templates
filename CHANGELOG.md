# Changelog

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
import { Hass } from '../src/types';

export const HASS: Hass = {
    areas: {
        eetkamer: {
            area_id: 'eetkamer',
            name: 'Eetkamer'
        },
        slaapkamer: {
            area_id: 'slaapkamer',
            name: 'Slaapkamer'
        },
        woonkamer: {
            area_id: 'woonkamer',
            name: 'Woonkamer'
        }
    },
    devices: {
        '706ad0ebe27e105d7cd0b73386deefdd': {
            id: '706ad0ebe27e105d7cd0b73386deefdd',
            area_id: 'eetkamer',
            manufacturer: 'Synology',
            serial_number: '123456789'
        },
        '4d584585f0eb89172ce1a71c8b0e74ae': {
            id: '4d584585f0eb89172ce1a71c8b0e74ae',
            area_id: 'woonkamer',
            model: 'HHCCJCY01'
        },
        '0c1c9c65040cbf3563c76dc376d072f3': {
            id: '0c1c9c65040cbf3563c76dc376d072f3',
            area_id: 'slaapkamer'
        },
        'b8c1c9dd23cb82bbfa09b5657f41d04f': {
            id: 'b8c1c9dd23cb82bbfa09b5657f41d04f',
            area_id: 'eetkamer'
        },
        'dea1c4475b8dc901b7b33c7eac09896d': {
            id: 'dea1c4475b8dc901b7b33c7eac09896d',
            area_id: 'slaapkamer'
        },
        'a121a9414241f03ce6b3108b2716f9be': {
            id: 'a121a9414241f03ce6b3108b2716f9be',
            area_id: null
        },
        '720a719fe7db1460b0e4cc9ffbb1488d': {
            id: '720a719fe7db1460b0e4cc9ffbb1488d',
            area_id: 'eetkamer'
        }
    },
    entities: {
        'binary_sensor.koffiezetapparaat_aan': {
            area_id: 'eetkamer',
            device_id: '706ad0ebe27e105d7cd0b73386deefdd'
        },
        'light.woonkamer_lamp': {
            area_id: 'woonkamer',
            device_id: '4d584585f0eb89172ce1a71c8b0e74ae'
        },
        'sensor.slaapkamer_temperatuur': {
            area_id: 'slaapkamer',
            device_id: 'dea1c4475b8dc901b7b33c7eac09896d'
        },
        'binary_sensor.koffiezetapparaat_verbonden': {
            area_id: 'eetkamer',
            device_id: 'b8c1c9dd23cb82bbfa09b5657f41d04f'
        },
        'light.eetkamer_lampje': {
            area_id: 'eetkamer',
            device_id: '720a719fe7db1460b0e4cc9ffbb1488d'
        },
        'sensor.slaapkamer_luchtvochtigheid': {
            area_id: 'slaapkamer',
            device_id: '0c1c9c65040cbf3563c76dc376d072f3'
        },
        'binary_sensor.internetverbinding': {
            area_id: null,
            device_id: 'a121a9414241f03ce6b3108b2716f9be'
        }
    },
    states: {
        'binary_sensor.koffiezetapparaat_aan': {
            attributes: {
                friendly_name: 'Koffiezetapparaat Aan',
                mode: 'single'
            },
            entity_id: 'binary_sensor.koffiezetapparaat_aan',
            state: 'on'
        },
        'light.woonkamer_lamp': {
            attributes: {
                friendly_name: 'Woonkamer Lamp',
                supported_features: 44
            },
            entity_id: 'light.woonkamer_lamp',
            state: 'off'
        },
        'sensor.slaapkamer_temperatuur': {
            attributes: {
                friendly_name: 'Slaapkamer Temperatuur',
                device_class: 'temperature',
                unit_of_measurement: 'ºC'
            },
            entity_id: 'sensor.slaapkamer_temperatuur',
            state: '17.4'
        },
        'binary_sensor.koffiezetapparaat_verbonden': {
            attributes: {
                friendly_name: 'Koffiezetapparaat Verbonden',
                device_class: 'connectivity'
            },
            entity_id: 'binary_sensor.koffiezetapparaat_verbonden',
            state: 'on'
        },
        'light.eetkamer_lampje': {
            attributes: {
                friendly_name: 'Eetkamer Lampje',
                brightness: 128
            },
            entity_id: 'light.eetkamer_lampje',
            state: 'on'
        },
        'sensor.slaapkamer_luchtvochtigheid': {
            attributes: {
                friendly_name: 'Slaapkamer Luchtvochtigheid',
                state_class: 'measurement'
            },
            entity_id: 'sensor.slaapkamer_luchtvochtigheid',
            state: '45'
        },
        'binary_sensor.internetverbinding': {
            attributes: {
                friendly_name: 'Internetverbinding',
                state_class: 'measurement',
                icon: 'mdi:internet'
            },
            entity_id: 'binary_sensor.internetverbinding',
            state: 'off'
        },
        'button.knopje': {
            attributes: {
                friendly_name: 'Knopje',
            },
            entity_id: 'button.knopje',
            state: 'unknown'
        },
        'camera.keukencamera': {
            attributes: {
                friendly_name: 'Keuken Camera',
            },
            entity_id: 'camera.keukencamera',
            state: 'unavailable'
        }
    }
};
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json' with { type: 'json' };

export default {
    roots: ['<rootDir>/tests'],
    moduleNameMapper: pathsToModuleNameMapper(
        tsconfig.compilerOptions.paths,
        {
            prefix: '<rootDir>'
        }
    ),
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
    ],
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        userAgent: 'Custom/Agent',
    },
    setupFilesAfterEnv: [
        'jest-location-mock'
    ]
};
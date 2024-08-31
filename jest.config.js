const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfig = require('./tsconfig');

module.exports = {
    roots: ['<rootDir>/tests'],
    moduleNameMapper: pathsToModuleNameMapper(
        tsconfig.compilerOptions.paths,
        {
            prefix: '<rootDir>/src'
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
};
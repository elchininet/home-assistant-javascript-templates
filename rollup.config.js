import ts from 'rollup-plugin-ts';
import terser from '@rollup/plugin-terser';

export default [
    {
        plugins: [
            ts(),
            terser({
                output: {
                    comments: false
                }
            })
        ],
        external: ['get-promisable-result'],
        input: 'src/index.ts',
        output: [
            {
                file: `dist/index.js`,
                format: 'cjs',
                exports: 'default'
            },
            {
                file: `dist/esm/index.js`,
                format: 'es'
            }
        ]
    }
];
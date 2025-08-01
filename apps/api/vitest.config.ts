import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/__tests__/',
                'dist/',
                '**/*.d.ts',
            ]
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@shared': resolve(__dirname, '../../packages/shared/src'),
            '@prompts': resolve(__dirname, '../../packages/prompts/src')
        }
    }
}) 
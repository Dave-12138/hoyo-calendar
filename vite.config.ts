import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { BuildOptions } from "vite";

function getBuild(mode: string): BuildOptions {
    switch (mode) {
        case "calendar-node":
            return {
                target: "modules",
                outDir: "./node",
                lib: {
                    entry: "./src/data-fetcher/index",
                    fileName: "fetch-calendar",
                    formats: ['cjs']
                },
                rollupOptions: {
                    external: ["vue", /node:.*/],
                },
                minify: true
            }
        case "calendar":
        default:
            return {
                outDir: "./calendar",
                lib: false,
                target: "esNext",
                rollupOptions: {
                    input: {
                        index: "src/index.ts"
                    },
                    external: ["vue", /node:.*/],
                    output: {
                        entryFileNames: "calendar.js",
                        assetFileNames: "style.css"
                    }
                },
                minify: true
            }
    }
}
export default defineConfig(({ mode }) => {
    return {
        plugins: [
            vue()
        ],
        build: getBuild(mode),
        resolve: {
            alias: {
                '@': (new URL('./src', import.meta.url)).href
            }
        },

    }
});
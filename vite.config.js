import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      util: "rollup-plugin-node-polyfills/polyfills/util",
      events: "rollup-plugin-node-polyfills/polyfills/events",
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
    },
  },
  define: {
    // Use JSON.stringify to inject a literal replacement for process
    process: JSON.stringify({ env: { NODE_DEBUG: false } }),
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
        process: JSON.stringify({ env: { NODE_DEBUG: false } }),
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true, // Enable process polyfill
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [],
    },
  },
});

//   server: {
//   host: '0.0.0.0',
//   port: 5173,
//   allowedHosts: ['test.agrifacts.space', '0.0.0.0']
// },

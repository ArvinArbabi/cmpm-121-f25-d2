// https://vitejs.dev/config/
export default {
  base: "/cmpm-121-f25-d2/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: true,
  },
};

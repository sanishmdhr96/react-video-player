import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    compilerOptions: {
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  minify: true,
  treeshake: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
  onSuccess: async () => {
    // Bundle CSS files
    const cssFiles = [
      "src/styles/VideoPlayer.css",
      "src/styles/Controls.css",
      "src/styles/ControlElements.css",
      "src/styles/ProgressBar.css",
    ].filter((file) => fs.existsSync(file));

    if (cssFiles.length > 0) {
      const bundledCSS = cssFiles
        .map((file) => fs.readFileSync(file, "utf-8"))
        .join("\n\n");

      fs.mkdirSync("dist", { recursive: true });
      fs.writeFileSync("dist/styles.css", bundledCSS);
      console.log("✅ CSS bundled to dist/styles.css");
    }
  },
});

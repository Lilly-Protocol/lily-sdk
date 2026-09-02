import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("package exports contract", () => {
  const packageJsonPath = path.resolve(__dirname, "../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  it("declares subpaths in exports that map to corresponding source files", () => {
    const exportsMap = packageJson.exports as Record<
      string,
      string | { import?: string; require?: string; types?: string }
    >;

    expect(exportsMap).toBeDefined();

    for (const [subpath, target] of Object.entries(exportsMap)) {
      if (subpath === "./package.json") {
        expect(target).toBe("./package.json");
        continue;
      }

      if (typeof target === "object") {
        // Verify source module counterpart exists in src/
        const moduleName = subpath === "." ? "index" : subpath.replace(/^\.\//, "");
        const srcFile = path.resolve(__dirname, `../src/${moduleName}.ts`);
        expect(fs.existsSync(srcFile), `Expected source file ${srcFile} to exist for export ${subpath}`).toBe(true);

        // Verify declared output files have valid paths
        if (target.import) {
          expect(target.import.startsWith("./dist/")).toBe(true);
        }
        if (target.types) {
          expect(target.types.startsWith("./dist/")).toBe(true);
        }
        if (target.require) {
          expect(target.require.startsWith("./dist/")).toBe(true);
        }
      }
    }
  });

  it("declares top-level main, module, and types fields pointing to dist/index", () => {
    expect(packageJson.main).toBe("./dist/index.cjs");
    expect(packageJson.module).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
  });
});

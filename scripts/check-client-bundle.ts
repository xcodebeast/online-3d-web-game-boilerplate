import type { Manifest, ManifestChunk } from "vite";

const outputDirectory = new URL("../dist/apps/client/", import.meta.url);
const initialGzipBudget = 143_360;
const totalGzipBudget = 384_000;
const chunkBudget = 460_800;

/** Includes every static dependency of every entry, deduplicating shared chunks and cycles. */
const collectInitialFiles = (buildManifest: Manifest): Set<string> => {
  const files = new Set<string>();
  const visit = (chunk: ManifestChunk): void => {
    if (files.has(chunk.file)) {
      return;
    }
    files.add(chunk.file);
    const dependencies = chunk.imports ?? [];
    for (const name of dependencies) {
      const dependency = buildManifest[name];
      if (!dependency) {
        throw new Error(`Missing manifest dependency: ${name}`);
      }
      visit(dependency);
    }
  };
  const chunks = Object.values(buildManifest);
  for (const chunk of chunks) {
    if (chunk.isEntry) {
      visit(chunk);
    }
  }
  if (files.size === 0) {
    throw new Error("No client entries found in the build manifest");
  }
  return files;
};

const manifest: Manifest = await Bun.file(
  new URL(".vite/manifest.json", outputDirectory),
).json();
const initialFiles = collectInitialFiles(manifest);
const files = new Set(
  Object.values(manifest)
    .map((chunk) => chunk.file)
    .filter((file) => file.endsWith(".js")),
);
let initialGzip = 0;
let totalGzip = 0;

interface ChunkSize {
  file: string;
  rawSize: number;
  compressedSize: number;
}
const sizes: ChunkSize[] = await Promise.all(
  Array.from(files, async (file): Promise<ChunkSize> => {
    const code = await Bun.file(new URL(file, outputDirectory)).bytes();
    return {
      file,
      rawSize: code.length,
      compressedSize: Bun.gzipSync(code).length,
    };
  }),
);
for (const { file, rawSize, compressedSize } of sizes) {
  if (rawSize > chunkBudget) {
    throw new Error(
      `${file} exceeds the ${chunkBudget}-byte chunk budget (${rawSize} bytes)`,
    );
  }
  totalGzip += compressedSize;
  if (initialFiles.has(file)) {
    initialGzip += compressedSize;
  }
}
if (initialGzip > initialGzipBudget) {
  throw new Error(
    `Initial client JS exceeds the ${initialGzipBudget}-byte gzip budget (${initialGzip} bytes)`,
  );
}
if (totalGzip > totalGzipBudget) {
  throw new Error(
    `Total client JS exceeds the ${totalGzipBudget}-byte gzip budget (${totalGzip} bytes)`,
  );
}
// biome-ignore lint/suspicious/noConsole: This CLI reports the enforced production bundle sizes in build and CI logs.
console.info(
  `Client JS: ${initialGzip} bytes gzip initially; ${totalGzip} bytes gzip across ${files.size} chunks. All bundle budgets passed.`,
);

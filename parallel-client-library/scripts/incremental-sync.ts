import path from "node:path";
import { runLibrarySync } from "./lib/backfill-core";

function parseArgs(argv: string[]) {
  const args = {
    write: false,
    client: null as string | null,
    rootDir: path.resolve(process.cwd()),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--write") args.write = true;
    if (arg === "--client") args.client = argv[index + 1] ?? null;
    if (arg === "--root") args.rootDir = path.resolve(argv[index + 1] ?? process.cwd());
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await runLibrarySync({
    rootDir: args.rootDir,
    clientFilter: args.client,
    write: args.write,
    syncType: "incremental",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

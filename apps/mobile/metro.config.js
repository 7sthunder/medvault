// Metro config for the Expo client.
//
// The mobile app is a *client* of the existing Next.js server: it talks to the same
// tRPC HTTP endpoint and the same Better Auth routes. To do that it reuses the web
// app's pure domain layer (`src/shared`: enums, zod validations, dose/adherence calc)
// instead of forking it, so a schema change lands in both clients at once.
//
// That means Metro has to resolve modules *above* this package, hence `watchFolders`
// on the repo root plus the tsconfig `paths` entries Expo reads automatically.

const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// src/shared lives two levels up and imports `date-fns` / `@date-fns/tz` / `zod`.
// Without this, those bare specifiers would resolve against the repo root's
// node_modules (pnpm-isolated) and Metro would fail to find them.
config.watchFolders = [repoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(repoRoot, "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;

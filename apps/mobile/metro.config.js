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
const fs = require("node:fs");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "../..");

// pnpm's isolated layout keeps each package's dependencies symlinked inside
// `node_modules/.pnpm/<pkg>@<version>/node_modules`, and Metro does not walk that
// structure. pnpm does however publish a flat view of every transitive dependency at
// `node_modules/.pnpm/node_modules`, so adding it as a lookup path is what lets Metro
// resolve packages that are imported but never declared here (react-native's
// `invariant`, `@expo/metro-runtime`'s `whatwg-fetch`, ...). Without it `expo start`
// and `expo export` both fail with "Unable to resolve module ...".
const pnpmStore = path.resolve(repoRoot, "node_modules/.pnpm/node_modules");

const config = getDefaultConfig(projectRoot);

// src/shared lives two levels up and imports `date-fns` / `@date-fns/tz` / `zod`.
// Without this, those bare specifiers would resolve against the repo root's
// node_modules (pnpm-isolated) and Metro would fail to find them.
config.watchFolders = [repoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(repoRoot, "node_modules"),
  ...(fs.existsSync(pnpmStore) ? [pnpmStore] : []),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;

import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security-headers";

/** Must match the specifier in `src/instrumentation.ts` verbatim. */
const SCHEDULER_BOOTSTRAP = "@/server/scheduler-bootstrap";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep these out of the server bundle so Node `require()`s them from `node_modules` at runtime.
  //
  // `web-push` reaches `agent-base`, which does a bare `require("http")`. Webpack's `createRequire`
  // parser hook only tolerates a literal argument, so the lazy loader in
  // `src/server/domain/push/server.ts` could not be statically analysed: with a template literal
  // webpack logs "module.createRequire failed parsing argument" and `getWebPush()` returns null, so
  // push delivery is silently disabled. With a literal it instead tries to bundle the whole
  // `web-push` -> `agent-base` -> `http` graph, which stalls `/instrumentation` compilation
  // indefinitely. Externing it removes the trade-off entirely and lets the module be imported
  // normally.
  //
  // `pg-native` is the optional native accelerator `pg/lib/native` probes for; it is a compiled
  // addon and must never be bundled.
  serverExternalPackages: ["web-push", "pg-native"],
  webpack: (config, { nextRuntime, webpack }) => {
    // `instrumentation.ts` is compiled twice: once for Node, once for Edge. The Edge pass has no
    // `fs` / `net` / `tls`, so the whole `pg` graph has to be kept out of that bundle —
    // `pg-connection-string` calls `require("fs")` at module scope, and `pg/lib/native` reaches
    // for `pg-native` and `module.createRequire`. `serverExternalPackages` does not help here:
    // Next only wires it into the non-edge externals list. The `NEXT_RUNTIME` guard in
    // `register()` does not help either, because webpack resolves the graph before it evaluates
    // the branch. `IgnorePlugin` hooks `normalModuleFactory.hooks.beforeResolve`, so it wins
    // ahead of tsconfig-paths resolution and the module is never walked at all. The real module
    // is loaded on Node, where the guard has already returned for Edge.
    if (nextRuntime !== "edge") return config;

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: new RegExp(`^${SCHEDULER_BOOTSTRAP.replace(/[/@]/g, "\\$&")}$`),
      }),
    );
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;

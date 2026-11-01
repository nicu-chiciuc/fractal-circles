// The Alchemy stack of this site. .github/workflows/alchemy.yml runs it: the stage `prod` on each
// push to master, and the stage `pr-<number>` on each pull request, a Worker of its own that
// `alchemy destroy` deletes when the pull request closes.
//
// The stack name is the repository. Its state is in the `alchemy-state-store` project of the Convex
// team. A run needs the team token CONVEX_ACCESS_TOKEN, and CLOUDFLARE_API_TOKEN and
// CLOUDFLARE_ACCOUNT_ID for the Worker.
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "nicu-chiciuc/fractal-circles",
  {
    providers: Cloudflare.providers(),
    state: Convex.state({ team: "nicu" }),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    // At `prod`, the Worker that Workers Builds deployed before this stack, found by its name. The
    // first deploy takes it over only with --adopt, and a destroy never deletes it. Any other stage
    // is a Worker with the name of the stage. There is no build: .assetsignore lists the four
    // files of the site, and nothing else in this folder is uploaded.
    const site = yield* Cloudflare.Worker("Site", {
      name: stage === "prod" ? "fractal-circles" : `fractal-circles-${stage}`,
      assets: {
        directory: ".",
        notFoundHandling: "none",
      },
      compatibility: { date: "2026-08-16" },
    }).pipe(RemovalPolicy.retain(stage === "prod"));

    return { url: site.url };
  }),
);

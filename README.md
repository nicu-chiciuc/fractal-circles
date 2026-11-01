# fractal-circles

[Open the site](https://fractal-circles.pfp.workers.dev).

GitHub Actions deploys the Alchemy stack in `alchemy.run.ts`. A push to `master`
deploys the existing `fractal-circles` Worker at the URL above. There is no build.
The `.assetsignore` allowlist includes only the four site files.

Each pull request from this repository gets a `pr-<number>` stage and a
`fractal-circles-pr-<number>` Worker. The workflow comments with its URL and deletes
that Worker when the pull request closes. Fork pull requests get no preview.
Production has a retain removal policy, and the workflow only destroys PR stages.

Deployment needs the repository secrets `CONVEX_ACCESS_TOKEN`,
`CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID`. State lives in the
`alchemy-state-store` project of the `nicu` Convex team.

The manual workflow accepts `plan_only` to inspect a production plan and `adopt`
for the one-time takeover of the existing Worker. Workers Builds is disabled
after that takeover.

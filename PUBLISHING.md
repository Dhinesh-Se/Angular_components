# Publishing to npm

This repository is an Angular library workspace. Publish the built package from `dist/enterprise-components`, not the repository root. The root project contains source, workspace configuration, and development dependencies; the npm package is produced by `ng-packagr` during `npm run build`.

## One-time npm setup

1. Create or use an npm account at <https://www.npmjs.com/>.
2. Make sure the package name in `package.json` is available or rename it to your organization scope, for example `@your-company/angular-components`.
3. If using a scoped package, create or confirm the npm organization/scope has permission to publish the package.
4. Authenticate locally:

```bash
npm login
npm whoami
```

For CI/CD, create an npm automation token and expose it as `NPM_TOKEN`. Do not commit tokens to the repository.

## Local publish workflow

Run these commands from the repository root:

```bash
npm ci
npm run build
npm run pack:dry-run
npm run publish:dry-run
npm run publish:public
```

What each command does:

- `npm ci` installs exact dependencies from `package-lock.json` when present. Use `npm install` first if the repository does not have a lockfile yet.
- `npm run build` builds the Angular package into `dist/enterprise-components`.
- `npm run pack:dry-run` previews which files npm would include in the tarball.
- `npm run publish:dry-run` validates publish metadata without uploading.
- `npm run publish:public` publishes the scoped package publicly. For private npm organizations, remove `--access public` or use the access level required by your registry plan.

## Versioning

Update the version before every publish:

```bash
npm version patch
# or: npm version minor
# or: npm version major
```

`npm version` updates `package.json`, creates a git commit, and creates a tag. Push both the branch and tags after publishing:

```bash
git push
git push --tags
```

## Publishing to a private registry

If your enterprise uses Artifactory, Verdaccio, GitHub Packages, Azure Artifacts, or another registry, add a project-level `.npmrc` in CI or configure the registry during the pipeline:

```bash
npm config set registry https://registry.npmjs.org/
npm publish ./dist/enterprise-components --registry https://registry.npmjs.org/
```

For GitHub Packages, the package scope must match the GitHub owner or organization, and the registry should be `https://npm.pkg.github.com`.

## Recommended CI/CD outline

1. Checkout code.
2. Install dependencies with `npm ci`.
3. Run `npm run lint`, `npm test`, and `npm run build`.
4. Run `npm run publish:dry-run` on pull requests or release candidates.
5. On a tagged release, write `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to `.npmrc` in the CI workspace.
6. Publish with `npm run publish:public`.

## Common errors

- **403 Forbidden**: your npm user/token does not have permission, the package name/scope is unavailable, or your network policy blocks the registry.
- **402 Payment Required**: scoped packages defaulted to private publishing. Use `--access public` for public scoped packages.
- **Package already exists/version already published**: increment `version` with `npm version patch|minor|major` and rebuild before publishing.
- **Accidentally publishing source root**: always publish `./dist/enterprise-components`; do not run plain `npm publish` from the repository root.

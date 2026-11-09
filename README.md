# TRAINSET

TRAINSET is a graphical tool for labeling time series data. You can upload multiple series and apply one or many labels. In the GIF below, `series_a` is being labled with `bar` and `biz` labels while `series_b` is serving as a reference.

![TRAINSET labeling GIF](https://user-images.githubusercontent.com/8713574/112393077-b1832d80-8cb7-11eb-811b-0a7200be658d.gif)


## Hosted Version

If you just want to use TRAINSET and don't want to mess with deploying it, head to the [hosted version](https://trainset.geocene.com)

## Build Setup

Use **Node.js 24.x and npm 11.x**. The `.nvmrc` file selects Node 24 for contributors using [nvm](https://github.com/nvm-sh/nvm); Heroku reads the runtime requirements from `package.json`.

```bash
# select the project's runtime (if using nvm)
nvm install
nvm use

# install the exact dependency versions in package-lock.json
npm ci

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# check the built app's HTTP responses and production assets
npm test

# serve the production build at localhost:5000 (or the PORT environment variable)
npm start

# build for production and view the bundle analyzer report
npm run build --report
```

Run `npm run build` before `npm test` or `npm start`. Commit `package.json` and `package-lock.json` together when changing dependencies. This migration retains the existing Vue 2/webpack 4 application; updating the runtime does not replace those legacy tools.

## Heroku Deployment

The migration target is **Heroku-26**, with Node 24 and npm 11. See [Heroku's supported Node versions](https://devcenter.heroku.com/articles/nodejs-support) and the [Heroku-26 stack notes](https://devcenter.heroku.com/articles/heroku-26-stack). The Node.js buildpack builds the frontend with `npm run build` and starts the server with `npm start`; the server listens on Heroku's `PORT`.

### Verify before deploying

After the pull request is reviewed, test its revision in a separate staging app or Review App on Heroku-26 before changing production. Check the installed runtime and successful build in the deployment log, then:

1. Open the home page and download the sample CSV.
2. Upload that CSV, select a series, brush some points, and apply a label.
3. Export the CSV and confirm the chosen points have the expected labels.
4. Visit Help and License, including loading their URLs directly, and check for browser errors.

Confirm that the app uses the current `heroku/nodejs` buildpack rather than an old pinned buildpack. Keep any staging configuration separate from production.

### Upgrade the existing app

Changing the `stack` field in `app.json` only configures newly created Review Apps, Heroku CI apps, and Heroku Button apps. It does **not** change the existing `geocene-trainset` app. An existing app needs a stack change followed by a fresh build, as described in [Heroku's upgrade guide](https://devcenter.heroku.com/articles/upgrading-to-the-latest-stack).

Before upgrading, record the current stack and the last working release number:

```bash
heroku stack -a geocene-trainset
heroku releases -a geocene-trainset
heroku buildpacks -a geocene-trainset
```

From the reviewed and merged revision on `master`, set the target stack and deploy:

```bash
heroku git:remote -a geocene-trainset
heroku stack:set heroku-26 -a geocene-trainset
git push heroku master
```

If deployment is managed through Heroku's GitHub integration, trigger a new build of the reviewed revision there instead of pushing to the Heroku Git remote. The stack change remains pending until a new build is deployed. Repeat the browser checks above, confirm the active stack, and inspect `heroku logs --tail -a geocene-trainset`.

### Roll back

If the deployed app fails verification, restore the recorded working release (replace `vNN` with its actual number):

```bash
heroku rollback vNN -a geocene-trainset
heroku stack -a geocene-trainset
```

Rolling back restores that release's built app and running stack. Confirm the stack selected for future builds before attempting another deployment. A rollback to Heroku-22 is temporary recovery; its end-of-life deadline still applies. Setting the old stack alone does not restore a previous build.

## Funding Support

The development of TRAINSET was funded by the [NIH Clean Cooking Implementation Science Network](https://www.fic.nih.gov/About/Staff/Policy-Planning-Evaluation/Pages/clean-cooking-implementation-science-network.aspx) with funding from the [NIH Common Fund for Global Health](https://commonfund.nih.gov/globalhealth). The development team and cookstove community are grateful for this support.

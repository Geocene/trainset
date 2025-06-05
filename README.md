# TRAINSET

TRAINSET is a graphical tool for labeling time series data. You can upload multiple series and apply one or many labels. In the GIF below, `series_a` is being labled with `bar` and `biz` labels while `series_b` is serving as a reference.

![TRAINSET labeling GIF](https://user-images.githubusercontent.com/8713574/112393077-b1832d80-8cb7-11eb-811b-0a7200be658d.gif)


## Hosted Version

If you just want to use TRAINSET and don't want to mess with deploying it, head to the [hosted version](https://trainset.geocene.com)

## Build Setup

This project works with modern versions of Node.js (v10 or later). Ensure you
have an up‑to‑date Node and npm installed before running the commands below.

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# testing script for serving prod build locally
npm run start

# build for production and view the bundle analyzer report
npm run build --report

# pushing to heroku

git push heroku master
```
see [here](https://devcenter.heroku.com/articles/git#deploying-code).

## CSV Formats

TRAINSET accepts two input layouts:

1. **Wide format** – a `timestamp` column followed by one column per series.
   Optional label columns like `series1_label` are paired with each series.
2. **TRAINSET format** – rows contain `series,timestamp,value,label`.

The provided parser detects either layout automatically and normalizes the data
before loading.

## Deploying to Netlify

1. Commit your changes to a Git repository (GitHub, GitLab, etc.).
2. Create a new site on [Netlify](https://www.netlify.com/) and link it to the repository.
3. Set **Build command** to `npm run build` and **Publish directory** to `dist`.
4. Deploy the site. Netlify reads `netlify.toml` so all SPA routes work and the
   bundled files are served from the `dist` folder.
5. To preview locally install the Netlify CLI and run `npx netlify dev`.
6. The sample functions in `netlify/functions` mirror the local Express
   endpoints so label autosave and data export work when hosted on Netlify.
   Update these files to connect to your own database because Netlify's file
   system is temporary.

The functions provide:
* `/.netlify/functions/annotations` – save and load labels
* `/.netlify/functions/data` – serve the demo dataset with optional outlier
  clipping via `?clip=1`
* `/.netlify/functions/export` – download the annotated CSV

With these functions in place, `timeline_clone.html` and the Vue app will POST
to `/annotations` and fetch `/data` and `/export` for saving and loading data.

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Funding Support

The development of TRAINSET was funded by the [NIH Clean Cooking Implementation Science Network](https://www.fic.nih.gov/About/Staff/Policy-Planning-Evaluation/Pages/clean-cooking-implementation-science-network.aspx) with funding from the [NIH Common Fund for Global Health](https://commonfund.nih.gov/globalhealth). The development team and cookstove community are grateful for this support.

## Local Timeline Clone
A minimal example page is available in `timeline_clone.html`. Open this file directly or visit `/timeline` when running the Vue app.
Start the local server with `npm start` and navigate to `http://localhost:5000/timeline_clone.html` or `http://localhost:8080/#/timeline` during development.
The demo loads data from the `/data` endpoint and autosaves label changes.
The Vue labeling page now also persists labels to `static/files/annotations.json` and browser storage.
Use the mouse wheel to zoom. Arrow keys pan the selection while <kbd>Shift</kbd>+Arrow resizes it.
Press <kbd>Ctrl</kbd>+&uarr; to label the current range as occupied and <kbd>Ctrl</kbd>+&darr; for unoccupied.
Saved labels are stored in `static/files/annotations.json` when using the server and in your browser's localStorage. Click **Export CSV** to download the annotated data. Use the **Clip outliers** checkbox to discard points more than five standard deviations from the mean and adjust the Y axis with the "Y Max" field.


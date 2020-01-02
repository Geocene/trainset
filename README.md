# TRAINSET

> TRAINSET is a graphical tool for labeling time series data

![TRAINSET GIF](TRAINSET-GIF.gif?raw=true "Title")

## Build Setup

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
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Docker

Build
```
docker build . TRAINSET:1.0.0
```

Run
```
docker run -d -p 5000:5000 --name TRAINSET TRAINSET:1.0.0
```

## Configure Labels

Define your labels in a JSON file and mount it to the docker container as `/app/static/labels.json`.

/home/me/my_labels.json
```
{
  "1": "Label 1",
  "2": "Label 2"
}
```

`docker run -v /home/me/my_labels.json:/app/static/labels.json -d -p 5000:5000 --name TRAINSET TRAINSET:1.0.0`

## Funding Support

The development of TRAINSET was funded by the NIH Clean Cooking Implementation Science Network with funding from the NIH Common Fund for Global Health. The development team and cookstove community are grateful for this support.

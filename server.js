const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');
const history = require('connect-history-api-fallback');

let app = express();
app.use(history());
app.use(serveStatic(__dirname + "/dist"));

const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
	res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log('Listening on port ' + port)
});
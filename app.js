let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let indexRouter = require('./routes/index');
let auth = require('./routes/auth');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json({ limit: '500mb', parameterLimit: 100000, extended: false }));
app.use(express.urlencoded({ limit: '500mb', parameterLimit: 100000, extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// If set AUTHORIZATION=true, you must provide a correct Bearer token
if (process.env.AUTHORIZATION) {
  app.all('/*', auth);
}
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res) {
  res.status(404).json(
    {
      'result': 'failed',
      'detail': 'no such endpoint: [' + req.method + '] ' + req.url
    });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
});

module.exports = app;

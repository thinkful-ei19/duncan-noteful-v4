'use strict';

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');

const { PORT, MONGODB_URI } = require('./config');

const notesRouter = require('./routes/notes');
const foldersRouter = require('./routes/folders');
const tagsRouter = require('./routes/tags');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const localAuth = require('./passport/local');
const jwtStrategy = require('./passport/jwt');

// Create an Express application
const app = express();

// Log all requests. Skip logging during
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
  skip: () => process.env.NODE_ENV === 'test'
}));

// Utilize the Express static webserver, passing in the directory name
app.use(express.static('public'));

// Utilize the Express `.json()` body parser
app.use(express.json());

passport.use(localAuth);
passport.use(jwtStrategy);

app.use('/api', usersRouter);
app.use('/api', authRouter);

app.use(passport.authenticate('jwt', { session: false, failWithError: true }));

// Mount routers
app.use('/api', notesRouter);
app.use('/api', foldersRouter);
app.use('/api', tagsRouter);



// Catch-all 404
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Catch-all Error handler
// Add NODE_ENV check to prevent stacktrace leak
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  });
});

// Listen for incoming connections
if (require.main === module) {
  mongoose.connect(MONGODB_URI)
    .then(instance => {
      const conn = instance.connections[0];
      console.info(`Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`);
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      console.error('\n === Did you remember to start `mongod`? === \n');
      console.error(err);
    });

  app.listen(PORT, function () {
    console.info(`Server listening on ${this.address().port}`);
  }).on('error', err => {
    console.error(err);
  });
}

module.exports = app; // Export for testing

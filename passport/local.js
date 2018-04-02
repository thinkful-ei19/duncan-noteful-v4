'use strict';

const {Strategy: LocalStrategy} = require('passport-local');

const User = require('../models/user');

const localAuth = new LocalStrategy((username, password, done) => {
  User.findOne({ username })
    .then(user => {
      if (!user) {
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username',
          location: 'username'
        });
      }
      return user.validatePassword(password)
        .then(isValid => {
          if (!isValid) {
            return Promise.reject({
              reason: 'LoginError',
              message: 'Incorrect password',
              location: 'password'
            });
          }
          return done(null, user);
        });
    }) 
    .catch(err => {
      if (err.reason === 'LoginError') {
        return done(null, false);
      }
      return done(err);
    });
});

module.exports = localAuth; 
'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

const {JWT_EXPIRY, JWT_SECRET} = require('../config');

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

const createAuthToken = function(user){
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
};

router.post('/login', localAuth, function (req, res) {
  const authToken = createAuthToken(req.user);
  return res.json(authToken);
});

module.exports = router;
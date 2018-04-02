'use strict';

const express = require('express');
const router = express.Router();

// const mongoose = require('mongoose');
const passport = require('passport');
// const localAuth = require('../passport/local');

// const User = require('../models/user');

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

router.post('/login', localAuth, function (req, res) {
  return res.json(req.user);
});

module.exports = router;
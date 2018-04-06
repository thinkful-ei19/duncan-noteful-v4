'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../config');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Login', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullName = 'Example User';
  const id = '333333333333333333333300';
  
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function () {
    return User.hashPassword(password)
      .then(digest => User.create({
        _id : id,
        username,
        password: digest,
        fullName
      }));
  });
  
  afterEach(function () {
    return User.remove();
  });
  
  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should return a valid auth token', function () {
        return chai.request(app)
          .post('/api/login')
          .send({ username, password })
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body.authToken).to.be.a('string');
          
            const payload = jwt.verify(res.body.authToken, JWT_SECRET);
          
            expect(payload.user).to.not.have.property('password');
            expect(payload.user).to.deep.equal({ id, username, fullName });
          });
      });

      it('Should reject requests with no credentials', function () {
        return chai.request(app)
          .post('/api/login')
          .catch(err => err.response)
          .then(res => {
            expect(res.body.message).to.equal('Bad Request');
            expect(res).to.have.status(400);
          });
          
      });

      it('Should reject requests with incorrect usernames', function () {
        return chai.request(app)
          .post('/api/login')
          .send({username: 'baduser', password})
          .catch(err => err.response)
          .then(res => {
            expect(res.body.message).to.equal('Unauthorized');
            expect(res).to.have.status(401);
          });
      });

      it('Should reject requests with incorrect passwords', function() {
        return chai.request(app)
          .post('/api/login')
          .send({username, password:'badpassword'})
          .catch(err => err.response)
          .then(res => {
            expect(res.body.message).to.equal('Unauthorized');
            expect(res).to.have.status(401);
          });
      });
    });
  });
});
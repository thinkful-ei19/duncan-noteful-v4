'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const validateTags = function(userId, tags = []) {
  if (!tags.length) {
    return Promise.resolve();
  }
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        return Promise.reject('InvalidTag');
      }
    });
};

const validateFolders = function(userId, folderId) {
  if (!folderId) {
    return Promise.resolve();
  }
  return Folder.findOne({_id : folderId, userId})
    .then(folder => {
      if (!folder) {
        return Promise.reject('InvalidFolder');
      }
    });
};

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const {id} = req.user;

  let filter = { userId: id };

  /**
   * BONUS CHALLENGE - Search both title and content using $OR Operator
   *   filter.$or = [{ 'title': { $regex: re } }, { 'content': { $regex: re } }];
  */

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort('created')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id : id, userId})
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `tag id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  if (folderId) {
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      const err = new Error('The `folder id` is not valid');
      err.status = 400;
      return next(err);
    }
  }

  const newItem = { title, content, folderId, tags, userId };

  const foldersPromise = validateFolders(userId, folderId);
  const tagsPromise = validateTags(userId, tags);

  Promise.all([foldersPromise, tagsPromise])
    .then(() => {
      return Note.create(newItem);
    })
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });



  // My solution
  // const foldersPromise = Folder.find({ _id : folderId, userId});
  // const tagsPromise = Tag.find({userId});

  // Promise.all([foldersPromise,tagsPromise])
  //   .then(([folder, tag]) => {
  //     if (folderId) {
  //       if (!folder[0]) {
  //         const err = new Error('The item is not valid');
  //         err.status = 400;
  //         return next(err);
  //       }
  //     }
  //     if (tags) {
  //       const validTags = tag.map(item => item.id);
  //       tags.forEach(item => {
  //         if (!validTags.includes(item)) {
  //           const err = new Error('The item is not valid');
  //           err.status = 400;
  //           return next(err);
  //         }
  //       });
  //     } 
  //     return Note.create(newItem);
  //   })
  //   .then(result => {
  //     res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
  //   })
  //   .catch(err => {
  //     next(err);
  //   });


});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const updateItem = { title, content, tags };

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }
  
  const options = { new: true };

  const foldersPromise = validateFolders(userId, folderId);
  const tagsPromise = validateTags(userId, tags);

  Promise.all([foldersPromise, tagsPromise])
    .then(() => {
      return Note.findOneAndUpdate({_id : id, userId}, updateItem, options).populate('tags');
    })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err === 'InvalidFolder') {
        err = new Error('The folder is not valid');
        err.status = 400;
      }
      if (err === 'InvalidTag') {
        err = new Error('The tag is not valid');
        err.status = 400;
      }
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({_id : id, userId })
    .then((data) => {
      if (data) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
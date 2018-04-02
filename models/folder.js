'use strict';

const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, unique: true}
});

folderSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

/** BONUS CHALLENGE
 * Move the cascading delete or cascade set null into the schema
folderSchema.pre('remove', function(next) {
  mongoose.models.Note.remove({folderId: this._id})
    .then(() => next())
    .catch(err => {
      next(err);
    });
});
*/

module.exports = mongoose.model('Folder', folderSchema);

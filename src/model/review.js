const mongoose = require('../db/mongoose');

const User = require('./user');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  stars: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  comment: String,
  pictureUrl: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

/*
  If the review is written by the user, make sure that the review's name is the name of the user
*/
reviewSchema.pre('save', function beforeSave(next) {
  if (this.user) {
    User.findById(this.user, (err, user) => {
      if (err) {
        throw new Error('Error connecting to the database');
      }

      if (!user) {
        throw new Error('No user with that id');
      }

      this.name = user.firstName + user.lastName;
      return next();
    });
  } else {
    next();
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

const User = require('../model/user');

const localOpts = {
  usernameField: 'email',
};

passport.use(new LocalStrategy(localOpts, (email, password, done) => {
  User.findOne({ email }, (err, user) => {
    if (err) { return done(err); }

    if (!user) {
      return done(null, false);
    }

    if (!user.validPassword(password)) {
      return done(null, false);
    }
    return done(null, user.toAuthJSON());
  });
}));

const jwtOpts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('JWT-transfer'),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JWTStrategy(jwtOpts, (jwtPayload, done) => {
  User.findOne({ _id: jwtPayload.userId }, (err, user) => {
    if (err) {
      return done(err, false);
    }
    if (!user) {
      return done(null, false);
    }

    // Should not create new token if the token expires in more than 20 min
    const shouldUseOldToken = (jwtPayload.exp - jwtPayload.iat) >= (60 * 20);
    return done(null, user.toAuthJSON(shouldUseOldToken));
  });
}));

const authEmail = passport.authenticate('local', { session: false });
const authJWT = passport.authenticate('jwt', { session: false });

module.exports = {
  passport,
  authEmail,
  authJWT,
};

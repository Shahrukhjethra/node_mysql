const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = (sequelize, Sequelize) => {
  const Users = sequelize.define("users", {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please enter your username'
        }
      }
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      validate: {
        isEmail: {
          msg: "please enter valid email address"
        },
      }
    },
    mobile: {
      type: Sequelize.STRING,
      unique: true,
      validate: {
        is: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      }
    },
    password: {
      type: Sequelize.STRING
    },
    resetPasswordToken: {
      type: Sequelize.STRING
    },
    resetPasswordExpire: {
      type: Sequelize.STRING
    },
  },
    {
      scopes: {
        public: {
          attributes: ['id', 'username', 'email', 'mobile']
        }
      },
      hooks: {
        beforeCreate: async (user, options) => {
          console.log("beforeCreate");
          {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user, options) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    }
  );

  Users.prototype.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  }

  Users.prototype.getSignedJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET);
  };


  // Generate and hash password token
  Users.prototype.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
  };
  return Users;
};

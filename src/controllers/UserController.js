import log from 'winston-logger-setup'
import User from '../models/User'
import CollectClass from '../foundations/CollectClass'
// import imageUpload from '../helpers/imageUpload'
import password from '../helpers/passwordModule'
import jwtsign from '../helpers/jwtsign'
var nodemailer = require('nodemailer')
var crypto = require('crypto')
var algorithm = 'aes-256-ctr'
var emailhash = 'd6F3Efeq'
function encrypt (text) {
  var cipher = crypto.createCipher(algorithm, emailhash)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex')
  return crypted
}
function decrypt (text) {
  var decipher = crypto.createDecipher(algorithm, emailhash)
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}
exports.collectToRegister = (req, res, next) => {
  // console.log(req.body)
  let collectInstance = new CollectClass()
  collectInstance.setBody([
    'firstName',
    'lastName',
    'email',
    'password',
    'deviceId',
    'hideUserDetails'
  ])
  collectInstance.setFiles(['profilePic'])
  collectInstance.setMandatoryFields({
    firstName: 'First name not provided',
    lastName: 'Last name not provided',
    email: 'Email not provided',
    password: 'Password not provided',
    deviceId: 'Device Id not provided',
    profilePic: 'Profile picture not provided'
  })
  collectInstance.collect(req).then((data) => {
    req.userData = data
    next()
  }).catch((err) => {
    next(err)
  })
}

exports.register = (req, res, next) => {
  try {
    imageUpload(req.userData.profilePic, 'users').then((filename) => {
      req.userData.profilePic = filename
      // newUser.validateSync()
    password.generate(req.userData.password).then((hash) => {
      req.userData.password = hash
      // console.log(req.userData.email)
      let newUser = new User(req.userData)
      newUser.save((err, data) => {
        if (err) {
          next(err)
        } else {
          var verificationHash = encrypt(req.userData.email)
          // host=req.get('host')
          var link = res.locals.host + ':' + res.locals.port + '/useractivation/' + verificationHash
          // outputs hello world
          // console.log(verificationHash)
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'xenishmail@gmail.com',
              pass: 'jenish123'
            }
          })
          var mailOptions = {
            from: 'xenishmail@gmail.com',
            to: req.userData.email,
            subject: 'Account Verification',
            html: 'Hello,<br> Please Click on the link to activate your account.<br><a href=' + link + '>Click here to verify</a>'
          }
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              let error = new Error(err)
              log.error(error, {})
              next(error)
            } else {
              req.cdata = {
                success: 1,
                message: 'User registered temporarily, Activation required, Please click on the link provided in your email',
                data
              }
              next()
              // console.log('Email sent: ' + info.response)
            }
          })
        }
      })
    }).catch((e) => {
      throw e
    })
    }).catch((e) => {
      let error = new Error(e)
      log.error(error, {})
      next(error)
    })
  } catch (err) {
    let error = new Error(err)
    log.error(error, {})
    next(error)
  }
}

exports.activate = (req, res, next) => {
  function callback (err, numAffected) {
    if (err) {
      let error = new Error(err)
      log.error(error, {})
      next(error)
    } else {
      req.cdata = {
        success: 1,
        message: 'User account activated successfully'
      }
      next()
    }
  }
  try {
    var conditions = { email: decrypt(req.params.activationCode) }
    var update = { status: 1 }
    var options = { multi: true }
    User.update(conditions, update, options, callback)
  } catch (err) {
    let error = new Error(err)
    log.error(error, {})
    next(error)
  }
}

exports.list = (req, res, next) => {
  try {
    User.find({}, {password: 0}, (err, data) => {
      if (err) {
        throw err
      } else {
        req.cdata = {
          success: 1,
          message: 'Users retrieved successfully',
          data
        }
        next()
      }
    })
  } catch (err) {
    let error = new Error(err)
    log.error(error, {})
    next(error)
  }
}

exports.collectToLogin = (req, res, next) => {
  let collectInstance = new CollectClass()
  collectInstance.setBody(['email', 'password'])
  collectInstance.setMandatoryFields({
    'email': 'Email not provided',
    'password': 'Password not provided'
  })
  collectInstance.collect(req).then((data) => {
    req.loginData = data
    next()
  }).catch((err) => {
    next(err)
  })
}

exports.authenticate = (req, res, next) => {
  try {
    password.compare(req.loginData, User).then((data) => {
      delete data.password
      jwtsign.generateAccessToken(data).then((accessToken) => {
        jwtsign.generateRefreshToken(data).then((refreshToken) => {
          res.setHeader('authorization', 'Bearer ' + accessToken)
          res.setHeader('refreshtoken', 'Bearer ' + refreshToken)
          req.cdata = {
            success: 1,
            message: 'Login successful'
          }
          next()
        }).catch((e) => {
          throw e
        })
      }).catch((e) => {
        throw e
      })
    }).catch((e) => {
      let error = new Error(e)
      log.error(error, {})
      next(error)
    })
  } catch (err) {
    let error = new Error(err)
    next(error)
  }
}

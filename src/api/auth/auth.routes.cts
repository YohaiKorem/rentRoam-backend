const express = require('express')
const {
  login,
  signup,
  logout,
  errCallback,
  verifySocialToken,
} = require('./auth.controller.cjs')
const { requireAuth } = require('../../middlewares/requireAuth.middleware.cjs')
const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.get('/facebook', verifySocialToken)
router.get('/google', verifySocialToken)

router.post('/logout', logout)
router.get('/err/callback', errCallback)
module.exports = router

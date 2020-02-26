'use strict'

const route = require('express').Router()

const controller = require('./../controllers/ibushak')

route.get('/ibushak/get-phonelist', controller.get_phonelist)

module.exports = route
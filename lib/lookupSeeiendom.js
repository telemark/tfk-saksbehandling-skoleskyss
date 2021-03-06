'use strict'

var thru = require('thru')
var fixAddress = require('tfk-utils-fix-address-for-seeiendom')
var getGnrBnrAddress = require('./getGnrBnrAddress')
var VerboseLogger = require('./verboseLog')

var lookupSeeiendom = thru(function (itemString, callback) {
  var item = JSON.parse(itemString)
  var verboseLog = new VerboseLogger(item.verboseLog)
  verboseLog.log('lookupSeeiendom')

  if (item.registeredAddress) {
    verboseLog.log('lookupSeeiendom: starts')
    var query = fixAddress(item.registeredAddress.street + ', ' + item.registeredAddress.zip + ' ' + item.registeredAddress.city)
    if (item.registeredGnrBnrAddress) {
      verboseLog.log('lookupSeeiendom: will use gaardsnr/bruksnr')
      query = item.registeredGnrBnrAddress
    }
    getGnrBnrAddress(query, function (error, data) {
      verboseLog.log('lookupSeeiendom: finished lookup')
      if (error) {
        item.errors.push({
          method: 'lookupSeeiendom',
          error: error
        })
        verboseLog.log('lookupSeeiendom: finished with error - ' + error)
        verboseLog.log('lookupSeeiendom: will use original address')
        item.registeredAddressGeocoded = query
        return callback(null, JSON.stringify(item))
      } else {
        var lat = data.geocoded.lat
        var lng = data.geocoded.lng
        if (data.ID) {
          item.registeredAddressGeocoded = lat + ',' + lng
        } else {
          verboseLog.log('lookupSeeiendom: address not unique')
          verboseLog.log('lookupSeeiendom: will use original address')
          item.registeredAddressGeocoded = query
        }
        verboseLog.log('lookupSeeiendom: finished without errors')
        return callback(null, JSON.stringify(item))
      }
    })
  } else {
    verboseLog.log('lookupSeeiendom: no address found')
    return callback(null, itemString)
  }
})

module.exports = lookupSeeiendom

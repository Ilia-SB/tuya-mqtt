const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const utils = require('../lib/utils')

class GenericDevice extends TuyaDevice {
    init() {
        debug('Generic device init() for ' + this.toString())

        this.deviceData.mdl = 'Generic Device'

        // Check if custom template in device config
        if (this.config.hasOwnProperty('template')) {
            // Map generic DPS topics to device specific topic names
            debug('Applying template to ' + this.toString())
            this.deviceTopics = this.config.template
        } else {
            if(!this.config.persist) {
                // Try to get schema to at least know what DPS keys to get initial update
                debug('Getting schema for ' + this.toString())
                this.device.get({"schema": true})
            }
        }

        // Restore saved state
        super.restoreState()

        // Get initial states and start publishing topics
        this.getStates()
    }
}

module.exports = GenericDevice
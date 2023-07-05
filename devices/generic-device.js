const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const utils = require('../lib/utils')

class GenericDevice extends TuyaDevice {
    init() {
        debug('Generic device init()')
        this.deviceData.mdl = 'Generic Device'

        // Check if custom template in device config
        if (this.config.hasOwnProperty('template')) {
            // Map generic DPS topics to device specific topic names
            this.deviceTopics = this.config.template
        } else {
            // Try to get schema to at least know what DPS keys to get initial update
            this.device.get({"schema": true})
        }

        // Get initial states and start publishing topics
        this.getStates()
    }

    requestData(options) {
        debug('Requesting data for child: ' + options.toString())
        this.device.get(options);
    }
}

module.exports = GenericDevice
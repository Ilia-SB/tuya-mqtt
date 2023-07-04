const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const utils = require('../lib/utils')

class GenericPassiveSubDevice extends TuyaDevice {
    //Passive device like door sensor which is sleeping most of the time. No direct connection will be established
    //data will be passed from parent based on cid value.
    constructor(parent, deviceInfo) {
        super(deviceInfo);
        this.parent = parent;
        this.connected = false;
    }

    connectDevice() {
        this.connected = this.parent.connected;
    }

    monitorHeartbeat() {
        return;
    }

    setData(data) {
        debug('Received data from parent device ' + this.parent.options.id + ' ->', JSON.stringify(data.dps));
        this.updateState(data)
    }

    async init() {
        debug('Generic subdevice init()')
        this.deviceData.mdl = 'Generic Subdevice'

        // Check if custom template in device config
        if (this.config.hasOwnProperty('template')) {
            // Map generic DPS topics to device specific topic names
            this.deviceTopics = this.config.template
        } else {
            // Try to get schema to at least know what DPS keys to get initial update
            const result = await this.parent.device.get({schema: true, cid: this.subDevices})
            if (!utils.isJsonString(result)) {
                if (result === 'Schema for device not available') {
                    debug('Device id ' + this.config.id + ' failed schema discovery and no custom template defined')
                    debug('Cannot get initial DPS state data for device ' + this.options.name + ' but data updates will be publish')
                }
            }
        }

        // Get initial states and start publishing topics
        this.getStates()
    }
}

module.exports = GenericPassiveSubDevice
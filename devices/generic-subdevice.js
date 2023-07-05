const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const utils = require('../lib/utils')

class GenericPassiveSubDevice extends TuyaDevice {
    //Passive device like door sensor which is sleeping most of the time. No direct connection will be established
    //data will be passed from parent based on cid value.
    constructor(parent, deviceInfo) {
        super(deviceInfo);
        this.cid = deviceInfo.cid
        this.parent = parent;
        this.connected = false;
    }

    onConnected() {
        this.connected = true;
        debug('Connected to device ' + this.toString())
        this.publishMqtt(this.baseTopic + 'status', 'online')
        this.init()
    }

    onDisconnected() {
        this.connected = false;
        debug('Disconnected from device ' + this.toString())
        this.publishMqtt(this.baseTopic + 'status', 'offline')
    }

    monitorHeartbeat() {
        return;
    }

    onData(data) {
        debug('Received data from parent device ' + this.parent.options.id + ' ->', JSON.stringify(data.dps));
        this.updateState(data)
    }

    init() {
        debug('Generic passive subdevice init()')
        this.deviceData.mdl = 'Generic Subdevice'

        // Check if custom template in device config
        if (this.config.hasOwnProperty('template')) {
            // Map generic DPS topics to device specific topic names
            this.deviceTopics = this.config.template
        } else {
            // Try to get schema to at least know what DPS keys to get initial update
            this.requestData({schema: true})
        }

        // Get initial states and start publishing topics
        this.getStates()
    }

    requestData(options) {
        debug('RequestData for ' + this.toString())
        options.cid = this.cid
        debug(JSON.stringify(options))
        this.parent.requestData(options)
    }
}

module.exports = GenericPassiveSubDevice
const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const debugError = require('debug')('tuya-mqtt:error')
const utils = require('../lib/utils')
const fs = require('fs')

class GenericPassiveSubDevice extends TuyaDevice {
    //Passive device like door sensor which is sleeping most of the time. No direct connection will be established
    //data will be passed from parent based on cid value.
    constructor(parent, deviceInfo) {
        super(deviceInfo);
        this.cid = deviceInfo.configDevice.cid
        this.parent = parent;
        this.connected = false;
        if(deviceInfo.configDevice.persist) {
            this.persist = deviceInfo.configDevice.persist
        } else {
            this.persist = false;
        }
    }

    onConnected() {
        this.connected = true;
        debug('Connected to device ' + this.toString())
        this.publishMqtt(this.baseTopic + 'status', 'online')
        this.init()
    }

    onDisconnected() {
        if(this.connected) {
            this.connected = false;
            debug('Disconnected from device ' + this.toString())
            this.publishMqtt(this.baseTopic + 'status', 'offline')
        }
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
        
        // Restore saved state if needed
        if(this.persist) {
            try {
                dps = fs.readFileSync('./' + this.cid, 'utf8')
                this.dps = JSON.parse(dps)
                debug('Restored state for ' + this.toString())
                debug(dps)
            } catch (e) {
                debugError('Persist file not found!')
                debugError(e)
            }
        }

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

    processCommand(message, commandTopic) {
        debug('Passive subdevices do not accept commands')
        return
    }
}

module.exports = GenericPassiveSubDevice
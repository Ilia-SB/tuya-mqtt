const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const debugError = require('debug')('tuya-mqtt:error')
const debugCommand = require('debug')('tuya-mqtt:command')
const utils = require('../lib/utils')
const fs = require('fs')

class GenericSubDevice extends TuyaDevice {
    //Devices connected via Tuya hub. No direct connection is made. Data will be passed from parent based on cid value.
    //Passive devices like door sensor which are sleeping most of the time.
    constructor(parent, deviceInfo) {
        super(deviceInfo);
        this.cid = deviceInfo.configDevice.cid
        this.parent = parent;
        this.connected = false;
        this.isPassive = deviceInfo.configDevice.passive ? deviceInfo.configDevice.passive : false
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
        debug('Generic ' + (this.isPassive ? 'passive ' : '') + 'subdevice init() for ' + this.toString())
        this.deviceData.mdl = 'Generic Subdevice'

        // Check if custom template in device config
        if (this.config.hasOwnProperty('template')) {
            // Map generic DPS topics to device specific topic names
            debug('Applying template to ' + this.toString())
            this.deviceTopics = this.config.template
        } else {
            if(!this.config.persist) {
                if (!this.isPassive) {
                    // Try to get schema to at least know what DPS keys to get initial update
                    debug('Getting schema for ' + this.toString())
                    this.get({schema: true})
                } else {
                    debug('Passive device. Skipping initial update for ' + this.toString())
                }
            } else {
                debug('Persisted device, skipping initial update for ' + this.toString())
            }
        }

        // Restore saved state
        this.restoreState()

        // Get initial states and start publishing topics
        if(!this.isPassive) {
            this.getStates()
        }
    }

    get(options) {
        debug('RequestData for ' + this.toString())
        options.cid = this.cid
        debug(JSON.stringify(options))
        this.parent.get(options)
    }

    processCommand(message) {
        let command = message.toLowerCase()
        debugCommand('Received command: ', command)
        switch(command) {
            case 'get-states':
                this.getStates()
                break
            default:
                debugCommand('Invalid command')
        }
    }
}

module.exports = GenericSubDevice
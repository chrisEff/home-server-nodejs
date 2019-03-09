# Home Server

[![GitHub license](https://img.shields.io/github/license/chrisEff/home-server-nodejs.svg)](https://github.com/chrisEff/home-server-nodejs/blob/master/LICENSE)
[![Build Status](https://travis-ci.com/chrisEff/home-server-nodejs.svg?branch=master)](https://travis-ci.com/chrisEff/home-server-nodejs)
[![Coverage Status](https://coveralls.io/repos/github/chrisEff/home-server-nodejs/badge.svg?branch=master)](https://coveralls.io/github/chrisEff/home-server-nodejs?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/chrisEff/home-server-nodejs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/chrisEff/home-server-nodejs?targetFile=package.json)

This server provides a simple little REST API that allows you to
* control Ikea Trådfri lights by connecting to a Trådfri gateway
* switch 433 MHz radio controlled power outlets on and off 

## Requirements

If you want to control Ikea Trådfri lights, you'll need...
* at least one bulb (duh!)
* an Ikea Trådfri gateway, connected to the same network as the computer this software runs on

If you want to control 433 MHz power outlets, you'll need...
* a Raspberry Pi or similar device (something that has GPIO pins)
* a 433 MHz RF transmitter + receiver. e.g.:
  * https://www.amazon.com/dp/B00M2CUALS
  * https://www.amazon.de/dp/B00OLI93IC
* to connect both the transmitter and receiver to said Raspberry Pi, so some jumper wires could come in handy:
  * https://www.amazon.com/dp/B01LZF1ZSZ
  * https://www.amazon.de/dp/B01EV70C78
  
## Installation

* clone this repo with its submodules:
	```
	git clone --recursive git@github.com:chrisEff/home-server-nodejs.git
	```

* install the dependencies:
	```
	cd home-server-nodejs
	npm i --production
	```

* compile RPi_utils
	```
	cd 433Utils/RPi_utils
	make
	cd ../..
	```

* adjust `config.js` according to your needs

* allow node to bind ports < 1024:
	```
	npm run allow-portbind
	```
	
* start the server
	```
	npm start
	```

## Useful links

### Tradfri
* https://github.com/home-assistant/home-assistant/issues/10252
* https://learn.pimoroni.com/tutorial/sandyj/controlling-ikea-tradfri-lights-from-your-pi

### 433 Mhz
* https://www.einplatinencomputer.com/raspberry-pi-433-mhz-funksteckdose-schalten/
* https://tutorials-raspberrypi.de/raspberry-pi-funksteckdosen-433-mhz-steuern/

### Temperature Sensors
* https://learn.adafruit.com/adafruits-raspberry-pi-lesson-11-ds18b20-temperature-sensing?view=all


## coap-client Examples

### get PSK
coap-client -m post -u "Client_identity" -k "<KEY_FROM_GATEWAY>" -e '{"9090":"<IDENTITY>"}' "coaps://<GATEWAY_IP>:5684/15011/9063"

# get gateway details
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15011/15012"

### get list of device IDs
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15001"

### get list of group IDs
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15004"

### get device infos
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15001/<DEVICE_ID>"

### get group infos
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15004/<GROUP_ID>"

### turn bulb on
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "3311" : [{ "5850" : 1 }] }' "coaps://<GATEWAY_IP>:5684/15001/<DEVICE_ID>"

### turn bulb off
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "3311" : [{ "5850" : 0 }] }' "coaps://<GATEWAY_IP>:5684/15001/<DEVICE_ID>"

### set bulb to warm white
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "3311" : [{ "5706" : "efd275" }] }' "coaps://<GATEWAY_IP>:5684/15001/<DEVICE_ID>"

### rename bulb to "foobar"
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "9001" : "foobar" }' "coaps://<GATEWAY_IP>:5684/15001/<DEVICE_ID>"

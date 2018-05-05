# Home Server

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

### get list of device IDs
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15001"

### get list of group IDs
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15004"

### get device infos
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15001/65537"

### get group infos
coap-client -m get -u "<IDENTITY>" -k "<PSK>" "coaps://<GATEWAY_IP>:5684/15004/131073"

### turn bulb on
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "3311" : [{ "5850" : 1 }] }' "coaps://<GATEWAY_IP>:5684/15001/65537"

### turn bulb off
coap-client -m put -u "<IDENTITY>" -k "<PSK>" -e '{ "3311" : [{ "5850" : 0 }] }' "coaps://<GATEWAY_IP>:5684/15001/65537"

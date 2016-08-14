# Wunderlist Geektool

Very simple [GeekTool](http://www.tynsoe.org/v2/geektool/) script written in Node JS to display tasks from [Wunderlist](https://www.wunderlist.com/).

![](https://github.com/czerwonkabartosz/wunderlist-geektool/blob/master/screenshots/details.png?raw=true)

##Prerequisites
- install `nodejs` - https://nodejs.org/en/
- copy `script.js` file to your computer
- create Wunderlist access token and client id - https://developer.wunderlist.com/documentation/concepts/authorization
  - register their application - https://developer.wunderlist.com/apps/new (as `APP URL` and `AUTH CALLBACK URL` enter `http://localhost`)
  - create access token (you will find a button to do this) 

##Install
- use file `wunderlist-geektool.glet` to install
- change command from `/usr/local/bin/node /script.js access_token client_id` to `/usr/local/bin/node /path/to/script.js [enter_your_access_token] [enter_your_client_id]`

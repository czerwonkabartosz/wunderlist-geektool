# Wunderlist Geektool

Very simple [GeekTool](http://www.tynsoe.org/v2/geektool/) script written in Node JS to display tasks from [Wunderlist](https://www.wunderlist.com/).

![](https://github.com/czerwonkabartosz/wunderlist-geektool/blob/master/screenshots/details.png?raw=true)

##Usage
This script was created to use it with GeekTool, but can be easily use it also in the console.
###Command Line Use
```
./script.js access_token client_id
```


##Prerequisites
- install `nodejs` - https://nodejs.org/en/
- create Wunderlist access token and client id - https://developer.wunderlist.com/documentation/concepts/authorization
  - register their application - https://developer.wunderlist.com/apps/new (as `APP URL` and `AUTH CALLBACK URL` enter `http://localhost`)
  - create access token (you will find a button to do this) 

##Install
- use file `wunderlist-geektool.glet` to install
- change in command `access-token` and `client-id`
```
const ACCESS_TOKEN = ''; // here put your access token
const CLIENT_ID = ''; // here put your client id
```

##Credits and license
By [Bartosz Czerwonka](https://github.com/czerwonkabartosz) under the MIT license:

> Copyright (c) 2016 Bartosz Czerwonka

> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
# ednRewrite
a javascript rewrite of a python [app](https://gist.github.com/IamMusavaRibica/7498bb043a8f5a7af618fa2b7c9b96ba) that reads tests from [eDnevnik](https://ocjene.skole.hr/) and sends to webhook  
## setup
1. clone repo
2. have nodejs installed
3. `npm i` in root directory
4. rename `info.demo.json` and `webhook.demo.txt` to `info.json` and `webhook.txt` respectively
5. fill their information with your own
6. `node .` in root directory
7. its running now! it checks every 10 mins for new tests and sends them to webhook
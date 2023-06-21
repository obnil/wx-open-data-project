//
// api: https://developers.weixin.qq.com/minigame/dev/document/open-api/data/wx.getUserInfo.html
//
cc.Class({
    extends: cc.Component,

    properties: {
        contentFull: cc.Node,
        contentShort: cc.Node,
        selfNode: cc.Node,
        prefabFull: cc.Prefab,
        prefabShort: cc.Prefab,
        node_fullRank: cc.Node,
        node_shortRank: cc.Node,
    },

    start() {

        if (typeof wx === 'undefined') {
            return;
        }

        this.times = 0;
        this.date = '';

        wx.onMessage(data => {
            switch (data.type) {
                case 'updateCost':
                    this.setUserCloud();
                    break;
                case 'switchRoute':
                    this.setRankType(data.value);
                    this.initFriendInfo(data.value);
                    break;
                default:
                    break;
            }
        });
        this.initUserInfo();
    },

    setRankType(type) {
        this.node_fullRank.active = !!type
        this.node_shortRank.active = !type
        if (type) {
            // 形态1
            // 取子域中Canvas组件，并设置其宽高为设计尺寸
            this.node.parent.getComponent(cc.Canvas).designResolution = cc.size(540, 800);
            // 设置挂靠节点宽高为设计尺寸
            this.node.width = 540
            this.node.height = 800
        } else {
            // 形态2
            this.node.parent.getComponent(cc.Canvas).designResolution = cc.size(540, 350);
            this.node.width = 540
            this.node.height = 350

        }
    },
    setUserCloud() {
        if (this.isSameWeek(this.date, new Date().valueOf())) {
            this.times++;
        } else {
            this.times = 1;
        }
        this.date = String(new Date().valueOf());
        let kvTime = { "key": "times", "value": String(this.times) };
        let kvDate = { "key": "date", "value": this.date }
        new Promise((resolve, reject) => {
            wx.setUserCloudStorage({
                KVDataList: [kvTime, kvDate],
                success: res => {
                    resolve(res)
                },
                fail: err => {
                    console.log(err);
                    reject(err)
                }
            })
        })
    },
    initUserInfo(message) {
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            lang: 'zh_CN',
            success: (res) => {
                this.selfNickname = res.data[0].nickName;
                this.selfAvatar = res.data[0].avatarUrl;
            },
            fail: (res) => {
                reject(res)
            }
        });
        wx.getUserCloudStorage({
            keyList: ['times', 'date'],
            success: (res) => {
                this.times = res.KVDataList[0] ? parseInt(res.KVDataList[0].value) : 0;
                if (res.KVDataList[1] !== undefined) {
                    this.date = res.KVDataList[1].value;
                }
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    isSameWeek(old, now) {
        if (old === null || now === null) return false;
        var oneDayTime = 1000 * 60 * 60 * 24;
        var old_count = parseInt(+old / oneDayTime);
        var now_other = parseInt(+now / oneDayTime);
        return parseInt((old_count + 3) / 7) == parseInt((now_other + 3) / 7);
    },

    initFriendInfo(type) {
        wx.getFriendCloudStorage({
            keyList: ['times', 'date'],
            success: (res) => {
                if (type) {
                    this.contentFull.removeAllChildren();
                    this.selfNode.removeAllChildren();
                } else {
                    this.contentShort.removeAllChildren();
                }
                //过滤掉非本周的数据
                res.data = res.data.filter(item => item.KVDataList[1] !== undefined && this.isSameWeek(item.KVDataList[1].value, new Date().valueOf()));
                // 对数据进行排序
                res.data.sort((a, b) => {
                    if (a.KVDataList.length === 0 && b.KVDataList.length === 0) return 0;
                    if (a.KVDataList.length === 0) return 1;
                    if (b.KVDataList.length === 0) return -1;
                    return parseInt(b.KVDataList[0].value) - parseInt(a.KVDataList[0].value);
                });
                for (let i = 0; i < res.data.length; i++) {
                    this.createUserBlock(i + 1, res.data[i], type);
                }
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    createUserBlock(index, user, full) {
        let node;
        if (full) {
            node = cc.instantiate(this.prefabFull);
            node.parent = this.contentFull;
        } else {
            node = cc.instantiate(this.prefabShort);
            node.parent = this.contentShort;
        }

        // set nickName
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickname;

        // set times
        let timesLabel = node.getChildByName('times').getComponent(cc.Label);
        let times = user.KVDataList[0] ? parseInt(user.KVDataList[0].value) : 0;
        timesLabel.string = `${times}次`;

        // set rank
        let rankLabel = node.getChildByName('rank').getComponent(cc.Label);
        rankLabel.string = index;

        // set avatar
        cc.loader.load({ url: user.avatarUrl, type: 'png' }, (err, texture) => {
            if (err) console.error(err);
            let userIcon = node.getChildByName('userIcon').getComponent(cc.Sprite);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });

        if (user.nickname == this.selfNickname) {
            if (full) {
                let node = cc.instantiate(this.prefabFull);
                node.parent = this.selfNode;

                // set nickName
                let userName = node.getChildByName('userName').getComponent(cc.Label);
                userName.string = user.nickName || user.nickname;

                // set times
                let timesLabel = node.getChildByName('times').getComponent(cc.Label);
                let times = user.KVDataList[0] ? parseInt(user.KVDataList[0].value) : 0;
                timesLabel.string = `${times}次`;

                // set rank
                let rankLabel = node.getChildByName('rank').getComponent(cc.Label);
                rankLabel.string = index;

                // set avatar
                cc.loader.load({ url: user.avatarUrl, type: 'png' }, (err, texture) => {
                    if (err) console.error(err);
                    let userIcon = node.getChildByName('userIcon').getComponent(cc.Sprite);
                    userIcon.spriteFrame = new cc.SpriteFrame(texture);
                });
            }
        }
    }
});

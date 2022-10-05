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

        wx.onMessage(data => {
            switch (data.type) {
                case 'updateCost':
                    this.times++;
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
        let kvTime = { "key": "times", "value": String(this.times) };
        new Promise((resolve, reject) => {
            wx.setUserCloudStorage({
                KVDataList: [kvTime],
                success: res => {
                    this.content.removeAllChildren();
                    this.initFriendInfo();
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
        wx.getUserCloudStorage({
            keyList: ['times'],
            success: (res) => {
                this.times = res.KVDataList[0] ? parseInt(res.KVDataList[0].value) : 0;
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    initFriendInfo(type) {
        wx.getFriendCloudStorage({
            keyList: ['times'],
            success: (res) => {
                for (let i = 0; i < res.data.length; ++i) {
                    this.createUserBlock(i, res.data[i], type == 1);
                }
            },
            fail: (res) => {
                console.error(res);
            }
        });
    },

    createUserBlock(index, user, full) {
        console.log('user:', user);
        let node;
        if (full) {
            this.contentFull.removeAllChildren();
            node = cc.instantiate(this.prefabFull);
            node.parent = this.contentFull;
        } else {
            this.contentShort.removeAllChildren();
            node = cc.instantiate(this.prefabShort);
            node.parent = this.contentShort;
        }
        node.x = 0;

        // set nickName
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        userName.string = user.nickName || user.nickname;

        // set times
        let timesLabel = node.getChildByName('times').getComponent(cc.Label);
        let times = user.KVDataList[0] ? parseInt(user.KVDataList[0].value) : 0;
        timesLabel.string = `通关${times}次`;

        // set rank
        let rankLabel = node.getChildByName('rank').getComponent(cc.Label);
        rankLabel.string = index + 1;

        // set avatar
        cc.loader.load({ url: user.avatarUrl, type: 'png' }, (err, texture) => {
            if (err) console.error(err);
            let userIcon = node.getChildByName('userIcon').getComponent(cc.Sprite);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });
    }

});

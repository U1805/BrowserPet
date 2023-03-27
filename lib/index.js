const imgsize = 130
const textsize = 50

class Character {
    constructor() {
        this.x = $(window).width() / 2;
        this.y = $(window).height() - imgsize;
        this.state = "";
        this.dir = 1; // 是否水平反转
        this.isClimb = false;
        this.isFly = false;
        this.isDrag = false;
        this.observer = null;
    }

    generate() {
        var div = document.createElement("div");
        var text = document.createElement("div");
        var img = document.createElement("img");
        $(text)
            .attr("hidden", true)
            .addClass("marisa-txt")
            .css({ "position": "fixed", "left": this.x, "top": this.y - textsize, "z-index": 1010 });
        $(img)
            .attr({ src: API.getImgURL("img/shime1.png"), alt: "marisa" })
            .addClass("marisa")
            .css({ "position": "fixed", "left": this.x, "top": this.y, "z-index": 1010 })
            .on("dragover", (e) => { e.originalEvent.preventDefault() }) // 可拖放！
        $(div)
            .addClass("marisa-ext")
            .append([text, img])
        $("body")[0].append(div);
        this.state = "stand";
    }

    async action_(title, loop = true) {
        if (this.dir == -1) $(".marisa").css("transform", "rotateY(180deg)");
        else $(".marisa").css("transform", "rotateY(0deg)");
        var item = API.action_gif[title];
        // this.message(title,10000)
        this.state = title;
        while (1) {
            if (this.state != title) break;
            for (var frame of item) {
                if (this.state != title) break;
                $(".marisa")
                    .attr("src", API.getImgURL(`img/shime${frame[0]}.png`))
                    .css({ left: this.x + frame[1][0] * this.dir, top: this.y + frame[1][1] });
                this.x += frame[1][0] * this.dir;
                this.y += frame[1][1]
                await API.sleep(frame[2] * 30);
            }
            if (!loop) break;
        }
    }

    async action(list, isdir = true) {
        var state = this.isClimb
        while (1) {
            if (this.isClimb != state) break;
            var time = Math.random() * 7000 + 5000
            var title = list[Math.floor(Math.random() * list.length)]
            if (API.action_list.indexOf(title) == -1) continue;
            if (isdir) this.dir = (Math.random() < 0.7) ? 1 : -1;
            this.action_(title)
            await API.sleep(time)
        }
    }

    talk(list) {
        return list[Math.floor(Math.random() * list.length)]
    }

    climb() {
        var width = $(window).width()
        this.observer = new MutationObserver(async () => {
            console.log("Observer: ")
            console.log(this.x, this.y, this.isClimb, this.isDrag, this.state, this.isClimb)
            if (this.isClimb) {
                if (this.y <= 300) {
                    this.x = $(window).width() / 2;
                    this.y = 310;
                    this.action_("falling", false);
                    var continueFall = true;
                    while (continueFall && this.isClimb && !this.isDrag) {
                        $(".marisa").css("top", this.y + 10);
                        this.y += 10;
                        await API.sleep(40);
                        if (this.y > $(window).height() - imgsize) {
                            continueFall = false;
                        }
                    }
                    var title = (Math.random() < 0.7) ? "fallen2" : "fallen";
                    await this.action_(title, false)
                    this.isClimb = false;
                    await this.action("stand");
                }
            }
            else if (!this.isDrag) {
                if (this.x < 20) { // 爬左边
                    this.dir = 1
                    this.x = -25
                    this.isClimb = true
                    await this.action_("wall_moveup")
                    await this.action(API.action_list_wall, false)
                } else if (this.x > width - 120) { // 爬右边
                    this.dir = -1
                    this.x = width - 110
                    this.isClimb = true
                    await this.action_("wall_moveup")
                    await this.action(API.action_list_wall, false)
                }
            }

            $('.marisa-txt').css({ "left": this.x, "top": this.y - textsize }); // 对话框跟随
            $('.marisa-content').css({ "left": this.x + imgsize, "top": this.y });
        })
        this.observer.observe(document.getElementsByClassName("marisa")[0], { attributeFilter: ["style"] })
    }

    drag(temp_this, ee) {
        this.isDrag = true;
        var img = $(".marisa");
        var title;
        // switch status
        var title_temp = temp_this.state;
        title = (Math.random() < 0.5) ? "catch" : "resist"
        temp_this.action_(title);
        // drag and move
        var [mousex, mousey] = [ee.clientX, ee.clientY];
        var [imgx, imgy] = [img.position().left, img.position().top];
        img.mousemove((e) => {
            var [dx, dy] = [e.clientX - mousex, e.clientY - mousey];
            img.css({ "left": imgx + dx, "top": imgy + dy });
            temp_this.x = imgx + dx;
            temp_this.y = imgy + dy;
        })
        // falling down
        let falling = () => { }
        img.mouseup(falling = async () => {
            img.off("mousemove");
            this.x += this.dir * 100;
            temp_this.action_("falling", false)
            this.isClimb = false;
            while (temp_this.y < $(window).height() - imgsize) {
                img.css("top", temp_this.y + 10);
                temp_this.y += 10;
                await API.sleep(40);
            }
            title = (Math.random() < 0.7) ? "fallen2" : "fallen"
            await temp_this.action_(title, false)
            img.off("mouseup", falling);
            temp_this.isDrag = false;
            await temp_this.action_(title_temp);
        })
    }

    async message(content, ms = 2000) {
        $(".marisa-txt").attr("hidden", false).html(content)
        setTimeout(() => {
            $(".marisa-txt").attr("hidden", true)
        }, ms)
    }

    addDropListener() {
        $(".marisa").on("drop", () => {
            var timestamp = API.getTimeNow();
            var text = window.getSelection().toString();
            var obj = {};
            obj[timestamp] = text;
            chrome.storage.local.set(obj, () => {
                this.message("保存力！")
            });
        })
    }

    addClickListener() {
        var time;
        var temp_this = this;
        var timeStart;
        var timeEnd;
        $(".marisa").mousedown((e) => {
            e.preventDefault();
            timeStart = API.getTimeNow();
            timeEnd = API.getTimeNow();
            time = setInterval(function () {
                timeEnd = API.getTimeNow();
                // 长按 0.5s 触发 https://blog.csdn.net/sinat_31057219/article/details/60965045
                if (timeEnd - timeStart > 500) {
                    clearInterval(time);
                    temp_this.drag(temp_this, e);
                }
            }, 100);
        })
        var falling = {};
        $(".marisa").mouseup(falling = async() => {
            clearInterval(time);
            if (timeEnd - timeStart < 500) {
                // chrome.runtime.sendMessage({
                //     title : "放学别走",
                //     message: "你小子刚才点我了是吧！",
                //     ms: 5000
                //   }, res => {})
                // this.observer.takeRecords();
                // this.observer.disconnect();
                

                if (this.isClimb) {
                    this.x += this.dir * 100;
                    this.action_("falling", false)
                    this.isClimb = false;
                    while (this.y < $(window).height() - imgsize) {
                        $(".marisa").css("top", this.y + 10);
                        this.y += 10;
                        await API.sleep(40);
                        console.log(this.y);
                    }
                    var title = (Math.random() < 0.7) ? "fallen2" : "fallen"
                    $(".marisa").off("mouseup", falling);
                    await this.action_(title, false)
                }
                this.message(this.talk(API.sentence_list));
                // this.observer.observe(document.getElementsByClassName("marisa")[0], { attributeFilter: ["style"] })
                await this.action_("stand", false)
                this.action(API.action_list);
            }

        })
    }

    // addTwemojiListener() {
    //     try {
    //         var head = $("head")[0];
    //         var style = document.createElement("style");
    //         $(style).attr("id", "twemojiStyleNP");
    //         $(style).html(`/* twemoji styles */
    //             img.ext-emoji, .small-emoji {
    //                 height: 1em;
    //                 width: 1em;
    //                 margin: 0 .05em 0 .1em;
    //                 vertical-align: -0.1em;
    //                 display: inline-block;
    //                 border: none !important;
    //             }`);
    //         $(head).append(style);
    //     } catch {
    //         console.log("The <head> tag was not found.");
    //         return;
    //     }

    //     window.addEventListener("DOMContentLoaded", () => {
    //         twemoji.parse(document.body, {
    //             base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
    //             className: "ext-emoji",
    //         })
    //     })
    // }
}

var Marisa = new Character();
Marisa.generate();
Marisa.action(API.action_list);
Marisa.climb();
// Marisa.fly();
// Marisa.addTwemojiListener(); // 无效
Marisa.addDropListener();
Marisa.addClickListener();

// var marisa = $('.marisa');
//   var windowHeight = $(window).height();
//   var marisaHeight = marisa.height();
//   var marisaWidth = marisa.width();
//   var marisaLeft = marisa.offset().left;
//   var marisaTop = marisa.offset().top;
//   var marisaSpeed = 5;
//   var marisaDirection = 'left';

//   var moveMarisa = setInterval(function() {
//     console.log(marisaDirection, marisaLeft, marisaTop)
//     if (marisaDirection == 'left') {
//       if (marisaLeft > 0) {
//         marisaLeft -= marisaSpeed;
//         marisa.css('left', marisaLeft);
//       } else {
//         marisaDirection = 'up';
//       }
//     } else if (marisaDirection == 'up') {
//       if (marisaTop > 0) {
//         marisaTop -= marisaSpeed;
//         marisa.css('top', marisaTop);
//       } else {
//         marisaDirection = 'down';
//       }
//     } else if (marisaDirection == 'down') {
//       if (marisaTop+100 < windowHeight) {
//         marisaTop += marisaSpeed;
//         marisa.css('top', marisaTop);
//       } else {
//         clearInterval(moveMarisa);
//       }
//     }
//   }, 50);
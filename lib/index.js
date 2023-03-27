const imgsize = 130
const textsize = 50
var windowWidth = $(window).width();
var windowHeight = $(window).height();

class Character {
    constructor() {
        this.x = windowWidth / 2;
        this.y = windowHeight - imgsize;
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
            .attr({ id: "marisa-txt", hidden: "true" })
            .css({ "position": "fixed", "left": this.x, "top": this.y - textsize, "z-index": 1010 });
        $(img)
            .attr({ src: API.getImgURL("img/shime1.png"), alt: "marisa", id: "marisa" })
            .css({ "position": "fixed", "left": this.x, "top": this.y, "z-index": 1010 })
            .on("dragover", (e) => { e.originalEvent.preventDefault() }) // 可拖放！
        $(div)
            .attr({ id: "marisa-ext" })
            .append([text, img])
        $("body")[0].append(div);
        this.state = "stand";
    }

    // 优化卡顿：
    // 减少 jQuery 来查找元素的 DOM 操作
    // 避免不必要的计算，如字符串拼接、模运算
    // 使用更快的选择器，类选择器 -> ID选择器
    // 使用更快的定时器，setTimeout -> requestAnimationFrame
    // 避免全局变量 API，在函数内部将其存储为局部变量
    gif(title, loop = true, next = false) {
        this.state = title;
        var marisa = $("#marisa"), marisa_text = $('#marisa-txt')
        var thiss = this
        var frameArray = API.action_gif[title]
        var images = API.getImgarray(frameArray);

        var currentImage = 0;
        var isPlaying = true; // gif 播放
        var startTime = null;
        var frameDuration = frameArray[currentImage][2] * 30;
        var animationId; // 用于存储 requestAnimationFrame 的返回值

        function bar(timestamp) {
            if (thiss.dir == -1) marisa.css("transform", "rotateY(180deg)");
            else marisa.css("transform", "rotateY(0deg)");

            if (!startTime) startTime = timestamp;
            if (isPlaying && timestamp - startTime >= frameDuration) {
                // url = API.getImgURL(`img/shime${ API.action_gif[title][currentImage][0] }.png`)
                thiss.x += frameArray[currentImage][1][0] * thiss.dir
                thiss.y += frameArray[currentImage][1][1]
                marisa.attr('src', images[currentImage])
                    .css({ left: thiss.x, top: thiss.y });
                marisa_text.css({ left: thiss.x, top: thiss.y - textsize }); // 对话框跟随
                console.log(thiss.dir, thiss.x, thiss.y)
                // setTimeout(bar, API.action_gif[title][currentImage][2]*30);
                // currentImage = (currentImage + 1) % API.action_gif[title].length;
                currentImage++;
                if (currentImage == frameArray.length) {
                    if (!loop) { // 若不循环
                        isPlaying = false;
                        cancelAnimationFrame(animationId);
                        if (next) thiss.gif("stand");
                        return;
                    }
                    currentImage = 0;
                }
                frameDuration = frameArray[currentImage][2] * 30;
                startTime = timestamp;

                // 检查是否到达页面边界，自动暂停
                if (((thiss.x <= 30 || thiss.y <= -imgsize || thiss.x >= windowWidth - 120 || thiss.y >= windowHeight - 90)
                    && title != "wall_moveup" && title != "falling")
                    || (thiss.y <= -imgsize && title == "wall_moveup")
                    || (thiss.y >= windowHeight - imgsize && title == "falling")) {
                    isPlaying = false;
                    cancelAnimationFrame(animationId);
                    return;
                }
            }
            animationId = requestAnimationFrame(bar);
        }
        // bar();
        animationId = requestAnimationFrame(bar);
        thiss.climb();
        return function () { // 控制播放和暂停
            isPlaying = !isPlaying;
            if (!isPlaying) {
                cancelAnimationFrame(animationId);
            } else {
                animationId = requestAnimationFrame(bar);
            }
        }
    }

    action(list, randomDir = true) {
        var marisa = this;
        var interval = 100;
        var title = "rush";
        var toggle = marisa.gif(title);
        function scheduleNext() {
            if (randomDir) marisa.dir = (Math.random() < 0.7) ? 1 : -1;
            var timer = setTimeout(function () {
                if (marisa.state == "wall_moveup" || marisa.state == "falling") {
                    clearTimeout(timer);
                    return;
                }
                console.log(interval, title)
                toggle(); // 取消上一个动作
                toggle = marisa.gif(title); // 开始新动作
                title = list[Math.floor(Math.random() * list.length)]
                interval = Math.random() * 7000 + 5000;
                scheduleNext();
            }, interval);
        }
        scheduleNext();
    }

    climb() {
        var thiss = this
        var startTime = null;
        var state = 'left';

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            if (timestamp - startTime >= 100) {
                if (state == 'left') {
                    if (thiss.x <= 30 || thiss.x >= windowWidth - 120) {
                        state = 'up';
                    }
                } else if (state === 'up') {
                    if (thiss.y > -imgsize && thiss.state != "wall_moveup") {
                        thiss.x = -25
                        thiss.gif("wall_moveup")
                    } else if (thiss.y <= -imgsize) {
                        state = 'down';
                    }
                } else if (state === 'down') {
                    if (thiss.y < windowHeight - imgsize && thiss.state != "falling") {
                        thiss.x = windowWidth / 2;
                        thiss.gif("falling")
                    } else if (thiss.y >= windowHeight - imgsize) {
                        state = "left";
                        if (Math.random() < 0.7)
                            thiss.gif("fallen2", false, true);
                        else
                            thiss.gif("fallen", false, true);
                    }
                }
                startTime = timestamp;
            }
            requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    drag(temp_this, ee) {
        this.isDrag = true;
        var img = $("#marisa");
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
            await temp_this.action_(title, false);
            img.off("mouseup", falling);
            temp_this.isDrag = false;
            await temp_this.action_(title_temp);
        })
    }

    talk(list) {
        return list[Math.floor(Math.random() * list.length)]
    }

    async message(content, ms = 2000) {
        $("#marisa-txt").attr("hidden", false).html(content)
        setTimeout(() => {
            $("#marisa-txt").attr("hidden", true);
        }, ms)
    }

    addDropListener() {
        $("#marisa").on("drop", () => {
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
        $("#marisa").mousedown((e) => {
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
        $("#marisa").mouseup(falling = async () => {
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
                        $("#marisa").css("top", this.y + 10);
                        this.y += 10;
                        await API.sleep(40);
                        console.log(this.y);
                    }
                    var title = (Math.random() < 0.7) ? "fallen2" : "fallen"
                    $("#marisa").off("mouseup", falling);
                    await this.action_(title, false);
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
// Marisa.action(API.action_list);
// Marisa.climb();
// Marisa.fly();
// Marisa.addTwemojiListener(); // 无效
Marisa.addDropListener();
Marisa.addClickListener();
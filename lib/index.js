const imgsize = 130
const textsize = 50

class Character {
    constructor() {
        this.x = $(window).width() / 2;
        this.y = $(window).height() - imgsize;
        this.state = "";
        this.dir = 1; // 是否水平反转
        this.isClimb = false;
    }

    generate() {
        var div = document.createElement("div");
        var text = document.createElement("div");
        var img = document.createElement("img");
        var content = document.createElement("div");
        var button1 = document.createElement("div");
        var button2 = document.createElement("div");
        var button3 = document.createElement("div");
        var button4 = document.createElement("div");
        $(text)
            .attr("hidden", true)
            .addClass("marisa-txt")
            .css({ "position": "fixed", "left": this.x, "top": this.y - textsize, "z-index": 1010 });
        $(img)
            .attr({ src: API.getImgURL("img/shime1.png"), alt: "marisa" })
            .addClass("marisa")
            .css({ "position": "fixed", "left": this.x, "top": this.y, "z-index": 1010 })
            .on("dragover", (e) => { e.originalEvent.preventDefault() }) // 可拖放！
        $(content)
            .append([button1, button2, button3, button4])
            .addClass("marisa-content")
            .css({ "position": "fixed", "left": this.x + imgsize, "top": this.y, "z-index": 1010 });
        $([button2, button3, button4]).html("🔘")
        $(button1)
            .html("💖")
            .addClass("button1")
        $(div)
            .addClass("marisa-ext")
            .append([text, img, content])
        $("body")[0].append(div);
        this.state = "stand";
    }

    async action_(title, loop = true) {
        if (this.dir == -1) $(".marisa").css("transform", "rotateY(180deg)");
        else $(".marisa").css("transform", "rotateY(0deg)");
        var item = API.action_gif[title];
        // var [witdh, height] = [$(window).width(), $(window).height()]
        this.state = title;
        while (1) {
            if (this.state != title) break;
            for (var frame of item) {
                if (this.state != title) break;
                $(".marisa")
                    .attr("src", API.getImgURL(`img/shime${frame[0]}.png`))
                    .css({ left: this.x + frame[1][0] * this.dir, top: this.y + frame[1][1] });
                // this.x = (this.x + frame[1][0] * this.dir + witdh) % witdh;
                // this.y = (this.y + frame[1][1] + height) % height;
                this.x += frame[1][0] * this.dir;
                this.y += frame[1][1]
                await API.sleep(frame[2] * 30);
            }
            if (!loop) break;
        }
    }

    async action(list, isdir = true,) {
        var state = this.isClimb
        while (1) {
            if (this.isClimb != state) break;
            var time = Math.random() * 7000 + 5000
            var title = list[Math.floor(Math.random() * list.length)]
            if (isdir) this.dir = (Math.random() < 0.7) ? 1 : -1;
            // console.log(title, time, this.dir)
            this.action_(title)
            await API.sleep(time)
        }
    }

    async message(content, ms = 1000) {
        $(".marisa-txt").attr("hidden", false).html(content)
        setTimeout(() => {
            $(".marisa-txt").attr("hidden", true)
        }, ms)
    }

    climb() {
        var width = $(window).width()
        const observer = new MutationObserver(async () => {
            if (this.x < 20 && !this.isClimb) {
                this.dir = 1
                this.x = -25
                this.isClimb = true
                await this.action_("wall_moveup")
                await this.action(API.action_list_wall, false)
            } else if (this.x > width - 120 && !this.isClimb) {
                this.dir = -1
                this.x = width - 110
                this.isClimb = true
                await this.action_("wall_moveup")
                await this.action(API.action_list_wall, false)
            }
            $('.marisa-txt').css({ "left": this.x, "top": this.y - textsize });
            $('.marisa-content').css({ "left": this.x + imgsize, "top": this.y });
        })
        observer.observe(document.getElementsByClassName("marisa")[0], { attributeFilter: ["style"] })
    }

    // addClickListener() { // bug：click 的时候不会继续选择！
    //     $(".button1").mouseup(async (e) => {

    //     })
    // }

    addDropListener() {
        $(".marisa").on("drop", () => {
            var time = new Date();
            var timestamp = time.getTime();
            var text = window.getSelection().toString();
            var obj = {};
            obj[timestamp] = text;
            chrome.storage.local.set(obj, () => {
                this.message("保存力！")
                console.log(timestamp, text)
            });
        })
    }

    addDragListener() {
        var img = $(".marisa");
        var title;
        img.mousedown((e) => {
            var title_temp = this.state;
            title = (Math.random() < 0.5) ? "catch" : "resist"
            this.action_(title);
            e.preventDefault();
            var [mousex, mousey] = [e.clientX, e.clientY];
            var [imgx, imgy] = [img.position().left, img.position().top];
            img.mousemove((e) => {
                var [dx, dy] = [e.clientX - mousex, e.clientY - mousey];
                img.css({ "left": imgx + dx, "top": imgy + dy });
                this.x = imgx + dx;
                this.y = imgy + dy;
            })
            img.mouseup(async () => {
                img.off("mousemove");
                this.action_("falling", false)
                while (this.y < $(window).height() - imgsize) {
                    img.css("top", this.y + 20);
                    this.y += 20;
                    await API.sleep(80)
                }
                title = (Math.random() < 0.7) ? "fallen2" : "fallen"
                await this.action_(title, false)
                if (this.isClimb) {
                    this.isClimb = false;
                    await this.action("stand");
                } else {
                    await this.action_(title_temp);
                }
            })
        })
    }

    addTwemojiListener() {
        try {
            var head = $("head")[0];
            var style = document.createElement("style");
            $(style).attr("id", "twemojiStyleNP");
            $(style).html(`/* twemoji styles */
                img.ext-emoji, .small-emoji {
                    height: 1em;
                    width: 1em;
                    margin: 0 .05em 0 .1em;
                    vertical-align: -0.1em;
                    display: inline-block;
                    border: none !important;
                }`);
            $(head).append(style);
        } catch {
            console.log("The <head> tag was not found.");
            return;
        }

        window.addEventListener("DOMContentLoaded", () => {
            twemoji.parse(document.body, {
                base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
                className: "ext-emoji",
            })
        })
    }
}

var Marisa = new Character();
Marisa.generate();
Marisa.action(API.action_list);
Marisa.climb();
// Marisa.addClickListener();
Marisa.addDragListener();
// Marisa.addTwemojiListener();
Marisa.addDropListener();
// Marisa.addClickListener();
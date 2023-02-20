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
    }

    generate() {
        var div = document.createElement("div");
        var text = document.createElement("div");
        var img = document.createElement("img");
        // var content = document.createElement("div");
        // var button1 = document.createElement("div");
        // var button2 = document.createElement("div");
        // var button3 = document.createElement("div");
        // var button4 = document.createElement("div");
        $(text)
            .attr("hidden", true)
            .addClass("marisa-txt")
            .css({ "position": "fixed", "left": this.x, "top": this.y - textsize, "z-index": 1010 });
        $(img)
            .attr({ src: API.getImgURL("img/shime1.png"), alt: "marisa" })
            .addClass("marisa")
            .css({ "position": "fixed", "left": this.x, "top": this.y, "z-index": 1010 })
            .on("dragover", (e) => { e.originalEvent.preventDefault() }) // 可拖放！
        // $(content)
        //     .append([button1, button2, button3, button4])
        //     .addClass("marisa-content")
        //     .css({ "position": "fixed", "left": this.x + imgsize, "top": this.y, "z-index": 1010 });
        // $([button2, button3, button4]).html("🔘")
        // $(button1)
        //     .html("💖")
        //     .addClass("button1")
        $(div)
            .addClass("marisa-ext")
            .append([text, img, /*content*/])
        $("body")[0].append(div);
        this.state = "stand";
    }

    async action_(title, loop = true) {
        if (this.dir == -1) $(".marisa").css("transform", "rotateY(180deg)");
        else $(".marisa").css("transform", "rotateY(0deg)");
        var item = API.action_gif[title];
        this.message(title,10000)
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
            if(API.action_list.indexOf(title)==-1) continue;
            if (isdir) this.dir = (Math.random() < 0.7) ? 1 : -1;
            // console.log(title, time, this.dir)
            this.action_(title)
            await API.sleep(time)
        }
    }

    climb() {
        var width = $(window).width()
        const observer = new MutationObserver(async () => {
            if (this.x < 20 && !this.isClimb) { // 爬左边
                this.dir = 1
                this.x = -25
                this.isClimb = true
                await this.action_("wall_moveup")
                await this.action(API.action_list_wall, false)
            } else if (this.x > width - 120 && !this.isClimb) { // 爬右边
                this.dir = -1
                this.x = width - 110
                this.isClimb = true
                await this.action_("wall_moveup")
                await this.action(API.action_list_wall, false)
            // } else if(this.y <= 100 && this.isClimb){ // 爬到顶掉下来 // TODO
            //     this.x += this.dir*100;
            //     this.action_("falling", false)
            //     this.isClimb = false;
            //     while (this.y < $(window).height() - imgsize) {
            //         $(".marisa").css("top", this.y + 10);
            //         this.y += 10;
            //         await API.sleep(40);
            //         console.log(this.x, this.y);  
            //     }
            //     var title = (Math.random() < 0.7) ? "fallen2" : "fallen";
            //     await this.action_(title, false)
            //     this.isClimb = false;
            //     await this.action("stand");
            }
            $('.marisa-txt').css({ "left": this.x, "top": this.y - textsize }); // 对话框跟随
            $('.marisa-content').css({ "left": this.x + imgsize, "top": this.y });
        })
        observer.observe(document.getElementsByClassName("marisa")[0], { attributeFilter: ["style"] })
    }

    // fly() { // TODO
    //     const observer = new MutationObserver
    //     setInterval(()=>{
    //         if(this.y <= 50 && !this.isFly){
    //             this.fly = true;
    //             if(this.dir == 1){
    //                 this.dir = -1;
    //                 this.x = 100;
    //                 this.action_("ceiling_stay", false);
    //             }
    //             console.log("fly!!");
    //         }
    //     },1000)
    // }

    drag(temp_this, ee) {
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
        let falling = ()=>{}
        img.mouseup(falling = async()=>{
            var t = API.getTimeNow();
            img.off("mousemove");
            this.x += this.dir*100;
            this.isClimb = false;
            console.log(this.x, this.y);  
            temp_this.action_("falling", false)
            while (temp_this.y < $(window).height() - imgsize) {
                img.css("top", temp_this.y + 10);
                temp_this.y += 10;
                await API.sleep(40);
                console.log(t);
            }
            title = (Math.random() < 0.7) ? "fallen2" : "fallen"
            await temp_this.action_(title, false)
            img.off("mouseup", falling);
            await temp_this.action_(title_temp);
        })        
    }

    async message(content, ms = 1000) {
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
            console.log(1,obj);
            chrome.storage.local.set(obj, () => {
                this.message("保存力！")
                console.log(2,timestamp, text)
            });
        })
    }

    addClickListener(){
        var time;
        var temp_this = this;
        var timeStart;
        var timeEnd;
        $(".marisa").mousedown((e)=>{
            e.preventDefault();
            timeStart = API.getTimeNow();
            timeEnd = API.getTimeNow();
            time = setInterval(function () {
                timeEnd = API.getTimeNow();
                if (timeEnd - timeStart > 500) { // 长按 0.5s 触发 https://blog.csdn.net/sinat_31057219/article/details/60965045
                    clearInterval(time);

                    temp_this.drag(temp_this, e); 
                }
            }, 100);
        })
        $(".marisa").mouseup(()=>{
            clearInterval(time);
            if (timeEnd - timeStart < 500){
                chrome.storage.local.get(null, (result) => {
                    console.log(3, result)
                });
                this.message("sb");
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
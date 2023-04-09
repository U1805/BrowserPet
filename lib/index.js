const imgsize = 130
const textsize = 50

class Character {
    constructor() {
        this.x = $(window).width() / 2;
        this.y = $(window).height() - imgsize;
        this.state = "";
        this.isPlay = true; // gif 播放
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
            .on("dragover", (e) => { e.originalEvent.preventDefault() }) // 可拖放！
        $("body")[0].append(div);
        this.state = "stand";
    }

    // 优化卡顿：
    // 减少 jQuery 来查找元素的 DOM 操作
    // 避免不必要的计算，如字符串拼接、模运算
    // 使用更快的选择器，类选择器 -> ID选择器
    // 使用更快的定时器，setTimeout -> requestAnimationFrame
    // 避免全局变量 API，在函数内部将其存储为局部变量
    gif(title, loop = true, dir=1, callback) {
        this.state = title;
        this.isPlay = true;
        var marisa_img = $("#marisa"), marisa_text = $('#marisa-txt');
        var marisa = this;
        var state_tmp = title;
        var frameArray = API.action_gif[title];
        var images = API.getImgarray(frameArray);

        var currentImage = 0;
        var startTime = null;
        var frameDuration = frameArray[currentImage][2] * 30;
        var animationId = requestAnimationFrame(bar);
        
        function bar(timestamp) {
            if (dir == -1) marisa_img.css("transform", "rotateY(180deg)");
            else marisa_img.css("transform", "rotateY(0deg)");

            if (!startTime) startTime = timestamp;
            if (timestamp - startTime >= frameDuration) {
                marisa.x += frameArray[currentImage][1][0] * dir
                marisa.y += frameArray[currentImage][1][1]

                var w = $(window).width
                if(marisa.x <= 0) marisa.x = w;
                else if(marisa.x >= w) marisa.x = 0;

                marisa_img.attr('src', images[currentImage])
                    .css({ left: marisa.x, top: marisa.y });
                marisa_text.css({ left: marisa.x, top: marisa.y - textsize }); // 对话框跟随
                
                console.log(dir, marisa.x, marisa.y)
                currentImage++;
                if (currentImage == frameArray.length) currentImage = 0;
                frameDuration = frameArray[currentImage][2] * 30;
                startTime = timestamp;
            }
            if (!loop && callback) callback();
            if (loop && marisa.isPlay && marisa.state==state_tmp) {
                animationId = requestAnimationFrame(bar);
            }
            else {
                cancelAnimationFrame(animationId);
            }
            
        }
    }

    playSequentialGif(gifTitles) {
        let index = 0;
        let playNextGif = () => {
            if (index < gifTitles.length) {
                let loop = false;
                if (index === gifTitles.length - 1) {
                    // 如果是最后一个 gif，则设置为循环播放
                    loop = true;
                }
                this.gif(gifTitles[index], loop, playNextGif);
                index++;
            }
        }
        playNextGif();
    }

    action(titleArray) {
        var marisa = this
        let intervalId = setInterval(function() {
          if (marisa.isPlay === false) {
            clearInterval(intervalId);
            return;
          }
          var title = titleArray[Math.floor(Math.random() * titleArray.length)];
          if(marisa.state != title) marisa.gif(title);
        }, Math.floor(Math.random() * 3000) + 5000); // random interval between 5 to 7 seconds
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

    addClickListener() {
        $("#marisa").mouseup(()=>{
            this.message(this.talk(API.sentence_list));
        })
    }
}

var Marisa = new Character();
Marisa.generate();
Marisa.action(API.action_list);
// Marisa.addDropListener();
Marisa.addClickListener();
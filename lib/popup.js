var input = document.getElementById("input");

function s2d(str) {
    return document.createRange().createContextualFragment(str);
}

function copyText(val) {
    input.value = document.getElementById(val).innerHTML; // 修改文本框的内容
    input.select(); // 选中文本
    document.execCommand("copy", true); // 执行浏览器复制命令
    alert("复制成功");
};

function load(){
    chrome.storage.local.get(null, (items)=>{
            var keys = Object.keys(items);
            for(let key of keys){
                chrome.storage.local.get(key, (result)=>{
                    let dom = s2d(`<div class="wrapper">
                            <span id="${ key }" class="text">${ result[key] }</span>
                            <p class="btn">copy</p>
                        </div>`)
                    let btn = dom.lastElementChild.lastElementChild;
                    document.body.appendChild(dom);
                    console.log(btn)
                    $(btn).click(()=>{
                        input.value = $(`#${ key }`).text();
                        input.select();
                        document.execCommand("copy", true); // 执行浏览器复制命令
                        alert("复制成功");
                    })
                    // $(this).click(copyText())
                })
            }
    })
}

load();
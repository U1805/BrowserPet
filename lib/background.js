chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  console.log("inputChanged: " + text);
  if (!text) return;
  if (text == "chat"){
    suggest([
      { content:"chatMarisa", description:"来聊天叭" },
      { content:"chatGPT", description:"去chatGPT官网" }
    ])
  }
});
// 当用户接收关键字建议时触发
chrome.omnibox.onInputEntered.addListener((text) => {
  if (!text) return;
  var href = "";
  if(text == "chatGPT") href = "https://chat.openai.com/chat";
  else if (text.startsWith("chat")) href = "../chat/chat.html";
  openUrlCurrentTab(href);
});
// 获取当前选项卡ID
function getCurrentTabId(callback)
{
 chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
 {
 if(callback) callback(tabs.length ? tabs[0].id: null);
 });
}
// 当前标签打开某个链接
function openUrlCurrentTab(url)
{
 getCurrentTabId(tabId => {
 chrome.tabs.update(tabId, {url: url});
 })
}

function send_notification(title = " ", message = "Auto Recode Start · · ·", ms = 5000) {
  chrome.notifications.create("id", {
    type: "basic",
    title: title,
    message: message,
    iconUrl: "../img/icon.png",
  });

  var timer = setTimeout(function (e) { //清理对应id的通知
    chrome.notifications.clear("id");
    clearTimeout(timer);
  }, ms);
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  var title = req.title;
  var message = req.message;
  var ms = req.ms;
  send_notification(title, message, ms);
});
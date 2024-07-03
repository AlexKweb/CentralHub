const telegramApi = require('node-telegram-bot-api');
const libqp = require('libqp');
const nodemon = require('nodemon')
const process = require('node:process');
const Imap = require('imap'),
  inspect = require('util').inspect;
// import { Buffer } from 'node:buffer';

var fs = require('fs'), fileStream;
const { buttons, buttonsEdit, changeDevice, buttonsWithoutChangedevice, buttonsEditWithoutCloseReq, buttonsRef } = require('./options');
const { users, usersChatId } = require('./users');
let text;
// const BOT_TOKEN = ''; testbot
const BOT_TOKEN = '';
const bot = new telegramApi(BOT_TOKEN, { polling: true });
let chatIdTsiukhai = '';
let chatIdRatkevich = '';
var imap = new Imap({
  user: '',
  password: '',
  host: '',
  port: 993,
  tls: true
});

function openInbox(cb) {
  imap.openBox('fardesk', false, cb);
}


imap.once('ready', function () {
  openInbox(function (err, box) {
    if (err) throw err;
    setInterval(() => {
      imap.search(['UNSEEN'], function (err, results) {
        if (err) throw err;
        fetchIMAP(results)
      });
    }, 300000);//300000
    // imap.search(['UNSEEN'], function (err, results) {
    //   if (err) throw err;
    //   fetchIMAP(results)
    // });
  });
});

imap.once('error', function (err) {
  // console.log(err, 'serror');
});

imap.once('end', function () {
  // console.log('Connection ended');
});

imap.connect();


// bot.on('message', async msg =>{
//     const chatId = msg.chat.id;
//     console.log(msg)
// })
bot.on('callback_query', async msg => {
  console.log(msg)
  const ac = new AbortController();
  const listResponsClose = (response) => { responseCloseReq(response, msg, listResponsClose) };
  const listResponsDevice = (response) => responseChangeDevice(response, msg, listResponsDevice);
  const data = msg.data;
  const chatId = msg.message.chat.id;
  const messageId = msg.message.message_id;
  let text = msg.message.text;
  // console.log(text)
  // console.log(msg, 'msg')
  let arrayKeyboard = msg.message.reply_markup.inline_keyboard[0];
  if (data === '1') {

    bot.editMessageReplyMarkup(buttonsRef['reply_markup'], { chat_id: chatId, message_id: messageId });


    bot.sendMessage(chatId, 'Отправьте сообщение с закрытием заявки');

    bot.on('message', listResponsClose)
  }
  if (data === '2') {
    let changedevice = 'Введите следующую информацию: Идентификационный номер'
    bot.sendMessage(chatId, changedevice)
    bot.on('message', listResponsDevice);
    bot.editMessageReplyMarkup(buttonsRef['reply_markup'], { chat_id: chatId, message_id: messageId });

  }

})

async function responseCloseReq(response, msgCloseReq, listRespons) {
  let reg = /[\r\n\t\f]+/g;
  let textEditStrike = '<strike>' + msgCloseReq.message.text + '</strike>';
  let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0,msgCloseReq.message.text.indexOf('Title')).replaceAll(reg,'')}&c[menu]=UserRequest%3AOpenRequests`;

  bot.sendMessage(chatIdTsiukhai, `Заявка: [${msgCloseReq.message.text.substring(0,msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${usersChatId[response.chat.id]}](tg://user?id=${response.chat.id}). Текст: ${response.text}`,{parse_mode: 'Markdown'});

  bot.sendMessage(chatIdRatkevich, `Заявка: [${msgCloseReq.message.text.substring(0,msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${usersChatId[response.chat.id]}](tg://user?id=${response.chat.id}). Текст: ${response.text}`,{parse_mode: 'Markdown'});

  bot.sendMessage(, `Заявка: [${msgCloseReq.message.text.substring(0,msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${usersChatId[response.chat.id]}](tg://user?id=${response.chat.id}). Текст: ${response.text}`,{parse_mode: 'Markdown'});
  // bot.sendMessage(,response.text);
  bot.editMessageText(textEditStrike, { chat_id: msgCloseReq.message.chat.id, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' })
  bot.removeListener('message', listRespons)
}
async function responseChangeDevice(response, msg, listRespons) {
  console.log(msg)
  const chatId = response.chat.id;
  let s = response.text
  bot.sendMessage(chatId, s, changeDevice);
  bot.on('edited_message_text', editMessageChange)
  bot.removeListener('message', listRespons);

  if (s.length !== 8) {
    bot.sendMessage(chatId, 'Номер должен быть 8 символов, измените ваше сообщение');
    bot.on('callback_query', (response) => { msA(response, msg) });
  }
  else{
    bot.on('callback_query', (response) => { msA(response, msg) });
  }

}

async function editMessageChange(s) {
  bot.deleteMessage(s.chat.id, s['message_id'] + 1)
  bot.editMessageText(s.text, { chat_id: s.chat.id, message_id: s['message_id'] + 2, reply_markup: changeDevice.reply_markup })
}
async function msA(response, msg) {
  console.log(msg)
  let reg = /[\r\n\t\f]+/g;
  const dataA = response.data;
  let textEditStrike = '<strike>' + msg.message.text + '</strike>';
  const messageAId = response.message.message_id;
  const chatId = response.message.chat.id;
  // console.log(msg)
  if (dataA === 'OK') {
    bot.editMessageReplyMarkup({}, { chat_id: chatId, message_id: messageAId });
    bot.sendMessage(chatId, 'prinyuto');
    bot.removeListener('edited_message_text', editMessageChange);
    bot.editMessageText(textEditStrike, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' })
    bot.sendMessage(, `Произведена замена оборудования кем:${usersChatId[msg.message.chat.id]}. ${msg.message.text.substring(0, msg.message.text.indexOf('Title'))} Идентификационный номер: ${response.message.text}`);
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msg.message.text.substring(0,msg.message.text.indexOf('Title')).replaceAll(reg,'')}&c[menu]=UserRequest%3AOpenRequests`;

    bot.sendMessage(chatIdTsiukhai, `Произведена замена оборудования кем: [${usersChatId[msg.message.chat.id]}](tg://user?id=${msg.message.chat.id}). [${msg.message.text.substring(0,msg.message.text.indexOf('Title'))}](${url}) Идентификационный номер: ${response.message.text}`,{parse_mode: 'Markdown'});
    bot.sendMessage(chatIdRatkevich, `Произведена замена оборудования кем: [${usersChatId[msg.message.chat.id]}](tg://user?id=${msg.message.chat.id}). [${msg.message.text.substring(0,msg.message.text.indexOf('Title'))}](${url}) Идентификационный номер: ${response.message.text}`,{parse_mode: 'Markdown'});
  }
}

function fetchIMAP(results) {
  try {
    var f = imap.fetch(results, { bodies: '' });
    f.on('message', function (msg, seqno) {

      var prefix = '(#' + seqno + ') ';
      msg.on('body', function (stream, info) {
        // console.log(prefix + 'Body');

        let decoder = new libqp.Decoder();
        stream.on('data', function (chunk) {

          let s = new Buffer.from(chunk).toString('utf8');

          let textMessage = '';
          let textSend = '';
          let textObj = '';
          let regex = /[\r\n\t\f]+/g;
          let regexSpan = /(<span.*?>)/g;
          let regexTable = /(<table.*?>)/g;
          text = libqp.decode(s).toString('utf8');
          // console.log(text)
          // console.log(text)
          text = text.substring(text.indexOf('<body>'), text.indexOf('</body>') - 7) + '}';
          
          text = text.substring(0 , text.length-2) + '}';

          text = text.replaceAll('"', '\'');
          
          let a = text.replace(regex, '');
          a = a.replace(regexTable, '').replaceAll('<tbody>', '').replaceAll('<tr>', '').replaceAll('<td>','').replaceAll('</td>','').replaceAll('</tr>','').replaceAll('</tbody>', '').replaceAll('</table>','');
          textMessage = a.replace(regex, '').replace('<body>', '{').replace('</body>', '}').replaceAll('<br>', '').replaceAll('</p>', '').replaceAll('</span>', '').replaceAll('<p>', '').replaceAll('[', '"').replaceAll(' ]', '"').replaceAll(']', '"').replaceAll(' "', '').replace(regexSpan, '.');
        

          // bot.sendMessage('', textMessage);
          
          if(a.indexOf('Конопелько Илья, Вам назначен новый запрос') != -1){
            console.log('my request')
          }
          else{
            try{
              textObj = JSON.parse(textMessage);
              if(textObj === undefined){
                throw new Error ('что-то пошло не так')
              }
              let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${textObj['Ticket']}&c[menu]=UserRequest%3AOpenRequests`;
              textSend = `[${textObj['Ticket']}](${url})\nTitle: ${textObj['Title']}\nCaller company: ${textObj['Caller company']}\nDevice serial: ${textObj['Device serial']}\nDevice address: ${textObj['Device address']}\nDescription: ${textObj['Description']}`

            }
            catch(err){
              textSend = err.message

            }

          }
          // console.log(JSON.parse(textMessage))
          
          try{
            if(users[textObj['Agent']]){
              bot.on("polling_error", (msg) => console.log(msg));
              bot.sendMessage(users[textObj['Agent']], textSend, { reply_markup: buttons.reply_markup, parse_mode: 'Markdown' });
              console.log(bot.errors());
              // bot.sendMessage('', textSend, buttons, { parse_mode: 'Markdown' });
            }
            else{
              throw new Error('chatId not define')
            }
          }
          catch(err){
            bot.sendMessage('', a + err.message);
          } 
          
        })
      });
      // console.log(text)
      msg.once('attributes', function (attrs) {
        // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
      });
      msg.once('end', function () {
        // console.log(prefix + 'Finished');
      });
    });
    f.once('error', function (err) {
      console.log('Fetch error: ' + err);
    });
    // f.once('end', function () {
    //   console.log('Done fetching all messages!');
    //   imap.end();
    // });
    imap.setFlags(results, ['\\Seen'], function (err) {
      if (!err) {
        // console.log("marked as read");
      } else {
        // console.log(JSON.stringify(err, null, 2));
      }
    });
  }
  catch (err) {
    // imap.end();
    // console.log(err + '')
  }
}


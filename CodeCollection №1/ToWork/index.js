const telegramApi = require('node-telegram-bot-api'); // Модуль для работы с Telegram Bot API
const libqp = require('libqp'); // Модуль для работы с Quoted-Printable кодировкой
const nodemon = require('nodemon'); // Модуль для автоматического перезапуска Node.js сервера при изменениях
const process = require('node:process'); // Модуль для работы с процессами в Node.js
const Imap = require('imap'); // Модуль для работы с IMAP
const { inspect } = require('util'); // Утилита для преобразования объектов в строку для отладки
var fs = require('fs'), fileStream; 
const { buttons, buttonsEdit, changeDevice, buttonsWithoutChangedevice, buttonsEditWithoutCloseReq, buttonsRef, zakritZaivkiakritZaivki, zakritZaivki, kartreader, podemenBACK, svernut, to, printer, sviaz, video, kartreaderBACK, cancel, videoBACK, sviazBACK, printerBACK } = require('./options'); // Опции для кнопок
//const { users, usersChatId } = require('./users'); // Информация о пользователях
// Константа для работы с Telegram Bot; тестовый токен закомментирован
const BOT_TOKEN = '7113415649:AAF20ZaZV3V1seUv-Lud7tigNukC-eTD4Tk'; //testbot const BOT_TOKEN2 = '7310883694:AAG6fKYcvvATDIjVZmOZkDIahHld5YgzHBQ'  ; // Токен вашего Telegram Bot
const bot = new telegramApi(BOT_TOKEN, { polling: true });// Создание экземпляра Telegram Bot
let chatId = '1440654064'
let chatIdTsiukhai = '1440654064'; // Идентификатор чата для Tsiukhai 1440654064
let chatIdRatkevich = '91211691'; // Идентификатор чата для Ratkevich 91211691
var imap = new Imap({ // Настройки для подключения к IMAP серверу
    user: 'sashaklimovking@outlook.com', // Логин для IMAP
    password: '94699203o', // Пароль для IMAP
    host: 'imap.outlook.com', // Хост IMAP сервера
    port: 993, // Порт IMAP сервера
    tls: true // Использование TLS
});
let lastMessageId
function openInbox(cb) {// Функция для открытия почтового ящика
    imap.openBox('INBOX', false, cb); // Открытие ящика 'fardesk'
}
imap.once('ready', function() {// Событие, происходящее при готовности IMAP соединения
    openInbox(function(err, box) {
        if (err) throw err; // Обработка ошибки при открытии ящика
                setInterval(() => {//console.log('Прошло 10сек. Просмотрел почту')// Установка интервала для поиска непрочитанных писем каждые 5 минут
            imap.search(['UNSEEN'], function(err, results) {
                if (err) throw err; // Обработка ошибки при поиске писем
                fetchIMAP(results); // Обработка найденных писем
            });
        }, 10000); // 300000 миллисекунд = 5 минут
                imap.search(['UNSEEN'], function (err, results) {// Закомментированный код для разового поиска непрочитанных писем
          if (err) throw err;
          fetchIMAP(results)
        });
        console.log('Просмотрел почту')
    });
});
imap.once('error', function(err) {// Событие, происходящее при ошибке IMAP соединения// console.log(err, 'serror'); // Закомментированный вывод ошибки
});
imap.once('end', function() {// Событие, происходящее при завершении IMAP соединения// console.log('Connection ended'); // Закомментированный вывод завершения соединения
});
imap.connect();// Подключение к IMAP серверу
const test123  = bot.on('callback_query', async msg => {// Обработчик callback-запросов от бота// console.log(msg); // Вывод сообщения в консоль
    const ac = new AbortController(); // Создание экземпляра AbortController
    const listResponsClose = (response) => { responseCloseReq(response, msg, listResponsClose) }; // Функция для обработки закрытия заявки
    const listResponsDevice = (response) => responseChangeDevice(response, msg, listResponsDevice); // Функция для обработки смены устройства
    const data = msg.data; // Данные из сообщения
    const chatId = msg.message.chat.id; // Идентификатор чата
    const messageId = msg.message.message_id; // Идентификатор сообщения
    
    let text = msg.message.text; // Текст сообщения// console.log(text) // Закомментированный вывод текста сообщения// console.log(msg, 'msg') // Закомментированный вывод сообщения в консоль
    let arrayKeyboard = msg.message.reply_markup.inline_keyboard[0]; // Кнопки из сооб
    //Твой кусок
    if (data === '1') {
        bot.editMessageReplyMarkup(zakritZaivki['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === '2') {
        let changedevice = 'Введите следующую информацию: Идентификационный номер';
        bot.sendMessage(chatId, changedevice); // Отправка сообщения с инструкцией
        bot.on('message', listResponsDevice); // Установка обработчика сообщений для смены устройстваf
        bot.editMessageReplyMarkup(buttonsRef['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    //Твой кусок закрыт

    const responseON1 = (response) => { responseWithText(response, msg, {responseON1,result,TextofButtons}) }; // Отправлять не готовый текст
    const responseON2 = (response) => { responseWithoutText(response, msg, {responseON2,TextofButtons}) }; // Отправлять готовый текст
    // Кнопки после закрыть заявки
    if (data === 'Kartreader') {
        bot.editMessageReplyMarkup(kartreader['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === 'Video') {
        bot.editMessageReplyMarkup(video['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === 'TO') {  
        bot.editMessageReplyMarkup(to['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Выполнено ТО.Введите что выполено:',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{/*console.log(res);*/return res;})
        TextofButtons = 'Выполнено ТО: '
        bot.on('message', responseON1)
    }
    if (data === 'Sviaz') {
        bot.editMessageReplyMarkup(sviaz['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === 'Printer') {
        bot.editMessageReplyMarkup(printer['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data ==='buttons') {// Кнопка назад на главную
        bot.editMessageReplyMarkup(buttons['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    
    // Кнопки после картридер
    if (data === 'Podemenniy') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId });
        const message = bot.sendMessage(chatId, 'Введите серийный подменного?',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{/*console.log(res);*/return res;})
        TextofButtons = 'Картридер. Замена оборудования, серийник установленного: '
        bot.on('message', responseON1)
    }
    if (data ==='Izvlechenie') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите что извлекли?',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Картридер. Извлечение постороннего предмета: '
        bot.on('message', responseON1)
    }
    if (data ==='Remontreader') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Что сделано?',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Картридер. Замена всех расходников + тестирование + '
        bot.on('message', responseON1)
    }
    if (data ==='Drugoe') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите ваш текст:',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Картридер. Другое:'
        bot.on('message', responseON1)
    }
    // Кнопки после Video
    if (data ==='VideoNabludenie') {
        TextofButtons = 'Выполнена настройка видео наблюдения'
        responseON2()
    }
    if (data ==='OchistkaDiska') {
        TextofButtons = 'Видео. Очистка диска'
        responseON2()
    }
    if (data ==='Lisenzia') {
        TextofButtons = 'Востановление лицензии'
        responseON2()
    }
    if (data ==='ZamenaObered') {
        bot.editMessageReplyMarkup(videoBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Что менялось(Серийник если есть)',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Видео. Менялось(Серийник если есть):'
        bot.on('message', responseON1)
    }
    if (data ==='VideoOther') {
        bot.editMessageReplyMarkup(videoBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите ваш текст:',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Видео. Другое:'
        bot.on('message', responseON1)
    }
    // Кнопки После ТО   
        
    // Кнопки После Связь
    if (data ==='PerezagruzkaATM') {
        TextofButtons = 'Связь. Перезагрузка ATM'
        responseON2()
    }
    if (data ==='PerezagruzkaSviaz') {
        TextofButtons = 'Перезагрузка связи'
        responseON2()
    }
    if (data ==='ZamenaSVIAZ') {
        bot.editMessageReplyMarkup(sviazBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите замененное оборудование',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Связь. Замена обурудования:'
        bot.on('message', responseON1)
    }
    if (data ==='SviazOther') {
        bot.editMessageReplyMarkup(sviazBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите ваш текст:',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Связь. Другое:'
        bot.on('message', responseON1)
    }
    // => Кнопки После Принтер
    if (data ==='ZamenaBumaga') {
        TextofButtons = 'Замена бумаги'
        responseON2()
    }
    if (data ==='Remont') {
        bot.editMessageReplyMarkup(printerBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Что сделали?',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Принтер. Ремонт оборудования:'
        bot.on('message', responseON1)
    }
    if (data ==='ZamenaPrinter') {
        bot.editMessageReplyMarkup(printerBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Серийник?',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Принтер. Замена обурудования. Серийник:'
        bot.on('message', responseON1)
    }
    if (data ==='PrinterOther') {
        bot.editMessageReplyMarkup(printerBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите ваш текст:',{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Принтер. Другое:'
        bot.on('message', responseON1)
    
    }
    // Кнопка ОТМЕНА
    if (data === 'Otmena' ) {
        await bot.editMessageText('Сообщение сейчас удалиться',{ chat_id: chatId, message_id: messageId })
        bot.deleteMessage(chatId, messageId)
        return
    }
});

// const appdb = require('./appdb')
const db = require('./db')
async function responseWithText(response, msgCloseReq, {listRespons,result}) {
    res =result._rejectionHandler0.message_id
    // await db.query(`INSERT INTO person (name, surname) values ($1, $2) RETURNING *`, [chatIdTsiukhai, res]);
    if (res) {}
    bot.deleteMessage(chatId, res).then(async () => {
        let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
        let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
        let textEditStrike = /*'<strike>' +*/ `Заявка: ${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}` /*+ '</strike>'*/; // Зачёркнутый текст
        
        let tiket =`${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replace('Ticket: ','').replaceAll(reg, '')}`
        let engineer = msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Start date')).replace(msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Agent')),'').replace('Agent: ','').replaceAll(reg, '')
        let discription =`${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Service')).replace(msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Description')),'').replace('Description: ','').replaceAll(reg, '')}`
        let time_start =`${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Execution start')).replace(msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Start date:')),'').replace('Start date: ','').replaceAll(reg, '')}`
        //time_start = new Date(time_start).toISOString().slice(0, 19).replace('T', ' ');
        let time_close =`${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Assignment date:')).replace(msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Last update:')),'').replace('Last update: ','').replaceAll(reg, '')}`
        //time_close = new Date(time_close).toISOString().slice(0, 19).replace('T', ' ');
        let ATM = `${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Device address')).replace(msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Device serial')),'').replace('Device serial: ','').replaceAll(reg, '')}.` /*+ '</strike>'*/; // Зачёркнутый текст
        //console.log(tiket,'===>'+engineer,'===>'+discription,'===>'+time_start,'===>'+time_close,'===>'+ATM)
        
        time_start = new Date(time_start)
        time_close = new Date(time_close)
        console.log(time_close.getTime()-time_start.getTime())
        engineer_id = await db.query(`select id from person where name = $1`,[engineer])
        // console.log(engineer_id)
        engineer_id = engineer_id.rowCount
        if (engineer_id == 0) {
            engineer_id =undefined
        }
        await db.query(`INSERT INTO post (application, engineer, Discription, Time_start_req, Time_close_req, ATM) values ($1, $2, $3, $4, $5, $6) RETURNING *`, [tiket, engineer_id,discription,time_start, time_close, ATM]).then(()=>{console.log("Отправлено да дб! post")});
        await db.query(`INSERT INTO post_final (type_of_repair,engineer,time_spent) values ($1,$2,$3)`, [TextofButtons+response.text,engineer_id,time_close.getTime()-time_start.getTime()]).then(()=>{console.log("Отправлено да дб post_final!")});
        
        
        //bot.sendMessage(chatIdTsiukhai, `📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${engineer}](tg://user?id=${response.chat.id})`, { parse_mode: 'Markdown' })
        //bot.sendMessage(chatIdRatkevich, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${chatId}](tg://user?id=${response.chat.id})`, { parse_mode: 'Markdown' });
        //bot.editMessageText(`📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${engineer}](tg://user?id=${response.chat.id})`, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML',parse_mode: 'Markdown' });
        
        bot.removeListener('message',listRespons);    
    })
}
async function responseWithoutText(response, msgCloseReq, {listRespons,TextofButtons}) {
    let reg = /[\r\n\t\f]+/g; 
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    let textEditStrike = /*'<strike>' +*/ `Заявка: ${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}.` /*+ '</strike>'*/; // Зачёркнутый текст
    bot.sendMessage(chatIdTsiukhai, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { parse_mode: 'Markdown' });
    //bot.sendMessage(chatIdRatkevich, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { parse_mode: 'Markdown' });
    bot.editMessageText(`\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML',parse_mode: 'Markdown' });

    bot.removeListener('message', listRespons);     
}


async function responseCloseReq(response, msgCloseReq, listRespons) {
    let reg = /[\r\n\t\f]+/g; 
    let textEditStrike = '<strike>' + msgCloseReq.message.text + '</strike>';
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    // Отправка сообщения Tsiukhai
    bot.sendMessage(chatIdTsiukhai, `Заявка: [${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${chatId}](tg://user?id=${response.chat.id}). Текст: ${response.text}`, { parse_mode: 'Markdown' });
    bot.editMessageText(textEditStrike, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' });
    bot.removeListener('message', listRespons);
}
async function responseChangeDevice(response, msg, listRespons) {
    const chatId = response.chat.id; 
    let s = response.text; 
    bot.sendMessage(chatId, s, changeDevice);
    bot.on('edited_message_text', editMessageChange);
    bot.removeListener('message', listRespons);
    if (s.length !== 8) {// Проверка длины идентификационного номера
        bot.sendMessage(chatId, 'Номер должен быть 8 символов, измените ваше сообщение');
        bot.on('callback_query', (response) => { msA(response, msg) });
    } else {
        bot.on('callback_query', (response) => { msA(response, msg) }); 
    }
}
async function editMessageChange(s) {
    bot.deleteMessage(s.chat.id, s['message_id'] + 1); // Удаление сообщения
    bot.editMessageText(s.text, { chat_id: chatId/*s.chat.id*/, message_id: s['message_id'] + 2, reply_markup: changeDevice.reply_markup });
}
async function msA(response, msg) {
    let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
    const dataA = response.data;
    let textEditStrike = '<strike>' + msg.message.text + '</strike>'; 
    const messageAId = response.message.message_id; 
    const chatId = response.message.chat.id; 
    if (dataA === 'OK') {
        bot.editMessageReplyMarkup({}, { chat_id: chatId, message_id: messageAId }); 
        bot.sendMessage(chatId, 'Принято'); 
        bot.removeListener('edited_message_text', editMessageChange); 
        bot.editMessageText(textEditStrike, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' }); // Редактирование текста сообщения
        bot.sendMessage(chatId, `Произведена замена оборудования кем: ${usersChatId[msg.message.chat.id]}. ${msg.message.text.substring(0, msg.message.text.indexOf('Title'))} Идентификационный номер: ${response.message.text}`);
        let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msg.message.text.substring(0, msg.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    }}
function fetchIMAP(results) {// Функция для обработки найденных писем IMAP
    try {var f = imap.fetch(results, { bodies: '' });
        f.on('message', function(msg, seqno) {
            var prefix = '(#' + seqno + ') '; 
                msg.on('body', function(stream, info) {
                let decoder = new libqp.Decoder(); // Декодер для Quoted-Printable
                stream.on('data', function(chunk) {
                    let s = new Buffer.from(chunk).toString('utf8'); // Преобразование данных в строкуж// console.log(s)
                    text = libqp.decode(s).toString('utf8'); // Декодирование текста
                    let replacedData = text.replace(/[\n\r]/g, '');
                    let modifiedText = replacedData.replace(/<[^>]+>/g, "");   
                    modifiedText = modifiedText.replace(/[\s\S]*?[Ticket]:/g, "");
                    modifiedText = modifiedText.replace(/[\s\S]*?(\[Ticket\]:\[.*?\])/g, '$1');
                    modifiedText = modifiedText.replace(/\[([\w\s-]+)]:\[(.*?)],/g, "$1: $2\n");
                    
                    //Проверка слов
                    const extrawords = ['картридер','видео','то','связь','принтер', 'ремонт', 'карт-ридер','card_reader', 'карт','ошибка', 'дисплей', 'бумага', 'бумаги', 'кассет', 'серийный', 'серийник', 'подымен', 'извлекли', 'извлечен', 'извлечён', 'извлечены', 'извлечёны', 'замена', 'оборудование','замены', 'оборудования',  'ридер', 'ридера', 'ридеров', 'извлечение', 'извлекли', 'извлек', 'извличение', 'настройка', 'настройку', 'настроил', 'настроили', 'видеооборудования', 'видеооборудование', 'чист', 'диска', 'очистка', 'диск', 'чистка', 'почистил', 'востанов', 'востановление', 'востановил', 'лицензии', 'лицензию', 'загруз', 'перезагрузил', 'перезагрузка', 'атм', 'atm', 'связ', 'связи', 'сервис', 'подключен', 'сервер', 'сигнал', 'авария', 'выключатель', 'вентилятор', 'батарея', 'платеж', 'обновление', 'монета', 'заправка', 'кассетник', 'датчик', 'замок', 'камера', 'система', 'терминал', 'чек'];
                    function formatMessage(text) {
                            const paragraphs = new RegExp(extrawords.join('|'), 'gi');
                            const formattedMessage = text.replace(paragraphs, "<strong><em><u>$&</u></em></strong>");
                            return formattedMessage;
                          }
                          const formattedMessage = formatMessage(modifiedText);
                        //   console.log(formattedMessage);

                    try {   
                        if (chatId) {console.log('Сообщение отправлено!');
                            bot.sendMessage(chatId, formattedMessage, { reply_markup: buttons.reply_markup, parse_mode: 'Markdown', parse_mode: 'HTML'}); // Отправка сообщения пользователю
                        } else {
                            throw new Error('chatId not define'); 
                        }
                    } catch (err) {
                        bot.sendMessage('', a + err.message);
                    }
                });
            });
            msg.once('attributes', function(attrs) {
            });
            msg.once('end', function() {
            });
        });
           f.once('error', function(err) {
        });
        imap.setFlags(results, ['\\Seen'], function(err) {// Установка флага прочитанных писем
        });
    } catch (err) {
}}

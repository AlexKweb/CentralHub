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
let chatIdTsiukhai = '1440654064'; // Идентификатор чата для Tsiukhai
let chatIdRatkevich = '91211691'; // Идентификатор чата для Ratkevich 91211691
var imap = new Imap({ // Настройки для подключения к IMAP серверу
    user: 'sashaklimovking@outlook.com', // Логин для IMAP
    password: '94699203o', // Пароль для IMAP
    host: 'imap.outlook.com', // Хост IMAP сервера
    port: 993, // Порт IMAP сервера
    tls: true // Использование TLS
});

let lastMessageId
//===========================================================---НЕ ЗАБЫТЬ
//let cancelButtonPressed;


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
// bot.on('message', async msg =>{// Закомментированный обработчик сообщений бота
//     const chatId = msg.chat.id;bot.sendMessage(chatId, 'Я работаю ChatId:'+ chatId);// console.log("Пришло соообщение от человека chatId:" + chatId)
// })
bot.on('callback_query', async msg => {// Обработчик callback-запросов от бота// console.log(msg); // Вывод сообщения в консоль
    const ac = new AbortController(); // Создание экземпляра AbortController
    const listResponsClose = (response) => { responseCloseReq(response, msg, listResponsClose) }; // Функция для обработки закрытия заявки
    const listResponsDevice = (response) => responseChangeDevice(response, msg, listResponsDevice); // Функция для обработки смены устройства
    const data = msg.data; // Данные из сообщения
    const chatId = msg.message.chat.id; // Идентификатор чата
    const messageId = msg.message.message_id; // Идентификатор сообщения
    const inputHandler = (response) => {
        const userText = response.text;
        bot.sendMessage(chatId, `Ваше сообщение: ${userText}`);
        bot.removeListener('message', inputHandler);     
    };
    let text = msg.message.text; // Текст сообщения// console.log(text) // Закомментированный вывод текста сообщения// console.log(msg, 'msg') // Закомментированный вывод сообщения в консоль
    let arrayKeyboard = msg.message.reply_markup.inline_keyboard[0]; // Кнопки из сооб
    //Твой кусок
    if (data === '1') {
        bot.editMessageReplyMarkup(zakritZaivki['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        //bot.sendMessage(chatId, 'Отправьте сообщение с закрытием заявки'); // Отправка сообщения
        //bot.on('message', listResponsClose); // Установка обработчика сообщений для закрытия заявки
    }
    if (data === '2') {
        let changedevice = 'Введите следующую информацию: Идентификационный номер';
        bot.sendMessage(chatId, changedevice); // Отправка сообщения с инструкцией
        bot.on('message', listResponsDevice); // Установка обработчика сообщений для смены устройстваf
        bot.editMessageReplyMarkup(buttonsRef['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    //Твой кусок закрыт



    let textForOtmena = '\n\n (Чтобы отменить, нажмите кнопку ОТМЕНА и напишите любой текст, потом венитесь к заявки и нажмите <НАЗАД'
    cancelButtonPressed = false
    
    const responseON1 = (response) => { responseWithText(response, msg, {responseON1,result,TextofButtons,cancelButtonPressed}) }; // Функция для обработки закрытия заявки
    const responseON2 = (response) => { responseWithoutText(response, msg, {responseON2,TextofButtons}) }; // Функция для обработки закрытия заявки
    // Кнопки после закрыть заявки
    if (data === 'Kartreader') {
        // bot.editMessageText(modifiedText, { chat_id: chatId, message_id: messageId })
        bot.editMessageReplyMarkup(kartreader['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === 'Video') {
        bot.editMessageReplyMarkup(video['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
    }
    if (data === 'TO') {
        bot.editMessageReplyMarkup(to['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
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
        const message = bot.sendMessage(chatId, 'Введите серийный подменного?'+textForOtmena,{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{console.log(res);return res;})
        console.log(message, '============')
        console.log(result.message_Id)
        bot.on('callback_query', query =>{
            if (query.data === 'Otmena') {
                console.log('++++++++++++++++',query.message,'++++++++++++++')
                bot.deleteMessage(chatId, query.message.message_id)    
                // bot.removeListener('message', listRespons);       
                return
            }
            else{ TextofButtons = 'Картридер. Замена оборудования, серийник установленного: '
                bot.on('message', responseON1)}
        })
        
        // TextofButtons = 'Картридер. Замена оборудования, серийник установленного: '
        // bot.on('message', responseON1)
    }
    if (data ==='Izvlechenie') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите что извлекли?'+textForOtmena,{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Картридер. Извлечение постороннего предмета: '
        bot.on('message', responseON1)
    }
    if (data ==='Remontreader') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Что сделано?'+textForOtmena,{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
        result = message.then((res)=>{return res;})
        TextofButtons = 'Картридер. Замена всех расходников + тестирование + '
        bot.on('message', responseON1)
    }
    if (data ==='Drugoe') {
        bot.editMessageReplyMarkup(kartreaderBACK['reply_markup'], { chat_id: chatId, message_id: messageId }); // Редактирование кнопок
        const message = bot.sendMessage(chatId, 'Введите ваш текст:'+textForOtmena,{ reply_markup: cancel.reply_markup, parse_mode: 'Markdown' });
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
        
        responseON2()
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
    
    if (data === 'Otmena' ) {
        // res =result._rejectionHandler0.message_id
        cancelButtonPressed = true
        // bot.deleteMessage(chatId, messageId)
        // bot.removeListener('callback_query', responseON1);    
        // return
    }

});
async function responseWithText(response, msgCloseReq, {listRespons,result,TextofButtons,cancelButtonPressed}) {
    
    res =result._rejectionHandler0.message_id
    console.log(cancelButtonPressed)
    if (cancelButtonPressed === true) {

        cancelButtonPressed === false
    //     bot.deleteMessage(chatId, res)
       bot.removeListener('message', listRespons);       
        return
    }
    console.log(res)
    console.log(TextofButtons)
    
    try {
        bot.deleteMessage(chatId, res)
    } catch (error) {} 
    let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    let textEditStrike = /*'<strike>' +*/ `Заявка: ${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}.` /*+ '</strike>'*/; // Зачёркнутый текст
    bot.sendMessage(chatIdTsiukhai, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${chatId}](tg://user?id=${response.chat.id})`, { parse_mode: 'Markdown' });
    
    //bot.sendMessage(chatIdRatkevich, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${chatId}](tg://user?id=${response.chat.id})`, { parse_mode: 'Markdown' });
    bot.editMessageText(`\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}${response.text}\n👤[${chatId}](tg://user?id=${response.chat.id})`, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML',parse_mode: 'Markdown' });

    bot.removeListener('message', listRespons);     
    }

async function responseWithoutText(response, msgCloseReq, {listRespons,TextofButtons}) {
    // res =result._rejectionHandler0.message_id
    // console.log(res)
    console.log(TextofButtons)
    // bot.deleteMessage(chatId, res)
    let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    let textEditStrike = /*'<strike>' +*/ `Заявка: ${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}.` /*+ '</strike>'*/; // Зачёркнутый текст
    bot.sendMessage(chatIdTsiukhai, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { parse_mode: 'Markdown' });
    //bot.sendMessage(chatIdRatkevich, `\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { parse_mode: 'Markdown' });
    bot.editMessageText(`\n📄${textEditStrike}\n🔗[Ссылка](${url})\n🔁${TextofButtons}\n👤[${chatId}](tg://user?id=${chatId})`, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML',parse_mode: 'Markdown' });

    bot.removeListener('message', listRespons);     
}






















// Асинхронная функция для обработки закрытия заявки
async function responseCloseReq(response, msgCloseReq, listRespons) {
    let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
    let textEditStrike = '<strike>' + msgCloseReq.message.text + '</strike>'; // Зачёркнутый текст
    let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
    // Отправка сообщения Tsiukhai
    bot.sendMessage(chatIdTsiukhai, `Заявка: [${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${chatId}](tg://user?id=${response.chat.id}). Текст: ${response.text}`, { parse_mode: 'Markdown' });
    // Отправка сообщения Ratkevich
    //  bot.sendMessage(chatIdRatkevich, `Заявка: [${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${chatId}](tg://user?id=${response.chat.id}). Текст: ${response.text}`, { parse_mode: 'Markdown' });
            // Закомментированный пример отправки сообщения// bot.sendMessage(, `Заявка: [${msgCloseReq.message.text.substring(0, msgCloseReq.message.text.indexOf('Title'))}](${url}). От кого: [${chatId}](tg://user?id=${response.chat.id}). Текст: ${response.text}`, { parse_mode: 'Markdown' });
    // Редактирование сообщения с зачёркнутым текстом
    bot.editMessageText(textEditStrike, { chat_id: chatId/*msgCloseReq.message.chat.id*/, message_id: msgCloseReq.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' });
    // Удаление обработчика сообщений
    bot.removeListener('message', listRespons);
}
async function responseChangeDevice(response, msg, listRespons) {// Асинхронная функция для обработки смены устройства
    // console.log(msg); // Вывод сообщения в консоль
    const chatId = response.chat.id; // Идентификатор чата
    let s = response.text; // Текст из сообщения
    bot.sendMessage(chatId, s, changeDevice); // Отправка сообщения с новой информацией
    bot.on('edited_message_text', editMessageChange); // Установка обработчика для редактирования сообщения
    bot.removeListener('message', listRespons); // Удаление обработчика сообщений
    
    if (s.length !== 8) {// Проверка длины идентификационного номера
        bot.sendMessage(chatId, 'Номер должен быть 8 символов, измените ваше сообщение'); // Сообщение об ошибке
        bot.on('callback_query', (response) => { msA(response, msg) }); // Установка обработчика для callback-запросов
    } else {
        bot.on('callback_query', (response) => { msA(response, msg) }); // Установка обработчика для callback-запросов
    }
}
async function editMessageChange(s) {// Асинхронная функция для редактирования сообщения
    bot.deleteMessage(s.chat.id, s['message_id'] + 1); // Удаление сообщения
    bot.editMessageText(s.text, { chat_id: chatId/*s.chat.id*/, message_id: s['message_id'] + 2, reply_markup: changeDevice.reply_markup }); // Редактирование текста сообщения
}
async function msA(response, msg) {// Асинхронная функция для обработки callback-запросов
    // console.log(msg); // Вывод сообщения в консоль
    let reg = /[\r\n\t\f]+/g; // Регулярное выражение для удаления спецсимволов
    const dataA = response.data; // Данные из ответа
    let textEditStrike = '<strike>' + msg.message.text + '</strike>'; // Зачёркнутый текст
    const messageAId = response.message.message_id; // Идентификатор сообщения
    const chatId = response.message.chat.id; // Идентификатор чата
    if (dataA === 'OK') {// Проверка значения dataA
        bot.editMessageReplyMarkup({}, { chat_id: chatId, message_id: messageAId }); // Редактирование кнопок
        bot.sendMessage(chatId, 'Принято'); // Отправка сообщения
        bot.removeListener('edited_message_text', editMessageChange); // Удаление обработчика для редактирования сообщения
        bot.editMessageText(textEditStrike, { chat_id: msg.message.chat.id, message_id: msg.message.message_id, reply_markup: buttonsRef['reply_markup'], parse_mode: 'HTML' }); // Редактирование текста сообщения
        // Отправка сообщения с информацией о замене оборудования
        bot.sendMessage(chatId, `Произведена замена оборудования кем: ${usersChatId[msg.message.chat.id]}. ${msg.message.text.substring(0, msg.message.text.indexOf('Title'))} Идентификационный номер: ${response.message.text}`);
        let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${msg.message.text.substring(0, msg.message.text.indexOf('Title')).replaceAll(reg, '')}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
        //bot.sendMessage(chatIdTsiukhai, `Произведена замена оборудования кем: [${usersChatId[msg.message.chat.id]}](tg://user?id=${msg.message.chat.id}). [${msg.message.text.substring(0, msg.message.text.indexOf('Title'))}](${url}) Идентификационный номер: ${response.message.text}`, { parse_mode: 'Markdown' });
        //bot.sendMessage(chatIdRatkevich, `Произведена замена оборудования кем: [${usersChatId[msg.message.chat.id]}](tg://user?id=${msg.message.chat.id}). [${msg.message.text.substring(0, msg.message.text.indexOf('Title'))}](${url}) Идентификационный номер: ${response.message.text}`, { parse_mode: 'Markdown' });
    }}
function fetchIMAP(results) {// Функция для обработки найденных писем IMAP
    try {var f = imap.fetch(results, { bodies: '' }); // Получение писем
        f.on('message', function(msg, seqno) {
            var prefix = '(#' + seqno + ') '; // Префикс для сообщений
                msg.on('body', function(stream, info) {// Обработчик тела сообщения// console.log(prefix + 'Body'); // Закомментированный вывод тела сообщения
                let decoder = new libqp.Decoder(); // Декодер для Quoted-Printable
                stream.on('data', function(chunk) {
                    let s = new Buffer.from(chunk).toString('utf8'); // Преобразование данных в строкуж// console.log(s)
                    text = libqp.decode(s).toString('utf8'); // Декодирование текста
                        // console.log(text, 'Message for mail')
                    let replacedData = text.replace(/[\n\r]/g, '');
                    let modifiedText = replacedData.replace(/<[^>]+>/g, "");   
                    modifiedText = modifiedText.replace(/[\s\S]*?[Ticket]:/g, "");
                    modifiedText = modifiedText.replace(/[\s\S]*?(\[Ticket\]:\[.*?\])/g, '$1');
                    // modifiedText = modifiedText.replace(/--[\s\S]*/, '');
                    let modifiedTextForConsole = modifiedText.replace(/],/g, "],\n");                           
            console.log(modifiedTextForConsole);
                    // if (a.indexOf('Конопелько Илья, Вам назначен новый запрос') != -1) {// Проверка на наличие определённого текста
                    //     console.log('my request');
                    // }
                    //  else {
                    //     try {
                    //         textObj = JSON.parse(textMessage); // Преобразование текста в объект
                    //         if (textObj === undefined) {
                    //             throw new Error('что-то пошло не так'); // Обработка ошибки
                    //         }
                    //         let url = `https://fardesk.farnell.by/pages/UI.php?operation=details&class=UserRequest&id=${textObj['Ticket']}&c[menu]=UserRequest%3AOpenRequests`; // URL для заявки
                    //         textSend = `[${textObj['Ticket']}](${url})\nTitle: ${textObj['Title']}\nCaller company: ${textObj['Caller company']}\nDevice serial: ${textObj['Device serial']}\nDevice address: ${textObj['Device address']}\nDescription: ${textObj['Description']}`; // Формирование текста для отправки
                    //     }catch (err) {textSend = err.message; // Текст ошибки
                    //     }}
                    // console.log(JSON.parse(textMessage)); // Закомментированный вывод объекта
                    try {
                        if (chatId) {
                            bot.sendMessage(chatId, modifiedText, { reply_markup: buttons.reply_markup, parse_mode: 'Markdown' }); // Отправка сообщения пользователю
                            // console.log(bot.errors()); // Вывод ошибок бота
                            // bot.sendMessage(chatId, modifiedText, buttons, { parse_mode: 'Markdown' }); // Закомментированная отправка сообщения
                        } else {
                            throw new Error('chatId not define'); // Обработка ошибки отсутствия chatId
                        }
                    } catch (err) {
                        bot.sendMessage('', a + err.message); // Отправка сообщения с ошибкой
                    }
                });
            });
            msg.once('attributes', function(attrs) {// console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
            });
            msg.once('end', function() {// console.log(prefix + 'Finished');
            });
        });
           f.once('error', function(err) {// console.log('Fetch error: ' + err);// Обработка ошибок получения писем
        });
        imap.setFlags(results, ['\\Seen'], function(err) {// Установка флага прочитанных писем
            if (!err) {// console.log("marked as read"); // Закомментированный вывод успешной установки флага
            } else {// console.log(JSON.stringify(err, null, 2)); // Закомментированный вывод ошибки
            }
        });
    } catch (err) {// imap.end(); // Закомментированное завершение IMAP соединения// console.log(err + ''); // Закомментированный вывод ошибки
}}

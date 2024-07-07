const TelegramApi = require('node-telegram-bot-api')
const token = '7310883694:AAG6fKYcvvATDIjVZmOZkDIahHld5YgzHBQ'
const bot = new TelegramApi(token,{polling:true})
const Buttons = {reply_markup: JSON.stringify({inline_keyboard:[
        [{text: 'Кнопка 1', callback_data:'Кнопка 1'},
         {text: 'Кнопка 2', callback_data:'Кнопка 2'}],        
        [{text: 'Кнопка 3', callback_data:'Кнопка 3'}]
]})}

let comands =['/start','/but']

const start = () => {

    bot.setMyCommands([
        {command:comands[0],description:'Старт'},
        {command:comands[0],description:'Кнопки'}
    ])

    bot.on('message', msg=>{
        const text = msg.text;
        const chatId =msg.chat.id
        console.log(chatId)
         bot.sendMessage(chatId,"Команды:/start /but")
        if (text === '/start') {
            bot.sendMessage(chatId,"Привет " + msg.from.username )
        }
        else if(text === '/but'){
            bot.sendMessage(chatId," Привет" + msg.from.first_name, Buttons)
        }
        else {bot.sendMessage(chatId,"Введи что-то другое")}       
    })

    bot.on('callback_query', msg=>{
        try{
        const chatId =msg.message.chat.id
        
        bot.sendMessage(chatId,"Ты выбрал " + msg.data)    
}
catch(Error){console.log(Error)}
finally{}
})
}

start()

const Imap = require('imap');
const {simpleParser} = require('mailparser')
const {parse} = require('path')



process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const imapConfig = {
  user: 'sashaklimovking@outlook.com',      // Ваша электронная почта
  password: '94699203o',     // Ваш пароль
  host: 'imap.outlook.com',            // Хост IMAP сервера
  port: 993,                           // Порт IMAP сервера (обычно 993 для TLS)
  tls: true                            // Использование TLS для безопасности
};

const getEmails = () =>{
    try {
      const imap = new Imap(imapConfig)

      imap.once('ready', () =>{
        imap.openBox('INBOX', false, () =>{
          imap.search(['UNSEEN',['Since',new Date()]], (er, results)=>{
            const f = imap.fetch(results,{bodies: ''});
            f.on('message', msg =>{
              msg.on('body',stream =>{
                // simpleParser(stream, async(err, parsed)=>{

                  console.log('==============================')
                console.log(msg)
                bot.sendMessage(1440654064, parsed.from.text)
                bot.sendMessage(1440654064, parsed.text)
                console.log('-------------------------------')
                console.log(parsed.from.text)
                console.log(parsed.text)
                console.log('++++++++++++++++++++++++++++++')

                // })
                
              })
            })
          })
        })
      })

      imap.once('error', () =>{
        console.log(err)
      })
    
      imap.once('end', () =>{
        console.log('Conection END')
      })
    
    imap.connect();
    } catch (ex) {
      console.log('AN ERROR HAS BEEN OCCURSED')
    }



}
getEmails()













































































// // Отключаем проверку TLS сертификата (только для разработки)
// // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


// // Импортируем библиотеку imap для работы с почтовым сервером через протокол IMAP
// const Imap = require('imap');

// // Импортируем simple-parser для парсинга тела писем
// const { simpleParser } = require('simple-parser');

// // Настройки IMAP: указываем пользователя, пароль, хост, порт и использование TLS
// const imapConfig = {
//   user: 'sashaklimovking@gmail.com',      // Ваша электронная почта
//   password: '94699203g',     // Ваш пароль
//   host: 'imap.gmail.com',            // Хост IMAP сервера
//   port: 993,                           // Порт IMAP сервера (обычно 993 для TLS)
//   tls: true                            // Использование TLS для безопасности
// };

// // Создаем экземпляр IMAP с указанными настройками
// const imap = new Imap(imapConfig);

// // Функция для открытия почтового ящика (например, INBOX)
// function openInbox(cb) {
//   imap.openBox('INBOX', true, cb);     // Открываем ящик INBOX в режиме чтения
// }

// // Обработчик события "ready" срабатывает, когда подключение к IMAP установлено
// imap.once('ready', function() {
//   openInbox(function(err, box) {       // Открываем INBOX ящик
//     if (err) throw err;                // Если возникла ошибка, выбрасываем исключение

//     // Получаем первые 10 сообщений из INBOX
//     const f = imap.seq.fetch('1:10', {
//       bodies: '',                      // Получаем все части тела письма
//       struct: true                     // Получаем структуру письма
//     });

//     // Обработчик события "message" для каждого сообщения
//     f.on('message', function(msg, seqno) {
//       console.log('Message #%d', seqno); // Логируем номер сообщения
//       const prefix = '(#' + seqno + ') '; // Префикс для логирования

//       // Обработчик события "body" для тела сообщения
//       msg.on('body', function(stream, info) {
//         // Парсим тело сообщения


//         bot.sendMessage(chatId,msg)


//         simpleParser(stream, (err, parsed) => {
//           if (err) {
//             console.error('Error parsing email:', err); // Логируем ошибку парсинга
//             return;
//           }

//           // Логируем основные части письма
//           console.log(`${prefix}Subject: ${parsed.subject}`);
//           console.log(`${prefix}From: ${parsed.from.text}`);
//           console.log(`${prefix}Date: ${parsed.date}`);
//           console.log(`${prefix}Text: ${parsed.text}`);
//         });
//       });

//       // Обработчик события "attributes" для атрибутов сообщения
//       msg.once('attributes', function(attrs) {
//         console.log(`${prefix}Attributes: %s`, attrs); // Логируем атрибуты сообщения
//       });

//       // Обработчик события "end" для завершения обработки сообщения
//       msg.once('end', function() {
//         console.log(`${prefix}Finished`); // Логируем завершение обработки сообщения
//       });
//     });

//     // Обработчик события "error" для ошибок при получении сообщений
//     f.once('error', function(err) {
//       console.log('Fetch error: ' + err); // Логируем ошибку получения сообщений
//     });

//     // Обработчик события "end" для завершения получения всех сообщений
//     f.once('end', function() {
//       console.log('Done fetching all messages!'); // Логируем завершение получения сообщений
//       imap.end();                                 // Закрываем соединение с IMAP
//     });
//   });
// });

// // Обработчик события "error" для ошибок подключения к IMAP
// imap.once('error', function(err) {
//   console.log(err); // Логируем ошибку подключения
// });

// // Обработчик события "end" для завершения соединения с IMAP
// imap.once('end', function() {
//   console.log('Connection ended'); // Логируем завершение соединения
// });

// // Подключаемся к IMAP серверу
// imap.connect();
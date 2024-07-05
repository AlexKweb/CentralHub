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
        const chatId =msg.message.chat.id
        
        bot.sendMessage(chatId,"Ты выбрал " + msg.data)    
    })
}

start()
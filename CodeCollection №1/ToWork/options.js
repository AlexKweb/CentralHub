module.exports = {
    buttons: {
       reply_markup: JSON.stringify({
           inline_keyboard: [
               [{text: 'закрыть заявку', callback_data: '1'}, {text: 'замена оборудования', callback_data: '2'}],    
           ]
       })
   },
   buttonsWithoutChangedevice: {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'закрыть заявку', callback_data: '1'}],
            
        ]
    })
    },
    buttonsRef: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'ссылка на заявку', callback_data: '3'}],
                
            ]
        })
        },
    buttonsEdit: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {text: 'замена оборудования', callback_data: '2'}],
                ]
            })
        },
    buttonsEditWithoutCloseReq: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {text: 'ссылка на заявку', callback_data: '3'}],
                ]
            })
        },
    changeDevice: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Готово', callback_data: 'OK'}],
            ]
        })
    },
//Новые кнопки 

//Кнопки 1 страницы После Закрыть заявки
    zakritZaivki: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Картридер', callback_data: 'Kartreader'},{text: 'Видео', callback_data: 'Video'},{text: 'ТО', callback_data: 'TO'}],
                [{text: 'Связь', callback_data: 'Sviaz'},{text: 'Принтер', callback_data: 'Printer'},{text: '< Назад', callback_data: 'buttons'}]
            ]
        })
    },
    // => Кнопки После Картридер
    kartreader: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Установка подеменного', callback_data: 'Podemenniy'}],
                [{text: 'Извлечение постороннего предмета', callback_data: 'Izvlechenie'}],
                [{text: 'Ремонт ридера', callback_data: 'Remontreader'}],
                [{text: 'Другое', callback_data: 'Drugoe'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    },
    // => Кнопки После Видео
    video: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Выполнена настройка видеонаблюдения', callback_data: 'VideoNabludenie'}],
                [{text: 'очистка диска', callback_data: 'OchistkaDiska'}],
                [{text: 'восстановление лицензии', callback_data: 'Lisenzia'}],
                [{text: 'Замена обурудования', callback_data: 'ZamenaObered'}],
                [{text: 'Другое', callback_data: 'VideoOther'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    }, 
    // => Кнопки После ТО
    to: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Много', callback_data: '1'}],
                [{text: 'Много', callback_data: '1'}],
                [{text: 'Много', callback_data: '1'}],
                [{text: 'Много', callback_data: '1'},{text: '< Назад', callback_data: '1'}],
                [{text: 'Много', callback_data: '1'},{text: '< Назад', callback_data: '1'}],
                [{text: 'Много', callback_data: '1'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    },
    // => Кнопки После Связь
    sviaz: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Перезагрузка ATM', callback_data: 'PerezagruzkaATM'}],
                [{text: 'Перезагрузка связи', callback_data: 'PerezagruzkaSviaz'}],
                [{text: 'Замена обурудования', callback_data: 'ZamenaSVIAZ'}],
                [{text: 'Другое', callback_data: 'SviazOther'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    },
    // => Кнопки После Принтер
    printer: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Замена бумаги', callback_data: 'ZamenaBumaga'}],
                [{text: 'Ремонт оборудования', callback_data: 'Remont'}],
                [{text: 'Замена обурудования', callback_data: 'ZamenaPrinter'}],
                [{text: 'Другое', callback_data: 'PrinterOther'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    },


    // => Кнопки После Картридер => После Установка подеменного,
    // => Кнопки После Картридер =>После Извлечение постороннего предмета
    // => Кнопки После Картридер =>После Ремонт ридера
    kartreaderBACK:{//+send Message
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '< Назад', callback_data: 'Kartreader'}]
            ]
        })
    },
    // => Кнопки После Видео =>После Выполнена настройка видеонаблюдения
    // => Кнопки После Видео =>После очистка диска
    // => Кнопки После Видео =>После восстановление лицензии
    // => Кнопки После Видео =>Замена обурудования
    videoBACK:{//+send Message
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '< Назад', callback_data: 'Video'}]
            ]
        })
    },

    // => Кнопки После ТО => После 


    // => Кнопки После Связь =>После Перезагрузка ATM
    // => Кнопки После Связь =>После Перезагрузка связи
    // => Кнопки После Связь =>После Замена обурудования
    sviazBACK:{//+send Message
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '< Назад', callback_data: 'Sviaz'}]
            ]
        })
    },
    


    // => Кнопки После Принтер =>После Замена бумаги
    // => Кнопки После Принтер =>После Ремонт оборудования
    // => Кнопки После Принтер =>После Замена обурудования
    printerBACK:{
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '< Назад', callback_data: 'Printer'}]
            ]
        })
    },




    // svernut: {
    //     reply_markup: JSON.stringify({
    //         inline_keyboard: [
    //             [{text: 'Свернуть заявку', callback_data: 'svernut'}],
    //         ]
    //     })
    // },
    // => Кнопки После Картридер
    kartreader: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Установка подеменного', callback_data: 'Podemenniy'}],
                [{text: 'Извлечение постороннего предмета', callback_data: 'Izvlechenie'}],
                [{text: 'Ремонт ридера', callback_data: 'Remontreader'}],
                [{text: 'Другое', callback_data: 'Drugoe'},{text: '< Назад', callback_data: '1'}]
            ]
        })
    },









    cancel: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Отмена', callback_data: 'Otmena'}],
            ]
        })
    },






}
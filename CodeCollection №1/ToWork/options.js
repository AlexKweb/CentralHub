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

}
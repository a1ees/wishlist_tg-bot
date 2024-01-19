import { Markup } from 'telegraf';

export function getMainMenu() {
    return Markup.keyboard([
        ['🌟 Создать виш-айтем', '📘 Инструкции'],
        ['🔑 Ввести инвайт-код', '📤 Получить инвайт-код'],
        ['👫 Виш-айтемы друзей', '📋 Мои виш-айтемы']
    ]).resize();
}

export function getCreateWishMenu() {
    return Markup.keyboard([
        ['🚫 Отменить создание'],
    ]).resize();
}

export function getAddInvCodeMenu() {
    return Markup.keyboard([
        ['🏠 Главное меню'],
    ]).resize();
}

export function getWishItems(itemsArr) { // клавиатура для вывода списка виш-айтемов
    if (itemsArr.length > 2) {
        const columns = 2;
        const rows = Math.ceil(itemsArr.length / columns);
        const buttons = [];

        for (let i = 0; i < rows; i++) {
            const rowButtons = [];

            for (let j = 0; j < columns; j++) {
                const index = i * columns + j;
                if (index < itemsArr.length) {
                    rowButtons.push(itemsArr[index]);
                }
            }

            buttons.push(rowButtons);
        }

        buttons.unshift(['🏠 Главное меню']);
        return Markup.keyboard(buttons).resize();
    } else {
        let titles = itemsArr;
        titles.unshift('🏠 Главное меню');
        return Markup.keyboard(titles).resize();
    }
}

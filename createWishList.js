import {session, sessionReset} from "./session.js";

import {checkUniqueTitle, getWishList, handleWishList} from "./controllers/wishList.js";
import { getCreateWishMenu, getMainMenu } from "./keyboards.js";
import { findUser } from "./controllers/user.js";

export async function handleTitle(ctx, messageText, wishListItem, chatId) { // Функция для обработки шага 'title'
    if (await checkUniqueTitle(messageText)) {
        await ctx.reply(`Товар с названием ${messageText} уже создан, придумайте другое название:`);
        return 'title';
    } else if (messageText) {
        wishListItem.title = messageText;
        wishListItem.owner = chatId;
        await ctx.reply(`Название товара сохранено: ${wishListItem.title}\nТеперь пришлите краткое описание товара`);
        return 'description';
    } else {
        await ctx.reply('Пожалуйста, отправьте корректное название товара');
        return 'title';
    }
}

export async function handleDescription(ctx, messageText, wishListItem) { // Функция для обработки шага 'description'
    if (messageText) {
        wishListItem.description = messageText;
        await ctx.reply(`Описание товара сохранено: ${wishListItem.description}\nТеперь пришлите стоимость товара в рублях(пример: 5000)`);
        return 'price';
    } else {
        await ctx.reply('Пожалуйста, отправьте корректное описание товара');
        return 'description';
    }
}

export async function handlePrice(ctx, messageText, wishListItem) { // Функция для обработки шага 'price'
    const regex = /^\s*\d+\s*$/; // регулярка для проверки целого числа
    if (regex.test(messageText)) {
        if (messageText) {
            wishListItem.price = messageText;
            await ctx.reply(`Стоимость сохранена: ${wishListItem.price}₽\nТеперь пришлите фотографию товара`);
            return 'photo';
        } else {
            await ctx.reply('Пожалуйста, отправьте корректное описание товара');
            return 'price';
        }
    } else {
        await ctx.reply('Вы отправили некорректную стоимость товара, повторите попытку.\nПример отправки цены: 3000')
        return 'price'
    }
}

export async function handlePhoto(ctx, message, wishListItem) { // Функция для обработки шага 'photo'
    if (message.photo) {
        const photo = message.photo[0];
        wishListItem.photo = photo.file_id;
        await ctx.reply('Фотография товара сохранена\nТеперь пришлите ссылку на товар');
        return 'link';
    } else {
        await ctx.reply('Пожалуйста, отправьте фотографию товара');
        return 'photo';
    }
}

export async function handleLink(ctx, messageText, wishListItem) { // Функция для обработки шага 'link'
    if (messageText) {
        wishListItem.link = messageText;
        const keyboard = [{ text: 'Завершить создание', callback_data: 'complete_creation' }]
        await getWishItemInMessage(ctx, wishListItem, keyboard)
        return 'completed';
    } else {
        await ctx.reply(
            'Пожалуйста, ' +
            'отправьте корректную ссылку на товар'
        );
        return 'link';
    }
}

export async function handleInvalid(ctx) { // Функция для обработки некорректных данных
    await ctx.reply(
        `Вы отправили некорректные данные. 
         Пожалуйста, следуйте инструкциям и отправляйте информацию о товаре по порядку: 
         сначала название, затем описание, фотографию и в конце ссылку.`
    );
    return 'invalid';
}

async function handleCreate(ctx, chatId) { // Функция начала создания вишайтема
    sessionReset(chatId)
    session.get(chatId).wishItem = {
        currentState: 'title',
    }
    await ctx.reply('Пришлите название вашего товара', getCreateWishMenu(), { reply_markup: null });
}

async function createWish(ctx, chatId, messageText, bot) { // функция обрабатывает создание виш-айтема
    const wishListItem = session.get(chatId).wishItem;
    const currentState = wishListItem.currentState;

    let nextState;

    switch (currentState) {
        case 'title':
            nextState = await handleTitle(ctx, messageText, wishListItem, chatId);
            break;
        case 'description':
            nextState = await handleDescription(ctx, messageText, wishListItem);
            break;
        case 'price':
            nextState = await handlePrice(ctx, messageText, wishListItem);
            break;
        case 'photo':
            nextState = await handlePhoto(ctx, ctx.message, wishListItem);
            break;
        case 'link':
            nextState = await handleLink(ctx, messageText, wishListItem);
            bot.action('complete_creation', async (ctx) => {
                const creatorId = ctx.update.callback_query.from.id;
                const creatorWish = session.get(creatorId).wishItem;

                await handleWishList(creatorWish);
                await ctx.answerCbQuery();
                await ctx.editMessageReplyMarkup();
                await ctx.reply('Создание карточки завершено!', getMainMenu(), { reply_markup: null });

                session.get(creatorId).wishItem = null;
            });
            break;
        case 'completed':
            return;
        default:
            nextState = await handleInvalid(ctx);
            break;
    }
    if (nextState !== 'invalid') {
        session.get(chatId).wishItem.currentState = nextState;
    }
}

export async function getWishItemInMessage(ctx, item, keyboard) { // функция отправляет выбранный виш-айтем в чат
    let linkText = item.link.startsWith('http') ? `[Перейти к товару](${item.link})` : `*Ссылка:* ${item.link}`;
    const replyOptions = {
        caption: `*Название:* ${item.title}\n*Описание:* ${item.description}\n*Стоимость:* ${item.price}₽\n${linkText}`,
        parse_mode: 'Markdown'
    };
    if (keyboard) {
        replyOptions.reply_markup = {
            inline_keyboard: [keyboard]
        };
    }
    await ctx.replyWithPhoto(item.photo, replyOptions);
}

export async function getFriendsWishItems(ctx, chatId, messageText) {
    const userId = { userId: chatId };
    const { addedUsers } = await findUser(userId);
    const currentUserId = addedUsers.find((i) => i.userName === messageText)?.userId;
    if (currentUserId) {
        sessionReset(chatId);
        await getWishList(ctx, currentUserId, chatId);
    } else {
        return ctx.reply('Такого пользователя не существует');
    }
}

export { handleCreate, createWish };

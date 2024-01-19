import express from 'express';
import {botInstructions, PORT} from './config.js';
import {Telegraf} from 'telegraf';
import mongoose from 'mongoose';
import { getAddedUsers, handleUser, hasUser } from "./controllers/user.js";
import { createWish, getFriendsWishItems, getWishItemInMessage, handleCreate } from "./createWishList.js";
import { session, sessionReset } from "./session.js";
import { getMainMenu, getWishItems } from "./keyboards.js";
import { addUser, getInviteCode, handleInviteCode } from "./inviteWishList.js";
import { getWishList } from "./controllers/wishList.js";
import dotenv from 'dotenv';

dotenv.config();

const { TOKEN } = process.env


const app = express();
const bot = new Telegraf(TOKEN);

mongoose.connect('mongodb://127.0.0.1:27017/wishlist').then(r => console.log('Успешное подключение к MongoDB'));

async function botMessage(ctx) {
    try {
        const chatId = ctx.message.chat.id;
        const messageText = ctx.message.text;

        if (!await hasUser(ctx)) {
            await handleUser(ctx);
        }

        if (!session.has(chatId)) {
            session.set(chatId, {});
        }

        switch (messageText) {
            case '/start':
                sessionReset(chatId);
                ctx.reply('Вы перешли в главное меню', getMainMenu(), { reply_markup: null });
                break;
            case '🌟 Создать виш-айтем':
                sessionReset(chatId);
                await handleCreate(ctx, chatId);
                break;
            case '📤 Получить инвайт-код':
                ctx.reply(await getInviteCode(ctx, chatId));
                break;
            case '📘 Инструкции':
                ctx.replyWithHTML(botInstructions);
                break;
            case '🔑 Ввести инвайт-код':
                await handleInviteCode(ctx, chatId);
                break;
            case '📋 Мои виш-айтемы':
                await getWishList(ctx, chatId, chatId);
                break;
            case '👫 Виш-айтемы друзей':
                session.get(chatId).friendsWishItems = true;
                const addedUsers = await getAddedUsers(chatId);
                const userNames = addedUsers.map((i) => i.userName);
                ctx.reply('Список друзей:', getWishItems(userNames), { reply_markup: null });
                break;
            case '🚫 Отменить создание':
                sessionReset(chatId);
                ctx.reply('Создание виш-айтема отменено', getMainMenu(), { reply_markup: null });
                break;
            case '🏠 Главное меню':
                sessionReset(chatId);
                ctx.reply('Вы перешли в главное меню!', getMainMenu(), { reply_markup: null });
                break;
            default:
                await handleOtherMessages(ctx, chatId, messageText);
                break;
        }
    } catch (err) {
        console.error('Произошла ошибка:', err);
    }
}

let messageCount = 0;
const messagesPerSecondLimit = 25;
const timeWindow = 1000;

bot.on('message', (ctx) => { // Основной обработчик сообщений пользователя
    messageCount++;
    if (messageCount <= messagesPerSecondLimit) {
         botMessage(ctx)
    } else {
        setTimeout(() => {
            messageCount = 0;
        }, timeWindow);
    }
});


// Функция для обработки всех остальных сообщений пользователя
async function handleOtherMessages(ctx, chatId, messageText) {
    const { wishItem, addInviteCode, getWishLists, friendsWishItems } = session.get(chatId);

    if (wishItem) {
        await createWish(ctx, chatId, messageText, bot);

    } else if (addInviteCode) {
        await addUser(ctx, chatId);

    } else if (getWishLists) {
        const selectedItem = getWishLists.filter((i) => messageText.startsWith(i.title))[0];
        return selectedItem
            ? getWishItemInMessage(ctx, selectedItem)
            : ctx.reply('Айтема не существует');

    } else if (friendsWishItems) {
        await getFriendsWishItems(ctx, chatId, messageText);
    } else {
        return ctx.reply('Пожалуйста, начните с команды, например, /start');
    }
}

bot.launch()
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))


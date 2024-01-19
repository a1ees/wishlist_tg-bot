import {addUserToUser, findUser} from "./controllers/user.js";
import {session, sessionReset} from "./session.js";
import {getAddInvCodeMenu} from "./keyboards.js";

function generateInviteCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
        if (i === 3) {
            code += '-';
        }
    }
    return code;
}

async function isCodeUnique(code) {
    const inviteCode = { inviteCode: code };
    const existingUser = await findUser(inviteCode)
    return !existingUser;
}

export async function inviteWishList() {
    let code = generateInviteCode();
    while (!(await isCodeUnique(code))) {
        code = generateInviteCode();
    }
    return code;
}

export async function getInviteCode(ctx, chatId) {
    try {
        const userId = { userId: chatId };
        const user = await findUser(userId)
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        await ctx.reply('Ваш код:')
        return `${user.inviteCode}`;
    } catch (err) {
        console.log('Ошибка:', err);
        return 'Произошла ошибка при получении кода приглашения';
    }
}

export async function handleInviteCode(ctx, chatId) {
    sessionReset(chatId)
    session.get(chatId).addInviteCode = {
        currentState: 'awaitCode',
    }
    await ctx.reply('Пришлите инвайт-код для добавления пользователя', getAddInvCodeMenu(), { reply_markup: null });
}

export async function searchInviteCode(ctx, chatId, addInviteCode) {
    try {
        const inviteCode = { inviteCode: ctx.message.text };
        const userToAdd = await findUser(inviteCode)
        if (!userToAdd) {
            await ctx.reply('Пользователь не найден, попробуйте ввести ещё раз', getAddInvCodeMenu(), { reply_markup: null });
        } else {
            addInviteCode.currentState = 'awaitUserName';
            addInviteCode.userToAdd = userToAdd;
            await ctx.reply('Пользователь найден! 🌟')
            await ctx.reply('Пожалуйста, укажите имя для этого пользователя в следующем сообщении:')
        }
    } catch (err) {
        console.log('Ошибка:', err);
        return 'Произошла ошибка при получении кода приглашения';
    }
}

export async function addUserName(ctx, chatId, addInviteCode) {
    try {
        const myUserId = { userId: chatId };
        const userToAdd = addInviteCode.userToAdd;
        const userName = ctx.message.text ? ctx.message.text : 'undefined';
        addInviteCode.currentState = 'completed';
        await addUserToUser(ctx, myUserId, userToAdd, myUserId, userName)
    } catch (err) {
        console.log('Ошибка:', err);
        return 'Произошла ошибка при получении кода приглашения';
    }
}

export async function addUser(ctx, chatId) {
    const addInviteCode = session.get(chatId).addInviteCode;
    const currentState = addInviteCode.currentState;


    switch (currentState) {
        case 'awaitCode':
            await searchInviteCode(ctx, chatId, addInviteCode);
            break;
        case 'awaitUserName':
            await addUserName(ctx, chatId, addInviteCode);
            session.get(chatId).addInviteCode = null;
            break;
    }
}

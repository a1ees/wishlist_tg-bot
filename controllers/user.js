import UserModel from "../models/user.js"
import {getMainMenu} from "../keyboards.js";
import {inviteWishList} from "../inviteWishList.js";

async function handleUser(ctx) { // создает пользователя
    try {
        const { first_name, id } = ctx.from;
        const userId = { userId: id };
        const existingUser = await findUser(userId);

        if (existingUser) {
            return ctx.reply(`С возвращением, ${first_name}!`, getMainMenu(), { reply_markup: null });
        } else {
            const uniqueInviteCode = await inviteWishList();
            await UserModel.create({ userName: first_name, userId: id, inviteCode: uniqueInviteCode });
            return ctx.reply(`Добро пожаловать, ${first_name}!`, getMainMenu(), { reply_markup: null });
        }
    } catch (error) {
        console.error('Произошла ошибка при создании пользователя:', error);
        ctx.reply('Произошла ошибка, обратитесь к https://t.me/a1eesc.');
    }
}

async function findUser(obj) { // возвращает объект пользователя
    try {
        return UserModel.findOne(obj);
    } catch (err) {
        console.log(`Произошла ошибка при поиске юзера ${err}`)
    }
}

async function hasUser(ctx) { // проверяет наличие пользователя в бд
    try {
        const { id } = ctx.from;
        const userId = { userId: id };
        const existingUser = await findUser(userId)
        return !!existingUser;
    } catch (error) {
        console.error('Произошла ошибка при поиске юзера:', error);
        ctx.reply('Произошла ошибка, обратитесь к https://t.me/a1eesc.');
    }
}

async function addUserToUser(ctx, filter, userToAdd, myUserId, userName) { // добавляет пользователя в друзья другому пользователю
    try {
        const myUser = await findUser(myUserId)
        const { addedUsers } = myUser;
        if (userToAdd.userId.toString() === myUserId.userId.toString()) {
            return ctx.reply('Вы пытаетесь добавить себя 🥺', getMainMenu(), { reply_markup: null });
        } else if (addedUsers.map((i) => i.userId).includes(userToAdd.userId.toString())) {
            return ctx.reply('Пользователь уже добавлен 🥺', getMainMenu(), { reply_markup: null });
        } else if (addedUsers.map((i) => i.userName).includes(userName)) {
            return ctx.reply('Придумайте другое имя пользователю, такой уже есть в вашем списке 🥺', getMainMenu(), { reply_markup: null });
        } else {
            await UserModel.findOneAndUpdate(
                filter,
                { $addToSet: { addedUsers: { userId: userToAdd.userId, userName: userName } } },
                { new: true },
            );
            await ctx.reply(`Пользователь ${userName} (${userToAdd.userName}) добавлен!`, getMainMenu(), { reply_markup: null });
        }
    } catch (error) {
        console.error('Произошла ошибка при добавлении юзера:', error);
        ctx.reply('Произошла ошибка, обратитесь к https://t.me/a1eesc.');
    }
}

async function getAddedUsers(myUserId) { // выводит в консоль добавленных пользователей
    const myUser = await findUser({ userId: myUserId });
    return myUser.addedUsers;
}

export { handleUser, hasUser, findUser, addUserToUser, getAddedUsers };

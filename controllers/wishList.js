import WishListModel from "../models/wishList.js"
import {getWishItems} from "../keyboards.js";
import {session} from "../session.js";

export async function handleWishList(wishItem) { // создает виш лист
    try {
        await WishListModel.create(wishItem);
        return 'completed';
    } catch (error) {
        console.log(error)
    }
}

export async function checkUniqueTitle(title) { // проверяет уникальность заголовка
    try {
        const wishArr = await WishListModel.find({ title: title })
        return wishArr.length;
    } catch (error) {
        console.log(error)
    }
}

export async function getWishList(ctx, userId, chatId) { // функция создает клавиатуру и сессию с айтемами юзера
    try {
        const items = await WishListModel.find({ owner: userId });
        session.get(chatId).getWishLists = items;
        const titles = [...items].map((i) => i.title + ` (~${i.price}р)`)
        return ctx.reply('Виш-айтемы:', getWishItems(titles), { reply_markup: null });
    } catch (error) {
        console.log(error)
    }
}

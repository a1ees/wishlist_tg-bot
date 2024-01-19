const session = new Map();

function sessionReset(chatId) {
    const sessionData = session.get(chatId);
    sessionData.addInviteCode = null;
    sessionData.wishItem = null;
    sessionData.getWishLists = null;
    sessionData.friendsWishItems = null;
}

export { session, sessionReset };

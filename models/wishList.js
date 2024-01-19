import mongoose from 'mongoose';

const wishListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
    },
    link: {
        type: String,
        required: true,
        minlength: 1,
    },
    description: {
        type: String,
        required: false,
        minlength: 1,
    },
    photo: {
        type: String,
        minlength: 1,
        required: false,
    },
    price: {
        type: String,
        minlength: 1,
        required: false,
    },
    owner: {
        type: String,
        required: true,
    },
});

wishListSchema.set('versionKey', false);

const WishListModel = mongoose.model('wishList', wishListSchema);

export default WishListModel;

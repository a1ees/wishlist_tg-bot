import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: false,
    },
    userId: {
        type: String,
        required: true,
    },
    inviteCode: {
        type: String,
        required: true,
    },
    addedUsers: {
        type: Array,
        default: [],
        required: true,
    },
});

userSchema.set('versionKey', false);

const UserModel = mongoose.model('user', userSchema);

export default UserModel;

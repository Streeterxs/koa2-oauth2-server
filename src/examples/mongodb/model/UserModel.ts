import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';

import { Callback, Token, Client } from "oauth2-server";
import { testsLogger } from "../../../testLogger";
import { appLogger } from "../../../appLogger";


let log;

if (process.env.JEST_WORKER_ID) {

    log = testsLogger.extend('userModel');
} else {

    log = appLogger.extend('userModel');
}


export interface IUser extends mongoose.Document {
    email: string;
    password: string;
    tokens: string[];
};
export interface IUserModel extends mongoose.Model<IUser> {
    getUser(email: string, password: string): Promise<IUser>;
};
const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        unique: false,
        required: true
    },
    tokens: {
        type: [String],
        required: true,
        default: []
    }
});

userSchema.statics.getUser = async (email, password) => {

    const user = await User.findOne({email});

    if (!user) {
        throw new Error('Invalid login credentials');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        throw new Error('Invalid password');
    }

    return user;
};

userSchema.pre<IUser>('save', async function(next) {

    if (this.isModified('password')) {

        log('this inside pre save: ', this);
        this.password = await bcrypt.hash(this.password, 8);
        log('this.password: ', this.password);
    }

    next();
});

export const User = mongoose.model<IUser, IUserModel>('PersonsSector_User', userSchema);

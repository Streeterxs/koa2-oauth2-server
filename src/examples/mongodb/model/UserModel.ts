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

export interface IOAuthTokens extends mongoose.Document, Token {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
};

export interface IOAuthTokensModel extends mongoose.Model<IOAuthTokens> {
    getAccessToken: (bearerToken: string, callback?: Callback<IOAuthTokens>) => Promise<IOAuthTokens>;
    getRefreshToken: (refreshToken: string) => Promise<IOAuthTokens>;
    verifyScope: (accessToken: IOAuthTokens, scope: string | string[], callback?: Callback<boolean>) => Promise<boolean>;
    saveToken: (token: IOAuthTokens, client: Client, user: IUser, callback?: Callback<IOAuthTokens>) => Promise<IOAuthTokens>;
};
const oAuthTokensSchema = new Schema({
    accessToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    client: { type: String },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
    user: { type: String }
});

export interface IOAuthClient extends mongoose.Document {
    clientId: string;
    clientSecret: string;
    grants: string | string[];
    redirectUris?: string | string[];
    accessTokenLifetime?: number;
    refreshTokenLifetime?: number;
};
export interface IOAuthCLientModel extends mongoose.Model<IOAuthClient> {
    getClient(clientId: string, clientSecret: string, callback?: Callback<Client>): Promise<Client>;
};
const oAuthClientSchema = new Schema({
    clientId: { type: String },
    clientSecret: { type: String },
    grants: { type: [String] },
    redirectUris: { type: Array, required: false }
});


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

// Fixed infinite loading on request
oAuthTokensSchema.statics.getAccessToken = (bearerToken: string, callback?: Callback<Token>) => {

    log('bearerToken: ', bearerToken);
    OAuthTokens.findOne({accessToken: bearerToken}, (error, token) => {

        log('callback Token: ', token);
        log('callback error: ', error);
        callback(error, token);
    });
};

oAuthTokensSchema.statics.verifyScope = async (token: IOAuthTokens, scope: string | string[], callback?: Callback<Token>): Promise<boolean> => {

    log('verifyScope!!');
    if (!token.scope) {
        return false;
    }

    const requestedScopes = (scope as string).split(' ');
    const authorizedScopes = (token.scope as string).split(' ');
    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);
};

oAuthTokensSchema.statics.getRefreshToken = async (refreshToken: string) => {

  log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

  return await OAuthTokens.findOne({ refreshToken });
};

oAuthTokensSchema.statics.saveToken = async (token: IOAuthTokens, client: Client, user: IUser) => {

  log('in saveToken (token: ' + token + ')');
  log('token stringfied: ', JSON.stringify(token));
  log('token expires on: ', token.accessTokenExpiresAt);
  log('client.id: ', client.id);
  log('client.id === client._id: ', client.id === client._id);
  log('user: ', user);

  const accessToken = new OAuthTokens({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    client: client.id,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    user: user.id
  });

  const newToken = await accessToken.save();
  (await user.tokens).splice(0, 0, newToken.id);
  await user.save();

  return newToken;
};

oAuthClientSchema.statics.getClient = async (clientId, clientSecret) => {

    return await OAuthClient.findOne({ clientId, clientSecret });
};

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
export const OAuthTokens = mongoose.model<IOAuthTokens, IOAuthTokensModel>('PersonsSector_OAuthTokens', oAuthTokensSchema);
export const OAuthClient = mongoose.model<IOAuthClient, IOAuthCLientModel>('PersonsSector_OAuthClient', oAuthClientSchema);

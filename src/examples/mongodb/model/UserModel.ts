import mongoose, { Schema } from "mongoose";

import { Callback, Token, Client } from "oauth2-server";

export interface IOAuthTokens extends mongoose.Document, Token {
    accessToken: string;
    accessTokenExpiresOn: Date;
    clientId: string;
    refreshToken: string;
    refreshTokenExpiresOn: Date;
    userId: string;
};
export interface IOAuthTokensModel extends mongoose.Model<IOAuthTokens> {
    getAccessToken: (bearerToken: string, callback?: Callback<IOAuthTokens>) => Promise<IOAuthTokens>;
    getRefreshToken: (refreshToken: string) => Promise<IOAuthTokens>;
    verifyScope: (accessToken: IOAuthTokens, scope: string | string[], callback?: Callback<boolean>) => Promise<boolean>;
    saveToken: (token: IOAuthTokens, client: Client, user: IUser, callback?: Callback<IOAuthTokens>) => Promise<IOAuthTokens>;
};
const oAuthTokensSchema = new Schema({
    accessToken: { type: String },
    accessTokenExpiresOn: { type: Date },
    clientId: { type: String },
    refreshToken: { type: String },
    refreshTokenExpiresOn: { type: Date },
    userId: { type: String }
});

// TODO Correct typing conflicts Client ~ Document
export interface IOAuthClient extends mongoose.Document/* , Client */ {
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
    redirectUris: { type: Array }
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

oAuthTokensSchema.statics.getAccessToken = async (bearerToken: string, callback?: Callback<IOAuthTokens>): Promise<IOAuthTokens> => {

    return await OAuthTokens.findOne({accessToken: bearerToken});
};

oAuthTokensSchema.statics.verifyScope = async (token: IOAuthTokens, scope: string | string[], callback?: Callback<IOAuthTokens>): Promise<boolean> => {

    if (!token.scope) {
        return false;
    }

    const requestedScopes = (scope as string).split(' ');
    const authorizedScopes = (token.scope as string).split(' ');
    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);
};

oAuthTokensSchema.statics.getRefreshToken = async (refreshToken: string) => {

  console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

  return await OAuthTokens.findOne({ refreshToken });
};

oAuthTokensSchema.statics.saveToken = async (token: IOAuthTokens, client: Client, user: IUser) => {

  console.log('in saveToken (token: ' + token + ')');

  const accessToken = new OAuthTokens({
    accessToken: token.accessToken,
    accessTokenExpiresOn: token.accessTokenExpiresOn,
    clientId: client.id,
    refreshToken: token.refreshToken,
    refreshTokenExpiresOn: token.refreshTokenExpiresOn,
    userId: user.id
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

  console.log('in getUser (username: ' + email + ', password: ' + password + ')');

  return await User.findOne({ email, password });
};

export const User = mongoose.model<IUser, IUserModel>('PersonsSector_User', userSchema);
export const OAuthTokens = mongoose.model<IOAuthTokens, IOAuthTokensModel>('PersonsSector_OAuthTokens', oAuthTokensSchema);
export const OAuthClient = mongoose.model<IOAuthClient, IOAuthCLientModel>('PersonsSector_OAuthClient', oAuthClientSchema);

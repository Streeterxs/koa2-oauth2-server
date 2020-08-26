import mongoose, { Schema } from "mongoose";

import { Callback, Token, Client } from "oauth2-server";
import { testsLogger } from "@koa2oauth2/debug";
import { appLogger } from "@koa2oauth2/debug";
import { IUser } from "./UserModel";


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

export const OAuthTokens = mongoose.model<IOAuthTokens, IOAuthTokensModel>('PersonsSector_OAuthTokens', oAuthTokensSchema);

import mongoose, { Schema } from "mongoose";

import { Callback, Client } from "oauth2-server";
import { testsLogger } from "../../../../src/testLogger";
import { appLogger } from "../../../../src/appLogger";


let log;

if (process.env.JEST_WORKER_ID) {

    log = testsLogger.extend('userModel');
} else {

    log = appLogger.extend('userModel');
}

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

oAuthClientSchema.statics.getClient = async (clientId, clientSecret) => {

    return await OAuthClient.findOne({ clientId, clientSecret });
};

export const OAuthClient = mongoose.model<IOAuthClient, IOAuthCLientModel>('PersonsSector_OAuthClient', oAuthClientSchema);

import OAuth2 from 'oauth2-server';
import Koa from 'koa';

import { User, OAuthTokens, OAuthClient } from "./model";
import {koaOauthServer} from '@koa2oauth2/server';

const app = new Koa()
const model:
    OAuth2.AuthorizationCodeModel |
    OAuth2.ClientCredentialsModel |
    OAuth2.RefreshTokenModel |
    OAuth2.PasswordModel |
    OAuth2.ExtensionModel = {
        getAccessToken: OAuthTokens.getAccessToken,
        saveToken: OAuthTokens.saveToken,
        verifyScope: OAuthTokens.verifyScope,
        getRefreshToken: OAuthTokens.getRefreshToken,
        getClient: OAuthClient.getClient,
        getUser: User.getUser
    };

const {
    authenticate,
    authorize,
    token
} = koaOauthServer({
    model
});

app.use(authenticate());

app.listen('3000');

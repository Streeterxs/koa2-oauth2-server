import { User, OAuthTokens, OAuthClient } from "./model";
import OAuth2 from 'oauth2-server';
import { koaOauhServer } from "../../koaOauhServer";

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

const app = koaOauhServer({
    model
});

app.use(async (context, next) => {
    context.authenticate();
    await next();
});

app.listen('3000');

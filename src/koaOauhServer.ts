import koa from 'koa';
import OAuth2, {Request, Response, UnauthorizedRequestError} from 'oauth2-server';
import debug from 'debug';

const log = debug('koaOauthServer:entry');


export interface IKoaOauth2Context extends koa.DefaultContext {
    authenticate: () => {};
    authorize: () => {};
    token: () => (next: any) => Promise<any>;
};
export const koaOauhServer = (options: OAuth2.ServerOptions) => {

    const app = new koa<koa.DefaultState, IKoaOauth2Context>();

    const oauth = new OAuth2(options);

    // https://stackoverflow.com/questions/45782303/best-way-to-add-helper-methods-to-context-object-in-koa2
    app.context.oauth = oauth;
    app.context.authenticate = function() {

        return (next) => {

            log('this: ', this);
            log('this.request: ', this.request);
            const request = new Request(this.request);
            const response = new Response(this.response);

        try {
            this.state.oauth = {
                token: this.oauth.authenticate(request, response)
            };
        } catch (e) {

            log('error: ', e);
            if (e instanceof UnauthorizedRequestError) {
                this.status = e.code;
            } else {
                this.body = { error: e.name, error_description: e.message };
                this.status = e.code;
            }

            return this.app.emit('error', e, this);
        }

        return next;
        };
    };

    app.context.authorize = function() {

        return async (next) => {
            const request = new Request(this.request);
            const response = new Response(this.response);

            try {
                this.state.oauth = {
                    code: await this.oauth.authorize(request, response)
                };

                this.body = response.body;
                this.status = response.status;

                this.set(response.headers);
            } catch (e) {
                if (response) {
                    this.set(response.headers);
                }

                if (e instanceof UnauthorizedRequestError) {
                    this.status = e.code;
                } else {
                    this.body = { error: e.name, error_description: e.message };
                    this.status = e.code;
                }

                return this.app.emit('error', e, this);
            }

            return next;
        };
    };

    app.context.token = function() {

        return async (next) => {
            const request = new Request(this.request);
            const response = new Response(this.response);

            try {
                this.state.oauth = {
                    token: await this.oauth.token(request, response)
                };

                this.body = response.body;
                this.status = response.status;

                this.set(response.headers);
            } catch (e) {
                if (response) {
                    this.set(response.headers);
                }

                if (e instanceof UnauthorizedRequestError) {
                    this.status = e.code;
                } else {
                    this.body = { error: e.name, error_description: e.message };
                    this.status = e.code;
                }

                return this.app.emit('error', e, this);
            }

            return next;
        };
    };

    return app;
};

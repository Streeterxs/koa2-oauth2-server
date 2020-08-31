import koa from 'koa';
import OAuth2, {Request, Response, UnauthorizedRequestError} from 'oauth2-server';
import {appLogger} from '@koa2oauth2/debug';

const log = appLogger.extend('entry');


export interface IKoaOauth2Context extends koa.DefaultContext {
    authenticate: () => {};
    authorize: () => {};
    token: () => (next: any) => Promise<any>;
};
export const koaOauthServer = (options: OAuth2.ServerOptions) => {

    const oauth = new OAuth2(options);

    const authenticate = () => {

        return async (context: koa.DefaultContext, next: koa.Next) => {

            log('context: ', context);
            log('context.request: ', context.request);
            const request = new Request(context.request);
            const response = new Response(context.response);

            try {
                context.state.oauth = {
                    token: await oauth.authenticate(request, response)
                };
            } catch (e) {

                log('error: ', e);
                if (e instanceof UnauthorizedRequestError) {
                    context.status = e.code;
                } else {
                    context.body = { error: e.name, error_description: e.message };
                    context.status = e.code;
                }

                return context.app.emit('error', e, context);
            }

            await next();
        };
    };

    const authorize = () => {

        return async (context: koa.DefaultContext, next: koa.Next) => {

            const request = new Request(context.request);
            const response = new Response(context.response);

            try {
                context.state.oauth = {
                    code: await oauth.authorize(request, response)
                };

                context.body = response.body;
                context.status = response.status;

                context.set(response.headers);
            } catch (e) {
                if (response) {
                    context.set(response.headers);
                }

                if (e instanceof UnauthorizedRequestError) {
                    context.status = e.code;
                } else {
                    context.body = { error: e.name, error_description: e.message };
                    context.status = e.code;
                }

                return context.app.emit('error', e, context);
            }

            await next();
        };
    };

    const token = () => {

        return async (context: koa.DefaultContext, next: koa.Next) => {

            const request = new Request(context.request);
            const response = new Response(context.response);

            try {

                context.state.oauth = {
                    token: await oauth.token(request, response)
                };

                context.body = response.body;
                context.status = response.status;

                context.set(response.headers);
            } catch (e) {

                if (response) {
                    context.set(response.headers);
                }

                if (e instanceof UnauthorizedRequestError) {
                    context.status = e.code;
                } else {
                    context.body = { error: e.name, error_description: e.message };
                    context.status = e.code;
                }

                return context.app.emit('error', e, context);
            }

            await next();
        };
    };

    return {
        authenticate,
        authorize,
        token
    };
};

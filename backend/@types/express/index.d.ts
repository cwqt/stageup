import * as ExpressSession from 'express-session';

declare module 'express' {
	export interface Request {
		session: ExpressSession.Session & {
			user?: {
				_id: number;
				is_admin: boolean;
			};
		};
	}
}

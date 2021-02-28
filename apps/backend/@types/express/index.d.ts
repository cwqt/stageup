import { IUser } from '@core/interfaces';
import * as ExpressSession from 'express-session';

declare module 'express' {
	export interface Request {
		session: ExpressSession.Session & {
			user?: {
				_id: IUser["_id"];
				is_admin: boolean;
			};
		};
	}
}

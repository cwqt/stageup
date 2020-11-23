import { Request, Response }  from 'express';
import { Router } from './router';

const router = new Router();

router.get<string>("/", (req:Request, res:Response) => res.send("Hello world!"), []);


export default router;
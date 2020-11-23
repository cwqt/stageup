import { Request, Response }  from 'express';
import { Router } from './router';

const router = new Router();

router.get<string>("/", async (req:Request, res:Response) => "Hello world!", []);


export default router;
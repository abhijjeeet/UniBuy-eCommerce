import * as express from "express"; // eslint-disable-line @typescript-eslint/no-unused-vars
import "./session"
import { Account } from "@prisma/client";



declare global {
    namespace Express {
        interface Request {
            user: Account;
        }
    }
}





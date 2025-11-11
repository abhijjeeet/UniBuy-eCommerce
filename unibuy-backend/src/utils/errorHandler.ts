import { ErrorRequestHandler } from "express";
import { ValidateError } from "tsoa";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    if (err instanceof ValidateError) {
        let message = "Validtion Error"
        if (err?.fields['body']?.message) message = err?.fields['body']?.message
        res.status(422).json({ message, details: err?.fields, });
        return;
    }
    if (err) {
        res.status(err.status || 500).send(err);
        return;
    }
    next();
};


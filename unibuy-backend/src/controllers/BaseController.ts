
import { Controller } from "tsoa";

export type MsgRes = { message: string };


export class BaseController extends Controller {

    protected msgRes(message: string): MsgRes {
        return { message }
    };

    protected createRes(resource: string): MsgRes {
        return { message: `${resource} is created.` };
    }

    protected deleteRes(resource: string): MsgRes {
        return { message: `${resource} is deleted.` };
    }

    protected updateRes(resource: string, action?: string): MsgRes {
        if (action) return { message: `${resource} is ${action}.` };
        return { message: `${resource} is updated.` };
    }

    protected notFoundRes(resource: string, id?: number | string): MsgRes {
        this.setStatus(404);
        if (id) return { message: `${resource} with ID ${id} not found.` };
        return { message: `${resource} not found.` };
    }

    protected alreadyExistsRes(resource: string): MsgRes {
        this.setStatus(400);
        return { message: `${resource} already exists.` };
    }

    protected badRequestRes(message: string): MsgRes {
        this.setStatus(400);
        return { message };
    }

    protected unauthorizedRes(message: string): MsgRes {
        this.setStatus(401);
        return { message };
    }

}

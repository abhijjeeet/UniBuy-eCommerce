import { useRoot } from "../context/RootContext";
import { apiRequest } from "./baseService";

export const useLogin = () => {
    const { setToken, setRole } = useRoot();

    return async (body) => {
        const response = await apiRequest("POST", "auth/auth/login", body);
        if (response.token) {
            setToken(response.token);
            setRole("User");
        }
        return response;
    };
};

export const useTFA = () => {
    const { setToken, setRole } = useRoot();

    return async (body) => {
        const response = await apiRequest("POST", "auth/auth/2FA", body);
        if (response.token) {
            setToken(response.token);
            setRole("User");
        }
        return response;
    };
};


export const useFirebaseLogin = () => {
    const { setToken, setRole } = useRoot();

    return async (body) => {
        const response = await apiRequest("POST", "auth/auth/login/firebase", body);
        if (response.token) {
            setToken(response.token);
            setRole("User");
        }
        return response;
    };
};



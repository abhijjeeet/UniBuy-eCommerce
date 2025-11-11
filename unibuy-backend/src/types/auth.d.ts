




export interface LoginBody {
    /**
     * @pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ please provide correct email
     */
    email: string;
    password: string;
};


export interface OtpVerifyBody {
    /**
     * @pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ please provide correct email
     */
    email: string;
    otp: string;
};



export interface AuthResponse { token: string, isOnboarded: boolean, isAdmin: boolean };

export interface AdminAuthResponse { token: string };

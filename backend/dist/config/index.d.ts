export declare const config: {
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    server: {
        env: string;
        port: number;
        apiUrl: string;
        frontendUrl: string;
    };
    logs: {
        level: string;
    };
    uploads: {
        dir: string;
        maxFileSize: number;
    };
    external: {
        mega: {
            url: string;
            key: string;
        };
        sox: {
            url: string;
            key: string;
        };
    };
    sqlServer: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        encrypt: boolean;
        trustServerCertificate: boolean;
    };
    email: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
};
//# sourceMappingURL=index.d.ts.map
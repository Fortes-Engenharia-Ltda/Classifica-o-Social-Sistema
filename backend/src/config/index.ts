import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Server
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Logs
  logs: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // File Uploads
  uploads: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },

  // External APIs
  external: {
    mega: {
      url: process.env.MEGA_API_URL || '',
      key: process.env.MEGA_API_KEY || '',
    },
    sox: {
      url: process.env.SOX_API_URL || '',
      key: process.env.SOX_API_KEY || '',
    },
  },

  // SQL Server (FortesDW)
  sqlServer: {
    host: process.env.SQLSERVER_HOST || '',
    port: parseInt(process.env.SQLSERVER_PORT || '1433', 10),
    database: process.env.SQLSERVER_DATABASE || '',
    user: process.env.SQLSERVER_USER || '',
    password: process.env.SQLSERVER_PASSWORD || '',
    encrypt: process.env.SQLSERVER_ENCRYPT !== 'false',
    trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE === 'true',
  },

  // Email (recuperação de senha)
  email: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    user: 'classificacaofortes@outlook.com',
    pass: 'Fortes2026@',
    from: 'classificacaofortes@outlook.com',
  },
};

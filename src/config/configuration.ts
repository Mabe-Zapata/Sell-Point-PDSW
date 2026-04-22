export const configuration = () => ({
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD !== undefined ? process.env.DATABASE_PASSWORD : 'root',
    name: process.env.DATABASE_NAME || 'sellpoint',
  },
  tax: {
    percentage: parseFloat(process.env.IVA_PERCENTAGE || '15'),
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
});

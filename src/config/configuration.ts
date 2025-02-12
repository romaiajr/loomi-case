export default () => ({
  port: parseInt(process.env.PORT || '3000'),
  database: {
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    pwd: process.env.DATABASE_PWD?.toString(),
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    synchronize: true,
  },
  jwtSecretKey: process.env.JWT_SECRET,
});

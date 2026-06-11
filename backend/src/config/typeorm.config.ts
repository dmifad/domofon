import { DataSource, DataSourceOptions } from 'typeorm';

export const typeOrmConfig = (): DataSourceOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

export default new DataSource(typeOrmConfig());

/**
 * Dev-сид: тестовый дом, квартира (лицевой счёт 100001, код 1234), домофон и камера.
 * Запуск: pnpm seed
 */
import 'reflect-metadata';
import dataSource from './config/typeorm.config';

async function seed() {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const existing = await dataSource.query(
    `SELECT id FROM buildings WHERE address = $1 LIMIT 1`,
    ['ул. Тестовая, 1'],
  );
  if (existing.length > 0) {
    console.log('Seed already applied');
    await dataSource.destroy();
    return;
  }

  const [{ id: buildingId }] = await dataSource.query(
    `INSERT INTO buildings (city, address) VALUES ($1, $2) RETURNING id`,
    ['Москва', 'ул. Тестовая, 1'],
  );

  await dataSource.query(
    `INSERT INTO apartments (building_id, number, account_number, link_code)
     VALUES ($1, '42', '100001', '1234')`,
    [buildingId],
  );

  await dataSource.query(
    `INSERT INTO intercoms (building_id, name, sip_uri, camera_path)
     VALUES ($1, 'Подъезд 1', 'sip:panel1@asterisk', 'panel1')`,
    [buildingId],
  );

  await dataSource.query(
    `INSERT INTO cameras (building_id, name, stream_path, has_archive)
     VALUES ($1, 'Двор', 'yard1', true)`,
    [buildingId],
  );

  console.log('Seed applied: дом "ул. Тестовая, 1", кв. 42, л/с 100001, код 1234');
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

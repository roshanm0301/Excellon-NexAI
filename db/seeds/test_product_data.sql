-- db/seeds/test_product_data.sql
-- Sample product records for testing the Product List runtime view
-- 20 products across 5 brands, 5 categories, mix of types and active/inactive

BEGIN;

INSERT INTO entity_record (id, tenant_id, entity_type, payload, status, created_by, updated_by)
VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM001","item_name":"Engine Oil 10W30 1L","item_type":"Lubricant","brand":"Castrol","category":"Lubricants","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM002","item_name":"Engine Oil 5W40 1L","item_type":"Lubricant","brand":"Castrol","category":"Lubricants","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM003","item_name":"Air Filter Element","item_type":"Spare Part","brand":"Bosch","category":"Filters","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM004","item_name":"Oil Filter Cartridge","item_type":"Spare Part","brand":"Bosch","category":"Filters","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM005","item_name":"Fuel Filter Assembly","item_type":"Spare Part","brand":"Bosch","category":"Filters","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM006","item_name":"Spark Plug Iridium","item_type":"Spare Part","brand":"NGK","category":"Electrical","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM007","item_name":"Spark Plug Platinum","item_type":"Spare Part","brand":"NGK","category":"Electrical","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM008","item_name":"Glow Plug Diesel","item_type":"Spare Part","brand":"NGK","category":"Electrical","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM009","item_name":"Brake Disc Front","item_type":"Spare Part","brand":"Bosch","category":"Brakes","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM010","item_name":"Brake Pad Set Front","item_type":"Spare Part","brand":"Bosch","category":"Brakes","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM011","item_name":"Coolant Concentrate 1L","item_type":"Consumable","brand":"Castrol","category":"Lubricants","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM012","item_name":"Brake Fluid DOT4 500ml","item_type":"Consumable","brand":"Castrol","category":"Lubricants","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM013","item_name":"Wiper Blade 18 inch","item_type":"Accessory","brand":"Bosch","category":"Accessories","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM014","item_name":"Wiper Blade 22 inch","item_type":"Accessory","brand":"Bosch","category":"Accessories","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM015","item_name":"Battery 60Ah MF","item_type":"Spare Part","brand":"Philips","category":"Electrical","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM016","item_name":"Battery 75Ah MF","item_type":"Spare Part","brand":"Philips","category":"Electrical","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM017","item_name":"Cabin Air Filter","item_type":"Spare Part","brand":"3M","category":"Filters","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM018","item_name":"Headlamp Bulb H4","item_type":"Spare Part","brand":"Philips","category":"Electrical","is_active":false}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM019","item_name":"Transmission Fluid ATF","item_type":"Lubricant","brand":"Castrol","category":"Lubricants","is_active":false}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'product',
 '{"item_code":"ITM020","item_name":"Car Polish Compound","item_type":"Consumable","brand":"3M","category":"Accessories","is_active":true}',
 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')

ON CONFLICT DO NOTHING;

COMMIT;

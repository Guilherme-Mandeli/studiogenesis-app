-- ------------------------------------------------------------
-- SEED DATA (Datos de Prueba)
-- ------------------------------------------------------------

-- 1. CATEGORIAS
INSERT INTO categories (name, slug, description, entity_type, parent_id) VALUES
('Alimentos', 'alimentos', 'Categoría raíz de alimentos', 'product', NULL); -- ID 1

INSERT INTO categories (name, slug, description, entity_type, parent_id) VALUES
('Lácteos y Huevos', 'lacteos-huevos', 'Leche, quesos, huevos, etc.', 'product', (SELECT id FROM categories WHERE slug='alimentos')), -- ID 2
('Carnes', 'carnes', 'Pollo, res, cerdo, etc.', 'product', (SELECT id FROM categories WHERE slug='alimentos')), -- ID 3
('Despensa', 'despensa', 'Granos, pastas, aceites', 'product', (SELECT id FROM categories WHERE slug='alimentos')), -- ID 4
('Frutas y Verduras', 'frutas-verduras', 'Frescos', 'product', (SELECT id FROM categories WHERE slug='alimentos')); -- ID 5


-- 2. PRODUCTOS (12 Items)

-- Lácteos y Huevos
INSERT INTO products (name, slug, code, price, status, tariffs, gallery) VALUES
('Leche Entera 1L', 'leche-entera-1l', 'LAC-001', 1.20, 'Activo', 
 '[
    {"start_date": "2025-01-01", "end_date": "2025-11-30", "price": 1.00, "status": "expired"},
    {"start_date": "2025-12-01", "end_date": "2026-02-28", "price": 1.20, "status": "Activo"}
  ]'::jsonb, 
 '["https://via.placeholder.com/300?text=Leche"]'::jsonb
),
('Huevos Docena', 'huevos-docena', 'LAC-002', 3.50, 'Activo', 
 '[
    {"start_date": "2025-12-01", "end_date": "2026-01-31", "price": 3.50, "status": "Activo"}
  ]'::jsonb, 
 '["https://via.placeholder.com/300?text=Huevos"]'::jsonb
),
('Queso Gouda 250g', 'queso-gouda-250', 'LAC-003', 4.75, 'Activo', 
 '[
    {"start_date": "2025-10-01", "end_date": "2025-12-15", "price": 4.50, "status": "expired"},
    {"start_date": "2025-12-16", "end_date": "2026-12-31", "price": 4.75, "status": "Activo"}
  ]'::jsonb, 
 '["https://via.placeholder.com/300?text=Queso"]'::jsonb
),
('Yogurt Natural 1kg', 'yogurt-natural-1kg', 'LAC-004', 2.80, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Yogurt"]'::jsonb);

-- Carnes
INSERT INTO products (name, slug, code, price, status, tariffs, gallery) VALUES
('Pechuga de Pollo 1kg', 'pechuga-pollo', 'CAR-001', 8.90, 'Activo', 
 '[
    {"start_date": "2025-12-01", "end_date": "2025-12-31", "price": 9.50, "status": "expired"}, 
    {"start_date": "2026-01-01", "end_date": "2026-01-31", "price": 8.90, "status": "Activo"} 
  ]'::jsonb, 
 '["https://via.placeholder.com/300?text=Pollo"]'::jsonb
),
('Carne Molida Premium', 'carne-molida', 'CAR-002', 12.00, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Carne"]'::jsonb),
('Chuleta de Cerdo', 'chuleta-cerdo', 'CAR-003', 7.50, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Cerdo"]'::jsonb);

-- Despensa
INSERT INTO products (name, slug, code, price, status, tariffs, gallery) VALUES
('Pan de Molde Blanco', 'pan-molde', 'DES-001', 1.50, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Pan"]'::jsonb),
('Arroz Grano Largo 1kg', 'arroz-largo', 'DES-002', 1.80, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Arroz"]'::jsonb),
('Pasta Spaghetti 500g', 'pasta-spaghetti', 'DES-003', 0.90, 'Activo', 
 '[
    {"start_date": "2025-11-01", "end_date": "2025-12-31", "price": 0.80, "status": "expired"},
    {"start_date": "2026-01-01", "end_date": "2026-12-31", "price": 0.90, "status": "Activo"}
  ]'::jsonb, 
 '["https://via.placeholder.com/300?text=Pasta"]'::jsonb
),
('Aceite de Oliva 500ml', 'aceite-oliva', 'DES-004', 6.50, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Aceite"]'::jsonb);

-- Frutas
INSERT INTO products (name, slug, code, price, status, tariffs, gallery) VALUES
('Manzana Roja kg', 'manzana-roja', 'FRU-001', 2.20, 'Activo', '[]'::jsonb, '["https://via.placeholder.com/300?text=Manzana"]'::jsonb);


-- 3. ASIGNAR CATEGORÍAS (Relaciones)

-- Helper: INSERT INTO product_categories SELECT p.id, c.id FROM products p, categories c WHERE p.slug = '...' AND c.slug = '...';

-- Lácteos
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p CROSS JOIN categories c WHERE p.slug IN ('leche-entera-1l', 'huevos-docena', 'queso-gouda-250', 'yogurt-natural-1kg') AND c.slug = 'lacteos-huevos';

-- Carnes
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p CROSS JOIN categories c WHERE p.slug IN ('pechuga-pollo', 'carne-molida', 'chuleta-cerdo') AND c.slug = 'carnes';

-- Despensa
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p CROSS JOIN categories c WHERE p.slug IN ('pan-molde', 'arroz-largo', 'pasta-spaghetti', 'aceite-oliva') AND c.slug = 'despensa';

-- Frutas
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p CROSS JOIN categories c WHERE p.slug = 'manzana-roja' AND c.slug = 'frutas-verduras';


-- 4. CITAS (APPOINTMENTS) - Diciembre 2025 y Enero 2026

-- Citas en Diciembre
INSERT INTO appointments (name, status, date, units, total_cost, product_id)
VALUES 
('Pedido #DIC-001', 'completed', '2025-12-10', 2, 2.40, (SELECT id FROM products WHERE slug='leche-entera-1l')), -- 2 * 1.20 (Tarifa Dec)
('Pedido #DIC-002', 'confirmed', '2025-12-15', 1, 9.50, (SELECT id FROM products WHERE slug='pechuga-pollo')), -- 1 * 9.50 (Tarifa Dec expired)
('Pedido #DIC-003', 'pending', '2025-12-24', 12, 42.00, (SELECT id FROM products WHERE slug='huevos-docena')), 
('Pedido #DIC-004', 'completed', '2025-12-31', 5, 4.00, (SELECT id FROM products WHERE slug='pasta-spaghetti')); -- 5 * 0.80

-- Citas en Enero
INSERT INTO appointments (name, status, date, units, total_cost, product_id)
VALUES 
('Pedido #ENE-001', 'pending', '2026-01-05', 10, 89.00, (SELECT id FROM products WHERE slug='pechuga-pollo')), -- 10 * 8.90 (Tarifa Jan Activo)
('Pedido #ENE-002', 'confirmed', '2026-01-10', 3, 3.60, (SELECT id FROM products WHERE slug='leche-entera-1l')),
('Pedido #ENE-003', 'pending', '2026-01-15', 2, 9.50, (SELECT id FROM products WHERE slug='queso-gouda-250')), -- 2 * 4.75
('Pedido #ENE-004', 'cancelled', '2026-01-20', 1, 6.50, (SELECT id FROM products WHERE slug='aceite-oliva'));

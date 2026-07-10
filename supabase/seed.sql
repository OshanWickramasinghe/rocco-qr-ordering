-- ============================================================================
-- Rocco's QR Ordering System — Demo Seed Data
-- Run AFTER schema.sql. Safe to re-run (it clears seed data first).
-- ============================================================================

truncate table public.order_items, public.orders, public.reviews restart identity cascade;
delete from public.menu_items;
delete from public.categories;
delete from public.promotions;

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
insert into public.categories (id, name, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Classic Pizza', 1),
  ('11111111-1111-1111-1111-111111111102', 'Premium Pizza', 2),
  ('11111111-1111-1111-1111-111111111103', 'Chicken Pizza', 3),
  ('11111111-1111-1111-1111-111111111104', 'Vegetarian', 4),
  ('11111111-1111-1111-1111-111111111105', 'Drinks', 5),
  ('11111111-1111-1111-1111-111111111106', 'Desserts', 6),
  ('11111111-1111-1111-1111-111111111107', 'Add-ons', 7);

-- ----------------------------------------------------------------------------
-- CLASSIC PIZZA (8)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_spicy, is_popular, is_new) values
('11111111-1111-1111-1111-111111111101','Margherita','San Marzano tomato, fior di latte mozzarella, fresh basil',1450,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',14,false,true,false),
('11111111-1111-1111-1111-111111111101','Marinara','Tomato, garlic, oregano, extra virgin olive oil',1250,'https://images.unsplash.com/photo-1601924582970-9238bcb495d9',12,false,false,false),
('11111111-1111-1111-1111-111111111101','Quattro Formaggi','Mozzarella, gorgonzola, parmesan, provolone',1650,'https://images.unsplash.com/photo-1548369937-47519962c11a',15,false,true,false),
('11111111-1111-1111-1111-111111111101','Funghi','Mozzarella, mixed mushrooms, thyme, truffle oil drizzle',1550,'https://images.unsplash.com/photo-1513104890138-7c749659a591',15,false,false,false),
('11111111-1111-1111-1111-111111111101','Pepperoni Classic','Mozzarella, double pepperoni, chili flakes',1600,'https://images.unsplash.com/photo-1628840042765-356cda07504e',14,true,true,false),
('11111111-1111-1111-1111-111111111101','Hawaiian','Mozzarella, honey-glazed ham, pineapple',1550,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',14,false,false,false),
('11111111-1111-1111-1111-111111111101','Napoletana','Anchovies, capers, olives, oregano',1500,'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f',13,false,false,false),
('11111111-1111-1111-1111-111111111101','Diavola','Spicy salami, chili oil, red onion',1700,'https://images.unsplash.com/photo-1590947132387-155cc02f3212',15,true,false,true);

-- ----------------------------------------------------------------------------
-- PREMIUM PIZZA (8)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_spicy, is_popular, is_new) values
('11111111-1111-1111-1111-111111111102','Truffle Burrata','Burrata, black truffle paste, wild mushroom, rocket',2450,'https://images.unsplash.com/photo-1593246049226-ded77bf90326',18,false,true,true),
('11111111-1111-1111-1111-111111111102','Prosciutto & Fig','Prosciutto crudo, fresh fig, gorgonzola, honey',2350,'https://images.unsplash.com/photo-1600628421066-f6bda6a7b976',17,false,true,false),
('11111111-1111-1111-1111-111111111102','Lobster Cream','Lobster meat, mascarpone cream, chive, lemon zest',3200,'https://images.unsplash.com/photo-1548365328-8b849e6c7f04',20,false,false,true),
('11111111-1111-1111-1111-111111111102','Wagyu Beef','Wagyu beef strips, caramelised onion, parmesan shavings',3400,'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47',20,false,true,false),
('11111111-1111-1111-1111-111111111102','Smoked Salmon','Smoked salmon, cream cheese, dill, capers, red onion',2600,'https://images.unsplash.com/photo-1560usinesspizza','19',false,false,false),
('11111111-1111-1111-1111-111111111102','Duck Confit','Shredded duck confit, hoisin glaze, spring onion',2900,'https://images.unsplash.com/photo-1552539618-7eec9b4d1796',19,false,false,false),
('11111111-1111-1111-1111-111111111102','Truffle Mushroom Deluxe','Porcini, chestnut mushroom, truffle cream, thyme',2500,'https://images.unsplash.com/photo-1590534247854-e97d5e3feaf4',18,false,false,false),
('11111111-1111-1111-1111-111111111102','Four Seasons Deluxe','Artichoke, prosciutto, mushroom, olives - quartered',2200,'https://images.unsplash.com/photo-1592861956120-e524fc739696',17,false,false,false);

-- fix a bad image url typo above
update public.menu_items set image_url = 'https://images.unsplash.com/photo-1594007654729-407eedc4be65'
where name = 'Smoked Salmon';

-- ----------------------------------------------------------------------------
-- CHICKEN PIZZA (7)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_spicy, is_popular, is_new) values
('11111111-1111-1111-1111-111111111103','BBQ Chicken','Grilled chicken, smoky BBQ sauce, red onion, mozzarella',1750,'https://images.unsplash.com/photo-1600891964092-4316c288032e',16,false,true,false),
('11111111-1111-1111-1111-111111111103','Peri Peri Chicken','Peri peri marinated chicken, peppers, mozzarella',1800,'https://images.unsplash.com/photo-1620374643809-dfb802e0ff89',16,true,true,false),
('11111111-1111-1111-1111-111111111103','Chicken Tikka','Tandoori chicken tikka, onion, coriander, mint yogurt drizzle',1850,'https://images.unsplash.com/photo-1565958011703-44f9829ba187',17,true,false,false),
('11111111-1111-1111-1111-111111111103','Buffalo Chicken','Buffalo hot sauce chicken, blue cheese crumble, celery',1800,'https://images.unsplash.com/photo-1615719413546-198b25453f85',16,true,false,true),
('11111111-1111-1111-1111-111111111103','Chicken Alfredo','Creamy alfredo base, grilled chicken, parmesan',1900,'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3',17,false,false,false),
('11111111-1111-1111-1111-111111111103','Honey Mustard Chicken','Chicken, honey mustard glaze, caramelised onion',1750,'https://images.unsplash.com/photo-1548365328-9f547210cca7',16,false,false,false),
('11111111-1111-1111-1111-111111111103','Chicken Supreme','Chicken, peppers, mushroom, onion, sweetcorn',1800,'https://images.unsplash.com/photo-1548369937-47519962c11a',17,false,false,false);

-- ----------------------------------------------------------------------------
-- VEGETARIAN (7)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_spicy, is_popular, is_new) values
('11111111-1111-1111-1111-111111111104','Garden Veggie','Bell pepper, onion, olives, sweetcorn, mushroom',1450,'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c',14,false,false,false),
('11111111-1111-1111-1111-111111111104','Spinach & Ricotta','Baby spinach, ricotta, garlic, pine nuts',1550,'https://images.unsplash.com/photo-1544982503-9f984c14501a',15,false,false,false),
('11111111-1111-1111-1111-111111111104','Paneer Tikka','Marinated paneer, onion, capsicum, mint chutney drizzle',1650,'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1',16,true,true,false),
('11111111-1111-1111-1111-111111111104','Mediterranean','Sun-dried tomato, feta, olives, artichoke, rocket',1700,'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94',15,false,false,false),
('11111111-1111-1111-1111-111111111104','Vegan Delight','Vegan mozzarella, roasted vegetables, basil pesto',1650,'https://images.unsplash.com/photo-1552539618-7eec9b4d1796',15,false,false,true),
('11111111-1111-1111-1111-111111111104','Corn & Cheese','Sweetcorn, mozzarella, cheddar, spring onion',1400,'https://images.unsplash.com/photo-1517433670267-08bbd4be890f',13,false,false,false),
('11111111-1111-1111-1111-111111111104','Jalapeno Popper','Jalapeno, cream cheese, mozzarella, chili flakes',1500,'https://images.unsplash.com/photo-1601924494483-4b7fbd7bafcc',14,true,false,false);

-- ----------------------------------------------------------------------------
-- DRINKS (10)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_popular, is_new) values
('11111111-1111-1111-1111-111111111105','Coca-Cola','330ml can, ice cold',350,'https://images.unsplash.com/photo-1554866585-cd94860890b7',2,true,false),
('11111111-1111-1111-1111-111111111105','Sprite','330ml can',350,'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',2,false,false),
('11111111-1111-1111-1111-111111111105','Fresh Lime Soda','Sweet or salt, muddled fresh lime',450,'https://images.unsplash.com/photo-1621263764928-df1444c5e859',4,true,false),
('11111111-1111-1111-1111-111111111105','Mango Lassi','Yoghurt, ripe mango, cardamom',550,'https://images.unsplash.com/photo-1553530666-ba11a7da3888',5,true,false),
('11111111-1111-1111-1111-111111111105','Iced Coffee','Cold brew, milk, brown sugar syrup',600,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',5,false,false),
('11111111-1111-1111-1111-111111111105','Watermelon Cooler','Fresh watermelon, mint, lime',500,'https://images.unsplash.com/photo-1622597467836-f3285f2131b8',4,false,true),
('11111111-1111-1111-1111-111111111105','Sparkling Water','500ml bottle',300,'https://images.unsplash.com/photo-1523362628745-0c100150b504',1,false,false),
('11111111-1111-1111-1111-111111111105','Passionfruit Iced Tea','House brewed tea, passionfruit syrup',450,'https://images.unsplash.com/photo-1499638673689-79a0b5115d87',4,false,false),
('11111111-1111-1111-1111-111111111105','Ginger Beer','Craft brewed, spicy ginger kick',500,'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d',2,false,false),
('11111111-1111-1111-1111-111111111105','Chocolate Milkshake','Belgian chocolate, whipped cream',650,'https://images.unsplash.com/photo-1541658016709-82535e94bc69',6,true,false);

-- ----------------------------------------------------------------------------
-- DESSERTS (5)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes, is_popular, is_new) values
('11111111-1111-1111-1111-111111111106','Tiramisu','Espresso-soaked ladyfingers, mascarpone, cocoa',750,'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',5,true,false),
('11111111-1111-1111-1111-111111111106','Nutella Calzone','Folded pizza dough, warm nutella, powdered sugar',850,'https://images.unsplash.com/photo-1624353365286-3f8d62daad51',10,true,false),
('11111111-1111-1111-1111-111111111106','Panna Cotta','Vanilla bean panna cotta, mixed berry coulis',700,'https://images.unsplash.com/photo-1488477181946-6428a0291777',4,false,false),
('11111111-1111-1111-1111-111111111106','Chocolate Lava Cake','Warm molten centre, vanilla ice cream',800,'https://images.unsplash.com/photo-1624353365286-3f8d62daad51',9,true,true),
('11111111-1111-1111-1111-111111111106','Cannoli Duo','Sicilian shells, sweet ricotta, pistachio',700,'https://images.unsplash.com/photo-1607478900766-efe13248b125',4,false,false);

-- ----------------------------------------------------------------------------
-- ADD-ONS (5)
-- ----------------------------------------------------------------------------
insert into public.menu_items (category_id, name, description, price, image_url, prep_time_minutes) values
('11111111-1111-1111-1111-111111111107','Extra Cheese','Extra mozzarella on any pizza',250,'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d',3),
('11111111-1111-1111-1111-111111111107','Garlic Dip','House-made roasted garlic dip',150,'https://images.unsplash.com/photo-1592894869086-f828b161e90a',2),
('11111111-1111-1111-1111-111111111107','Chili Oil','House-infused chili oil',100,'https://images.unsplash.com/photo-1613478223719-2ab802602423',1),
('11111111-1111-1111-1111-111111111107','Garlic Bread','Toasted garlic bread, 4 pieces',450,'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c',6),
('11111111-1111-1111-1111-111111111107','Side Salad','Mixed greens, cherry tomato, balsamic',500,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',3);

-- ----------------------------------------------------------------------------
-- ONE ACTIVE PROMOTION (for the featured banner)
-- ----------------------------------------------------------------------------
insert into public.promotions (title, description, discount_percent, menu_item_id, is_active)
select 'Chef''s Special', '20% off Truffle Burrata this week', 20,
  id, true
from public.menu_items where name = 'Truffle Burrata';

-- ----------------------------------------------------------------------------
-- DEMO ORDERS (a realistic mixed queue across a few tables)
-- ----------------------------------------------------------------------------
do $$
declare
  t1 int; t2 int; t3 int; t4 int; t5 int;
  m record;
  o_id uuid;
begin
  select id into t1 from public.tables where label = 'Table 3';
  select id into t2 from public.tables where label = 'Table 7';
  select id into t3 from public.tables where label = 'Table 12';
  select id into t4 from public.tables where label = 'Table 5';
  select id into t5 from public.tables where label = 'Table 9';

  -- Order 1: waiting
  insert into public.orders (table_id, status, subtotal, vat_amount, grand_total, created_at)
  values (t1, 'waiting', 3100, 248, 3348, now() - interval '3 minutes')
  returning id into o_id;
  select id, name, price from public.menu_items where name = 'Margherita' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  values (o_id, m.id, m.name, m.price, 1, m.price);
  select id, name, price from public.menu_items where name = 'BBQ Chicken' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, notes, line_total)
  values (o_id, m.id, m.name, m.price, 1, 'Well done', m.price);

  -- Order 2: preparing
  insert into public.orders (table_id, status, subtotal, vat_amount, grand_total, accepted_at, created_at)
  values (t2, 'preparing', 4550, 364, 4914, now() - interval '14 minutes', now() - interval '17 minutes')
  returning id into o_id;
  select id, name, price from public.menu_items where name = 'Truffle Burrata' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  values (o_id, m.id, m.name, m.price, 1, m.price);
  select id, name, price from public.menu_items where name = 'Chocolate Milkshake' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  values (o_id, m.id, m.name, m.price, 2, m.price*2);

  -- Order 3: ready
  insert into public.orders (table_id, status, subtotal, vat_amount, grand_total, accepted_at, ready_at, created_at)
  values (t3, 'ready', 1750, 140, 1890, now() - interval '22 minutes', now() - interval '1 minutes', now() - interval '25 minutes')
  returning id into o_id;
  select id, name, price from public.menu_items where name = 'Peri Peri Chicken' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, notes, line_total)
  values (o_id, m.id, m.name, m.price, 1, 'Extra spicy', m.price);

  -- Order 4: served (historical, for reports)
  insert into public.orders (table_id, status, subtotal, vat_amount, grand_total, accepted_at, ready_at, served_at, created_at)
  values (t4, 'served', 2900, 232, 3132, now() - interval '3 hours', now() - interval '2 hours 40 minutes', now() - interval '2 hours 30 minutes', now() - interval '3 hours 5 minutes')
  returning id into o_id;
  select id, name, price from public.menu_items where name = 'Pepperoni Classic' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  values (o_id, m.id, m.name, m.price, 2, m.price*2);

  -- Order 5: cancelled
  insert into public.orders (table_id, status, subtotal, vat_amount, grand_total, cancelled_at, created_at)
  values (t5, 'cancelled', 1450, 116, 1566, now() - interval '1 hour', now() - interval '1 hour 10 minutes')
  returning id into o_id;
  select id, name, price from public.menu_items where name = 'Garden Veggie' into m;
  insert into public.order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
  values (o_id, m.id, m.name, m.price, 1, m.price);
end $$;

-- ----------------------------------------------------------------------------
-- DEMO REVIEWS
-- ----------------------------------------------------------------------------
insert into public.reviews (rating, comment, created_at) values
(5, 'Best pizza in town, the truffle burrata is unreal.', now() - interval '2 days'),
(4, 'Great food, service was a little slow during peak hour.', now() - interval '1 day'),
(5, 'Loved being able to order from my phone, so easy!', now() - interval '5 hours'),
(3, 'Pizza was good but arrived a bit cold.', now() - interval '8 hours'),
(5, 'The peri peri chicken pizza is my new favourite.', now() - interval '30 minutes');

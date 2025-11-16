-- Seed de lecciones ejemplo
insert into public.lessons (title, description, xp, order_index) values
('Introducción a CONNECT', 'Bienvenida y cómo usar la plataforma.', 30, 1),
('Uso básico del teclado', 'Aprender a escribir y borrar.', 50, 2),
('Navegación en Internet', 'Conceptos básicos de navegar y buscar.', 60, 3),
('Comunicación digital', 'Correo y mensajería básica.', 70, 4)
ON CONFLICT DO NOTHING;

-- Units
insert into public.units (title, description, order_index) values
('Fundamentos', 'Unidad básica para comenzar', 1),
('Competencias Medias', 'Unidad media para afianzar', 2),
('Maestría Digital', 'Unidad avanzada', 3)
ON CONFLICT DO NOTHING;

-- Assign units & levels to lessons (simple mapping)
update public.lessons set unit_id = (select id from public.units where title='Fundamentos'), level='basico' where order_index <=2;
update public.lessons set unit_id = (select id from public.units where title='Competencias Medias'), level='medio' where order_index=3;
update public.lessons set unit_id = (select id from public.units where title='Maestría Digital'), level='experto' where order_index>=4;

-- Normalizar RUT históricos a formato consistente (cuerpo con puntos y DV separado por guión)
-- Idempotente: puede ejecutarse varias veces.

-- Function to normalize RUT (returns formatted or null if invalid)
create or replace function public.format_rut_sql(raw text)
returns text language plpgsql as $$
declare
  c text;
  body text;
  dv text;
  sumv int := 0;
  mult int := 2;
  i int;
  remainder int;
  dv_calc text;
begin
  if raw is null then return null; end if;
  c := upper(regexp_replace(raw, '[^0-9K]', '', 'g'));
  if length(c) < 2 then return null; end if;
  body := substr(c, 1, length(c)-1);
  dv := substr(c, length(c), 1);
  if not (length(body) = 7 or length(body) = 8) then return null; end if; -- enforce 8-9 total
  -- compute DV
  for i in reverse length(body)..1 loop
    sumv := sumv + cast(substr(body,i,1) as int) * mult;
    mult := case when mult = 7 then 2 else mult + 1 end;
  end loop;
  remainder := 11 - (sumv % 11);
  dv_calc := case remainder when 11 then '0' when 10 then 'K' else cast(remainder as text) end;
  if dv_calc != dv then return null; end if;
  -- add dots
  body := regexp_replace(body, '(\d)(?=(\d{3})+(?!\d))', '\1.', 'g');
  return body || '-' || dv;
end;$$;

-- Update rows with invalid or unformatted RUT -> formatted; set invalid to NULL
update public.users_profile
set rut = public.format_rut_sql(rut)
where rut is not null;

-- Optional: report invalids (run manually if needed)
-- select user_id, rut from public.users_profile where rut is not null and format_rut_sql(rut) is null;

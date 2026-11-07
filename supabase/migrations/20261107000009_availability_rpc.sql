-- =============================================================================
-- 0009 · Substituição atômica da disponibilidade semanal
-- SECURITY INVOKER: a RLS de availability_rules continua decidindo quem pode.
-- =============================================================================
create or replace function public.set_weekly_availability(
  p_professional_id uuid,
  p_unit_id uuid,
  p_rules jsonb -- [{ "weekday": 1, "start": "09:00", "end": "12:00" }, ...]
)
returns integer
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_business uuid;
  v_count integer;
begin
  select business_id into v_business from public.professionals where id = p_professional_id;
  if v_business is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  delete from public.availability_rules
  where professional_id = p_professional_id and unit_id = p_unit_id;

  insert into public.availability_rules (business_id, professional_id, unit_id, weekday, start_time, end_time)
  select v_business, p_professional_id, p_unit_id,
         (r ->> 'weekday')::smallint, (r ->> 'start')::time, (r ->> 'end')::time
  from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) r;

  get diagnostics v_count = row_count;
  return v_count;
exception
  when exclusion_violation then
    raise exception 'AVAILABILITY_OVERLAP' using errcode = 'P0001',
      hint = 'Intervalos sobrepostos (inclusive em outra unidade).';
end
$$;

grant execute on function public.set_weekly_availability(uuid, uuid, jsonb) to authenticated;

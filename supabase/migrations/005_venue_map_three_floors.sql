-- На схеме три этажа (4, 3, 2) — четвёртый пояс b3 не используется
delete from public.venue_stair_states where stair_key like 'b3-%';

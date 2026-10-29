-- PENDING: do not apply until explicitly requested by user.
alter table public.decide_foods
  add column if not exists category text not null default '기타',
  add column if not exists icon text not null default '🍽️';

update public.decide_foods
set category = case trim(name)
  when '김치찌개' then '한식'
  when '돈까스' then '일식'
  when '초밥' then '일식'
  when '제육볶음' then '한식'
  when '파스타' then '양식'
  when '햄버거' then '양식'
  when '마라탕' then '중식'
  else category
end
where category = '기타';

update public.decide_foods
set icon = case category
  when '한식' then '🍚'
  when '중식' then '🥟'
  when '일식' then '🍣'
  when '양식' then '🍝'
  when '디저트' then '🍰'
  else '🍽️'
end
where icon = '🍽️';

alter table public.decide_foods
  add constraint decide_foods_category_valid
  check (category in ('한식', '중식', '일식', '양식', '디저트', '기타'));

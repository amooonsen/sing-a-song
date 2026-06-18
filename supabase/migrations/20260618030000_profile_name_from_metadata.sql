-- 가입 시 입력한 이름(display_name)을 프로필에 반영.
-- 이름 미입력 시 이메일 local-part 로 폴백.
-- 적용: supabase db push

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

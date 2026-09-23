-- Attendance Location Tracking
-- Adds GPS location fields to attendance table for location-based check-in verification

alter table public.attendance
add column if not exists check_in_lat numeric(10, 8),
add column if not exists check_in_lng numeric(11, 8),
add column if not exists check_out_lat numeric(10, 8),
add column if not exists check_out_lng numeric(11, 8),
add column if not exists distance_from_office integer;

comment on column public.attendance.check_in_lat is 'Employee latitude at check-in';
comment on column public.attendance.check_in_lng is 'Employee longitude at check-in';
comment on column public.attendance.check_out_lat is 'Employee latitude at check-out';
comment on column public.attendance.check_out_lng is 'Employee longitude at check-out';
comment on column public.attendance.distance_from_office is 'Distance from office in meters at check-in';

-- Office location settings (stored in settings table for easy configuration)
insert into public.settings (key, value)
values
  ('office_latitude', '32.17989'),
  ('office_longitude', '74.18584'),
  ('office_radius_meters', '500')
on conflict (key) do update set value = excluded.value;
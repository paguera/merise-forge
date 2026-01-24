-- Add footer settings to site_settings if not exists
INSERT INTO public.site_settings (key, value) VALUES ('footer_text', 'MERISE © 2024 - Tous droits réservés') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('footer_links', '[]') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.site_settings (key, value) VALUES ('footer_social', '[]') ON CONFLICT (key) DO NOTHING;
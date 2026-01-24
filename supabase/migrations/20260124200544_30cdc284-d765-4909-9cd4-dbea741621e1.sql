-- Ajouter un champ commentaire à sync_history pour les discussions sur les changements
ALTER TABLE public.sync_history 
ADD COLUMN comment TEXT;
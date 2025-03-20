-- Update default templates with new placeholder formats
UPDATE seo_page_templates
SET 
  url_structure = CASE 
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-state')
    THEN '/fluturime-{nga_state}-ne-{per_state}/'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-city')
    THEN '/bileta-avioni-{nga_city}-ne-{per_city}/'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-city')
    THEN '/fluturime-{nga_state}-ne-{per_city}/'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-state')
    THEN '/bileta-avioni-{nga_city}-ne-{per_state}/'
  END,
  seo_title = CASE 
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-state')
    THEN 'Fluturime {nga_state} në {per_state} | Çmimet & Linjat e Lira'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-city')
    THEN 'Bileta Avioni {nga_city} në {per_city} | Rezervo Online'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-city')
    THEN 'Fluturime {nga_state} në {per_city} | Çmimet & Oraret'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-state')
    THEN 'Bileta Avioni {nga_city} në {per_state} | Rezervo Online'
  END,
  meta_description = CASE 
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-state')
    THEN 'Gjeni ofertat më të mira për fluturime {nga_state} në {per_state}. ✈️ Çmime të ulëta, fluturime direkte dhe me ndalesë.'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-city')
    THEN 'Rezervoni biletën tuaj {nga_city} në {per_city} me çmimet më të mira! ✈️ Krahasoni fluturimet dhe zgjidhni ofertën më të mirë.'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'state-city')
    THEN 'Fluturime {nga_state} në {per_city}. ✈️ Gjeni dhe krahasoni çmimet më të mira për udhëtimin tuaj.'
    WHEN template_type_id = (SELECT id FROM seo_template_types WHERE slug = 'city-state')
    THEN 'Bileta avioni {nga_city} në {per_state}. ✈️ Rezervoni online me çmimet më të ulëta të garantuara.'
  END;

-- Add helpful comment
COMMENT ON TABLE seo_page_templates IS 
'Stores SEO templates with support for nga/per placeholders:
- {nga_city}: Uses the "Nga" format for cities
- {per_city}: Uses the "Për" format for cities
- {nga_state}: Uses the "Nga" format for states
- {per_state}: Uses the "Për" format for states';
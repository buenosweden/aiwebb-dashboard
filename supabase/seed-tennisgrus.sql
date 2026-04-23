-- Uppdatera din sites-rad med tennisgrus-sektioner och SEO
-- Kör detta i Supabase SQL Editor

UPDATE public.sites
SET
  name = 'Tennisgrus.se',
  wp_url = 'https://tennisgrus.aiwebb.se',
  wp_api_key = 'testkey_tennisgrus_abc123xyz789',
  brand = '{"name":"Tennisgrus.se","primary_color":"#D85A30","tone":"professional"}'::jsonb,
  seo = '{
    "meta_title": "Tennisgrus – komplett guide till tennisbanans yta",
    "meta_description": "Allt om tennisgrus: kornstorlek, lerhalt, åtgång, underhåll och pris. Beställ direkt från tenarotennis.com.",
    "focus_keyword": "tennisgrus"
  }'::jsonb,
  sections = '[
    {
      "type": "hero",
      "data": {
        "eyebrow": "Komplett guide",
        "headline": "Tennisgrus – allt du behöver veta",
        "subheadline": "Kornstorlek, lerhalt, åtgång och underhåll. Vi hjälper dig välja rätt grus för din tennisbana.",
        "primary_cta": {"label": "Se priser och beställ", "url": "https://www.tenarotennis.com/product-category/tennisgrus/", "style": "primary"},
        "secondary_cta": {"label": "Läs guiden", "url": "#vad-ar-tennisgrus"}
      }
    },
    {
      "type": "usp_row",
      "data": {
        "items": [
          {"icon": "🎾", "label": "Rätt kornstorlek", "description": "0,2–0,8 mm för bästa spelegenskaper"},
          {"icon": "🏗️", "label": "Enkel beräkning", "description": "Ca 1 ton per 100 m² vid 10 mm djup"},
          {"icon": "🚚", "label": "Snabb leverans", "description": "Direktleverans från tenarotennis.com"}
        ]
      }
    },
    {
      "type": "text_block",
      "data": {
        "heading": "Vad är tennisgrus?",
        "body": "Tennisgrus, eller antuka som det kallas internationellt, är det karakteristiska röd-orange gruslager som täcker tennisbanor runt om i världen. Det är ett noggrant utvalt material med specifika egenskaper för att ge optimal spelupplevelse.\n\nMaterialet består av krossad tegelsten, keramik eller naturmaterial med en kornstorlek på 0,2–0,8 mm. Den rätta lerhalten ger gruset dess sammanhållande egenskaper och den karakteristiska röda färgen. Det är inte vilket grus som helst – varje korn är utvalt för att ge den bästa spelupplevelsen.",
        "layout": "single"
      }
    },
    {
      "type": "table",
      "data": {
        "heading": "Kornstorlek och egenskaper",
        "intro": "Välj rätt kornstorlek beroende på bantyp och spelstil.",
        "columns": ["Kornstorlek", "Användning", "Spelegenskaper"],
        "rows": [
          ["0,2–0,5 mm", "Topplagret", "Snabb yta, låg studs"],
          ["0,5–0,8 mm", "Mellanskikt", "Balanserad spelyta"],
          ["0,8–2,0 mm", "Bärlager", "Dränering och stabilitet"]
        ]
      }
    },
    {
      "type": "faq",
      "data": {
        "heading": "Vanliga frågor om tennisgrus",
        "items": [
          {
            "question": "Hur mycket tennisgrus behöver jag?",
            "answer": "För en standardtennisbana (260 m²) med 10 mm gruslager behöver du ca 2,6 ton. Beräkna med formeln: ytan i m² × djup i meter × 1 700 kg/m³."
          },
          {
            "question": "Vad kostar tennisgrus?",
            "answer": "Priset varierar beroende på kvalitet och leveranssätt. Kontakta tenarotennis.com för aktuella priser och leveransmöjligheter."
          },
          {
            "question": "Hur sköter man en grusbana?",
            "answer": "Vattna regelbundet för att hålla gruset sammanhållet, valta efter regn och tillsätt nytt grus vid behov – normalt 1–2 gånger per säsong."
          }
        ]
      }
    },
    {
      "type": "cta_band",
      "data": {
        "heading": "Redo att beställa tennisgrus?",
        "body": "Välj bland Tenaro Tennis sortiment av professionellt tennisgrus. Snabb leverans och konkurrenskraftiga priser.",
        "cta": {"label": "Beställ tennisgrus", "url": "https://www.tenarotennis.com/product-category/tennisgrus/", "style": "primary"},
        "background": "dark"
      }
    }
  ]'::jsonb
WHERE user_id = (SELECT id FROM auth.users LIMIT 1);

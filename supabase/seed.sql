-- Seed data for local development
-- Run after migrations: npx supabase db reset

-- Seed categories
INSERT INTO categories (slug, name, parent_slug, sort_order) VALUES
  ('geopolitics', 'Geopolitics', NULL, 0),
  ('trade_tariffs', 'Trade & Tariffs', 'geopolitics', 1),
  ('sanctions_export_controls', 'Sanctions & Export Controls', 'geopolitics', 2),
  ('military_conflict', 'Military & Conflict', 'geopolitics', 3),
  ('diplomacy_treaties', 'Diplomacy & Treaties', 'geopolitics', 4),
  ('elections_political', 'Elections & Political', 'geopolitics', 5),
  ('economics_policy', 'Economics & Policy', NULL, 10),
  ('monetary_policy', 'Monetary Policy', 'economics_policy', 11),
  ('fiscal_policy', 'Fiscal Policy', 'economics_policy', 12),
  ('regulation', 'Regulation', 'economics_policy', 13),
  ('economic_indicators', 'Economic Indicators', 'economics_policy', 14),
  ('technology_industry', 'Technology & Industry', NULL, 20),
  ('science_environment', 'Science & Environment', NULL, 30)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample events for development
INSERT INTO events (id, title, slug, description, category, subcategory, tags, probability, prob_change_24h, volume_24h, quality_score, resolution_date, resolution_status) VALUES
  ('evt_us_china_tariff_q3_2026', 'US increases China tariff rate above 145% before October 2026', 'us-china-tariff-increase-q3-2026', 'Will the effective US tariff rate on Chinese imports exceed 145% at any point before October 1, 2026?', 'trade_tariffs', 'us_china_trade', ARRAY['china', 'tariffs', 'trade-war', 'section-301'], 0.42, 0.03, 2300000, 0.92, '2026-10-01', 'open'),
  ('evt_fed_rate_mar_2026', 'Fed cuts rates at March 2026 meeting', 'fed-rate-cut-march-2026', 'Will the Federal Reserve cut the federal funds rate at the March 18-19, 2026 FOMC meeting?', 'monetary_policy', 'fed_decisions', ARRAY['fed', 'interest-rates', 'fomc'], 0.67, -0.03, 890000, 0.88, '2026-03-19', 'open'),
  ('evt_de_minimis_2026', 'De minimis exemption restored for any country by end of 2026', 'de-minimis-restoration-2026', 'Will the de minimis customs exemption be restored for at least one country before December 31, 2026?', 'trade_tariffs', 'de_minimis_customs', ARRAY['de-minimis', 'customs', 'tariffs', 'e-commerce'], 0.18, 0.02, 450000, 0.72, '2026-12-31', 'open'),
  ('evt_eu_carbon_tax_2026', 'EU carbon border tax fully implemented in 2026', 'eu-carbon-border-tax-2026', 'Will the EU Carbon Border Adjustment Mechanism (CBAM) be fully implemented by end of 2026?', 'trade_tariffs', 'eu_trade_policy', ARRAY['eu', 'carbon-tax', 'cbam', 'climate'], 0.31, 0.05, 340000, 0.65, '2026-12-31', 'open'),
  ('evt_vietnam_tariff_2026', 'Vietnam tariff increase to 46%+ in 2026', 'vietnam-tariff-increase-2026', 'Will the US tariff rate on Vietnamese imports exceed 46% at any point in 2026?', 'trade_tariffs', 'vietnam_trade', ARRAY['vietnam', 'tariffs', 'trade-war'], 0.35, -0.01, 280000, 0.58, '2026-12-31', 'open'),
  ('evt_boj_rate_2026', 'Bank of Japan raises interest rates in 2026', 'boj-rate-increase-2026', 'Will the Bank of Japan increase its policy rate above 0.5% in 2026?', 'monetary_policy', 'boj', ARRAY['japan', 'boj', 'interest-rates'], 0.41, 0.07, 230000, 0.61, '2026-12-31', 'open')
ON CONFLICT (id) DO NOTHING;

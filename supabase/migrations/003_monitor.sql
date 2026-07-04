-- Monitor agencies
CREATE TABLE IF NOT EXISTS monitor_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'barcelona',
  listing_url TEXT NOT NULL UNIQUE,
  selector_config JSONB NOT NULL DEFAULT '{}',
  scrape_interval_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scraped listings
CREATE TABLE IF NOT EXISTS monitor_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES monitor_agencies(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  price_monthly INTEGER,
  sqm INTEGER,
  bedrooms INTEGER,
  zone_name TEXT,
  image_url TEXT,
  raw_snippet TEXT,
  found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alerted_at TIMESTAMPTZ
);

-- Browser push subscriptions
CREATE TABLE IF NOT EXISTS monitor_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  max_price INTEGER,
  min_sqm INTEGER,
  min_bedrooms INTEGER,
  zones TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitor_listings_found_at ON monitor_listings(found_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitor_listings_unalerted ON monitor_listings(alerted_at) WHERE alerted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monitor_agencies_due ON monitor_agencies(active, last_scraped_at);

ALTER TABLE monitor_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agencies" ON monitor_agencies FOR SELECT USING (true);
CREATE POLICY "Service manage agencies" ON monitor_agencies FOR ALL USING (true);
CREATE POLICY "Public read listings" ON monitor_listings FOR SELECT USING (true);
CREATE POLICY "Service manage listings" ON monitor_listings FOR ALL USING (true);
CREATE POLICY "Anyone insert push subs" ON monitor_push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own push subs" ON monitor_push_subscriptions FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users manage own push subs" ON monitor_push_subscriptions FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- Seed 15 Barcelona agency examples (selectors use common WordPress real estate theme patterns)
INSERT INTO monitor_agencies (name, listing_url, selector_config, scrape_interval_minutes) VALUES
('Fincas Ventura', 'https://fincasventura.com/pisos-en-alquiler/', '{"container":".property-item","title":".property-title a","price":".property-price","sqm":".property-size","bedrooms":".property-rooms","link":"a.property-link","image":".property-thumbnail img"}', 30),
('Arrels Immobiliaria', 'https://arrels.cat/lloguers/', '{"container":".listing-item","title":"h3.listing-title","price":".listing-price","sqm":".detail-size","bedrooms":".detail-rooms","link":"a.listing-link","image":".listing-image img"}', 45),
('Habitatge Barcelona', 'https://habitatgebarcelona.com/alquiler/', '{"container":".property-box","title":".prop-title","price":".prop-price span","sqm":".prop-area","bedrooms":".prop-beds","link":"a.prop-link","image":".prop-image img"}', 30),
('BCN Pisos', 'https://bcnpisos.com/alquileres/', '{"container":"article.property","title":"h2.entry-title a","price":".price-tag","sqm":".surface-area","bedrooms":".bedrooms-count","link":"a.property-link","image":".wp-post-image"}', 30),
('Grup Inmocat', 'https://grupinmocat.com/lloguer/', '{"container":".inmo-item","title":".inmo-title","price":".inmo-price","sqm":".inmo-sqm","bedrooms":".inmo-rooms","link":"a.inmo-link","image":".inmo-img img"}', 60),
('Finques Cornet', 'https://finquescornet.com/alquiler-piso-barcelona/', '{"container":".property-card","title":".card-title a","price":".monthly-rent","sqm":".sqm-value","bedrooms":".rooms-value","link":"a.card-link","image":".card-img-top"}', 45),
('Immobiliaria Sagrada', 'https://immosagrada.com/pisos-alquiler-barcelona/', '{"container":".listing-card","title":"h3 a","price":".alquiler-precio","sqm":".metros-cuadrados","bedrooms":".num-habitaciones","link":"h3 a","image":"img.listing-img"}', 30),
('Barcelona Rentals Pro', 'https://barcelonarentalspro.com/listings/', '{"container":".rental-item","title":".rental-title","price":".rental-price","sqm":".rental-size","bedrooms":".rental-beds","link":"a.rental-link","image":".rental-photo img"}', 30),
('Eixample Finques', 'https://eixamplefinques.com/lloguer-pisos/', '{"container":".property","title":".property-name","price":".price-monthly","sqm":".m2","bedrooms":".habitaciones","link":"a","image":"img.photo"}', 60),
('Gràcia Habitatge', 'https://graciahabitatge.com/alquiler/', '{"container":".piso-item","title":".piso-titulo a","price":".piso-precio","sqm":".piso-m2","bedrooms":".piso-hab","link":".piso-titulo a","image":".piso-foto img"}', 30),
('Sarrià Immobiliaria', 'https://sarriaimmobiliaria.com/pisos-alquiler/', '{"container":".listing","title":"h2.title a","price":"span.price","sqm":"span.area","bedrooms":"span.rooms","link":"h2.title a","image":"img.thumb"}', 45),
('Sants Pisos', 'https://santspisos.com/alquiler-barcelona/', '{"container":".prop-item","title":".prop-name","price":".prop-rent","sqm":".prop-size","bedrooms":".prop-hab","link":"a.ver-piso","image":".prop-thumb img"}', 30),
('Poblenou Homes', 'https://poblenouhousing.com/alquiler/', '{"container":".house-card","title":"h3.house-title a","price":".house-price","sqm":".house-area","bedrooms":".house-beds","link":"h3 a","image":"img.house-image"}', 30),
('Horta Finques', 'https://hortafinques.com/lloguers-pisos/', '{"container":".finca-item","title":".finca-title","price":".finca-preu","sqm":".finca-m2","bedrooms":".finca-hab","link":"a.finca-link","image":".finca-img img"}', 60),
('Sant Martí Pisos', 'https://santmartipisos.com/alquiler/', '{"container":".pisos-item","title":"a.piso-title","price":".piso-price","sqm":".piso-sqm","bedrooms":".piso-rooms","link":"a.piso-title","image":"img.piso-img"}', 30)
ON CONFLICT (listing_url) DO NOTHING;

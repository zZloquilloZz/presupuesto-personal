-- ================================================================
-- PRESUPUESTO PERSONAL — Schema v3.1
-- Ejecutar en Supabase SQL Editor con la base de datos vacía
-- ================================================================


-- ── CATÁLOGOS (lectura pública, sin RLS por usuario) ─────────────

CREATE TABLE categorias (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  emoji TEXT NOT NULL DEFAULT '📦',
  orden INTEGER DEFAULT 0
);
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat_read" ON categorias FOR SELECT USING (true);

INSERT INTO categorias (id, label, color, emoji, orden) VALUES
  ('alimentacion', 'Alimentación',    '#F59E0B', '🍽',  1),
  ('transporte',   'Transporte',      '#3B82F6', '🚌',  2),
  ('entrete',      'Entretenimiento', '#8B5CF6', '🎮',  3),
  ('salud',        'Salud',           '#10B981', '💊',  4),
  ('educacion',    'Educación',       '#06B6D4', '📚',  5),
  ('hogar',        'Hogar',           '#F97316', '🏠',  6),
  ('ropa',         'Ropa',            '#EC4899', '👕',  7),
  ('otros',        'Otros',           '#6B7280', '📦',  8);


CREATE TABLE metodos_pago (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);
ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY "met_read" ON metodos_pago FOR SELECT USING (true);

INSERT INTO metodos_pago (id, label) VALUES
  ('debito',   'Débito'),
  ('efectivo', 'Efectivo'),
  ('credito',  'Crédito');


CREATE TABLE bancos (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_read" ON bancos FOR SELECT USING (true);

INSERT INTO bancos (id, label) VALUES
  ('bcp',        'BCP'),
  ('bbva',       'BBVA'),
  ('interbank',  'Interbank'),
  ('scotiabank', 'Scotiabank'),
  ('banbif',     'BanBif'),
  ('pichincha',  'Pichincha'),
  ('ripley',     'Ripley'),
  ('falabella',  'Falabella / CMR'),
  ('oh',         'Financiera Oh!'),
  ('cencosud',   'Cencosud'),
  ('amex',       'American Express'),
  ('otro',       'Otro banco');


CREATE TABLE tipos_deuda (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL
);
ALTER TABLE tipos_deuda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tde_read" ON tipos_deuda FOR SELECT USING (true);

INSERT INTO tipos_deuda (id, label) VALUES
  ('prestamo',  'Préstamo personal'),
  ('hipoteca',  'Hipoteca'),
  ('vehiculo',  'Crédito vehicular'),
  ('familiar',  'Deuda familiar'),
  ('tarjeta',   'Tarjeta de crédito'),
  ('otro',      'Otro');


CREATE TABLE afps (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  tasa  NUMERIC(5,2) NOT NULL DEFAULT 0
);
ALTER TABLE afps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "afp_read" ON afps FOR SELECT USING (true);

INSERT INTO afps (id, label, tasa) VALUES
  ('integra',   'AFP Integra',   11.37),
  ('prima',     'AFP Prima',     13.29),
  ('habitat',   'AFP Hábitat',   11.74),
  ('profuturo', 'AFP Profuturo', 13.53),
  ('onp',       'ONP',           13.00),
  ('ninguna',   'Sin aporte',     0.00);


CREATE TABLE tarjeta_tipos (
  id       TEXT PRIMARY KEY,
  banco_id TEXT NOT NULL REFERENCES bancos(id),
  label    TEXT NOT NULL,
  red      TEXT,
  tipo     TEXT NOT NULL DEFAULT 'credito'
);
ALTER TABLE tarjeta_tipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tti_read" ON tarjeta_tipos FOR SELECT USING (true);

INSERT INTO tarjeta_tipos (id, banco_id, label, red, tipo) VALUES
  ('bcp-visa-clasica',  'bcp',        'Visa Clásica',              'visa',       'credito'),
  ('bcp-visa-oro',      'bcp',        'Visa Oro',                  'visa',       'credito'),
  ('bcp-visa-plat',     'bcp',        'Visa Platinum',             'visa',       'credito'),
  ('bcp-mc-clasica',    'bcp',        'Mastercard Clásica',        'mastercard', 'credito'),
  ('bcp-mc-oro',        'bcp',        'Mastercard Oro',            'mastercard', 'credito'),
  ('bcp-debito',        'bcp',        'Débito BCP',                'visa',       'debito'),
  ('bbva-visa',         'bbva',       'Visa Continental',          'visa',       'credito'),
  ('bbva-mc',           'bbva',       'Mastercard BBVA',           'mastercard', 'credito'),
  ('bbva-debito',       'bbva',       'Débito BBVA',               'visa',       'debito'),
  ('ibank-visa',        'interbank',  'Visa Interbank',            'visa',       'credito'),
  ('ibank-mc',          'interbank',  'Mastercard Interbank',      'mastercard', 'credito'),
  ('ibank-debito',      'interbank',  'Débito Interbank',          'visa',       'debito'),
  ('scot-visa',         'scotiabank', 'Visa Scotiabank',           'visa',       'credito'),
  ('scot-mc',           'scotiabank', 'Mastercard Scotiabank',     'mastercard', 'credito'),
  ('scot-debito',       'scotiabank', 'Débito Scotiabank',         'mastercard', 'debito'),
  ('banbif-visa',       'banbif',     'Visa BanBif',               'visa',       'credito'),
  ('banbif-debito',     'banbif',     'Débito BanBif',             'visa',       'debito'),
  ('pich-visa',         'pichincha',  'Visa Pichincha',            'visa',       'credito'),
  ('pich-debito',       'pichincha',  'Débito Pichincha',          'visa',       'debito'),
  ('ripley-mc',         'ripley',     'Mastercard Ripley',         'mastercard', 'credito'),
  ('falabella-cmr',     'falabella',  'CMR Visa',                  'visa',       'credito'),
  ('oh-mc',             'oh',         'Mastercard Oh!',            'mastercard', 'credito'),
  ('cen-mc',            'cencosud',   'Mastercard Cencosud',       'mastercard', 'credito'),
  ('amex-gold',         'amex',       'American Express Gold',     'amex',       'credito'),
  ('amex-green',        'amex',       'American Express Green',    'amex',       'credito'),
  ('amex-plat',         'amex',       'American Express Platinum', 'amex',       'credito'),
  ('otro-credito',      'otro',       'Tarjeta de Crédito',        'otro',       'credito'),
  ('otro-debito',       'otro',       'Tarjeta de Débito',         'otro',       'debito');


-- ── TABLAS DE USUARIO ────────────────────────────────────────────
-- IMPORTANTE: todas usan FOR ALL con USING + WITH CHECK
-- USING  → filtra filas en SELECT / UPDATE / DELETE
-- WITH CHECK → valida filas nuevas en INSERT / UPDATE
-- Sin WITH CHECK los inserts fallan aunque RLS esté "activo"

CREATE TABLE config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  haber_basico NUMERIC(10,2) DEFAULT 1443.00,
  dia_deposito INTEGER DEFAULT 28,
  afp_id       TEXT REFERENCES afps(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfg_own" ON config
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE tarjetas_credito (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banco_id      TEXT REFERENCES bancos(id),
  tipo_id       TEXT REFERENCES tarjeta_tipos(id),
  nombre        TEXT NOT NULL,
  color         TEXT DEFAULT '#38BDF8',
  linea_credito NUMERIC(12,2) DEFAULT 0,
  cierre        INTEGER,
  pago_dia      INTEGER,
  activa        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tarjetas_credito ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trj_own" ON tarjetas_credito
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE gastos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarjeta_id   UUID REFERENCES tarjetas_credito(id) ON DELETE SET NULL,
  categoria_id TEXT REFERENCES categorias(id),
  metodo_id    TEXT REFERENCES metodos_pago(id),
  descripcion  TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  fecha        DATE NOT NULL,
  es_cuota     BOOLEAN DEFAULT false,
  notas        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gas_own" ON gastos
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());
CREATE INDEX idx_gastos_usuario_fecha ON gastos(usuario_id, fecha DESC);


CREATE TABLE gastos_fijos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarjeta_id   UUID REFERENCES tarjetas_credito(id) ON DELETE SET NULL,
  categoria_id TEXT REFERENCES categorias(id),
  metodo_id    TEXT REFERENCES metodos_pago(id),
  descripcion  TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  dia          INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gfi_own" ON gastos_fijos
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE gastos_recurrentes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarjeta_id   UUID REFERENCES tarjetas_credito(id) ON DELETE SET NULL,
  categoria_id TEXT REFERENCES categorias(id),
  metodo_id    TEXT REFERENCES metodos_pago(id),
  descripcion  TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  es_cuota     BOOLEAN DEFAULT false,
  notas        TEXT,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gastos_recurrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gre_own" ON gastos_recurrentes
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE cuotas_tarjetas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarjeta_id       UUID NOT NULL REFERENCES tarjetas_credito(id) ON DELETE CASCADE,
  descripcion      TEXT NOT NULL,
  monto_total      NUMERIC(12,2) NOT NULL,
  cuota            NUMERIC(12,2) NOT NULL,
  total_cuotas     INTEGER NOT NULL,
  pagadas          INTEGER DEFAULT 0,
  con_interes      BOOLEAN DEFAULT false,
  mes_primer_pago  INTEGER,
  anio_primer_pago INTEGER,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE cuotas_tarjetas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cuo_own" ON cuotas_tarjetas
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE historial_ingresos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_idx       INTEGER NOT NULL,
  anio          INTEGER NOT NULL,
  haber_basico  NUMERIC(12,2) DEFAULT 0,
  he25          NUMERIC(12,2) DEFAULT 0,
  he100         NUMERIC(12,2) DEFAULT 0,
  gratificacion NUMERIC(12,2) DEFAULT 0,
  cts           NUMERIC(12,2) DEFAULT 0,
  bono          NUMERIC(12,2) DEFAULT 0,
  otro_extra    NUMERIC(12,2) DEFAULT 0,
  otro_label    TEXT,
  bruto         NUMERIC(12,2) DEFAULT 0,
  afp           NUMERIC(12,2) DEFAULT 0,
  neto          NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, mes_idx, anio)
);
ALTER TABLE historial_ingresos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ing_own" ON historial_ingresos
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE presupuestos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  monto        NUMERIC(12,2) NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, categoria_id)
);
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pre_own" ON presupuestos
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


CREATE TABLE deudas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_id          TEXT REFERENCES tipos_deuda(id),
  descripcion      TEXT NOT NULL,
  acreedor         TEXT,
  monto_original   NUMERIC(12,2) DEFAULT 0,
  cuota_mensual    NUMERIC(12,2) NOT NULL,
  meses_pactados   INTEGER,
  pagos_realizados INTEGER DEFAULT 0,
  dia_vencimiento  INTEGER,
  fecha_inicio     DATE,
  notas            TEXT,
  activa           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deu_own" ON deudas
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

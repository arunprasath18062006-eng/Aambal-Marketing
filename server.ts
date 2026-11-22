import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'aambal.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    survey_no TEXT NOT NULL,
    approval_label TEXT NOT NULL,
    price_per_sqft INTEGER NOT NULL,
    price_tamil TEXT NOT NULL,
    price_display TEXT NOT NULL,
    total_units INTEGER NOT NULL,
    available_units INTEGER NOT NULL,
    min_area_sqft INTEGER NOT NULL,
    max_area_sqft INTEGER NOT NULL,
    road_access_json TEXT NOT NULL,
    facilities_json TEXT NOT NULL,
    images_json TEXT NOT NULL,
    layout_plan_image TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    maps_url TEXT NOT NULL,
    description TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    interested_in TEXT NOT NULL,
    property_id INTEGER,
    property_title TEXT,
    plot_number TEXT,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New Lead',
    message TEXT NOT NULL DEFAULT '',
    admin_notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function seedInitialProperties() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (countRow.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO properties (
      slug, title, type, location, district, survey_no, approval_label,
      price_per_sqft, price_tamil, price_display, total_units, available_units,
      min_area_sqft, max_area_sqft, road_access_json, facilities_json,
      images_json, layout_plan_image, lat, lng, maps_url, description, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    'yoga-ganapathi-nagar-athalai',
    'Yoga Ganapathi Nagar',
    'Plot',
    'Athalai Village, Madurai West Taluk',
    'Madurai District',
    'S.No. 88/2B1A, 79/9, 10A2, 11A, 11B, 80/5A1',
    'DTCP Approved (10/2024)',
    700,
    '1 சதுரடி விலை ரூ. 700/- முதல்',
    '₹700 / Sq.Ft onwards',
    49,
    46,
    813,
    3091,
    JSON.stringify([
      '29\'6" Wide Main Blacktop Road',
      '23\'9" Wide Internal Tar Roads',
      'Direct Connectivity to Athalai & Madurai West Ring Road',
      'Well-Planned Corner Junction Access'
    ]),
    JSON.stringify([
      'DTCP Approved Layout (10/2024)',
      'Dedicated EB Line Provision & Street Lighting',
      'Clear Patta & Immediate Registration',
      'Demarcated Corner Stones for All 49 Plots',
      'Sweet Potable Ground Water Table',
      'Avenue Tree Plantation & Storm Water Drainage',
      'Bank Loan Assistance Available'
    ]),
    JSON.stringify([
      '/src/assets/images/property_yoga_ganapathi_1795315019776.jpg',
      '/src/assets/images/hero_aambal_banner_1795315019818.jpg'
    ]),
    '/assets/aistudio/image_e7c687cf.png',
    9.98403,
    78.07421,
    'https://maps.app.goo.gl/JdTFEcW1iPCc7QFp8?g_st=aw',
    'DTCP-approved 49-plot residential layout located in fast-growing Athalai Village, Madurai West Taluk. Features wide 29\'6" and 23\'9" blacktop roads, immediate EB connectivity, and plot sizes ranging from 1.86 cents (813 sq.ft) up to 7.09 cents (3,091 sq.ft) for family homes and long-term investment.',
    1
  );

  insert.run(
    'aambal-heritage-villas-nagamalai',
    'Aambal Heritage Villas',
    'Villa',
    'Nagamalai Pudukkottai, Madurai West',
    'Madurai District',
    'S.No. 142/3A, 142/4B',
    'DTCP & RERA Registered',
    4250,
    'ரூ. 54 லட்சம் முதல் (3BHK வில்லா)',
    '₹54 Lakhs onwards (3BHK)',
    14,
    6,
    1250,
    1850,
    JSON.stringify([
      '30 Feet Concrete Internal Roads',
      '150 Meters from Theni-Madurai NH-85 Highway',
      'Covered Pedestrian Walkways & Avenue Lighting'
    ]),
    JSON.stringify([
      'Gated Community with 24/7 Security Cabin',
      '3BHK Duplex Architecture with Teakwood Main Door',
      'Covered Car Parking & Landscaped Front Courtyard',
      'Individual Borewell + Overhead Tank + Sump',
      'Solar Water Heater & Inverter Wiring Ready'
    ]),
    JSON.stringify([
      '/src/assets/images/property_madurai_villa_1795315020501.jpg',
      '/src/assets/images/hero_aambal_banner_1795315019818.jpg'
    ]),
    null,
    9.9328,
    78.0215,
    'https://maps.app.goo.gl/JdTFEcW1iPCc7QFp8?g_st=aw',
    'Contemporary 3BHK independent duplex villas designed for natural cross-ventilation in Nagamalai Pudukkottai. Close to Madurai Kamaraj University corridor, schools, and multi-specialty hospitals.',
    1
  );

  insert.run(
    'ring-road-green-enclave-samayanallur',
    'Ring Road Green Enclave',
    'Plot',
    'Samayanallur Bypass, Madurai North-West',
    'Madurai District',
    'S.No. 64/1A, 64/2C',
    'DTCP Approved Layout',
    850,
    '1 சதுரடி விலை ரூ. 850/- முதல்',
    '₹850 / Sq.Ft onwards',
    36,
    18,
    1000,
    2400,
    JSON.stringify([
      '40 Feet Main Entrance Boulevard',
      '30 Feet Tar Sub-Roads with Curbstones',
      '2 Minutes to Madurai Outer Ring Road Toll'
    ]),
    JSON.stringify([
      'Compound Wall Around Entire Layout',
      'Grand Entrance Arch & Security Gate',
      'Children Park & Walking Track',
      'Underground EB Cable Provision',
      'Ready-to-Construct Red Soil Plots'
    ]),
    JSON.stringify([
      '/src/assets/images/property_ring_road_plots_1795315019906.jpg',
      '/src/assets/images/property_yoga_ganapathi_1795315019776.jpg'
    ]),
    null,
    10.0124,
    78.0619,
    'https://maps.app.goo.gl/JdTFEcW1iPCc7QFp8?g_st=aw',
    'Highway-adjacent residential and commercial house sites near Samayanallur Bypass with rapid appreciation potential and seamless connectivity to Madurai city center and Dindigul highway.',
    1
  );
}

seedInitialProperties();

// Session signing key (never hardcoded; in-memory fallback when SESSION_SECRET env is unset)
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const VALID_LEAD_STATUSES = ['New Lead', 'Contacted', 'Site Visit', 'Negotiation', 'Closed'];
const VALID_PROPERTY_TYPES = ['Plot', 'Villa', 'Commercial'];

function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasscodeHash(passcode: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  const derived = crypto.scryptSync(passcode, salt, 64);
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function getAdminAuthState(): { configured: boolean; mode: 'env' | 'claimed' | 'unclaimed' } {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    return { configured: true, mode: 'env' };
  }
  const row = db
    .prepare('SELECT value FROM admin_settings WHERE key = ?')
    .get('passcode_hash') as { value: string } | undefined;
  if (row?.value) {
    return { configured: true, mode: 'claimed' };
  }
  return { configured: false, mode: 'unclaimed' };
}

function issueAdminToken(): string {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Invalid or expired admin session.' });
    return;
  }
  next();
}

interface RawPropertyRow {
  id: number;
  slug: string;
  title: string;
  type: string;
  location: string;
  district: string;
  survey_no: string;
  approval_label: string;
  price_per_sqft: number;
  price_tamil: string;
  price_display: string;
  total_units: number;
  available_units: number;
  min_area_sqft: number;
  max_area_sqft: number;
  road_access_json: string;
  facilities_json: string;
  images_json: string;
  layout_plan_image: string | null;
  lat: number;
  lng: number;
  maps_url: string;
  description: string;
  featured: number;
}

function mapPropertyRow(row: RawPropertyRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    location: row.location,
    district: row.district,
    surveyNo: row.survey_no,
    approvalLabel: row.approval_label,
    pricePerSqft: row.price_per_sqft,
    priceTamil: row.price_tamil,
    priceDisplay: row.price_display,
    totalUnits: row.total_units,
    availableUnits: row.available_units,
    minAreaSqft: row.min_area_sqft,
    maxAreaSqft: row.max_area_sqft,
    roadAccess: JSON.parse(row.road_access_json) as string[],
    facilities: JSON.parse(row.facilities_json) as string[],
    images: JSON.parse(row.images_json) as string[],
    layoutPlanImage: row.layout_plan_image,
    lat: row.lat,
    lng: row.lng,
    mapsUrl: row.maps_url,
    description: row.description,
    featured: row.featured === 1,
  };
}

interface RawLeadRow {
  id: number;
  name: string;
  mobile: string;
  interested_in: string;
  property_id: number | null;
  property_title: string | null;
  plot_number: string | null;
  location: string;
  status: string;
  message: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

function mapLeadRow(row: RawLeadRow) {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    interestedIn: row.interested_in,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    plotNumber: row.plot_number,
    location: row.location,
    status: row.status,
    message: row.message,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Public runtime config for browser Google Maps SDK
app.get('/api/config', (_req, res) => {
  const mapsApiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    '';
  res.json({ mapsApiKey });
});

// Public properties endpoints
app.get('/api/properties', (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const typeFilter = typeof req.query.type === 'string' ? req.query.type.trim() : '';

  const rows = db.prepare('SELECT * FROM properties ORDER BY featured DESC, id ASC').all() as unknown as RawPropertyRow[];
  const mapped = rows.map(mapPropertyRow).filter((p) => {
    const matchesType = !typeFilter || typeFilter === 'All' || p.type === typeFilter;
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search) ||
      p.location.toLowerCase().includes(search) ||
      p.district.toLowerCase().includes(search) ||
      p.surveyNo.toLowerCase().includes(search);
    return matchesType && matchesSearch;
  });

  res.json({ properties: mapped });
});

app.get('/api/properties/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid property ID.' });
    return;
  }
  const row = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as unknown as RawPropertyRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }
  res.json({ property: mapPropertyRow(row) });
});

// Public customer enquiry submission (Lead saved in SQLite DB)
app.post('/api/enquiries', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mobileRaw = typeof body.mobile === 'string' ? body.mobile.trim() : '';
  const mobileDigits = mobileRaw.replace(/[\s\-()+]/g, '');
  const interestedIn = typeof body.interestedIn === 'string' ? body.interestedIn.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : 'Madurai';
  const plotNumber = typeof body.plotNumber === 'string' ? body.plotNumber.trim().slice(0, 20) : null;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  const propertyIdNum =
    typeof body.propertyId === 'number' && Number.isInteger(body.propertyId) && body.propertyId > 0
      ? body.propertyId
      : null;

  if (name.length < 2 || name.length > 100) {
    res.status(400).json({ error: 'Please enter a valid customer name (2 to 100 characters).' });
    return;
  }
  if (!/^\d{10,15}$/.test(mobileDigits)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    return;
  }
  if (!interestedIn || interestedIn.length > 60) {
    res.status(400).json({ error: 'Please select whether you are interested in Plot, Villa, or Commercial.' });
    return;
  }
  if (location.length < 2 || location.length > 100) {
    res.status(400).json({ error: 'Please enter a preferred location.' });
    return;
  }

  let propertyTitle: string | null = null;
  if (propertyIdNum !== null) {
    const prop = db.prepare('SELECT id, title FROM properties WHERE id = ?').get(propertyIdNum) as
      | { id: number; title: string }
      | undefined;
    if (prop) {
      propertyTitle = prop.title;
    }
  }

  const result = db
    .prepare(
      `INSERT INTO leads (name, mobile, interested_in, property_id, property_title, plot_number, location, status, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'New Lead', ?)`
    )
    .run(name, mobileRaw.slice(0, 20), interestedIn, propertyIdNum, propertyTitle, plotNumber || null, location, message);

  const inserted = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid) as unknown as RawLeadRow;
  res.status(201).json({
    message: 'Enquiry submitted successfully. Our Aambal Marketing advisor will contact you shortly.',
    lead: mapLeadRow(inserted),
  });
});

// Admin Auth Routes
app.get('/api/admin/auth-status', (_req, res) => {
  res.json(getAdminAuthState());
});

app.post('/api/admin/bootstrap', (req, res) => {
  const authState = getAdminAuthState();
  if (authState.configured) {
    res.status(409).json({ error: 'Admin passcode is already configured. Please sign in.' });
    return;
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
  if (passcode.length < 6 || passcode.length > 64) {
    res.status(400).json({ error: 'Passcode must be between 6 and 64 characters.' });
    return;
  }

  const hash = hashPasscode(passcode);
  const insertResult = db
    .prepare('INSERT OR IGNORE INTO admin_settings (key, value) VALUES (?, ?)')
    .run('passcode_hash', hash);

  if (insertResult.changes === 0) {
    res.status(409).json({ error: 'Admin passcode was already claimed.' });
    return;
  }

  const token = issueAdminToken();
  res.status(201).json({ token, mode: 'claimed' });
});

app.post('/api/admin/login', (req, res) => {
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
  if (!passcode) {
    res.status(400).json({ error: 'Passcode is required.' });
    return;
  }

  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    const a = Buffer.from(passcode);
    const b = Buffer.from(envPasscode);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }
    res.json({ token: issueAdminToken(), mode: 'env' });
    return;
  }

  const row = db
    .prepare('SELECT value FROM admin_settings WHERE key = ?')
    .get('passcode_hash') as { value: string } | undefined;

  if (!row?.value) {
    res.status(409).json({ error: 'Admin passcode not yet set up.' });
    return;
  }

  if (!verifyPasscodeHash(passcode, row.value)) {
    res.status(401).json({ error: 'Incorrect admin passcode.' });
    return;
  }

  res.json({ token: issueAdminToken(), mode: 'claimed' });
});

// Protected Admin Leads Routes
app.get('/api/leads', requireAdmin, (req, res) => {
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const search = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  const rows = db.prepare('SELECT * FROM leads ORDER BY datetime(created_at) DESC, id DESC').all() as unknown as RawLeadRow[];
  const mapped = rows.map(mapLeadRow).filter((lead) => {
    const matchesStatus = !statusFilter || statusFilter === 'All' || lead.status === statusFilter;
    const matchesSearch =
      !search ||
      lead.name.toLowerCase().includes(search) ||
      lead.mobile.toLowerCase().includes(search) ||
      lead.location.toLowerCase().includes(search) ||
      (lead.propertyTitle?.toLowerCase().includes(search) ?? false);
    return matchesStatus && matchesSearch;
  });

  res.json({ leads: mapped });
});

app.patch('/api/leads/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid lead ID.' });
    return;
  }

  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as unknown as RawLeadRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const nextStatus = typeof body.status === 'string' ? body.status.trim() : existing.status;
  const nextNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim().slice(0, 1000) : existing.admin_notes;

  if (!VALID_LEAD_STATUSES.includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid lead status.' });
    return;
  }

  db.prepare(
    `UPDATE leads SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(nextStatus, nextNotes, id);

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as unknown as RawLeadRow;
  res.json({ lead: mapLeadRow(updated) });
});

app.delete('/api/leads/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid lead ID.' });
    return;
  }
  const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Lead not found.' });
    return;
  }
  res.json({ ok: true });
});

// Protected Admin Property Management Route
app.post('/api/properties', requireAdmin, (req, res) => {
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : 'Plot';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const district = typeof body.district === 'string' ? body.district.trim() : 'Madurai District';
  const surveyNo = typeof body.surveyNo === 'string' ? body.surveyNo.trim() : 'DTCP Approved';
  const approvalLabel = typeof body.approvalLabel === 'string' ? body.approvalLabel.trim() : 'DTCP Approved Layout';
  const pricePerSqft = Number(body.pricePerSqft) || 700;
  const priceTamil = typeof body.priceTamil === 'string' && body.priceTamil.trim() ? body.priceTamil.trim() : `1 சதுரடி விலை ரூ. ${pricePerSqft}/- முதல்`;
  const priceDisplay = typeof body.priceDisplay === 'string' && body.priceDisplay.trim() ? body.priceDisplay.trim() : `₹${pricePerSqft} / Sq.Ft onwards`;
  const totalUnits = Math.max(1, Number(body.totalUnits) || 20);
  const availableUnits = Math.max(0, Math.min(totalUnits, Number(body.availableUnits) || totalUnits));
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (title.length < 3 || location.length < 3 || !VALID_PROPERTY_TYPES.includes(type)) {
    res.status(400).json({ error: 'Please provide valid property title, type, and location.' });
    return;
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

  const result = db
    .prepare(
      `INSERT INTO properties (
        slug, title, type, location, district, survey_no, approval_label,
        price_per_sqft, price_tamil, price_display, total_units, available_units,
        min_area_sqft, max_area_sqft, road_access_json, facilities_json,
        images_json, layout_plan_image, lat, lng, maps_url, description, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      title,
      type,
      location,
      district,
      surveyNo,
      approvalLabel,
      pricePerSqft,
      priceTamil,
      priceDisplay,
      totalUnits,
      availableUnits,
      800,
      2400,
      JSON.stringify(['30 Feet Blacktop Road Access', 'Wide Internal Approach Roads']),
      JSON.stringify(['DTCP Approved', 'Clear Title & Patta', 'Street Lights & EB Provision']),
      JSON.stringify(['/src/assets/images/property_yoga_ganapathi_1795315019776.jpg']),
      null,
      9.98403,
      78.07421,
      'https://maps.app.goo.gl/JdTFEcW1iPCc7QFp8?g_st=aw',
      description || `${title} in ${location} — DTCP approved project by Aambal Marketing Properties.`,
      1
    );

  const inserted = db.prepare('SELECT * FROM properties WHERE id = ?').get(result.lastInsertRowid) as unknown as RawPropertyRow;
  res.status(201).json({ property: mapPropertyRow(inserted) });
});

app.patch('/api/properties/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid property ID.' });
    return;
  }
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as unknown as RawPropertyRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const availableUnits =
    typeof body.availableUnits === 'number' && body.availableUnits >= 0
      ? Math.min(existing.total_units, Math.floor(body.availableUnits))
      : existing.available_units;
  const pricePerSqft =
    typeof body.pricePerSqft === 'number' && body.pricePerSqft > 0
      ? Math.floor(body.pricePerSqft)
      : existing.price_per_sqft;

  db.prepare('UPDATE properties SET available_units = ?, price_per_sqft = ? WHERE id = ?').run(
    availableUnits,
    pricePerSqft,
    id
  );
  const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as unknown as RawPropertyRow;
  res.json({ property: mapPropertyRow(updated) });
});

function appendDirToZip(zip: JSZip, rootDir: string, currentDir: string) {
  const skipNames = new Set(['node_modules', 'data', '.gmp_cache', '.git']);
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipNames.has(entry.name)) continue;
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;

    const fullPath = path.resolve(currentDir, entry.name);
    if (!fullPath.startsWith(rootDir + path.sep)) continue;

    const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');
    if (entry.isDirectory()) {
      appendDirToZip(zip, rootDir, fullPath);
    } else if (entry.isFile()) {
      zip.file(relPath, fs.readFileSync(fullPath));
    }
  }
}

app.get('/api/admin/download-zip', requireAdmin, async (_req, res) => {
  try {
    const zip = new JSZip();
    const rootDir = path.resolve(__dirname);
    appendDirToZip(zip, rootDir, rootDir);
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="aambal-marketing-website.zip"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate website ZIP archive.' });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aambal Marketing server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

-- Incidents table shared by the UER Reporter and Responder frontends.
-- `images` is a JSON array of base64 data-URLs (max 4). `status` defaults to
-- the initial 'Reported' state when omitted.
CREATE TABLE IF NOT EXISTS incidents (
    id            text PRIMARY KEY,
    type          text,
    location      text,
    location_text text,
    time          text,
    status        text NOT NULL DEFAULT 'Reported',
    tagged        text,
    severity      text,
    text          text,
    images        jsonb DEFAULT '[]'
);

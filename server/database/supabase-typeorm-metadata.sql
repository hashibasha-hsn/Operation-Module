-- TypeORM requires this helper table in each service schema when using custom schemas.
CREATE TABLE IF NOT EXISTS auth.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS "user".typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS org.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS notification.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS permission.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS location.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

CREATE TABLE IF NOT EXISTS language.typeorm_metadata (
  "type" character varying NOT NULL,
  "database" character varying,
  "schema" character varying,
  "table" character varying,
  "name" character varying,
  "value" text
);

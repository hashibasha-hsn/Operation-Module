-- Run this in Supabase SQL Editor (fixes schema permissions + TypeORM helper tables)

GRANT CREATE, USAGE ON SCHEMA auth TO postgres;
GRANT CREATE, USAGE ON SCHEMA "user" TO postgres;
GRANT CREATE, USAGE ON SCHEMA org TO postgres;
GRANT CREATE, USAGE ON SCHEMA notification TO postgres;
GRANT CREATE, USAGE ON SCHEMA permission TO postgres;
GRANT CREATE, USAGE ON SCHEMA location TO postgres;
GRANT CREATE, USAGE ON SCHEMA language TO postgres;

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

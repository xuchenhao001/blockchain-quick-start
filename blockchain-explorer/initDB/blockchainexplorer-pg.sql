--
--    SPDX-License-Identifier: Apache-2.0
--

CREATE USER hppoc with password 'password';
DROP DATABASE IF EXISTS fabricexplorer;
CREATE DATABASE fabricexplorer owner hppoc;
\c fabricexplorer;
--

-- ----------------------------
--  Table structure for `blocks`
-- ----------------------------
DROP TABLE IF EXISTS blocks;

CREATE TABLE blocks (
  id SERIAL PRIMARY KEY,
  blocknum integer DEFAULT NULL,
  datahash character varying(256) DEFAULT NULL,
  prehash character varying(256) DEFAULT NULL,
  channelname character varying(128) DEFAULT NULL,
  txcount integer DEFAULT NULL,
  createdt Timestamp DEFAULT NULL
);

ALTER table blocks owner to hppoc;

-- ----------------------------
--  Table structure for `chaincodes`
-- ----------------------------
DROP TABLE IF EXISTS chaincodes;

CREATE TABLE chaincodes (
  id SERIAL PRIMARY KEY,
  name character varying(255) DEFAULT NULL,
  version character varying(255) DEFAULT NULL,
  path character varying(255) DEFAULT NULL,
  channelname character varying(255) DEFAULT NULL,
  txcount integer DEFAULT 0,
  createdt Timestamp DEFAULT NULL
);

ALTER table chaincodes owner to hppoc;
Alter sequence chaincodes_id_seq restart with 10;
-- ----------------------------
--  Table structure for `channel`
-- ----------------------------
DROP TABLE IF EXISTS channel;

--   state character(1) NOT NULL DEFAULT 'A' CHECK (state in ('A', 'D', 'S'))

CREATE TABLE channel (
  id SERIAL PRIMARY KEY,
  name varchar(64) DEFAULT NULL,
  blocks integer DEFAULT NULL,
  trans integer DEFAULT NULL,
  createdt Timestamp DEFAULT NULL
);

ALTER table channel owner to hppoc;
Alter sequence channel_id_seq restart with 3;
-- ----------------------------
--  Table structure for `peer`
-- ----------------------------
DROP TABLE IF EXISTS peer;

--   state character(1) NOT NULL DEFAULT 'A' CHECK (state in ('A', 'D', 'S'))

CREATE TABLE peer (
  id SERIAL PRIMARY KEY,
  org integer DEFAULT NULL,
  name varchar(64) DEFAULT NULL,
  mspid varchar(64) DEFAULT NULL,
  requests varchar(64) DEFAULT NULL,
  events varchar(64) DEFAULT NULL,
  server_hostname varchar(64) DEFAULT NULL,
  createdt timestamp DEFAULT NULL
);
ALTER table peer owner to hppoc;
-- ---------------------------
--  Table structure for `peer_ref_channel`
-- ----------------------------
DROP TABLE IF EXISTS peer_ref_channel;

CREATE TABLE peer_ref_channel (
  id SERIAL PRIMARY KEY,
  peerid integer DEFAULT NULL,
  channelid integer DEFAULT NULL,
  createdt Timestamp DEFAULT NULL
);
ALTER table peer_ref_channel owner to hppoc;

-- ====================Orderer BE-303=====================================
-- ----------------------------
--  Table structure for `orderer`
-- ----------------------------
DROP TABLE IF EXISTS orderer;

--   state character(1) NOT NULL DEFAULT 'A' CHECK (state in ('A', 'D', 'S'))

CREATE TABLE orderer (
  id SERIAL PRIMARY KEY,
  requests varchar(64) DEFAULT NULL,
  server_hostname varchar(64) DEFAULT NULL,
  createdt timestamp DEFAULT NULL
);
ALTER table orderer owner to hppoc;

--// ====================Orderer BE-303=====================================
-- ----------------------------
--  Table structure for `transaction`
-- ----------------------------
DROP TABLE IF EXISTS transaction;
CREATE TABLE transaction (
  id SERIAL PRIMARY KEY,
  channelname varchar(64) DEFAULT NULL,
  blockid integer DEFAULT NULL,
  txhash character varying(256) DEFAULT NULL,
  createdt timestamp DEFAULT NULL,
  chaincodename character varying(255) DEFAULT NULL
  );

ALTER table transaction owner to hppoc;
Alter sequence transaction_id_seq restart with 6;

DROP TABLE IF EXISTS write_lock;
CREATE TABLE write_lock (
  write_lock SERIAl PRIMARY KEY
);

ALTER table write_lock owner to hppoc;
Alter sequence write_lock_write_lock_seq restart with 2;

GRANT SELECT, INSERT, UPDATE,DELETE ON ALL TABLES IN SCHEMA PUBLIC to hppoc;

--
--    SPDX-License-Identifier: Apache-2.0
--

\c fabricexplorer;
--TODO research the prev_blockhash for the genesis block??
ALTER TABLE Blocks ADD COLUMN prev_blockhash character varying(256) DEFAULT NULL;
ALTER TABLE Blocks ADD COLUMN blockhash character varying(256) DEFAULT NULL;
ALTER TABLE Blocks ADD COLUMN genesis_block_hash character varying(256) DEFAULT NULL;

ALTER TABLE Transaction ADD COLUMN status  integer DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN creator_msp_id character varying(128) DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN endorser_msp_id character varying(800) DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN chaincode_id character varying(256) DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN type character varying(128) DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN read_set  json default NULL;
ALTER TABLE Transaction ADD COLUMN write_set  json default NULL;
ALTER TABLE Transaction ADD COLUMN genesis_block_hash character varying(256) DEFAULT NULL;

ALTER TABLE channel ADD COLUMN genesis_block_hash character varying(256) DEFAULT NULL;
ALTER TABLE channel ADD COLUMN channel_hash character varying(256) DEFAULT NULL;
ALTER TABLE channel ADD COLUMN channel_config  bytea default NULL;
ALTER TABLE channel ADD COLUMN channel_block  bytea DEFAULT NULL;
ALTER TABLE channel ADD COLUMN channel_tx  bytea DEFAULT NULL;
ALTER TABLE channel ADD COLUMN channel_version character varying(128) DEFAULT NULL;

ALTER TABLE chaincodes ADD COLUMN genesis_block_hash character varying(256) DEFAULT NULL;
ALTER TABLE chaincodes DROP COLUMN channelname ;

ALTER TABLE peer DROP COLUMN name;
ALTER TABLE peer ADD COLUMN genesis_block_hash character varying(256) DEFAULT NULL;
ALTER TABLE Transaction ADD COLUMN validation_code character varying(50) DEFAULT NULL,
ADD COLUMN envelope_signature character varying DEFAULT NULL,
ADD COLUMN payload_extension character varying DEFAULT NULL,
ADD COLUMN creator_id_bytes character varying DEFAULT NULL,
ADD COLUMN creator_nonce character varying DEFAULT NULL,
ADD COLUMN chaincode_proposal_input character varying DEFAULT NULL,
ADD COLUMN payload_proposal_hash character varying DEFAULT NULL,
ADD COLUMN endorser_id_bytes character varying DEFAULT NULL,
ADD COLUMN endorser_signature character varying DEFAULT NULL;

ALTER TABLE transaction DROP COLUMN channelname;
ALTER TABLE blocks DROP COLUMN channelname;


DROP INDEX IF EXISTS blocks_blocknum_idx;
CREATE INDEX ON Blocks (blocknum);

DROP INDEX IF EXISTS blocks_genesis_block_hash_idx;
CREATE INDEX ON Blocks (genesis_block_hash);

DROP INDEX IF EXISTS blocks_createdt_idx;
CREATE INDEX ON Blocks (createdt);

DROP INDEX IF EXISTS transaction_txhash_idx;
CREATE INDEX ON Transaction (txhash);

DROP INDEX IF EXISTS transaction_genesis_block_hash_idx;
CREATE INDEX ON Transaction (genesis_block_hash);

DROP INDEX IF EXISTS transaction_createdt_idx;
CREATE INDEX ON Transaction (createdt);

DROP INDEX IF EXISTS transaction_blockid_idx;
CREATE INDEX ON Transaction (blockid);

DROP INDEX IF EXISTS transaction_chaincode_proposal_input_idx;
CREATE INDEX ON Transaction (chaincode_proposal_input);

DROP INDEX IF EXISTS channel_genesis_block_hash_idx;
CREATE INDEX ON channel (genesis_block_hash);

DROP INDEX IF EXISTS channel_channel_hash_idx;
CREATE INDEX ON channel (channel_hash);

ALTER TABLE IF EXISTS Transaction RENAME TO Transactions;


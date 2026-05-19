-- Migration: Add pdf_url columns for PDF storage
-- Run this in Supabase SQL Editor

-- Networth: add pdf_url to certificates table
ALTER TABLE networth_certificates ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Offer Letter: add pdf_url to offers table
ALTER TABLE offerletter_offers ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- LLP Form: add pdf_url to agreements table
ALTER TABLE llp_form_agreements ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Partnership: already has partnership_documents table with file_url, no changes needed
-- (PDFs are stored as rows in partnership_documents with file_type = 'application/pdf')

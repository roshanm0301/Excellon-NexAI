import { useState, useRef } from 'react'
import { PlayCircle, RotateCcw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { PageLayout, Button, ProgressBar, Spinner, useToast } from '../../design-system'
import {
  createArtifact, publishArtifact,
  createNode,
  createOverlay,
  createView, saveDraft, publishView,
} from '../../config/studioApi'
import type { CreateViewRequest } from '../../types/viewStudio'

// ── Entity Configs ─────────────────────────────────────────────────────────────

const MASTER_ENTITY_CONFIGS = [
  {
    entity_type: 'uom',
    payload: {
      displayName: 'UOM', pluralName: 'UOMs', category: 'master', icon: 'ruler', color: '#6366F1',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'uomCode', label: 'UOM Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'uomName', label: 'UOM Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'decimalPlaces', label: 'Decimal Places', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['uomCode', 'uomName', 'decimalPlaces', 'isActive'] }],
      statuses: [
        { name: 'active', label: 'Active', color: '#22C55E', isInitial: true },
        { name: 'inactive', label: 'Inactive', color: '#94A3B8' },
      ],
      transitions: [
        { from: 'active', to: 'inactive', label: 'Deactivate' },
        { from: 'inactive', to: 'active', label: 'Activate' },
      ],
      relationships: [],
    },
  },
  {
    entity_type: 'organisation',
    payload: {
      displayName: 'Organisation', pluralName: 'Organisations', category: 'master', icon: 'building', color: '#3B82F6',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'orgCode', label: 'Org Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'orgName', label: 'Organisation Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'legalName', label: 'Legal Name', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'pan', label: 'PAN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'gstin', label: 'GSTIN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'address', label: 'Address', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'city', label: 'City', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'state', label: 'State', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'MH', label: 'Maharashtra' }, { code: 'KA', label: 'Karnataka' }, { code: 'TN', label: 'Tamil Nadu' }, { code: 'DL', label: 'Delhi' }, { code: 'GJ', label: 'Gujarat' }, { code: 'TS', label: 'Telangana' }, { code: 'AP', label: 'Andhra Pradesh' }, { code: 'WB', label: 'West Bengal' }, { code: 'RJ', label: 'Rajasthan' }, { code: 'UP', label: 'Uttar Pradesh' }] },
        { name: 'pincode', label: 'Pincode', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'phone', label: 'Phone', type: 'phone', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'email', label: 'Email', type: 'email', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Identity', fields: ['orgCode', 'orgName', 'legalName'] },
        { name: 'Tax', fields: ['pan', 'gstin'] },
        { name: 'Address', fields: ['address', 'city', 'state', 'pincode'] },
        { name: 'Contact', fields: ['phone', 'email', 'isActive'] },
      ],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'branch',
    payload: {
      displayName: 'Branch', pluralName: 'Branches', category: 'master', icon: 'git-branch', color: '#8B5CF6',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'branchCode', label: 'Branch Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'branchName', label: 'Branch Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'organisation', label: 'Organisation', type: 'reference', referenceEntity: 'organisation', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'address', label: 'Address', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'city', label: 'City', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'state', label: 'State', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'MH', label: 'Maharashtra' }, { code: 'KA', label: 'Karnataka' }, { code: 'TN', label: 'Tamil Nadu' }, { code: 'DL', label: 'Delhi' }, { code: 'GJ', label: 'Gujarat' }] },
        { name: 'pincode', label: 'Pincode', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'phone', label: 'Phone', type: 'phone', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'gstin', label: 'GSTIN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Identity', fields: ['branchCode', 'branchName', 'organisation'] },
        { name: 'Address', fields: ['address', 'city', 'state', 'pincode'] },
        { name: 'Contact', fields: ['phone', 'gstin', 'isActive'] },
      ],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [{ name: 'organisation', type: 'parent', targetEntity: 'organisation', foreignKey: 'organisation' }],
    },
  },
  {
    entity_type: 'department',
    payload: {
      displayName: 'Department', pluralName: 'Departments', category: 'master', icon: 'users', color: '#F59E0B',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'deptCode', label: 'Dept Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'deptName', label: 'Department Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'branch', label: 'Branch', type: 'reference', referenceEntity: 'branch', required: false, unique: false, indexed: true, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['deptCode', 'deptName', 'branch', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'employee',
    payload: {
      displayName: 'Employee', pluralName: 'Employees', category: 'master', icon: 'user', color: '#10B981',
      capabilities: { softDelete: true, auditTrail: true, pii: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'empCode', label: 'Employee Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'firstName', label: 'First Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'lastName', label: 'Last Name', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'branch', label: 'Branch', type: 'reference', referenceEntity: 'branch', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'department', label: 'Department', type: 'reference', referenceEntity: 'department', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'designation', label: 'Designation', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'email', label: 'Email', type: 'email', required: true, unique: true, indexed: true, storageType: 'physical', piiCategory: 'direct' },
        { name: 'phone', label: 'Phone', type: 'phone', required: true, unique: false, indexed: false, storageType: 'physical', piiCategory: 'direct' },
        { name: 'joiningDate', label: 'Joining Date', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Personal', fields: ['empCode', 'firstName', 'lastName'] },
        { name: 'Assignment', fields: ['branch', 'department', 'designation'] },
        { name: 'Contact', fields: ['email', 'phone', 'joiningDate', 'isActive'] },
      ],
      statuses: [
        { name: 'active', label: 'Active', color: '#22C55E', isInitial: true },
        { name: 'inactive', label: 'Inactive', color: '#94A3B8' },
        { name: 'terminated', label: 'Terminated', color: '#EF4444' },
      ],
      transitions: [
        { from: 'active', to: 'inactive', label: 'Deactivate' },
        { from: 'inactive', to: 'active', label: 'Activate' },
        { from: 'active', to: 'terminated', label: 'Terminate' },
      ],
      relationships: [],
    },
  },
  {
    entity_type: 'customer',
    payload: {
      displayName: 'Customer', pluralName: 'Customers', category: 'master', icon: 'users', color: '#3B82F6',
      capabilities: { softDelete: true, auditTrail: true, pii: true, workflow: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'customerCode', label: 'Customer Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'customerType', label: 'Customer Type', type: 'enum', required: true, unique: false, indexed: true, storageType: 'physical', enumValues: [{ code: 'Individual', label: 'Individual' }, { code: 'Corporate', label: 'Corporate' }, { code: 'Fleet', label: 'Fleet' }] },
        { name: 'firstName', label: 'First Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'lastName', label: 'Last Name', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'companyName', label: 'Company Name', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'pan', label: 'PAN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical', piiCategory: 'special_category' },
        { name: 'gstin', label: 'GSTIN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'email', label: 'Email', type: 'email', required: false, unique: false, indexed: true, storageType: 'physical', piiCategory: 'direct' },
        { name: 'primaryPhone', label: 'Primary Phone', type: 'phone', required: true, unique: false, indexed: false, storageType: 'physical', piiCategory: 'direct' },
        { name: 'secondaryPhone', label: 'Secondary Phone', type: 'phone', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'billingAddress', label: 'Billing Address', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'billingCity', label: 'Billing City', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'billingState', label: 'Billing State', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'MH', label: 'Maharashtra' }, { code: 'KA', label: 'Karnataka' }, { code: 'TN', label: 'Tamil Nadu' }, { code: 'DL', label: 'Delhi' }, { code: 'GJ', label: 'Gujarat' }] },
        { name: 'billingPincode', label: 'Billing Pincode', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'creditLimit', label: 'Credit Limit', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'creditPeriod', label: 'Credit Period (days)', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'paymentTerm', label: 'Payment Term', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'Immediate', label: 'Immediate' }, { code: 'Net15', label: 'Net 15' }, { code: 'Net30', label: 'Net 30' }, { code: 'Net45', label: 'Net 45' }] },
        { name: 'customerSource', label: 'Customer Source', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'WalkIn', label: 'Walk-In' }, { code: 'Online', label: 'Online' }, { code: 'Referral', label: 'Referral' }, { code: 'Exhibition', label: 'Exhibition' }] },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'blacklisted', label: 'Blacklisted', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Identity', fields: ['customerCode', 'customerType', 'firstName', 'lastName', 'companyName'] },
        { name: 'Tax & Finance', fields: ['pan', 'gstin', 'creditLimit', 'creditPeriod', 'paymentTerm'] },
        { name: 'Contact', fields: ['email', 'primaryPhone', 'secondaryPhone'] },
        { name: 'Address', fields: ['billingAddress', 'billingCity', 'billingState', 'billingPincode'] },
        { name: 'Account', fields: ['customerSource', 'isActive', 'blacklisted'] },
      ],
      statuses: [
        { name: 'prospect', label: 'Prospect', color: '#F59E0B', isInitial: true },
        { name: 'active', label: 'Active', color: '#22C55E' },
        { name: 'inactive', label: 'Inactive', color: '#94A3B8' },
        { name: 'blacklisted', label: 'Blacklisted', color: '#EF4444' },
      ],
      transitions: [
        { from: 'prospect', to: 'active', label: 'Activate' },
        { from: 'active', to: 'inactive', label: 'Deactivate' },
        { from: 'inactive', to: 'active', label: 'Reactivate' },
        { from: 'active', to: 'blacklisted', label: 'Blacklist' },
      ],
      relationships: [{ name: 'orders', type: 'child', targetEntity: 'sale_order', foreignKey: 'customer' }],
    },
  },
  {
    entity_type: 'hsn_sac',
    payload: {
      displayName: 'HSN-SAC', pluralName: 'HSN-SAC Codes', category: 'master', icon: 'hash', color: '#EC4899',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'hsnCode', label: 'HSN/SAC Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'description', label: 'Description', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'taxableCategory', label: 'Taxable Category', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'Taxable', label: 'Taxable' }, { code: 'Exempt', label: 'Exempt' }, { code: 'Zero-rated', label: 'Zero-rated' }, { code: 'Nil-rated', label: 'Nil-rated' }] },
        { name: 'applicableTaxRate', label: 'Applicable Tax Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['hsnCode', 'description', 'taxableCategory', 'applicableTaxRate', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'tax_config',
    payload: {
      displayName: 'Tax Configuration', pluralName: 'Tax Configurations', category: 'master', icon: 'percent', color: '#EF4444',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'taxCode', label: 'Tax Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'taxName', label: 'Tax Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'taxType', label: 'Tax Type', type: 'enum', required: true, unique: false, indexed: true, storageType: 'physical', enumValues: [{ code: 'GST', label: 'GST (CGST+SGST)' }, { code: 'IGST', label: 'IGST' }, { code: 'Exempt', label: 'Exempt' }, { code: 'Zero', label: 'Zero-rated' }] },
        { name: 'cgstRate', label: 'CGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'sgstRate', label: 'SGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'igstRate', label: 'IGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'cessRate', label: 'Cess Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'effectiveFrom', label: 'Effective From', type: 'date', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Identity', fields: ['taxCode', 'taxName', 'taxType'] },
        { name: 'Rates', fields: ['cgstRate', 'sgstRate', 'igstRate', 'cessRate'] },
        { name: 'Validity', fields: ['effectiveFrom', 'isActive'] },
      ],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'vehicle',
    payload: {
      displayName: 'Vehicle', pluralName: 'Vehicles', category: 'master', icon: 'car', color: '#0EA5E9',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'vehicleCode', label: 'Vehicle Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'modelName', label: 'Model Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'manufacturer', label: 'Manufacturer', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'variant', label: 'Variant', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'fuelType', label: 'Fuel Type', type: 'enum', required: true, unique: false, indexed: true, storageType: 'physical', enumValues: [{ code: 'Petrol', label: 'Petrol' }, { code: 'Diesel', label: 'Diesel' }, { code: 'Electric', label: 'Electric' }, { code: 'Hybrid', label: 'Hybrid' }, { code: 'CNG', label: 'CNG' }] },
        { name: 'transmissionType', label: 'Transmission', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'Manual', label: 'Manual' }, { code: 'Automatic', label: 'Automatic' }, { code: 'AMT', label: 'AMT' }, { code: 'CVT', label: 'CVT' }, { code: 'DCT', label: 'DCT' }] },
        { name: 'bodyStyle', label: 'Body Style', type: 'enum', required: false, unique: false, indexed: true, storageType: 'physical', enumValues: [{ code: 'Sedan', label: 'Sedan' }, { code: 'SUV', label: 'SUV' }, { code: 'Hatchback', label: 'Hatchback' }, { code: 'MUV', label: 'MUV' }, { code: 'Pickup', label: 'Pickup' }, { code: 'Commercial', label: 'Commercial' }] },
        { name: 'color', label: 'Colour', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'White', label: 'White' }, { code: 'Silver', label: 'Silver' }, { code: 'Grey', label: 'Grey' }, { code: 'Black', label: 'Black' }, { code: 'Red', label: 'Red' }, { code: 'Blue', label: 'Blue' }, { code: 'Orange', label: 'Orange' }] },
        { name: 'hsnCode', label: 'HSN Code', type: 'reference', referenceEntity: 'hsn_sac', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'uom', label: 'UOM', type: 'reference', referenceEntity: 'uom', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'basePrice', label: 'Base Price', type: 'decimal', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'mrp', label: 'MRP', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'taxCategory', label: 'Tax Category', type: 'reference', referenceEntity: 'tax_config', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'stockQty', label: 'Stock Qty', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Identity', fields: ['vehicleCode', 'modelName', 'manufacturer', 'variant'] },
        { name: 'Classification', fields: ['fuelType', 'transmissionType', 'bodyStyle', 'color'] },
        { name: 'Tax & Pricing', fields: ['hsnCode', 'taxCategory', 'basePrice', 'mrp', 'uom'] },
        { name: 'Inventory', fields: ['stockQty', 'isActive'] },
      ],
      statuses: [
        { name: 'active', label: 'Active', color: '#22C55E', isInitial: true },
        { name: 'discontinued', label: 'Discontinued', color: '#94A3B8' },
        { name: 'endOfLife', label: 'End of Life', color: '#EF4444' },
      ],
      transitions: [
        { from: 'active', to: 'discontinued', label: 'Discontinue' },
        { from: 'discontinued', to: 'active', label: 'Reactivate' },
        { from: 'discontinued', to: 'endOfLife', label: 'End of Life' },
      ],
      relationships: [],
    },
  },
  {
    entity_type: 'price_list',
    payload: {
      displayName: 'Price List', pluralName: 'Price Lists', category: 'master', icon: 'tag', color: '#F59E0B',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'priceListCode', label: 'Price List Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'priceListName', label: 'Price List Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'vehicle', label: 'Vehicle', type: 'reference', referenceEntity: 'vehicle', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'basePrice', label: 'Base Price', type: 'decimal', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'effectiveFrom', label: 'Effective From', type: 'date', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'effectiveTo', label: 'Effective To', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['priceListCode', 'priceListName', 'vehicle', 'basePrice', 'effectiveFrom', 'effectiveTo', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'expired', label: 'Expired', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'expired', label: 'Expire' }],
      relationships: [],
    },
  },
  {
    entity_type: 'financier',
    payload: {
      displayName: 'Financier', pluralName: 'Financiers', category: 'master', icon: 'landmark', color: '#6366F1',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'financierCode', label: 'Financier Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'financierName', label: 'Financier Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'bankName', label: 'Bank Name', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'contactPhone', label: 'Contact Phone', type: 'phone', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'email', label: 'Email', type: 'email', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'minLoanAmount', label: 'Min Loan Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'maxLoanAmount', label: 'Max Loan Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['financierCode', 'financierName', 'bankName', 'contactPhone', 'email', 'minLoanAmount', 'maxLoanAmount', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'insurance_provider',
    payload: {
      displayName: 'Insurance Provider', pluralName: 'Insurance Providers', category: 'master', icon: 'shield', color: '#10B981',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'providerCode', label: 'Provider Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'providerName', label: 'Provider Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'phone', label: 'Phone', type: 'phone', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'email', label: 'Email', type: 'email', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'licenseNumber', label: 'License Number', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['providerCode', 'providerName', 'phone', 'email', 'licenseNumber', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'delivery_term',
    payload: {
      displayName: 'Delivery Term', pluralName: 'Delivery Terms', category: 'master', icon: 'truck', color: '#8B5CF6',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'termCode', label: 'Term Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'termName', label: 'Term Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['termCode', 'termName', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'delivery_type',
    payload: {
      displayName: 'Delivery Type', pluralName: 'Delivery Types', category: 'master', icon: 'package', color: '#F59E0B',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'typeCode', label: 'Type Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'typeName', label: 'Type Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['typeCode', 'typeName', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'delivery_slot',
    payload: {
      displayName: 'Delivery Slot', pluralName: 'Delivery Slots', category: 'master', icon: 'clock', color: '#EC4899',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'slotCode', label: 'Slot Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'slotName', label: 'Slot Name', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'fromTime', label: 'From Time', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'toTime', label: 'To Time', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['slotCode', 'slotName', 'fromTime', 'toTime', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'warehouse',
    payload: {
      displayName: 'Warehouse', pluralName: 'Warehouses', category: 'master', icon: 'warehouse', color: '#6366F1',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'warehouseCode', label: 'Warehouse Code', type: 'string', required: true, unique: true, indexed: true, storageType: 'physical' },
        { name: 'warehouseName', label: 'Warehouse Name', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'branch', label: 'Branch', type: 'reference', referenceEntity: 'branch', required: false, unique: false, indexed: true, storageType: 'physical' },
        { name: 'address', label: 'Address', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'warehouseType', label: 'Warehouse Type', type: 'enum', required: false, unique: false, indexed: true, storageType: 'physical', enumValues: [{ code: 'Showroom', label: 'Showroom' }, { code: 'PDIYard', label: 'PDI Yard' }, { code: 'Stockyard', label: 'Stockyard' }, { code: 'Transit', label: 'Transit' }] },
        { name: 'capacity', label: 'Capacity', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['warehouseCode', 'warehouseName', 'branch', 'address', 'warehouseType', 'capacity', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }, { name: 'inactive', label: 'Inactive', color: '#94A3B8' }],
      transitions: [{ from: 'active', to: 'inactive', label: 'Deactivate' }, { from: 'inactive', to: 'active', label: 'Activate' }],
      relationships: [],
    },
  },
  {
    entity_type: 'picklist',
    payload: {
      displayName: 'Picklist', pluralName: 'Picklist Values', category: 'master', icon: 'list', color: '#94A3B8',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'category', label: 'Category', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'code', label: 'Code', type: 'string', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'label', label: 'Label', type: 'string', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'sortOrder', label: 'Sort Order', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'isActive', label: 'Is Active', type: 'boolean', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [{ name: 'Details', fields: ['category', 'code', 'label', 'sortOrder', 'isActive'] }],
      statuses: [{ name: 'active', label: 'Active', color: '#22C55E', isInitial: true }],
      transitions: [],
      relationships: [],
    },
  },
]

const TRANSACTION_ENTITY_CONFIGS = [
  {
    entity_type: 'sale_order_line',
    payload: {
      displayName: 'Sale Order Line', pluralName: 'Sale Order Lines', category: 'transaction', icon: 'list', color: '#8B5CF6',
      capabilities: { softDelete: true, auditTrail: true },
      idConfig: { strategy: 'uuid_v7' },
      fields: [
        { name: 'saleOrderId', label: 'Sale Order', type: 'reference', referenceEntity: 'sale_order', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'lineNumber', label: 'Line #', type: 'integer', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'lineStatus', label: 'Line Status', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'productCode', label: 'Vehicle', type: 'reference', referenceEntity: 'vehicle', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'uom', label: 'UOM', type: 'reference', referenceEntity: 'uom', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'orderQuantity', label: 'Order Qty', type: 'decimal', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'rate', label: 'Rate', type: 'decimal', required: true, unique: false, indexed: false, storageType: 'physical' },
        { name: 'baseAmount', label: 'Base Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'orderQuantity * rate', readOnly: true },
        { name: 'discountPercent', label: 'Discount %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'discountAmount', label: 'Discount Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'baseAmount * discountPercent / 100', readOnly: true },
        { name: 'taxableAmount', label: 'Taxable Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'baseAmount - discountAmount', readOnly: true },
        { name: 'cgstRate', label: 'CGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'sgstRate', label: 'SGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'igstRate', label: 'IGST Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'cgstAmount', label: 'CGST Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'taxableAmount * cgstRate / 100', readOnly: true },
        { name: 'sgstAmount', label: 'SGST Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'taxableAmount * sgstRate / 100', readOnly: true },
        { name: 'igstAmount', label: 'IGST Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'taxableAmount * igstRate / 100', readOnly: true },
        { name: 'lineAmount', label: 'Line Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'computed', computeExpression: 'taxableAmount + cgstAmount + sgstAmount + igstAmount', readOnly: true },
        { name: 'cancelledQty', label: 'Cancelled Qty', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'lineRemark', label: 'Line Remark', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Product', fields: ['saleOrderId', 'lineNumber', 'lineStatus', 'productCode', 'uom'] },
        { name: 'Quantity', fields: ['orderQuantity', 'cancelledQty'] },
        { name: 'Pricing', fields: ['rate', 'baseAmount', 'discountPercent', 'discountAmount', 'taxableAmount'] },
        { name: 'GST', fields: ['cgstRate', 'sgstRate', 'igstRate', 'cgstAmount', 'sgstAmount', 'igstAmount', 'lineAmount'] },
        { name: 'Notes', fields: ['lineRemark'] },
      ],
      statuses: [
        { name: 'open', label: 'Open', color: '#3B82F6', isInitial: true },
        { name: 'partiallyProcessed', label: 'Partially Processed', color: '#F59E0B' },
        { name: 'processed', label: 'Processed', color: '#22C55E' },
        { name: 'cancelled', label: 'Cancelled', color: '#EF4444' },
      ],
      transitions: [
        { from: 'open', to: 'cancelled', label: 'Cancel' },
        { from: 'open', to: 'partiallyProcessed', label: 'Partial Process' },
        { from: 'partiallyProcessed', to: 'processed', label: 'Complete' },
      ],
      relationships: [{ name: 'saleOrder', type: 'parent', targetEntity: 'sale_order', foreignKey: 'saleOrderId' }],
    },
  },
  {
    entity_type: 'sale_order',
    payload: {
      displayName: 'Sale Order', pluralName: 'Sale Orders', category: 'transaction', icon: 'file-text', color: '#3B82F6',
      capabilities: { softDelete: true, auditTrail: true, workflow: true },
      idConfig: { strategy: 'uuid_v7', displayId: { enabled: true, prefix: 'SO', separator: '-', seed: 1, padding: 6 } },
      fields: [
        { name: 'status', label: 'Status', type: 'string', required: false, unique: false, indexed: true, storageType: 'physical', readOnly: true },
        { name: 'documentNumber', label: 'Document Number', type: 'string', required: false, unique: false, indexed: true, storageType: 'physical', readOnly: true },
        { name: 'documentDate', label: 'Document Date', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'organisation', label: 'Organisation', type: 'reference', referenceEntity: 'organisation', required: false, unique: false, indexed: true, storageType: 'physical', readOnly: true },
        { name: 'branch', label: 'Branch', type: 'reference', referenceEntity: 'branch', required: false, unique: false, indexed: true, storageType: 'physical', readOnly: true },
        { name: 'department', label: 'Department', type: 'reference', referenceEntity: 'department', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'createdBy', label: 'Created By', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'customer', label: 'Customer', type: 'reference', referenceEntity: 'customer', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'gstin', label: 'Customer GSTIN', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'salesExecutive', label: 'Sales Executive', type: 'reference', referenceEntity: 'employee', required: true, unique: false, indexed: true, storageType: 'physical' },
        { name: 'orderSource', label: 'Order Source', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'WalkIn', label: 'Walk-In' }, { code: 'Online', label: 'Online' }, { code: 'Referral', label: 'Referral' }, { code: 'Exhibition', label: 'Exhibition' }, { code: 'Campaign', label: 'Campaign' }] },
        { name: 'priority', label: 'Priority', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'High', label: 'High' }, { code: 'Medium', label: 'Medium' }, { code: 'Low', label: 'Low' }, { code: 'Urgent', label: 'Urgent' }] },
        { name: 'requestedDeliveryDate', label: 'Requested Delivery Date', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'validTillDate', label: 'Valid Till Date', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'placeOfSupply', label: 'Place of Supply', type: 'enum', required: true, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'MH', label: 'Maharashtra' }, { code: 'KA', label: 'Karnataka' }, { code: 'TN', label: 'Tamil Nadu' }, { code: 'DL', label: 'Delhi' }, { code: 'GJ', label: 'Gujarat' }, { code: 'TS', label: 'Telangana' }, { code: 'AP', label: 'Andhra Pradesh' }, { code: 'WB', label: 'West Bengal' }, { code: 'RJ', label: 'Rajasthan' }, { code: 'UP', label: 'Uttar Pradesh' }] },
        { name: 'deliveryTerm', label: 'Delivery Term', type: 'reference', referenceEntity: 'delivery_term', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'deliveryType', label: 'Delivery Type', type: 'reference', referenceEntity: 'delivery_type', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'deliverySlot', label: 'Delivery Slot', type: 'reference', referenceEntity: 'delivery_slot', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'deliveryAddress', label: 'Delivery Address', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'paymentMode', label: 'Payment Mode', type: 'enum', required: true, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'Cash', label: 'Cash' }, { code: 'Finance', label: 'Finance' }, { code: 'Exchange', label: 'Exchange cum Finance' }] },
        { name: 'paymentMethod', label: 'Payment Method', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: 'Cheque', label: 'Cheque' }, { code: 'DD', label: 'Demand Draft' }, { code: 'NEFT', label: 'NEFT' }, { code: 'RTGS', label: 'RTGS' }, { code: 'UPI', label: 'UPI' }, { code: 'Cash', label: 'Cash' }] },
        { name: 'advancePayment', label: 'Advance Payment', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'financier', label: 'Financier', type: 'reference', referenceEntity: 'financier', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'downPayment', label: 'Down Payment', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'financeAmount', label: 'Finance Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'tenure', label: 'Tenure (months)', type: 'enum', required: false, unique: false, indexed: false, storageType: 'physical', enumValues: [{ code: '12', label: '12 months' }, { code: '24', label: '24 months' }, { code: '36', label: '36 months' }, { code: '48', label: '48 months' }, { code: '60', label: '60 months' }, { code: '72', label: '72 months' }] },
        { name: 'emiInterestRate', label: 'EMI Interest Rate %', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'insuranceProvider', label: 'Insurance Provider', type: 'reference', referenceEntity: 'insurance_provider', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'insurancePolicyNumber', label: 'Policy Number', type: 'string', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'insurancePolicyDate', label: 'Policy Date', type: 'date', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'totalQuantity', label: 'Total Qty', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'totalBaseAmount', label: 'Total Base Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'totalTaxAmount', label: 'Total Tax Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'netAmount', label: 'Net Amount', type: 'decimal', required: false, unique: false, indexed: false, storageType: 'physical', readOnly: true },
        { name: 'remarks', label: 'Remarks', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
        { name: 'cancellationReason', label: 'Cancellation Reason', type: 'text', required: false, unique: false, indexed: false, storageType: 'physical' },
      ],
      sections: [
        { name: 'Document Info', fields: ['status', 'documentNumber', 'documentDate', 'organisation', 'branch', 'department', 'createdBy'] },
        { name: 'Customer', fields: ['customer', 'gstin', 'salesExecutive', 'orderSource', 'priority', 'requestedDeliveryDate', 'validTillDate', 'placeOfSupply'] },
        { name: 'Delivery', fields: ['deliveryTerm', 'deliveryType', 'deliverySlot', 'deliveryAddress'] },
        { name: 'Payment', fields: ['paymentMode', 'paymentMethod', 'advancePayment'] },
        { name: 'Finance', fields: ['financier', 'downPayment', 'financeAmount', 'tenure', 'emiInterestRate'] },
        { name: 'Insurance', fields: ['insuranceProvider', 'insurancePolicyNumber', 'insurancePolicyDate'] },
        { name: 'Totals', fields: ['totalQuantity', 'totalBaseAmount', 'totalTaxAmount', 'netAmount'] },
        { name: 'Internal', fields: ['remarks', 'cancellationReason'] },
      ],
      statuses: [
        { name: 'open', label: 'Open', color: '#3B82F6', isInitial: true },
        { name: 'partiallyConverted', label: 'Partially Converted', color: '#F59E0B' },
        { name: 'converted', label: 'Converted', color: '#8B5CF6' },
        { name: 'invoiced', label: 'Invoiced', color: '#22C55E' },
        { name: 'expired', label: 'Expired', color: '#94A3B8' },
        { name: 'cancelled', label: 'Cancelled', color: '#EF4444' },
      ],
      transitions: [
        { from: 'open', to: 'cancelled', label: 'Cancel' },
        { from: 'open', to: 'expired', label: 'Expire' },
        { from: 'open', to: 'partiallyConverted', label: 'Partial Convert' },
        { from: 'partiallyConverted', to: 'converted', label: 'Convert' },
        { from: 'converted', to: 'invoiced', label: 'Invoice' },
      ],
      relationships: [
        { name: 'lines', type: 'child', targetEntity: 'sale_order_line', foreignKey: 'saleOrderId' },
        { name: 'customer', type: 'parent', targetEntity: 'customer', foreignKey: 'customer' },
      ],
    },
  },
]

const VIEW_CONFIGS = [
  {
    view_key: 'so-index',
    view_label: 'Sale Orders',
    surface_type: 'standard_crud',
    primary_entity: 'sale_order',
    payload: {
      component_tree: {
        component_key: 'root', component_code: 'PageRoot', props: { title: 'Sale Orders' }, children: [
          { component_key: 'toolbar', component_code: 'Toolbar', props: {}, children: [
            { component_key: 'btn-new', component_code: 'Button', props: { label: 'New Sale Order', variant: 'primary' }, bindings: {}, children: [] },
          ]},
          { component_key: 'table', component_code: 'DataTable', props: { columns: ['documentNumber', 'customer', 'salesExecutive', 'documentDate', 'status', 'netAmount'] }, bindings: { data: { source: 'field', field_key: 'records' } }, children: [] },
        ],
        bindings: {},
      },
      datasources: [{ key: 'records', entity: 'sale_order', type: 'list' }],
      events: [],
    },
  },
  {
    view_key: 'so-editor',
    view_label: 'Sale Order Editor',
    surface_type: 'header_line',
    primary_entity: 'sale_order',
    payload: {
      component_tree: {
        component_key: 'root', component_code: 'PageRoot', props: { title: 'Sale Order' }, children: [
          { component_key: 'header-section', component_code: 'Section', props: { title: 'Customer & Order Info' }, children: [
            { component_key: 'customer-field', component_code: 'ReferenceSelect', props: { label: 'Customer' }, bindings: { value: { source: 'field', field_key: 'customer' } }, children: [] },
            { component_key: 'exec-field', component_code: 'ReferenceSelect', props: { label: 'Sales Executive' }, bindings: { value: { source: 'field', field_key: 'salesExecutive' } }, children: [] },
            { component_key: 'payment-mode', component_code: 'Dropdown', props: { label: 'Payment Mode' }, bindings: { value: { source: 'field', field_key: 'paymentMode' } }, children: [] },
            { component_key: 'place-supply', component_code: 'Dropdown', props: { label: 'Place of Supply' }, bindings: { value: { source: 'field', field_key: 'placeOfSupply' } }, children: [] },
          ], bindings: {}},
          { component_key: 'lines-section', component_code: 'Section', props: { title: 'Order Lines' }, children: [
            { component_key: 'lines-table', component_code: 'DataTable', props: { columns: ['productCode', 'uom', 'orderQuantity', 'rate', 'lineAmount'] }, bindings: { data: { source: 'field', field_key: 'lines' } }, children: [] },
          ], bindings: {}},
        ],
        bindings: {},
      },
      datasources: [{ key: 'record', entity: 'sale_order', type: 'single' }],
      events: [],
    },
  },
  {
    view_key: 'customer-master',
    view_label: 'Customer Master',
    surface_type: 'standard_crud',
    primary_entity: 'customer',
    payload: {
      component_tree: {
        component_key: 'root', component_code: 'PageRoot', props: { title: 'Customer Master' }, children: [
          { component_key: 'table', component_code: 'DataTable', props: { columns: ['customerCode', 'firstName', 'lastName', 'customerType', 'primaryPhone', 'email', 'gstin'] }, bindings: { data: { source: 'field', field_key: 'records' } }, children: [] },
        ],
        bindings: {},
      },
      datasources: [{ key: 'records', entity: 'customer', type: 'list' }],
      events: [],
    },
  },
  {
    view_key: 'vehicle-catalog',
    view_label: 'Vehicle Catalog',
    surface_type: 'standard_crud',
    primary_entity: 'vehicle',
    payload: {
      component_tree: {
        component_key: 'root', component_code: 'PageRoot', props: { title: 'Vehicle Catalog' }, children: [
          { component_key: 'table', component_code: 'DataTable', props: { columns: ['vehicleCode', 'modelName', 'manufacturer', 'variant', 'fuelType', 'basePrice'] }, bindings: { data: { source: 'field', field_key: 'records' } }, children: [] },
        ],
        bindings: {},
      },
      datasources: [{ key: 'records', entity: 'vehicle', type: 'list' }],
      events: [],
    },
  },
  {
    view_key: 'sales-dashboard',
    view_label: 'Sales Dashboard',
    surface_type: 'dashboard',
    primary_entity: '',
    payload: {
      component_tree: {
        component_key: 'root', component_code: 'PageRoot', props: { title: 'Sales Dashboard — India Automobile' }, children: [
          { component_key: 'metrics-row', component_code: 'Row', props: {}, children: [
            { component_key: 'm1', component_code: 'MetricComparison', props: { label: "Today's Orders", value: '0', trend: 'neutral' }, bindings: {}, children: [] },
            { component_key: 'm2', component_code: 'MetricComparison', props: { label: 'This Month', value: '0', trend: 'neutral' }, bindings: {}, children: [] },
            { component_key: 'm3', component_code: 'MetricComparison', props: { label: 'Open Orders', value: '0', trend: 'neutral' }, bindings: {}, children: [] },
            { component_key: 'm4', component_code: 'MetricComparison', props: { label: 'Invoiced', value: '0', trend: 'neutral' }, bindings: {}, children: [] },
          ], bindings: {}},
          { component_key: 'open-orders', component_code: 'DataTable', props: { title: 'Open Sale Orders', columns: ['documentNumber', 'customer', 'netAmount', 'status'] }, bindings: {}, children: [] },
        ],
        bindings: {},
      },
      datasources: [],
      events: [],
    },
  },
]

// ── Steps ──────────────────────────────────────────────────────────────────────

type StepStatus = 'idle' | 'running' | 'done' | 'error'

const STEPS = [
  { label: 'Create Node Hierarchy', detail: '5 nodes' },
  { label: 'Create Master Entities', detail: '17 entities' },
  { label: 'Create Transaction Entities', detail: '2 entities' },
  { label: 'Publish All Entities', detail: '19 artifacts' },
  { label: 'Create Overlays', detail: '2 overlays' },
  { label: 'Create UI Studio Views', detail: '5 views' },
]

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') return <CheckCircle2 size={16} style={{ color: 'var(--success-500, #22C55E)', flexShrink: 0 }} />
  if (status === 'error') return <XCircle size={16} style={{ color: 'var(--error-500, #EF4444)', flexShrink: 0 }} />
  if (status === 'running') return <Spinner size={16} />
  return <Clock size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DemoSetupPage() {
  const { success, error } = useToast()
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(Array(6).fill('idle'))
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = (msg: string) => {
    setLogs(l => {
      const next = [...l, `${new Date().toLocaleTimeString()} — ${msg}`]
      setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 50)
      return next
    })
  }

  const handleReset = () => {
    ;['msw_artifacts', 'msw_nodes', 'msw_overlays', 'msw_views'].forEach(k => localStorage.removeItem(k))
    // Reload the page so MSW in-memory stores re-initialize from empty localStorage
    window.location.reload()
  }

  const runSetup = async () => {
    setRunning(true)
    setDone(false)
    setLogs([])
    setProgress(0)
    const statuses: StepStatus[] = Array(6).fill('idle')
    const setStep = (i: number, s: StepStatus) => { statuses[i] = s; setStepStatuses([...statuses]) }
    const createdArtifactIds: string[] = []

    try {
      // Step 0: Nodes
      setStep(0, 'running')
      const platform = await createNode({ name: 'Platform Root', node_type: 'platform', metadata: {} })
      addLog('Created node: Platform Root')
      const vertical = await createNode({ name: 'India Automobile', node_type: 'vertical', parent_id: platform.id, metadata: { industry: 'Automobile', region: 'India' } })
      addLog('Created node: India Automobile')
      const tenant = await createNode({ name: 'Demo Dealer Pvt Ltd', node_type: 'tenant', parent_id: vertical.id, metadata: { gstin: '27AAAPD1234A1Z5', state: 'Maharashtra' } })
      addLog('Created node: Demo Dealer Pvt Ltd')
      await createNode({ name: 'Mumbai Showroom', node_type: 'branch', parent_id: tenant.id, metadata: { city: 'Mumbai', branchCode: 'MUM-01' } })
      addLog('Created node: Mumbai Showroom')
      await createNode({ name: 'Pune Showroom', node_type: 'branch', parent_id: tenant.id, metadata: { city: 'Pune', branchCode: 'PUN-01' } })
      addLog('Created node: Pune Showroom')
      setStep(0, 'done')
      setProgress(10)

      // Step 1: Master entities
      setStep(1, 'running')
      for (const cfg of MASTER_ENTITY_CONFIGS) {
        const a = await createArtifact({ entity_type: cfg.entity_type, payload: cfg.payload as Record<string, unknown> })
        createdArtifactIds.push(a.id)
        addLog(`Created entity: ${cfg.payload.displayName}`)
      }
      setStep(1, 'done')
      setProgress(35)

      // Step 2: Transaction entities
      setStep(2, 'running')
      for (const cfg of TRANSACTION_ENTITY_CONFIGS) {
        const a = await createArtifact({ entity_type: cfg.entity_type, payload: cfg.payload as Record<string, unknown> })
        createdArtifactIds.push(a.id)
        addLog(`Created entity: ${cfg.payload.displayName}`)
      }
      setStep(2, 'done')
      setProgress(50)

      // Step 3: Publish all
      setStep(3, 'running')
      for (const id of createdArtifactIds) {
        await publishArtifact(id)
      }
      addLog(`Published ${createdArtifactIds.length} entities`)
      setStep(3, 'done')
      setProgress(65)

      // Step 4: Overlays
      setStep(4, 'running')
      await createOverlay({ entity_type: 'entity_schema', layer: 'platform', artifact_type: 'entity_schema', artifact_key: 'sale_order', scope_key: 'global', delta: { settings: { auditRetentionDays: 2555, softDelete: true } } } as unknown as Parameters<typeof createOverlay>[0])
      addLog('Created overlay: Platform base (sale_order)')
      await createOverlay({ entity_type: 'entity_schema', layer: 'vertical', artifact_type: 'entity_schema', artifact_key: 'sale_order', scope_key: 'india-automobile', delta: { fields: { gstin: { required: true, label: 'Customer GSTIN (India GST)' }, placeOfSupply: { required: true, label: 'Place of Supply (State)' } }, settings: { currencyCode: 'INR', taxSystem: 'GST', verticalLabel: 'India Automobile' } } } as unknown as Parameters<typeof createOverlay>[0])
      addLog('Created overlay: India Automobile vertical (sale_order)')
      setStep(4, 'done')
      setProgress(80)

      // Step 5: Views
      setStep(5, 'running')
      for (const vCfg of VIEW_CONFIGS) {
        const v = await createView({ view_label: vCfg.view_label, surface_type: vCfg.surface_type, primary_entity: vCfg.primary_entity } as CreateViewRequest)
        const viewKey = v.artifact_id
        await saveDraft(viewKey, { payload: vCfg.payload as unknown as import('../../types/viewStudio').ViewPayload })
        await publishView(viewKey)
        addLog(`Created view: ${vCfg.view_label}`)
      }
      setStep(5, 'done')
      setProgress(100)

      setDone(true)
      success('Setup complete!', 'India Automobile Sales domain configured successfully. Navigate to Entity Designer, Nodes, Overlays, and UI Studio to see the results.')
    } catch (err) {
      const idx = statuses.findIndex(s => s === 'running')
      if (idx !== -1) { statuses[idx] = 'error'; setStepStatuses([...statuses]) }
      const msg = err instanceof Error ? err.message : String(err)
      addLog(`ERROR: ${msg}`)
      error('Setup failed', msg)
    } finally {
      setRunning(false)
    }
  }

  return (
    <PageLayout
      title="Demo Setup — India Automobile"
      subtitle="Automatically configure the full Vehicle Sales domain for India Automobile vertical"
      headerActions={
        <Button variant="secondary" onClick={handleReset} disabled={running}>
          <RotateCcw size={14} style={{ marginRight: 6 }} />
          Reset All Data
        </Button>
      }
    >
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary card */}
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-secondary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', marginBottom: 12 }}>
            This setup will create the complete India Automobile Sales domain:
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['5', 'Nodes'], ['17', 'Master Entities'], ['2', 'Transaction Entities'], ['2', 'Overlays'], ['5', 'UI Studio Views']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand-600)' }}>{n}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Run button */}
        <div>
          <Button variant="primary" onClick={runSetup} disabled={running || done} style={{ gap: 8 }}>
            {running ? <Spinner size={16} /> : <PlayCircle size={16} />}
            {running ? 'Setting up…' : done ? 'Setup Complete ✓' : 'Run Setup'}
          </Button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < STEPS.length - 1 ? '1px solid var(--border-subtle, rgba(0,0,0,0.06))' : 'none', background: stepStatuses[i] === 'running' ? 'var(--brand-50, #EFF6FF)' : 'var(--bg-primary)' }}>
              <StepIcon status={stepStatuses[i]} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>{step.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginLeft: 8 }}>{step.detail}</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: stepStatuses[i] === 'done' ? 'var(--success-500, #22C55E)' : stepStatuses[i] === 'error' ? 'var(--error-500, #EF4444)' : 'var(--fg-tertiary)', textTransform: 'uppercase' }}>
                {stepStatuses[i] === 'idle' ? 'Pending' : stepStatuses[i] === 'running' ? 'Running' : stepStatuses[i] === 'done' ? 'Done' : 'Error'}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {(running || progress > 0) && (
          <div>
            <ProgressBar value={progress} max={100} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 4, textAlign: 'right' }}>{progress}%</div>
          </div>
        )}

        {/* Log panel */}
        {logs.length > 0 && (
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Log</div>
            <div
              ref={logRef}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

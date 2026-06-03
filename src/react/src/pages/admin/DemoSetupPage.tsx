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

// ── View payload builders ──────────────────────────────────────────────────────

function fld(entity: string, field_key: string) {
  return { source: 'field' as const, entity, field_key }
}
function sta(static_value: unknown) {
  return { source: 'static' as const, static_value }
}
function inp(key: string, code: string, entity: string, fieldKey: string, label: string, extra: Record<string, unknown> = {}) {
  return { component_key: key, component_code: code, props: { label, ...extra }, bindings: { value: fld(entity, fieldKey) } }
}
function vrow(key: string, children: unknown[]) {
  return { component_key: key, component_code: 'Row', children }
}
function vcol(key: string, children: unknown[]) {
  return { component_key: key, component_code: 'Column', children }
}
function vsec(key: string, title: string, children: unknown[]) {
  return { component_key: key, component_code: 'Section', props: { title }, children }
}

const VIEW_CONFIGS = [
  // ── 1. Sale Orders — standard_crud list ───────────────────────────────────
  {
    view_label: 'Sale Orders',
    surface_type: 'standard_crud',
    primary_entity: 'sale_order',
    payload: {
      meta: { description: 'Sale Order list with search, filters, and actions', default_mode: 'view' },
      datasources: [{ source_key: 'so_list', base_entity: 'sale_order', pagination: { page_size: 25 }, sort: [{ field: 'documentDate', direction: 'desc' }] }],
      component_tree: {
        component_key: 'root', component_code: 'PageRoot',
        children: [
          { component_key: 'tb', component_code: 'Toolbar', children: [
            { component_key: 'btn-new-so', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Sale Order') } },
          ]},
          { component_key: 'fp-so', component_code: 'FilterPanel', bindings: { filters: sta([
            { field: 'documentDate', operator: 'gte', label: 'From Date', type: 'date' },
            { field: 'documentDate', operator: 'lte', label: 'To Date', type: 'date' },
            { field: 'status', label: 'Status', type: 'enum' },
            { field: 'customer', operator: 'contains', label: 'Customer', type: 'text' },
            { field: 'branch', label: 'Branch', type: 'text' },
            { field: 'paymentMode', label: 'Payment Mode', type: 'enum' },
          ]) }},
          { component_key: 'dt-so', component_code: 'DataTable',
            props: { columns: [
              { key: 'documentNumber', label: 'SO Number', sortable: true, width: 140 },
              { key: 'documentDate', label: 'Date', sortable: true, width: 110, type: 'date' },
              { key: 'customer', label: 'Customer', sortable: true },
              { key: 'branch', label: 'Branch', sortable: true, width: 130 },
              { key: 'salesExecutive', label: 'Sales Exec', width: 140 },
              { key: 'paymentMode', label: 'Payment', width: 100 },
              { key: 'netAmount', label: 'Net Amount', sortable: true, width: 120, type: 'currency', align: 'right' },
              { key: 'status', label: 'Status', width: 110, type: 'status' },
            ]},
            bindings: { data: fld('sale_order', '_list'), loading: fld('sale_order', '_loading') },
          },
        ],
      },
    },
  },

  // ── 2. Sale Order Editor — header_line (all 35 fields + line items) ────────
  {
    view_label: 'Sale Order Editor',
    surface_type: 'header_line',
    primary_entity: 'sale_order',
    payload: {
      meta: { description: 'Sale Order create/edit — all fields across collapsible sections', default_mode: 'edit' },
      datasources: [
        { source_key: 'so_record', base_entity: 'sale_order', pagination: { page_size: 1 } },
        { source_key: 'sol_list', base_entity: 'sale_order_line', pagination: { page_size: 50 } },
      ],
      component_tree: {
        component_key: 'root', component_code: 'PageRoot',
        children: [
          // Toolbar
          { component_key: 'tb-so', component_code: 'Toolbar', children: [
            { component_key: 'btn-save', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('Save Draft') } },
            { component_key: 'btn-submit', component_code: 'Button', props: { variant: 'secondary' }, bindings: { label: sta('Submit Order') } },
            { component_key: 'sb-status', component_code: 'StatusBadge', bindings: { status: fld('sale_order', 'status') } },
          ]},

          // Section 1 — Document Info (7 fields)
          vsec('sec-doc', 'Document Information', [
            vrow('r-doc-1', [
              vcol('c-doc-1', [inp('f-docno',   'TextInput',  'sale_order', 'documentNumber',  'Document Number',   { readOnly: true })]),
              vcol('c-doc-2', [inp('f-docdate',  'DatePicker', 'sale_order', 'documentDate',    'Document Date')]),
              vcol('c-doc-3', [inp('f-status',   'Label',      'sale_order', 'status',           'Status')]),
              vcol('c-doc-4', [inp('f-createdby','Label',      'sale_order', 'createdBy',        'Created By')]),
            ]),
            vrow('r-doc-2', [
              vcol('c-doc-5', [inp('f-org',   'ReferenceSelect', 'sale_order', 'organisation', 'Organisation', { entity: 'organisation' })]),
              vcol('c-doc-6', [inp('f-branch','ReferenceSelect', 'sale_order', 'branch',        'Branch',       { entity: 'branch' })]),
              vcol('c-doc-7', [inp('f-dept',  'ReferenceSelect', 'sale_order', 'department',    'Department',   { entity: 'department' })]),
            ]),
          ]),

          // Section 2 — Customer Details (8 fields)
          vsec('sec-cust', 'Customer Details', [
            vrow('r-cust-1', [
              vcol('c-cust-1', [inp('f-customer', 'ReferenceSelect', 'sale_order', 'customer',       'Customer *',        { entity: 'customer', required: true })]),
              vcol('c-cust-2', [inp('f-gstin',    'TextInput',       'sale_order', 'gstin',           'Customer GSTIN')]),
              vcol('c-cust-3', [inp('f-exec',     'ReferenceSelect', 'sale_order', 'salesExecutive', 'Sales Executive *', { entity: 'employee', required: true })]),
              vcol('c-cust-4', [inp('f-source',   'Dropdown',        'sale_order', 'orderSource',    'Order Source',      { options: ['WalkIn','Online','Referral','Exhibition','Campaign'] })]),
            ]),
            vrow('r-cust-2', [
              vcol('c-cust-5', [inp('f-priority', 'Dropdown',  'sale_order', 'priority',              'Priority',               { options: ['High','Medium','Low'] })]),
              vcol('c-cust-6', [inp('f-deldate',  'DatePicker','sale_order', 'requestedDeliveryDate', 'Requested Delivery Date')]),
              vcol('c-cust-7', [inp('f-validtill','DatePicker','sale_order', 'validTillDate',          'Valid Till Date')]),
              vcol('c-cust-8', [inp('f-pos',      'Dropdown',  'sale_order', 'placeOfSupply',         'Place of Supply',        { options: ['Maharashtra','Karnataka','TamilNadu','Delhi','Gujarat','Telangana','AndhraPradesh','WestBengal','Rajasthan','UttarPradesh'] })]),
            ]),
          ]),

          // Section 3 — Delivery (4 fields)
          vsec('sec-del', 'Delivery', [
            vrow('r-del-1', [
              vcol('c-del-1', [inp('f-delterm', 'ReferenceSelect', 'sale_order', 'deliveryTerm', 'Delivery Term', { entity: 'delivery_term' })]),
              vcol('c-del-2', [inp('f-deltype', 'ReferenceSelect', 'sale_order', 'deliveryType', 'Delivery Type', { entity: 'delivery_type' })]),
              vcol('c-del-3', [inp('f-delslot', 'ReferenceSelect', 'sale_order', 'deliverySlot', 'Delivery Slot', { entity: 'delivery_slot' })]),
            ]),
            vrow('r-del-2', [
              vcol('c-del-4', [inp('f-deladdr', 'Textarea', 'sale_order', 'deliveryAddress', 'Delivery Address', { rows: 3 })]),
            ]),
          ]),

          // Section 4 — Payment Details (3 fields)
          vsec('sec-pay', 'Payment Details', [
            vrow('r-pay-1', [
              vcol('c-pay-1', [inp('f-paymode',   'Dropdown',    'sale_order', 'paymentMode',   'Payment Mode *',   { options: ['Cash','Finance','Exchange'], required: true })]),
              vcol('c-pay-2', [inp('f-paymethod', 'Dropdown',    'sale_order', 'paymentMethod', 'Payment Method',   { options: ['Cheque','DD','NEFT','RTGS','UPI','Cash'] })]),
              vcol('c-pay-3', [inp('f-advance',   'NumberInput', 'sale_order', 'advancePayment','Advance Payment (₹)')]),
            ]),
          ]),

          // Section 5 — Finance (5 fields)
          vsec('sec-fin', 'Finance', [
            vrow('r-fin-1', [
              vcol('c-fin-1', [inp('f-financier', 'ReferenceSelect', 'sale_order', 'financier',     'Financier',       { entity: 'financier' })]),
              vcol('c-fin-2', [inp('f-downpay',   'NumberInput',     'sale_order', 'downPayment',   'Down Payment (₹)')]),
              vcol('c-fin-3', [inp('f-finamount', 'NumberInput',     'sale_order', 'financeAmount', 'Finance Amount (₹)')]),
            ]),
            vrow('r-fin-2', [
              vcol('c-fin-4', [inp('f-tenure',  'Dropdown',    'sale_order', 'tenure',         'Tenure (Months)', { options: ['12','24','36','48','60','72'] })]),
              vcol('c-fin-5', [inp('f-emirate', 'NumberInput', 'sale_order', 'emiInterestRate','EMI Interest Rate (%)')]),
            ]),
          ]),

          // Section 6 — Insurance (3 fields)
          vsec('sec-ins', 'Insurance', [
            vrow('r-ins-1', [
              vcol('c-ins-1', [inp('f-insprov',    'ReferenceSelect', 'sale_order', 'insuranceProvider',    'Insurance Provider', { entity: 'insurance_provider' })]),
              vcol('c-ins-2', [inp('f-inspolicy',  'TextInput',       'sale_order', 'insurancePolicyNumber','Policy Number')]),
              vcol('c-ins-3', [inp('f-insdate',    'DatePicker',      'sale_order', 'insurancePolicyDate',  'Policy Date')]),
            ]),
          ]),

          // Section 7 — Order Totals (4 computed read-only fields)
          vsec('sec-totals', 'Order Totals', [
            vrow('r-tot-1', [
              vcol('c-tot-1', [inp('f-totalqty',  'Label', 'sale_order', 'totalQuantity',   'Total Quantity')]),
              vcol('c-tot-2', [inp('f-totalbase', 'Label', 'sale_order', 'totalBaseAmount', 'Total Base Amount (₹)')]),
              vcol('c-tot-3', [inp('f-totaltax',  'Label', 'sale_order', 'totalTaxAmount',  'Total Tax Amount (₹)')]),
              vcol('c-tot-4', [inp('f-netamt',    'Label', 'sale_order', 'netAmount',       'Net Amount (₹)')]),
            ]),
          ]),

          // Section 8 — Internal Notes (2 fields)
          vsec('sec-int', 'Internal Notes', [
            vrow('r-int-1', [
              vcol('c-int-1', [inp('f-remarks',    'Textarea', 'sale_order', 'remarks',            'Remarks',             { rows: 3 })]),
              vcol('c-int-2', [inp('f-cancelrsn',  'Textarea', 'sale_order', 'cancellationReason', 'Cancellation Reason', { rows: 3 })]),
            ]),
          ]),

          // Section 9 — Order Lines (sale_order_line, 20 columns)
          vsec('sec-lines', 'Order Lines', [
            { component_key: 'dt-lines', component_code: 'DataTable',
              props: {
                addRowEnabled: true, deleteRowEnabled: true,
                columns: [
                  { key: 'lineNumber',     label: '#',            width: 50,  type: 'number',   align: 'right', readOnly: true },
                  { key: 'lineStatus',     label: 'Status',       width: 90,  type: 'status' },
                  { key: 'productCode',    label: 'Vehicle',      sortable: true },
                  { key: 'uom',            label: 'UOM',          width: 80 },
                  { key: 'orderQuantity',  label: 'Qty',          width: 80,  type: 'number',   align: 'right' },
                  { key: 'rate',           label: 'Rate (₹)',     width: 110, type: 'currency', align: 'right' },
                  { key: 'baseAmount',     label: 'Base Amt',     width: 120, type: 'currency', align: 'right', readOnly: true },
                  { key: 'discountPercent',label: 'Disc %',       width: 80,  type: 'number',   align: 'right' },
                  { key: 'discountAmount', label: 'Disc Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
                  { key: 'taxableAmount',  label: 'Taxable',      width: 120, type: 'currency', align: 'right', readOnly: true },
                  { key: 'cgstRate',       label: 'CGST%',        width: 75,  type: 'number',   align: 'right' },
                  { key: 'sgstRate',       label: 'SGST%',        width: 75,  type: 'number',   align: 'right' },
                  { key: 'igstRate',       label: 'IGST%',        width: 75,  type: 'number',   align: 'right' },
                  { key: 'cgstAmount',     label: 'CGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
                  { key: 'sgstAmount',     label: 'SGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
                  { key: 'igstAmount',     label: 'IGST Amt',     width: 110, type: 'currency', align: 'right', readOnly: true },
                  { key: 'lineAmount',     label: 'Line Total',   width: 130, type: 'currency', align: 'right', readOnly: true },
                  { key: 'cancelledQty',   label: 'Cancelled',    width: 90,  type: 'number',   align: 'right' },
                  { key: 'lineRemark',     label: 'Remark' },
                ],
              },
              bindings: {
                data: fld('sale_order_line', '_list'),
                loading: fld('sale_order_line', '_loading'),
              },
            },
          ]),
        ],
      },
    },
  },

  // ── 3. Customer Master — standard_crud list (20 fields) ───────────────────
  {
    view_label: 'Customer Master',
    surface_type: 'standard_crud',
    primary_entity: 'customer',
    payload: {
      meta: { description: 'Customer master list with full field exposure' },
      datasources: [{ source_key: 'cust_list', base_entity: 'customer', pagination: { page_size: 25 }, sort: [{ field: 'customerCode', direction: 'asc' }] }],
      component_tree: {
        component_key: 'root', component_code: 'PageRoot',
        children: [
          { component_key: 'tb-cust', component_code: 'Toolbar', children: [
            { component_key: 'btn-new-cust', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Customer') } },
          ]},
          { component_key: 'fp-cust', component_code: 'FilterPanel', bindings: { filters: sta([
            { field: 'customerCode',  operator: 'contains', label: 'Customer Code', type: 'text' },
            { field: 'firstName',     operator: 'contains', label: 'Name',          type: 'text' },
            { field: 'customerType',  label: 'Type',        type: 'enum' },
            { field: 'primaryPhone',  operator: 'contains', label: 'Phone',         type: 'text' },
            { field: 'billingCity',   operator: 'contains', label: 'City',          type: 'text' },
            { field: 'isActive',      label: 'Active',      type: 'boolean' },
          ]) }},
          { component_key: 'dt-cust', component_code: 'DataTable',
            props: { columns: [
              { key: 'customerCode',  label: 'Code',         sortable: true, width: 120 },
              { key: 'customerType',  label: 'Type',         width: 100,  type: 'enum' },
              { key: 'firstName',     label: 'First Name',   sortable: true },
              { key: 'lastName',      label: 'Last Name',    sortable: true },
              { key: 'companyName',   label: 'Company',      sortable: true },
              { key: 'email',         label: 'Email' },
              { key: 'primaryPhone',  label: 'Phone',        width: 130 },
              { key: 'gstin',         label: 'GSTIN',        width: 160 },
              { key: 'billingCity',   label: 'City',         width: 110 },
              { key: 'billingState',  label: 'State',        width: 100, type: 'enum' },
              { key: 'creditLimit',   label: 'Credit Limit', width: 120, type: 'currency', align: 'right' },
              { key: 'paymentTerm',   label: 'Pay Term',     width: 100 },
              { key: 'customerSource',label: 'Source',       width: 100, type: 'enum' },
              { key: 'isActive',      label: 'Active',       width: 80,  type: 'boolean' },
              { key: 'blacklisted',   label: 'Blacklisted',  width: 95,  type: 'boolean' },
            ]},
            bindings: {
              data: fld('customer', '_list'),
              loading: fld('customer', '_loading'),
            },
          },
        ],
      },
    },
  },

  // ── 4. Vehicle Catalog — standard_crud list (15 fields) ───────────────────
  {
    view_label: 'Vehicle Catalog',
    surface_type: 'standard_crud',
    primary_entity: 'vehicle',
    payload: {
      meta: { description: 'Vehicle / Product master catalog' },
      datasources: [{ source_key: 'veh_list', base_entity: 'vehicle', pagination: { page_size: 25 }, sort: [{ field: 'modelName', direction: 'asc' }] }],
      component_tree: {
        component_key: 'root', component_code: 'PageRoot',
        children: [
          { component_key: 'tb-veh', component_code: 'Toolbar', children: [
            { component_key: 'btn-new-veh', component_code: 'Button', props: { variant: 'primary' }, bindings: { label: sta('New Vehicle') } },
          ]},
          { component_key: 'fp-veh', component_code: 'FilterPanel', bindings: { filters: sta([
            { field: 'manufacturer', operator: 'contains', label: 'Manufacturer', type: 'text' },
            { field: 'modelName',    operator: 'contains', label: 'Model',        type: 'text' },
            { field: 'fuelType',     label: 'Fuel Type',   type: 'enum' },
            { field: 'bodyStyle',    label: 'Body Style',  type: 'enum' },
            { field: 'color',        label: 'Color',       type: 'enum' },
            { field: 'isActive',     label: 'Active',      type: 'boolean' },
          ]) }},
          { component_key: 'dt-veh', component_code: 'DataTable',
            props: { columns: [
              { key: 'vehicleCode',       label: 'Code',         sortable: true, width: 120 },
              { key: 'manufacturer',      label: 'Manufacturer', sortable: true, width: 130 },
              { key: 'modelName',         label: 'Model',        sortable: true },
              { key: 'variant',           label: 'Variant',      sortable: true },
              { key: 'fuelType',          label: 'Fuel',         width: 90,  type: 'enum' },
              { key: 'transmissionType',  label: 'Trans.',       width: 90,  type: 'enum' },
              { key: 'bodyStyle',         label: 'Body',         width: 90,  type: 'enum' },
              { key: 'color',             label: 'Color',        width: 90,  type: 'enum' },
              { key: 'basePrice',         label: 'Base Price',   sortable: true, width: 120, type: 'currency', align: 'right' },
              { key: 'mrp',               label: 'MRP',          width: 110, type: 'currency', align: 'right' },
              { key: 'hsnCode',           label: 'HSN',          width: 100 },
              { key: 'taxCategory',       label: 'Tax Category', width: 120 },
              { key: 'stockQty',          label: 'Stock',        width: 80,  type: 'number',  align: 'right' },
              { key: 'isActive',          label: 'Active',       width: 80,  type: 'boolean' },
            ]},
            bindings: {
              data: fld('vehicle', '_list'),
              loading: fld('vehicle', '_loading'),
            },
          },
        ],
      },
    },
  },

  // ── 5. Sales Dashboard ─────────────────────────────────────────────────────
  {
    view_label: 'Sales Dashboard',
    surface_type: 'dashboard',
    primary_entity: '',
    payload: {
      meta: { description: 'India Automobile — Sales Overview Dashboard' },
      datasources: [
        { source_key: 'so_recent', base_entity: 'sale_order',  pagination: { page_size: 10 }, sort: [{ field: 'documentDate', direction: 'desc' }] },
        { source_key: 'veh_lowstock', base_entity: 'vehicle',  pagination: { page_size: 8  }, sort: [{ field: 'stockQty', direction: 'asc' }] },
      ],
      component_tree: {
        component_key: 'root', component_code: 'PageRoot',
        children: [
          // KPI metrics row
          vrow('r-kpi', [
            vcol('c-kpi-1', [{ component_key: 'm-orders',  component_code: 'MetricComparison', props: { label: "Today's Orders" },         bindings: { value: fld('sale_order', '_count_today'),          comparison: sta('vs yesterday') } }]),
            vcol('c-kpi-2', [{ component_key: 'm-revenue', component_code: 'MetricComparison', props: { label: 'Month Revenue (₹)' },       bindings: { value: fld('sale_order', '_sum_netAmount_month'),  comparison: sta('vs last month') } }]),
            vcol('c-kpi-3', [{ component_key: 'm-open',    component_code: 'MetricComparison', props: { label: 'Open Orders' },             bindings: { value: fld('sale_order', '_count_open'),           trend: sta('neutral') } }]),
            vcol('c-kpi-4', [{ component_key: 'm-cust',    component_code: 'MetricComparison', props: { label: 'Active Customers' },        bindings: { value: fld('customer',   '_count_active'),         trend: sta('up') } }]),
          ]),
          // Data row: recent orders + low stock alerts
          vrow('r-data', [
            vcol('c-data-1', [
              { component_key: 'dt-recent-so', component_code: 'DataTable',
                props: { title: 'Recent Sale Orders', columns: [
                  { key: 'documentNumber', label: 'SO#',     width: 130 },
                  { key: 'documentDate',   label: 'Date',    width: 100, type: 'date' },
                  { key: 'customer',       label: 'Customer' },
                  { key: 'salesExecutive', label: 'Sales Exec', width: 140 },
                  { key: 'paymentMode',    label: 'Payment',    width: 100 },
                  { key: 'netAmount',      label: 'Amount',     width: 120, type: 'currency', align: 'right' },
                  { key: 'status',         label: 'Status',     width: 110, type: 'status' },
                ]},
                bindings: { data: fld('sale_order', '_list'), loading: fld('sale_order', '_loading') },
              },
            ]),
            vcol('c-data-2', [
              { component_key: 'dg-lowstock', component_code: 'DataCardGrid',
                props: { title: 'Low Stock Alert', cardFields: [
                  { key: 'modelName',    label: 'Model' },
                  { key: 'fuelType',     label: 'Fuel' },
                  { key: 'color',        label: 'Color' },
                  { key: 'stockQty',     label: 'Stock', type: 'number' },
                ]},
                bindings: { data: fld('vehicle', '_list'), loading: fld('vehicle', '_loading') },
              },
            ]),
          ]),
        ],
      },
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

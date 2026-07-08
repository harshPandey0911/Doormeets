import React, { useState, useEffect } from 'react';
import RoomConfiguration from './RoomConfiguration';
import QuoteApproval from './QuoteApproval';
import { getMyConsultations } from '../../services/paintingConsultationService';
import { motion } from 'framer-motion';
import { FiZap, FiCalendar, FiNavigation, FiTool, FiCheck, FiClock } from 'react-icons/fi';

// ─── Status config for tracking cards ────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    label: 'Finding Vendors',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
    icon: <FiClock className="text-amber-500" />,
    pulse: true,
    desc: 'We\'re notifying vendors near you.'
  },
  ACCEPTED_BY_VENDOR: {
    label: 'Vendor Assigned',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: <FiCheck className="text-blue-500" />,
    pulse: false,
    desc: 'A vendor has accepted your request.'
  },
  VENDOR_EN_ROUTE: {
    label: 'Vendor On The Way!',
    color: 'indigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    textColor: 'text-indigo-700',
    icon: <FiNavigation className="text-indigo-500" />,
    pulse: true,
    desc: 'Your vendor is heading to your location.'
  },
  INSPECTION_IN_PROGRESS: {
    label: 'Inspection Underway',
    color: 'orange',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    textColor: 'text-orange-700',
    icon: <FiTool className="text-orange-500" />,
    pulse: true,
    desc: 'The vendor is at your property doing the inspection.'
  },
};

const TrackingCard = ({ consultation }) => {
  const status = consultation.status;
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const vendor = consultation.vendorId;
  const bookingType = consultation.bookingType;
  const slot = consultation.scheduledSlot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-4 ${config.bg} ${config.border} space-y-3`}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {config.pulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-${config.color}-400`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-${config.color}-500`}></span>
            </span>
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${config.textColor}`}>{config.label}</span>
        </div>
        {/* Booking type badge */}
        {bookingType === 'SCHEDULED' && slot?.timeSlot ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
            <FiCalendar className="text-xs" /> {slot.timeSlot}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
            <FiZap className="text-xs" /> Instant
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600">{config.desc}</p>

      {/* Vendor Info (shown when vendor is assigned) */}
      {vendor && ['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE', 'INSPECTION_IN_PROGRESS'].includes(status) && (
        <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-500 font-bold text-sm">
                {(vendor.name || 'V')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{vendor.businessName || vendor.name}</p>
              <p className="text-xs text-gray-500">{vendor.phone || 'Vendor'}</p>
            </div>
          </div>
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center"
            >
              <span className="text-green-600">📞</span>
            </a>
          )}
        </div>
      )}

      {/* Property */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>🏠</span>
        <span>{consultation.propertyType} · {consultation.address?.fullAddress || consultation.address?.city || 'Your property'}</span>
      </div>
    </motion.div>
  );
};

const PaintingConsultation = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await getMyConsultations();
      if (data.success) {
        setConsultations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const pendingQuotes = consultations.filter(c => c.status === 'QUOTE_GENERATED');
  const activeConsultations = consultations.filter(c =>
    ['PENDING', 'ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE', 'INSPECTION_IN_PROGRESS'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] pt-16 pb-24">

      {/* Quote Approvals */}
      {pendingQuotes.length > 0 && (
        <div className="px-4 mb-6 max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Quotes Awaiting Your Decision
          </h2>
          {pendingQuotes.map(consultation => (
            <QuoteApproval
              key={consultation._id}
              consultation={consultation}
              onActionComplete={fetchConsultations}
            />
          ))}
        </div>
      )}

      {/* Room configuration — new consultation request */}
      <RoomConfiguration onSuccess={fetchConsultations} />
    </div>
  );
};

export default PaintingConsultation;

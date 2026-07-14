import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus, FiStar, FiCalendar, FiX } from 'react-icons/fi';
import { toAssetUrl } from './cartUtils';

/* ── helper: compute visit dates from workflow steps ─────────── */
const computeVisitDates = (workflow) => {
  if (!workflow?.steps?.length) return [];
  const today = new Date();
  let cumulativeDays = 0;

  return workflow.steps
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((step, idx) => {
      cumulativeDays += step.daysAfterPreviousVisit || 0;
      const visitDate = new Date(today);
      visitDate.setDate(today.getDate() + cumulativeDays);
      return {
        sequence: idx + 1,
        title: step.title,
        date: visitDate,
        daysOffset: cumulativeDays,
        isToday: cumulativeDays === 0
      };
    });
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
/* ─────────────────────────────────────────────────────────────── */

const ServiceCard = ({ service, quantity = 0, onAdd, onIncrease, onDecrease, onOpen }) => {
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={() => onOpen?.(service)}
      className="rounded-xl border p-4 shadow-[0_4px_20px_rgba(17,24,39,0.02)] transition-all cursor-pointer flex justify-between items-center gap-4"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Left side details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-sm font-semibold tracking-tight leading-snug line-clamp-1" style={{ color: 'var(--text-primary)' }}>
            {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
          </h3>

          <div className="flex items-center gap-1 mt-0.5 text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-0.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
              <FiStar className="w-3 h-3" style={{ fill: 'var(--text-secondary)', color: 'var(--text-secondary)' }} />
              {service.rating || 4.5}
            </span>
            <span>({service.reviews || '1.2k'} reviews)</span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ₹{service.price}
            </span>
            {service.originalPrice && (
              <span className="text-xs line-through font-normal" style={{ color: 'var(--text-muted)' }}>₹{service.originalPrice}</span>
            )}
          </div>
        </div>

        {/* Divider and description */}
        <div className="mt-2.5">
          <div className="border-t w-full my-1.5" style={{ borderColor: 'var(--border)' }} />
          <p className="text-[11px] leading-relaxed line-clamp-2 font-normal mb-2" style={{ color: 'var(--text-secondary)' }}>
            {service.description}
          </p>

          {/* Multi-Visit Schedule Timeline */}
          {service.serviceType === 'multi_visit' && service.workflow?.steps?.length > 0 && (() => {
            const visits = computeVisitDates(service.workflow);
            if (!visits.length) return null;
            return (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVisitsModal(true);
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-100/50 dark:border-indigo-900/30 hover:bg-indigo-100/50 transition-all cursor-pointer"
                >
                  <FiCalendar className="w-3 h-3" />
                  <span>{visits.length} Scheduled Visits</span>
                </button>

                {showVisitsModal && (
                  <div 
                    className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVisitsModal(false);
                    }}
                  >
                    <div 
                      className="bg-white dark:bg-zinc-900 rounded-3xl p-5 w-full max-w-sm shadow-xl space-y-4 border dark:border-zinc-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center border-b pb-2 dark:border-zinc-800">
                        <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <FiCalendar className="w-4 h-4 text-indigo-500" /> {visits.length} Scheduled Visits
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowVisitsModal(false)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3 py-1">
                        {visits.map((v, i) => (
                          <div key={i} className="flex gap-3 items-start p-2.5 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <div className="font-bold text-slate-800 dark:text-zinc-200">Visit {v.sequence}</div>
                              <div className="text-gray-400 mt-0.5">
                                {v.daysOffset === 0 ? 'Today' : `After ${v.daysOffset} days`} ({formatDate(v.date)})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Right side image + absolute button */}
      <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-visible">
        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border" style={{ borderColor: 'var(--border)' }}>
          {service.image || service.icon || service.iconUrl ? (
            <img src={toAssetUrl(service.image || service.icon || service.iconUrl)} alt={service.title} className="h-full w-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-zinc-700" />
          )}
        </div>

        {/* Absolute Add Button centered at the bottom overlap */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[72px] h-[28px] z-10">
          {quantity > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full bg-white dark:bg-zinc-900 border border-violet-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-white font-bold text-xs shadow-md flex items-center justify-between px-1.5"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrease(service);
                }}
                className="w-5 h-5 hover:bg-violet-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-sm"
              >
                -
              </button>
              <span className="font-extrabold text-[11px]">{quantity}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrease(service);
                }}
                className="w-5 h-5 hover:bg-violet-100 dark:hover:bg-zinc-800 rounded-full flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(service);
              }}
              className="w-full h-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-0.5"
              style={{ color: '#B33A35' }}
            >
              <span>Add</span>
              <span className="text-[10px] font-semibold">+</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ServiceCard;

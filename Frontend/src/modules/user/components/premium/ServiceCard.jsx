import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMinus, FiStar, FiCalendar } from 'react-icons/fi';
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
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>₹{service.price}</span>
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
              <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-[10px] space-y-1.5">
                <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  <span>{visits.length} Scheduled Visits</span>
                </div>
                <div className="space-y-1">
                  {visits.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">
                        Visit {v.sequence}:
                      </span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {v.daysOffset === 0 ? 'Today' : `After ${v.daysOffset} days`} ({formatDate(v.date)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

        {/* Add/Quantity Button positioned on bottom center of image */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[85%] z-10" onClick={(e) => e.stopPropagation()}>
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg px-1 py-0.5 shadow-md">
              <button 
                type="button" 
                onClick={() => onDecrease?.(service)} 
                className="p-0.5 rounded text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <FiMinus className="w-2.5 h-2.5" />
              </button>
              <span className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300">
                Added ({quantity})
              </span>
              <button 
                type="button" 
                onClick={() => onIncrease?.(service)} 
                className="p-0.5 rounded text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <FiPlus className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => onAdd?.(service, e)}
              className="w-full py-1 bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-extrabold shadow-md hover:scale-[1.02] active:scale-95 transition-all text-center"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ServiceCard;

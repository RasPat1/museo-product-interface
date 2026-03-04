import { Exhibit } from '../types';
import { useCuration } from '../context/CurationContext';
import { museums } from '../data/museums';
import { CalendarPlus, CalendarCheck, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { isLeavingSoon } from '../utils/exhibitHelpers';

interface ExhibitCardProps {
  exhibit: Exhibit;
}

export function ExhibitCard({ exhibit }: ExhibitCardProps) {
  const { isExhibitInterested, toggleExhibit } = useCuration();
  const interested = isExhibitInterested(exhibit.id);
  const museum = museums.find(m => m.id === exhibit.museumId);

  const startDate = exhibit.startDate ? format(new Date(exhibit.startDate), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy');
  const endDate = exhibit.endDate ? format(new Date(exhibit.endDate), 'MMM d, yyyy') : null;
  const leavingSoon = isLeavingSoon(exhibit.endDate);

  return (
    <motion.div
      className="group overflow-hidden rounded-lg ring-1 ring-black/10 hover:ring-black/20 transition-all bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="aspect-[16/10] overflow-hidden relative">
        <img
          src={exhibit.imageUrl}
          alt={exhibit.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {leavingSoon && (
          <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-amber-600 text-white text-[11px] font-medium tracking-wide">
            Leaving soon
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="mb-3 inline-block rounded-full bg-black/5 px-3 py-1 text-xs">
          {exhibit.category}
        </div>
        
        <h3 className="mb-3">{exhibit.title}</h3>
        
        <p className="text-sm text-black/60 mb-4 line-clamp-3">
          {exhibit.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-black/60">
            <MapPin className="w-4 h-4" />
            <span>{museum?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-black/60">
            <Calendar className="w-4 h-4" />
            <span>{endDate ? `${startDate} – ${endDate}` : `From ${startDate}`}</span>
          </div>
        </div>

        {exhibit.url && (
          <a
            href={exhibit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors"
          >
            View exhibit page
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        <button
          onClick={() => toggleExhibit(exhibit.id)}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
            interested
              ? 'bg-black/5 text-black/70 hover:bg-black/10'
              : 'bg-black text-white hover:bg-black/90'
          }`}
        >
          {interested ? (
            <>
              <CalendarCheck className="w-4 h-4" />
              Remove from Calendar
            </>
          ) : (
            <>
              <CalendarPlus className="w-4 h-4" />
              Add to Calendar
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

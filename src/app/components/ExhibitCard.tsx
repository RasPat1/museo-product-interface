import { Exhibit } from '../types';
import { useCuration } from '../context/CurationContext';
import { museums } from '../data/museums';
import { Heart, MapPin, Calendar, ExternalLink } from 'lucide-react';
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

  const startDate = format(new Date(exhibit.startDate), 'MMM d, yyyy');
  const endDate = format(new Date(exhibit.endDate), 'MMM d, yyyy');
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
        <button
          onClick={() => toggleExhibit(exhibit.id)}
          className={`absolute top-4 right-4 w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            interested
              ? 'bg-black text-white'
              : 'bg-white/80 text-black hover:bg-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${interested ? 'fill-current' : ''}`} />
        </button>
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
            <span>{startDate} – {endDate}</span>
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
      </div>
    </motion.div>
  );
}

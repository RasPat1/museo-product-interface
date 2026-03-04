import { useNavigate } from 'react-router';
import { useCuration } from '../context/CurationContext';
import { exhibits } from '../data/exhibits';
import { museums } from '../data/museums';
import { ExhibitCard } from '../components/ExhibitCard';
import { ArrowLeft, Calendar, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Exhibits() {
  const navigate = useNavigate();
  const { curationState, isMuseumSelected } = useCuration();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter exhibits by selected museums
  const filteredExhibits = exhibits.filter(exhibit =>
    isMuseumSelected(exhibit.museumId)
  );

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(filteredExhibits.map(e => e.category)))];

  // Apply category filter
  const displayedExhibits = categoryFilter === 'all'
    ? filteredExhibits
    : filteredExhibits.filter(e => e.category === categoryFilter);

  const interestedCount = curationState.interestedExhibits.length;

  if (curationState.selectedMuseums.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="mb-1">Browse Exhibits</h1>
                <p className="text-sm text-black/60">
                  {displayedExhibits.length} exhibit{displayedExhibits.length !== 1 ? 's' : ''} from {curationState.selectedMuseums.length} museum{curationState.selectedMuseums.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {interestedCount > 0 && (
              <motion.button
                onClick={() => navigate('/calendar')}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-black/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calendar className="w-4 h-4" />
                Generate Calendar ({interestedCount})
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filter Bar */}
        <div className="mb-8 flex items-center gap-3">
          <Filter className="w-5 h-5 text-black/40" />
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  categoryFilter === category
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Exhibits Grid */}
        {displayedExhibits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedExhibits.map((exhibit) => (
              <ExhibitCard key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-black/40">No exhibits found in this category.</p>
          </div>
        )}

        {/* Bottom hint */}
        {interestedCount === 0 && displayedExhibits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-black/40 text-sm">
              Click the heart icon to mark exhibits you're interested in
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

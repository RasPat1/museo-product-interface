import { useNavigate } from 'react-router';
import { useCuration } from '../context/CurationContext';
import { exhibits } from '../data/exhibits';
import { museums } from '../data/museums';
import { ExhibitCard } from '../components/ExhibitCard';
import { ArrowLeft, Calendar, Filter, Landmark, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { sortByClosingSoonest, getMuseumIdsFromExhibits } from '../utils/exhibitHelpers';

export function Exhibits() {
  const navigate = useNavigate();
  const { curationState, isMuseumSelected } = useCuration();
  const [museumFilter, setMuseumFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter exhibits by selected museums from home page
  const filteredExhibits = exhibits.filter(exhibit =>
    isMuseumSelected(exhibit.museumId)
  );

  // Derive museum list dynamically from available exhibits
  const museumIds = getMuseumIdsFromExhibits(filteredExhibits);

  // Apply museum filter
  const museumFiltered = museumFilter === 'all'
    ? filteredExhibits
    : filteredExhibits.filter(e => e.museumId === museumFilter);

  // Get unique categories from museum-filtered exhibits
  const categories = ['all', ...Array.from(new Set(museumFiltered.map(e => e.category)))];

  // Reset category filter if current selection is no longer available
  if (categoryFilter !== 'all' && !categories.includes(categoryFilter)) {
    setCategoryFilter('all');
  }

  // Apply category filter, then sort by closing soonest first
  const displayedExhibits = sortByClosingSoonest(
    categoryFilter === 'all'
      ? museumFiltered
      : museumFiltered.filter(e => e.category === categoryFilter)
  );

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
                  {exhibits.length} exhibit{exhibits.length !== 1 ? 's' : ''} from {museums.length} museum{museums.length !== 1 ? 's' : ''}
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
        {filteredExhibits.length === 0 ? (
          /* Zero-state: museums selected but no exhibits available */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-black/30" />
            </div>
            <h3 className="text-xl font-medium mb-3">No exhibits yet</h3>
            <p className="text-black/50 mb-8">
              We're still gathering exhibit information for these museums. Check back soon or explore another city.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-black/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to cities
            </button>
          </motion.div>
        ) : (
          <>
            {/* Museum Filter */}
            {museumIds.length > 1 && (
              <div className="mb-4 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-black/40 shrink-0" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setMuseumFilter('all'); setCategoryFilter('all'); }}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      museumFilter === 'all'
                        ? 'bg-black text-white'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    All Museums
                  </button>
                  {museumIds.map(id => {
                    const museum = museums.find(m => m.id === id);
                    return (
                      <button
                        key={id}
                        onClick={() => { setMuseumFilter(id); setCategoryFilter('all'); }}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          museumFilter === id
                            ? 'bg-black text-white'
                            : 'bg-black/5 text-black/70 hover:bg-black/10'
                        }`}
                      >
                        {museum?.name ?? id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="mb-8 flex items-center gap-3">
              <Filter className="w-5 h-5 text-black/40 shrink-0" />
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
          </>
        )}
      </div>
    </div>
  );
}

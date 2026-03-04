import { useNavigate } from 'react-router';
import { useCuration } from '../context/CurationContext';
import { museums } from '../data/museums';
import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { getCitiesFromMuseums, getMuseumIdsByCity } from '../utils/museumHelpers';

const CITY_META: Record<string, { label: string; image: string }> = {
  'los-angeles': {
    label: 'Los Angeles',
    image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?auto=format&fit=crop&w=1200&q=80',
  },
  'new-york': {
    label: 'New York',
    image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
  },
};

function cityLabel(slug: string): string {
  return CITY_META[slug]?.label ?? slug;
}

function cityImage(slug: string): string | undefined {
  return CITY_META[slug]?.image;
}

export function Home() {
  const navigate = useNavigate();
  const { selectMuseums } = useCuration();

  const cities = getCitiesFromMuseums(museums);

  const handleCityClick = (city: string) => {
    const ids = getMuseumIdsByCity(museums, city);
    selectMuseums(ids);
    navigate('/exhibits');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="mb-1">Museo</h1>
            <p className="text-sm text-black/60">
              Discover, curate, and calendar museum exhibits
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="mb-4">Choose Your City</h2>
          <p className="text-lg text-black/60">
            Pick a city to explore current and upcoming museum exhibits worth visiting.
          </p>
        </motion.div>

        {/* City Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {cities.map((city) => {
            const count = getMuseumIdsByCity(museums, city).length;
            return (
              <motion.button
                key={city}
                onClick={() => handleCityClick(city)}
                className="group text-left overflow-hidden rounded-2xl ring-1 ring-black/10 hover:ring-black/20 transition-all cursor-pointer relative"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  {cityImage(city) ? (
                    <img
                      src={cityImage(city)}
                      alt={cityLabel(city)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="inline-block rounded-xl bg-black/60 backdrop-blur-sm px-6 py-4">
                      <div className="flex items-center gap-2 text-white/70 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{count} museum{count !== 1 ? 's' : ''}</span>
                      </div>
                      <h3 className="text-2xl font-medium text-white">{cityLabel(city)}</h3>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}

import { useNavigate } from 'react-router';
import { useCuration } from '../context/CurationContext';
import { museums } from '../data/museums';
import { MuseumCard } from '../components/MuseumCard';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  const navigate = useNavigate();
  const { curationState } = useCuration();
  const selectedCount = curationState.selectedMuseums.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1">Museo</h1>
              <p className="text-sm text-black/60">
                Discover, curate, and calendar museum exhibits
              </p>
            </div>
            {selectedCount > 0 && (
              <motion.button
                onClick={() => navigate('/exhibits')}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-black/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Continue with {selectedCount} museum{selectedCount !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
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
          <h2 className="mb-4">Choose Your Museums</h2>
          <p className="text-lg text-black/60">
            Select the museums you care about in Los Angeles. We'll show you current and upcoming exhibits worth visiting.
          </p>
        </motion.div>

        {/* Museum Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {museums.map((museum, index) => (
            <motion.div
              key={museum.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <MuseumCard museum={museum} />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        {selectedCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-black/40 text-sm">
              Select one or more museums to get started
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}

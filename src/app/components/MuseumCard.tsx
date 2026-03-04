import { Museum } from '../types';
import { useCuration } from '../context/CurationContext';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface MuseumCardProps {
  museum: Museum;
}

export function MuseumCard({ museum }: MuseumCardProps) {
  const { isMuseumSelected, toggleMuseum } = useCuration();
  const selected = isMuseumSelected(museum.id);

  return (
    <motion.button
      onClick={() => toggleMuseum(museum.id)}
      className={`group relative overflow-hidden rounded-lg transition-all ${
        selected ? 'ring-2 ring-black' : 'ring-1 ring-black/10 hover:ring-black/30'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={museum.imageUrl}
          alt={museum.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="mb-2 inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs">
          {museum.category}
        </div>
        <h3 className="mb-2">{museum.name}</h3>
        <p className="text-sm text-white/80">{museum.location}</p>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"
        >
          <Check className="w-5 h-5" />
        </motion.div>
      )}
    </motion.button>
  );
}

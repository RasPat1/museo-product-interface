import { useNavigate } from 'react-router';
import { useCuration } from '../context/CurationContext';
import { exhibits } from '../data/exhibits';
import { museums } from '../data/museums';
import { generateICS, downloadICS } from '../utils/icsGenerator';
import { ArrowLeft, Download, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useState } from 'react';

export function CalendarPage() {
  const navigate = useNavigate();
  const { curationState } = useCuration();
  const [downloaded, setDownloaded] = useState(false);

  const interestedExhibits = exhibits.filter(exhibit =>
    curationState.interestedExhibits.includes(exhibit.id)
  );

  if (interestedExhibits.length === 0) {
    navigate('/exhibits');
    return null;
  }

  const handleDownload = () => {
    const icsContent = generateICS(interestedExhibits);
    downloadICS(icsContent);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyInstructions = () => {
    // In a real app, this would copy a hosted URL
    const instructions = `1. Download the .ics file
2. Open Google Calendar (calendar.google.com)
3. Click the + next to "Other calendars"
4. Select "Import"
5. Choose the downloaded .ics file
6. Select which calendar to add events to
7. Click "Import"`;
    
    navigator.clipboard.writeText(instructions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/exhibits')}
              className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="mb-1">Your Calendar</h1>
              <p className="text-sm text-black/60">
                {interestedExhibits.length} exhibit{interestedExhibits.length !== 1 ? 's' : ''} ready to export
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 mb-8 ring-1 ring-black/10"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-black to-black/80 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="mb-2">Export to Google Calendar</h2>
              <p className="text-black/60 mb-6">
                Download your curated exhibit calendar as an .ics file and import it into Google Calendar. All exhibit dates and details will be added automatically.
              </p>
              <motion.button
                onClick={handleDownload}
                className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${
                  downloaded
                    ? 'bg-green-600 text-white'
                    : 'bg-black text-white hover:bg-black/90'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download .ics File
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-8"
        >
          <h3 className="mb-4">How to Import to Google Calendar</h3>
          <ol className="space-y-3 text-sm text-black/70">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>
              <span>Download the .ics file using the button above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
              <span>Open <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Calendar</a></span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">3</span>
              <span>Click the <strong>+</strong> next to "Other calendars" in the left sidebar</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">4</span>
              <span>Select "Import" from the menu</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">5</span>
              <span>Choose the downloaded .ics file and click "Import"</span>
            </li>
          </ol>
          <a
            href="https://support.google.com/calendar/answer/37118"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 text-sm text-black/60 hover:text-black transition-colors"
          >
            View Google's import guide
            <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Exhibit List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-4">Selected Exhibits</h3>
          <div className="space-y-3">
            {interestedExhibits.map((exhibit, index) => {
              const museum = museums.find(m => m.id === exhibit.museumId);
              const startDate = format(new Date(exhibit.startDate), 'MMM d, yyyy');
              const endDate = format(new Date(exhibit.endDate), 'MMM d, yyyy');

              return (
                <motion.div
                  key={exhibit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-white rounded-lg p-4 ring-1 ring-black/10"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={exhibit.imageUrl}
                        alt={exhibit.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="mb-1 text-sm">{exhibit.title}</h4>
                      <p className="text-xs text-black/60 mb-2">{museum?.name}</p>
                      <p className="text-xs text-black/40">
                        {startDate} – {endDate}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

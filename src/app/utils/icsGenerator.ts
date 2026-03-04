import { Exhibit } from '../types';
import { museums } from '../data/museums';

export function generateICS(exhibits: Exhibit[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Museo//Museum Exhibits Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Museo - Interesting Exhibits',
    'X-WR-CALDESC:Curated museum exhibits from Museo',
  ].join('\r\n');

  exhibits.forEach((exhibit) => {
    const museum = museums.find(m => m.id === exhibit.museumId);
    if (!museum) return;

    // Skip exhibits with no dates at all
    if (!exhibit.startDate && !exhibit.endDate) return;

    // Use today (local) for missing start dates (exhibit is already open)
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}${m}${d}`;
    const startDate = exhibit.startDate ? exhibit.startDate.replace(/-/g, '') : today;
    const endDate = exhibit.endDate ? exhibit.endDate.replace(/-/g, '') : exhibit.startDate.replace(/-/g, '');

    // Create a unique UID for each event
    const uid = `${exhibit.id}@museo.app`;
    const tz = museum.timezone;

    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `X-MUSEUM-TIMEZONE:${tz}`,
      `SUMMARY:${exhibit.title}`,
      `LOCATION:${museum.name}, ${museum.location}`,
      `DESCRIPTION:${exhibit.description}\\n\\nMuseum: ${museum.name}\\nCategory: ${exhibit.category}${exhibit.url ? `\\nMore info: ${exhibit.url}` : ''}`,
      ...(exhibit.url ? [`URL:${exhibit.url}`] : []),
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ].join('\r\n');
    
    icsContent += event;
  });

  icsContent += '\r\nEND:VCALENDAR';
  
  return icsContent;
}

export function downloadICS(content: string, filename: string = 'museo-exhibits.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

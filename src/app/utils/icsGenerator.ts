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
    'X-WR-TIMEZONE:America/Los_Angeles',
    'X-WR-CALDESC:Curated museum exhibits from Museo',
  ].join('\r\n');

  exhibits.forEach((exhibit) => {
    const museum = museums.find(m => m.id === exhibit.museumId);
    if (!museum) return;

    const startDate = exhibit.startDate.replace(/-/g, '');
    const endDate = exhibit.endDate.replace(/-/g, '');
    
    // Create a unique UID for each event
    const uid = `${exhibit.id}@museo.app`;
    
    const event = [
      '',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${exhibit.title}`,
      `LOCATION:${museum.name}, ${museum.location}`,
      `DESCRIPTION:${exhibit.description}\\n\\nMuseum: ${museum.name}\\nCategory: ${exhibit.category}`,
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

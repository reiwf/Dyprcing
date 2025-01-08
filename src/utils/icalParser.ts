import ICAL from 'ical.js';

export interface ICalEvent {
  startDate: Date;
  endDate: Date;
}

export async function parseICalFeed(icalUrl: string): Promise<ICalEvent[]> {
  try {
    // Add CORS proxy for development
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const response = await fetch(proxyUrl + icalUrl, {
      headers: {
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    return vevents.map(vevent => {
      const event = new ICAL.Event(vevent);
      return {
        startDate: event.startDate.toJSDate(),
        endDate: event.endDate.toJSDate()
      };
    });
  } catch (error) {
    console.error('Error parsing iCal feed:', error);
    throw new Error('Failed to parse calendar data');
  }
}

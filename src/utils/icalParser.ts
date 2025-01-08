import ICAL from 'ical.js';

export interface ICalEvent {
  startDate: Date;
  endDate: Date;
}

export async function parseICalFeed(icalData: string): Promise<ICalEvent[]> {
  try {
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
    console.error('Error parsing iCal data:', error);
    throw new Error('Failed to parse calendar data');
  }
}

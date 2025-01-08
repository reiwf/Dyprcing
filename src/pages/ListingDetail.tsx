import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { supabase, type Listing, type Reservation } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { parseICalFeed, type ICalEvent } from '../utils/icalParser';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [icalUrl, setIcalUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListingAndReservations();
  }, [id]);

  const fetchListingAndReservations = async () => {
    try {
      // Fetch listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (listingError) throw listingError;
      if (!listingData) throw new Error('Listing not found');
      
      // Verify ownership
      if (listingData.user_id !== user?.id) {
        navigate('/dashboard');
        return;
      }

      setListing(listingData);

      // Fetch reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('listing_id', id)
        .order('start_date', { ascending: true });

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load listing data');
    } finally {
      setLoading(false);
    }
  };

  const handleImportIcal = async () => {
    if (!icalUrl.trim()) return;

    try {
      const events = await parseICalFeed(icalUrl);

      // Prepare reservations for upsert
      const newReservations = events.map((event: ICalEvent) => ({
        listing_id: id,
        start_date: event.startDate.toISOString().split('T')[0],
        end_date: event.endDate.toISOString().split('T')[0],
        source: 'airbnb',
      }));

      // Upsert reservations
      const { error: upsertError } = await supabase
        .from('reservations')
        .upsert(newReservations, {
          onConflict: 'listing_id,start_date,end_date',
        });

      if (upsertError) throw upsertError;

      // Refresh reservations
      fetchListingAndReservations();
      setIcalUrl('');
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error importing iCal:', error);
      setError('Failed to import calendar data');
    }
  };

  const calculateOccupancyRate = () => {
    if (!reservations.length) return 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Filter reservations for current month
    const monthReservations = reservations.filter(reservation => {
      const startDate = new Date(reservation.start_date);
      return startDate.getMonth() === currentMonth && 
             startDate.getFullYear() === currentYear;
    });

    // Count booked days
    const bookedDays = new Set();
    monthReservations.forEach(reservation => {
      const start = new Date(reservation.start_date);
      const end = new Date(reservation.end_date);
      
      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        if (date.getMonth() === currentMonth) {
          bookedDays.add(date.getDate());
        }
      }
    });

    return Math.round((bookedDays.size / daysInMonth) * 100);
  };

  // TODO: Placeholder for dynamic pricing calculation
  const calculateSuggestedPrice = (occupancyRate: number) => {
    const basePrice = 100; // Example base price
    if (occupancyRate > 80) {
      return basePrice * 1.2; // 20% increase
    } else if (occupancyRate < 40) {
      return basePrice * 0.8; // 20% decrease
    }
    return basePrice;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!listing) {
    return <div>Listing not found</div>;
  }

  const occupancyRate = calculateOccupancyRate();
  const suggestedPrice = calculateSuggestedPrice(occupancyRate);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Occupancy Rate</h2>
              <p className="mt-2 text-3xl font-bold text-blue-600">{occupancyRate}%</p>
              <p className="mt-1 text-sm text-gray-500">Current month</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">Suggested Price</h2>
              <p className="mt-2 text-3xl font-bold text-green-600">${suggestedPrice}</p>
              <p className="mt-1 text-sm text-gray-500">Based on current occupancy</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Import Airbnb Calendar</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="Paste your Airbnb iCal URL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleImportIcal}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Import
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={reservations.map(reservation => ({
                title: 'Booked',
                start: reservation.start_date,
                end: reservation.end_date,
                backgroundColor: reservation.source === 'airbnb' ? '#3B82F6' : '#10B981',
              }))}
              height="auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

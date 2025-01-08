import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Listing } from '../supabaseClient';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [newListingTitle, setNewListingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListings();
  }, [user]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert([
          {
            title: newListingTitle.trim(),
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      setListings([data, ...listings]);
      setNewListingTitle('');
    } catch (error) {
      console.error('Error creating listing:', error);
      setError('Failed to create listing');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Your Listings</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateListing} className="mt-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={newListingTitle}
              onChange={(e) => setNewListingTitle(e.target.value)}
              placeholder="Enter listing title"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Listing
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900">{listing.title}</h2>
              <p className="mt-2 text-sm text-gray-500">
                Created on {new Date(listing.created_at).toLocaleDateString()}
              </p>
              {/* TODO: Add occupancy rate display */}
              <div className="mt-4 text-sm text-gray-600">
                Occupancy Rate: Coming soon
              </div>
            </Link>
          ))}
        </div>

        {listings.length === 0 && (
          <div className="mt-6 text-center text-gray-500">
            No listings yet. Create your first listing above!
          </div>
        )}
      </div>
    </div>
  );
}

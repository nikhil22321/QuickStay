import React, { useState } from 'react';
import { assets, cities } from '../assets/assets';
import { useAppContext } from '../context/AppContext';
import heroImage from '../assets/heroImage.png'; // ✅ Import background image

const Hero = () => {
  const { navigate, getToken, axios, setSearchedCities } = useAppContext(); // ✅ Fixed typo here
  const [destination, setDestination] = useState('');

  const onSearch = async (e) => {
    e.preventDefault();

    navigate(`/rooms?destination=${destination}`);

    try {
      await axios.post(
        '/api/user/store-recent-search',
        { recentSearchedCities: destination },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      setSearchedCities((prev) => {
        const updated = [...prev, destination];
        if (updated.length > 3) updated.shift();
        return updated;
      });
    } catch (error) {
      console.error('Error storing recent search:', error.message);
    }
  };

  return (
    <div
      className='flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-no-repeat bg-cover bg-center h-screen'
      style={{ backgroundImage: `url(${heroImage})` }} // ✅ Set image via inline style
    >
      <p className='bg-[#49B9FF]/50 px-3.5 py-1 rounded-full mt-20'>
        The Ultimate Hotel Experience
      </p>
      <h1 className='font-playfair text-2xl md:text-5xl md:text-[56px] md:leading-[56px] font-bold md:font-extrabold max-w-xl mt-4'>
        Discover Your Perfect Gateway Destination
      </h1>
      <p className='max-w-130 mt-2 text-sm md:text-base'>
        Unparalleled luxury and comfort await at the world's most exclusive hotels and resorts. Start your journey today.
      </p>

      <form
        onSubmit={onSearch}
        className='bg-white text-gray-500 rounded-lg px-6 py-4 mt-8 flex flex-col md:flex-row gap-4'
      >
        {/* Destination Input */}
        <div>
          <div className='flex items-center gap-2'>
            <img src={assets.calenderIcon} alt="" className='h-4' />
            <label htmlFor="destinationInput">Destination</label>
          </div>
          <input
            id="destinationInput"
            name="destination"
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            list="destinations"
            required
            placeholder="Type here"
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
          />
          <datalist id="destinations">
            {cities.map((city, index) => (
              <option value={city} key={index} />
            ))}
          </datalist>
        </div>

        {/* Check-in Date */}
        <div>
          <div className='flex items-center gap-2'>
            <img src={assets.calenderIcon} alt="" className='h-4' />
            <label htmlFor="checkIn">Check in</label>
          </div>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
          />
        </div>

        {/* Check-out Date */}
        <div>
          <div className='flex items-center gap-2'>
            <img src={assets.calenderIcon} alt="" className='h-4' />
            <label htmlFor="checkOut">Check out</label>
          </div>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none"
          />
        </div>

        {/* Guests */}
        <div className='flex md:flex-col max-md:gap-2 max-md:items-center'>
          <label htmlFor="guests">Guests</label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            max={4}
            placeholder="0"
            className="rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none max-w-16"
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className='flex items-center justify-center gap-1 rounded-md bg-black py-3 px-4 text-white my-auto cursor-pointer max-md:w-full max-md:py-1'
        >
          <img src={assets.searchIcon} alt="searchIcon" className='h-7' />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
};

export default Hero;

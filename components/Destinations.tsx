
import React, { useState, useEffect } from 'react';

const destinations = [
  { id: 1, url: 'https://picsum.photos/1200/800?image=1018' },
  { id: 2, url: 'https://picsum.photos/1200/800?image=1025' },
  { id: 3, url: 'https://picsum.photos/1200/800?image=103' },
];

const Destinations: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? destinations.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === destinations.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);


  return (
    <section id="destinations" className="py-20 bg-[#FFF0F0]">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Disfruta tu <span className="text-[#2E5A4E]">Resort</span></h2>
        <p className="text-gray-600 mt-2 mb-12">Experimenta el lujo y la comodidad en los destinos más bellos del mundo.</p>
      </div>
      <div className="max-w-4xl mx-auto h-96 relative group px-6">
        <div
          style={{ backgroundImage: `url(${destinations[currentIndex].url})` }}
          className="w-full h-full rounded-2xl bg-center bg-cover duration-500 shadow-2xl"
        ></div>
        {/* Left Arrow */}
        <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-10 text-2xl rounded-full p-2 bg-black/30 text-white cursor-pointer">
          <button onClick={prevSlide}><i className="fas fa-chevron-left"></i></button>
        </div>
        {/* Right Arrow */}
        <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-10 text-2xl rounded-full p-2 bg-black/30 text-white cursor-pointer">
          <button onClick={nextSlide}><i className="fas fa-chevron-right"></i></button>
        </div>
        <div className="flex top-4 justify-center py-2 absolute bottom-5 right-0 left-0">
          {destinations.map((_, slideIndex) => (
            <div
              key={slideIndex}
              onClick={() => setCurrentIndex(slideIndex)}
              className={`text-2xl cursor-pointer ${currentIndex === slideIndex ? 'text-[#F8BABA]' : 'text-white/50'}`}
            >
              <i className="fas fa-circle text-xs mx-1"></i>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Destinations;
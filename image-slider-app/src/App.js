import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [images, setImages] = useState({});
  const [currentCharacter, setCurrentCharacter] = useState('Ichika');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef(null);
  const characters = ['Ichika', 'Nino', 'Miku', 'Yotsuba', 'Itsuki', 'Together'];

  // Fetch the list of images for each character from the server
  useEffect(() => {
    const fetchImages = async () => {
      const allImages = {};
      for (const character of characters) {
        try {
          const response = await axios.get(`http://62.109.18.217:5000/images/${character}/list`);
          allImages[character] = response.data;
        } catch (error) {
          console.error(`There was an error fetching the images for ${character}: `, error);
        }
      }
      setImages(allImages);
      setIsLoading(false);
    };
    
    fetchImages();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target;
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.classList.remove('lazy-load'); // Optionally remove the lazy load class
            observer.unobserve(lazyImage);
          }
        });
      },
      {
        rootMargin: '0px',
        threshold: 0.01,
      }
    );
  
    const currentImage = imageRef.current;
    if (currentImage) {
      observer.observe(currentImage);
    }
  
    return () => {
      if (currentImage) {
        observer.unobserve(currentImage);
      }
    };
  }, [currentIndex, images]);
 
  useEffect(() => {
    setIsLoading(true); // Reset loading state on currentIndex change
  }, [currentIndex]);

  // Function to navigate to the next image
  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images[currentCharacter].length);
  };

  // Function to navigate to the previous image
  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images[currentCharacter].length) % images[currentCharacter].length);
  };

  // Function to show a random image
  const randomImage = () => {
    setCurrentIndex(Math.floor(Math.random() * images.length));
  };

    // Function to navigate to the next character
    const nextCharacter = () => {
      const currentIdx = characters.indexOf(currentCharacter);
      const nextIdx = (currentIdx + 1) % characters.length;
      setCurrentCharacter(characters[nextIdx]);
      setCurrentIndex(0); // Reset index for new character
    };
  
    // Function to navigate to the previous character
    const prevCharacter = () => {
      const currentIdx = characters.indexOf(currentCharacter);
      const prevIdx = (currentIdx - 1 + characters.length) % characters.length;
      setCurrentCharacter(characters[prevIdx]);
      setCurrentIndex(0); // Reset index for new character
    };

  const downloadCurrentImage = () => {
    const imageSrc = `http://62.109.18.217:5000${images[currentIndex]}`;
    fetch(imageSrc)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${currentIndex + 1}.jpg`; // Customize the filename here
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch(err => console.error("Error in downloading the file", err));
  };

  useEffect(() => {
    function handleKeyPress(e) {
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key.toLowerCase() === 'r') {
        randomImage();
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextImage, prevImage, randomImage]); // Include randomImage in the dependency array
  
    const onLoad = () => {
    setTimeout(() => setIsLoading(false), 250); // Adjust the delay here as needed
  };

  return (
    <div className="App">
      <header className="App-header">
      <h2>Quintessential Quintuplets Gallery</h2>
        {isLoading ? (
          <p>Loading images...</p>
        ) : (
          <>
          <span className='image-counter'>
          {currentCharacter} - Image {currentIndex + 1} of {images[currentCharacter].length}
          </span>
        {images[currentCharacter].length > 0 && (
              <div className="image-wrapper">
                <img 
                  ref={imageRef}
                  src={`http://62.109.18.217:5000${images[currentCharacter][currentIndex]}`} 
                  alt={`${currentCharacter}`}
                  onLoad={() => setIsLoading(false)}
                  className='fade-in'
                  key={`${currentCharacter}-${currentIndex}`}
                />
              </div>
            )}
        <div className="carousel-controls">
        <button onClick={prevCharacter}>Prev Character</button>
          <button onClick={prevImage}>Previous</button>
          <button onClick={randomImage}>Random</button>
          <button onClick={nextImage}>Next </button>
          <button onClick={nextCharacter}>Next Character</button>
        </div>
        <button onClick={downloadCurrentImage} style={{ marginTop: '10px' }}>Download Current Image</button>
      </header>
    </div>
  );
}

export default App;
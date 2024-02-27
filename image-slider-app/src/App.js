import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [character, setCharacter] = useState('Ichika'); // Default character
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef(null);

  // Fetch the list of images from the server for a given character
  useEffect(() => {
    setIsLoading(true);
    axios.get(`http://62.109.18.217:5000/images/${character}/list`)
      .then(response => {
        setImages(response.data);
        setCurrentIndex(0); // Start from the first image of the new character
      })
      .catch(error => console.error("There was an error fetching the images: ", error))
      .finally(() => setIsLoading(false));
  }, [character]);

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

    // Function to change character
    const changeCharacter = (newCharacter) => {
      setCharacter(newCharacter);
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
        <h2>Quintessential Quintuplets Gallery - {character}</h2>
        <div className="character-selector">
          {['Ichika', 'Nino', 'Miku', 'Yotsuba', 'Itsuki', 'Together'].map((char) => (
            <button key={char} onClick={() => changeCharacter(char)} disabled={character === char}>
              {char}
            </button>
          ))}
        </div>
        <span className='image-counter'>
          Image {currentIndex + 1} of {images.length}
        </span>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          images.length > 0 && (
            <div className="image-wrapper">
              <img 
                ref={imageRef}
                src={`http://62.109.18.217:5000${images[currentIndex]}`} 
                alt={`${character}`}
                onLoad={() => setIsLoading(false)}
                className={`lazy-load ${!isLoading ? 'fade-in' : ''}`}
                key={currentIndex}
              />
            </div>
          )
        )}
        <div className="carousel-controls">
          <button onClick={() => setCurrentIndex((currentIndex - 1 + images.length) % images.length)}>Previous</button>
          <button onClick={() => setCurrentIndex(Math.floor(Math.random() * images.length))}>Random</button>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % images.length)}>Next </button>
        </div>
        <button onClick={downloadCurrentImage} style={{ marginTop: '10px' }}>Download Current Image</button>
      </header>
    </div>
  );
}

export default App;
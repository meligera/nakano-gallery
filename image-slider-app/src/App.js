import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [characters] = useState(['Ichika', 'Nino', 'Miku', 'Yotsuba', 'Itsuki', 'Together']); // Added characters array
  const [selectedCharacter, setSelectedCharacter] = useState('Ichika'); // Default selected character
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef(null);

  // Fetch the list of images from the server for the selected character
  useEffect(() => {
    setIsLoading(true); // Show loader while fetching
    axios.get(`http://62.109.18.217:5000/images/${selectedCharacter}/list`)
      .then(response => {
        setImages(response.data);
        setCurrentIndex(Math.floor(Math.random() * response.data.length));
        setIsLoading(false); // Hide loader after fetching
      })
      .catch(error => console.error("There was an error fetching the images: ", error));
  }, [selectedCharacter]); // Dependency array now includes selectedCharacter

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
 
  
  const handleCharacterChange = (character) => {
    setSelectedCharacter(character); // Update the selected character which triggers the useEffect to fetch images
  };

  // Function to navigate to the next image
  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  // Function to navigate to the previous image
  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  // Function to show a random image
  const randomImage = () => {
    setCurrentIndex(Math.floor(Math.random() * images.length));
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
    setIsLoading(false); // Set loading to false when the image is loaded
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Quintessential Quintuplets Gallery</h2>
        <div>
          {characters.map(character => (
            <button key={character} onClick={() => handleCharacterChange(character)} style={{marginRight: '5px'}}>
              {character}
            </button>
          ))}
        </div>
        <span className='image-counter'>
          Image {currentIndex + 1} of {images.length}
        </span>
        {images.length > 0 && (
        <div className="image-wrapper">
          <img 
            ref={imageRef}
            data-src={`http://62.109.18.217:5000${images[currentIndex]}`} 
            alt="Girls"
            onLoad={onLoad}
            className={`lazy-load ${isLoading ? 'image-loading' : 'fade-in'}`}
            key={currentIndex}
            style={{ opacity: isLoading ? 0 : 1 }} // Adjust the initial opacity if needed
          />
        </div>
      )}
        <div className="carousel-controls">
          <button onClick={prevImage}>Previous</button>
          <button onClick={randomImage}>Random</button>
          <button onClick={nextImage}>Next </button>
        </div>
        <button onClick={downloadCurrentImage} style={{ marginTop: '10px' }}>Download Current Image</button>
      </header>
    </div>
  );
}

export default App;
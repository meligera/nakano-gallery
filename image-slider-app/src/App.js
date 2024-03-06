import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
//import './App.css';

function App() {
  const [characters] = useState([
    "Ichika",
    "Nino",
    "Miku",
    "Yotsuba",
    "Itsuki",
    "Together",
  ]); // Added characters array
  const [selectedCharacter, setSelectedCharacter] = useState("Ichika"); // Default selected character
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the list of images from the server for the selected character
  useEffect(() => {
    setIsLoading(true); // Show loader while fetching
    axios
      .get(`http://192.168.88.119:5000/images/${selectedCharacter}/list`)
      .then((response) => {
        setImages(response.data);
        setCurrentIndex(Math.floor(Math.random() * response.data.length));
        setIsLoading(false); // Hide loader after fetching
      })
      .catch((error) =>
        console.error("There was an error fetching the images: ", error)
      );
  }, [selectedCharacter]); // Dependency array now includes selectedCharacter

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
    const imageSrc = `http://192.168.88.119:5000${images[currentIndex]}`;
    fetch(imageSrc)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${currentIndex + 1}.jpg`; // Customize the filename here
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((err) => console.error("Error in downloading the file", err));
  };

  useEffect(() => {
    function handleKeyPress(e) {
      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key.toLowerCase() === "r") {
        randomImage();
      } else if (e.key.toLowerCase() === "d") {
        downloadCurrentImage();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [nextImage, prevImage, randomImage]);

  const onLoad = () => {
    setIsLoading(false); // Set loading to false when the image is loaded
  };

  return (
    <div className="App bg-gray-800 text-white w-full min-h-screen flex flex-col items-center justify-start pt-4">
      <header className="flex flex-col items-center justify-center w-full px-4 text-center">
        <h2 className="text-2xl mb-2">Quintessential Quintuplets Gallery</h2>
        <div className="flex flex-wrap justify-center items-center gap-2 mb-2">
          {characters.map((character) => (
            <button
              key={character}
              onClick={() => handleCharacterChange(character)}
              className={`${
                selectedCharacter === character ? "bg-green-500" : "bg-blue-500"
              } hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm`}
            >
              {character}
            </button>
          ))}
        </div>
        <span className="image-counter text-sm mb-2 font-style: italic">
          Image {currentIndex + 1} of {images.length}
        </span>
        {images.length > 0 && (
          <div className="image-wrapper flex justify-center items-center mb-2 w-full">
            <img
              src={`http://192.168.88.119:5000${images[currentIndex]}`}
              alt="Girls"
              onLoad={onLoad}
              className={`max-w-full max-h-[60vh] md:max-h-[74vh] object-contain transition-opacity duration-500 ease-in-out ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              key={currentIndex}
            />
          </div>
        )}
        <div className="carousel-controls flex justify-center items-center gap-4 mb-4 mt-2">
          <button
            onClick={prevImage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
          >
            ⤎ Prev
          </button>
          <button
            onClick={randomImage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
          >
            Random (R)
          </button>
          <button
            onClick={nextImage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
          >
            Next ⤏
          </button>
        </div>
        <button
          onClick={downloadCurrentImage}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
        >
          Download Current Image (D)
        </button>
      </header>
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import axios from "axios";
import JSZip from 'jszip';

function App() {
  const [characters] = useState([
    "Ichika",
    "Nino",
    "Miku",
    "Yotsuba",
    "Itsuki",
    "Together",
  ]);
  const [selectedCharacter, setSelectedCharacter] = useState("Ichika");
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`http://localhost:5000/images/${selectedCharacter}/list`)
      .then((response) => {
        setImages(response.data);
        setCurrentIndex(Math.floor(Math.random() * response.data.length));
        setIsLoading(false);
      })
      .catch((error) =>
        console.error("There was an error fetching the images: ", error)
      );
  }, [selectedCharacter]);

  const handleCharacterChange = (character) => {
    setSelectedCharacter(character);
  };

  const nextImage = () => {
    setCurrentIndex((currentIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((currentIndex - 1 + images.length) % images.length);
  };

  const randomImage = () => {
    setCurrentIndex(Math.floor(Math.random() * images.length));
  };

  const downloadCurrentImage = () => {
    const imageSrc = `http://localhost:5000${images[currentIndex]}`;
    fetch(imageSrc)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((err) => console.error("Error in downloading the file", err));
  };

  const downloadCurrentCharacterImages = () => {
    const zip = new JSZip();
    const promises = images.map((image, index) => {
      const imageUrl = `http://localhost:5000${image}`;
      return fetch(imageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          zip.file(`image_${index + 1}.jpg`, blob);
        });
    });

    Promise.all(promises).then(() => {
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${selectedCharacter}_images.zip`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      });
    });
  };

  const downloadAllImages = () => {
    const zip = new JSZip();
    const promises = characters.map((character) =>
      axios
        .get(`http://localhost:5000/images/${character}/list`)
        .then((response) => {
          const characterImages = response.data.map(
            (image, index) =>
              fetch(`http://localhost:5000${image}`)
                .then((response) => response.blob())
                .then((blob) => {
                  zip.file(`${character}_image_${index + 1}.jpg`, blob);
                })
          );
          return Promise.all(characterImages);
        })
    );

    Promise.all(promises).then(() => {
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `all_images.zip`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      });
    });
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
    setIsLoading(false);
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
              src={`http://localhost:5000${images[currentIndex]}`}
              alt="Girls"
              onLoad={onLoad}
              className={`max-w-full max-h-[60vh] md:max-h-[74vh] object-contain transition-all duration-500 ease-in-out ${
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
        <div className="download-buttons absolute top-4 right-4">
          <button
            onClick={downloadCurrentImage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
          >
            Download Current Image (D)
          </button>
          <button
            onClick={downloadCurrentCharacterImages}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm ml-2"
          >
            Download Current Character Images
          </button>
          <button
            onClick={downloadAllImages}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm ml-2"
          >
            Download All Images
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;

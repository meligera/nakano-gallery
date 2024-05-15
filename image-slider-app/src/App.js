import React, { useEffect, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import path from 'path-browserify';

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
  const [imageItems, setImageItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`https://nakanoimages.misatolab.ru/images/${selectedCharacter}/list`)
      .then((response) => {
        const imageUrls = response.data;
        setImages(imageUrls);
        const items = imageUrls.map((imageUrl) => ({
          thumbnail: `https://nakanoimages.misatolab.ru/images/${selectedCharacter}/thumbnail/${path.basename(imageUrl)}`,
          original: `https://nakanoimages.misatolab.ru${imageUrl}`,
        }));
        setImageItems(items);
        setIsLoading(false);
      })
      .catch((error) =>
        console.error('There was an error fetching the images: ', error)
      );
  }, [selectedCharacter]);

  const handleCharacterChange = (character) => {
    setSelectedCharacter(character);
  };

  const downloadCurrentImage = () => {
    const imageSrc = `https://nakanoimages.misatolab.ru${images[currentIndex]}`;
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
      const imageUrl = `https://nakanoimages.misatolab.ru${image}`;
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
        .get(`https://nakanoimages.misatolab.ru/images/${character}/list`)
        .then((response) => {
          const characterImages = response.data.map(
            (image, index) =>
              fetch(`https://nakanoimages.misatolab.ru${image}`)
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
      </header>
      <div className="gallery-wrapper flex justify-center items-center mb-2 w-full flex-grow p-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ImageGallery
            items={imageItems}
            showThumbnails={true}
            thumbnailPosition="left"
            showPlayButton={true}
            showFullscreenButton={true}
            disableThumbnailScroll={false}
            showIndex={true}
            lazyLoad={true}
            onSlide={(currentIndex) => setCurrentIndex(currentIndex)}
          />
        )}
      </div>
      <div className="download-buttons flex flex-col sm:flex-row items-center justify-center gap-2 mt-auto p-4">
        <button
          onClick={downloadCurrentImage}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
        >
          Download Current Image
        </button>
        <button
          onClick={downloadCurrentCharacterImages}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
        >
          Download Current Character Images
        </button>
        <button
          onClick={downloadAllImages}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded text-sm"
        >
          Download All Images
        </button>
      </div>
    </div>
  );
}
export default App;
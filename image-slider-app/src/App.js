import React, { useEffect, useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import path from 'path-browserify';
import { motion } from '@motionone/react';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

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
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderLazyThumbnail = (item) => (
    <img src={item.thumbnail} alt="" loading="lazy" />
  );

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
    <div className="App bg-white dark:bg-[#343541] text-gray-900 dark:text-gray-200 w-full h-screen overflow-hidden flex flex-col items-center justify-start pt-6 transition-colors duration-500">
      <header className="flex flex-col items-center justify-center w-full px-4 text-center mb-4 relative">
        <motion.button
          onClick={() => setDarkMode((prev) => !prev)}
          className="absolute top-0 right-0 p-2 text-xl"
          animate={{ rotate: darkMode ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
        </motion.button>
        <h2 className="text-2xl font-semibold mb-3">Quintessential Quintuplets Gallery</h2>
        <div className="flex flex-wrap justify-center items-center gap-2">
          {characters.map((character) => (
            <button
              key={character}
              onClick={() => handleCharacterChange(character)}
              className={`px-4 py-1 rounded-md text-sm font-medium transition-colors duration-300 ${
                selectedCharacter === character
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-[#444654] hover:bg-gray-300 dark:hover:bg-[#565869]'
              }`}
            >
              {character}
            </button>
          ))}
        </div>
      </header>
      <div className="gallery-wrapper flex justify-center items-center mb-4 w-full flex-grow p-4 overflow-hidden">
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
            renderThumbInner={renderLazyThumbnail}
            onSlide={(currentIndex) => setCurrentIndex(currentIndex)}
          />
        )}
      </div>
      <div className="download-buttons flex flex-col sm:flex-row items-center justify-center gap-2 mt-auto p-4">
        <button
          onClick={downloadCurrentImage}
          className="px-4 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-[#444654] hover:bg-gray-300 dark:hover:bg-[#565869] transition-colors duration-300"
        >
          Download Current Image
        </button>
        <button
          onClick={downloadCurrentCharacterImages}
          className="px-4 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-[#444654] hover:bg-gray-300 dark:hover:bg-[#565869] transition-colors duration-300"
        >
          Download Current Character Images
        </button>
        <button
          onClick={downloadAllImages}
          className="px-4 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-[#444654] hover:bg-gray-300 dark:hover:bg-[#565869] transition-colors duration-300"
        >
          Download All Images
        </button>
      </div>
    </div>
  );
}
export default App;


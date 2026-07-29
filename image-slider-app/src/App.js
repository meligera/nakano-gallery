import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const GITHUB_IMAGE_API =
  "https://api.github.com/repos/meligera/nakano-gallery/contents/images";
const RAW_GITHUB_PREFIX =
  "https://raw.githubusercontent.com/meligera/nakano-gallery/main/";
const JSDELIVR_PREFIX =
  "https://cdn.jsdelivr.net/gh/meligera/nakano-gallery@main/";

const CHARACTERS = [
  { name: "Ichika", kanji: "一花", accent: "#f39ab1", rgb: "243, 154, 177" },
  { name: "Nino", kanji: "二乃", accent: "#b895f5", rgb: "184, 149, 245" },
  { name: "Miku", kanji: "三玖", accent: "#74c7ec", rgb: "116, 199, 236" },
  { name: "Yotsuba", kanji: "四葉", accent: "#94d47b", rgb: "148, 212, 123" },
  { name: "Itsuki", kanji: "五月", accent: "#f07f79", rgb: "240, 127, 121" },
  { name: "Together", kanji: "五人", accent: "#f4c96b", rgb: "244, 201, 107" },
];

const imageLists = new Map();

const listCharacterImages = async (character) => {
  if (imageLists.has(character)) {
    return imageLists.get(character);
  }

  const response = await axios.get(
    `${GITHUB_IMAGE_API}/${encodeURIComponent(character)}?ref=main`
  );
  const images = response.data
    .filter(
      (item) =>
        item.type === "file" && /\.(jpe?g|png|webp)$/i.test(item.name)
    )
    .map((item) => item.download_url);

  imageLists.set(character, images);
  return images;
};

const fallbackUrlFor = (src) =>
  src.startsWith(RAW_GITHUB_PREFIX)
    ? src.replace(RAW_GITHUB_PREFIX, JSDELIVR_PREFIX)
    : src;

const fileNameFor = (src) => {
  try {
    return decodeURIComponent(src.split("/").pop());
  } catch {
    return "wallpaper";
  }
};

function ResilientImage({
  src,
  alt,
  className,
  loading,
  onLoad,
  onFinalError,
}) {
  const [activeSrc, setActiveSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setActiveSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    const fallback = fallbackUrlFor(src);
    if (activeSrc !== fallback) {
      setActiveSrc(fallback);
      return;
    }

    setFailed(true);
    onFinalError?.();
  };

  if (failed) {
    return (
      <span className={`${className || ""} image-fallback`} aria-label={alt}>
        <span aria-hidden="true">×</span>
      </span>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

function App() {
  const appRef = useRef(null);
  const activeThumbnailRef = useRef(null);
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [stageState, setStageState] = useState("loading");
  const [showPicker, setShowPicker] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const currentImage = images[currentIndex] || "";

  const loadCollection = useCallback(async () => {
    setIsLoading(true);
    setListError("");
    setImages([]);
    setCurrentIndex(0);

    try {
      const imageUrls = await listCharacterImages(selectedCharacter.name);
      setImages(imageUrls);
      if (!imageUrls.length) {
        setListError("This collection is empty.");
      }
    } catch (error) {
      console.error("Unable to load the image collection.", error);
      setListError(
        "The collection could not be reached. Please try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCharacter.name]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    setStageState(currentImage ? "loading" : "idle");
  }, [currentImage, reloadToken]);

  useEffect(() => {
    if (!currentImage) return undefined;

    const neighborIndexes = [
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
    ];
    const preloaders = neighborIndexes.map((index) => {
      const image = new Image();
      image.src = images[index];
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.src = "";
      });
    };
  }, [currentImage, currentIndex, images]);

  useEffect(() => {
    activeThumbnailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex, selectedCharacter.name]);

  const goToImage = useCallback(
    (index) => {
      if (!images.length) return;
      setCurrentIndex((index + images.length) % images.length);
    },
    [images.length]
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await appRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen mode is unavailable.", error);
    }
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const handleKeyboard = (event) => {
      const tagName = event.target.tagName;
      if (tagName === "INPUT" || tagName === "SELECT") return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToImage(currentIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToImage(currentIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToImage(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToImage(images.length - 1);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key.toLowerCase() === "p") {
        event.preventDefault();
        setShowPicker((visible) => !visible);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [currentIndex, goToImage, images.length, toggleFullscreen]);

  const downloadCurrentImage = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileNameFor(currentImage);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Unable to download this image.", error);
      window.open(fallbackUrlFor(currentImage), "_blank", "noopener,noreferrer");
    }
  };

  const backdropStyle = useMemo(
    () =>
      currentImage
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(7, 8, 13, .78), rgba(7, 8, 13, .9)), url("${currentImage}")`,
          }
        : undefined,
    [currentImage]
  );

  return (
    <main
      ref={appRef}
      className="gallery-app"
      style={{
        "--accent": selectedCharacter.accent,
        "--accent-rgb": selectedCharacter.rgb,
      }}
    >
      <div className="ambient-backdrop" style={backdropStyle} aria-hidden="true" />

      <header className="top-bar">
        <div className="brand-block">
          <span className="eyebrow">Nakano archive</span>
          <strong>Quintessential Gallery</strong>
        </div>

        <nav className="character-picker" aria-label="Choose a character">
          {CHARACTERS.map((character) => (
            <button
              key={character.name}
              type="button"
              className={
                character.name === selectedCharacter.name ? "is-active" : ""
              }
              aria-pressed={character.name === selectedCharacter.name}
              onClick={() => setSelectedCharacter(character)}
            >
              <span>{character.name}</span>
              <small>{character.kanji}</small>
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowPicker((visible) => !visible)}
            aria-pressed={showPicker}
            title="Toggle previews (P)"
          >
            <span aria-hidden="true">▦</span>
            <span className="action-label">Previews</span>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleFullscreen}
            title="Toggle fullscreen (F)"
          >
            <span aria-hidden="true">{isFullscreen ? "↙" : "↗"}</span>
            <span className="action-label">
              {isFullscreen ? "Exit" : "Fullscreen"}
            </span>
          </button>
        </div>
      </header>

      <section className="viewer" aria-label={`${selectedCharacter.name} gallery`}>
        {isLoading && (
          <div className="stage-message" role="status">
            <span className="loader" aria-hidden="true" />
            <strong>Opening {selectedCharacter.name}'s collection</strong>
            <small>Preparing the previews…</small>
          </div>
        )}

        {!isLoading && listError && (
          <div className="stage-message stage-error" role="alert">
            <span className="message-mark" aria-hidden="true">!</span>
            <strong>We couldn't open this collection</strong>
            <small>{listError}</small>
            <button type="button" onClick={loadCollection}>Try again</button>
          </div>
        )}

        {!isLoading && !listError && currentImage && (
          <>
            <div
              className={`stage-image-wrap ${
                stageState === "ready" ? "is-ready" : ""
              }`}
            >
              {stageState === "loading" && (
                <span className="stage-shimmer" aria-hidden="true" />
              )}
              <ResilientImage
                key={`${currentImage}-${reloadToken}`}
                src={currentImage}
                alt={`${selectedCharacter.name} wallpaper ${currentIndex + 1}`}
                className="stage-image"
                onLoad={() => setStageState("ready")}
                onFinalError={() => setStageState("error")}
              />
              {stageState === "error" && (
                <div className="image-error-card" role="alert">
                  <strong>This image is taking a break</strong>
                  <span>Retry it, or open the original file directly.</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => setReloadToken((token) => token + 1)}
                    >
                      Retry
                    </button>
                    <a
                      href={fallbackUrlFor(currentImage)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open original
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="nav-arrow nav-previous"
              onClick={() => goToImage(currentIndex - 1)}
              aria-label="Previous image"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="nav-arrow nav-next"
              onClick={() => goToImage(currentIndex + 1)}
              aria-label="Next image"
            >
              <span aria-hidden="true">›</span>
            </button>

            <div className="image-meta">
              <div>
                <span>{selectedCharacter.kanji}</span>
                <strong>{selectedCharacter.name}</strong>
              </div>
              <span className="file-name">{fileNameFor(currentImage)}</span>
            </div>

            <div className="viewer-actions">
              <span className="counter">
                <strong>{String(currentIndex + 1).padStart(2, "0")}</strong>
                <span>/ {String(images.length).padStart(2, "0")}</span>
              </span>
              <button type="button" onClick={downloadCurrentImage}>
                <span aria-hidden="true">↓</span>
                Download
              </button>
            </div>
          </>
        )}
      </section>

      {showPicker && images.length > 0 && (
        <section className="preview-dock" aria-label="Image picker">
          <div className="scrubber-row">
            <span>{selectedCharacter.name} collection</span>
            <input
              type="range"
              min="0"
              max={Math.max(images.length - 1, 0)}
              value={currentIndex}
              onChange={(event) => goToImage(Number(event.target.value))}
              aria-label="Jump to image"
            />
            <output>
              {currentIndex + 1} / {images.length}
            </output>
          </div>

          <div className="thumbnail-rail" role="listbox" aria-label="Previews">
            {images.map((image, index) => (
              <button
                key={image}
                ref={index === currentIndex ? activeThumbnailRef : null}
                type="button"
                role="option"
                aria-selected={index === currentIndex}
                aria-label={`Show image ${index + 1}`}
                className={index === currentIndex ? "is-active" : ""}
                onClick={() => goToImage(index)}
              >
                <ResilientImage
                  src={image}
                  alt=""
                  className="thumbnail-image"
                  loading="lazy"
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="keyboard-hint" aria-hidden="true">
        <span>← → navigate</span>
        <span>F fullscreen</span>
        <span>P previews</span>
      </div>
    </main>
  );
}

export default App;

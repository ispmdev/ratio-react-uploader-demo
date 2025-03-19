import { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import './App.css';

function App() {
  const [savedImages, setSavedImages] = useState(null);

  const handleImagesSaved = (images) => {
    setSavedImages(images);
    console.log('Saved images:', images);
  };

  // Function to download an image
  const downloadImage = (url, fileName) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Image Upload with Multi-Ratio Cropping
      </h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Select an Image to Crop
        </h2>
        <ImageUploader onImagesReady={handleImagesSaved} />
      </div>
      
      {savedImages && (
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Cropped Images
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Original</h3>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '1rem',
              maxWidth: '400px'
            }}>
              <img 
                src={savedImages.original.url} 
                alt="Original" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: '0.25rem', 
                  marginBottom: '0.5rem' 
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{savedImages.original.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {savedImages.original.type} • {Math.round(savedImages.original.size / 1024)} KB
                  </p>
                </div>
                <button 
                  onClick={() => downloadImage(savedImages.original.url, savedImages.original.name)}
                  style={{ 
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Cropped Versions</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem' 
            }}>
              {savedImages.crops.map((crop, index) => (
                <div key={index} style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  padding: '1rem'
                }}>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    marginBottom: '0.5rem', 
                    textTransform: 'capitalize' 
                  }}>
                    {crop.name}
                  </h4>
                  <img 
                    src={crop.url} 
                    alt={crop.name} 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      borderRadius: '0.25rem', 
                      marginBottom: '0.5rem' 
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {crop.type} • {Math.round(crop.size / 1024)} KB
                      </p>
                    </div>
                    <button 
                      onClick={() => downloadImage(crop.url, crop.fileName)}
                      style={{ 
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
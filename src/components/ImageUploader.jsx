import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ASPECT_RATIOS = [
  { name: 'portrait', ratio: 2/3, label: 'Portrait (2:3)' },
  { name: 'landscape', ratio: 16/9, label: 'Landscape (16:9)' },
  { name: 'square', ratio: 1, label: 'Square (1:1)' }
];

const ImageUploader = ({ onImagesReady }) => {
  // State management
  const [originalImage, setOriginalImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: upload, 1-3: cropping steps
  const [crops, setCrops] = useState({
    portrait: { unit: '%', width: 30, height: 30 * (3/2), x: 35, y: 35 },
    landscape: { unit: '%', width: 30, height: 30 * (9/16), x: 35, y: 35 },
    square: { unit: '%', width: 30, height: 30, x: 35, y: 35 }
  });
  const [completedCrops, setCompletedCrops] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs
  const imgRef = useRef(null);
  
  // Handle file drop or selection
  const handleFileSelected = useCallback(async (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const imageUrl = URL.createObjectURL(file);
      setOriginalImage({ file, url: imageUrl });
      setPreviewUrl(imageUrl);
      setIsOpen(true);
      setCurrentStep(1); // Move to first cropping step
    }
  }, []);

  // Handle crop change
  const onCropChange = useCallback((crop) => {
    if (!crop || crop.width === undefined || crop.height === undefined) return;
    
    const currentRatio = ASPECT_RATIOS[currentStep - 1].name;
    setCrops(prev => ({
      ...prev,
      [currentRatio]: crop
    }));
  }, [currentStep]);

  // Handle crop complete for the current ratio
  const onCropComplete = useCallback((crop) => {
    if (!crop || !imgRef.current || !crop.width || !crop.height) {
      console.error("Invalid crop or image reference", crop);
      return;
    }
    
    const currentRatio = ASPECT_RATIOS[currentStep - 1].name;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    
    // Determine scale factors based on natural vs. displayed size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set canvas dimensions based on the crop dimensions
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped portion onto the canvas
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    // Convert canvas to blob and store
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a file from the blob with an appropriate name
        const fileName = `${originalImage.file.name.split('.')[0]}_${currentRatio}.${originalImage.file.name.split('.')[1]}`;
        const croppedFile = new File([blob], fileName, { type: originalImage.file.type });
        
        console.log(`Created crop for ${currentRatio}`, {
          width: canvas.width,
          height: canvas.height,
          ratio: canvas.width / canvas.height
        });
        
        // Store the crop
        setCompletedCrops(prev => ({
          ...prev,
          [currentRatio]: {
            file: croppedFile,
            preview: URL.createObjectURL(blob)
          }
        }));
      } else {
        console.error("Failed to create blob from canvas");
      }
    }, originalImage.file.type);
  }, [currentStep, originalImage]);
  
  // Handle upload
  const handleSave = useCallback(() => {
    // Make sure all three crops are completed
    const requiredCrops = ASPECT_RATIOS.map(ratio => ratio.name);
    const completedCropNames = Object.keys(completedCrops);
    
    // Check if all required crops are completed
    const allCropsCompleted = requiredCrops.every(crop => completedCropNames.includes(crop));
    
    if (!allCropsCompleted) {
      alert(`Please complete all crop types: ${requiredCrops.filter(crop => !completedCropNames.includes(crop)).join(', ')}`);
      return;
    }
    
    // Create object with original and cropped images
    const savedImages = {
      original: {
        file: originalImage.file,
        url: originalImage.url,
        name: originalImage.file.name,
        type: originalImage.file.type,
        size: originalImage.file.size
      },
      crops: Object.entries(completedCrops).map(([name, data]) => ({
        name: name,
        file: data.file,
        url: data.preview,
        fileName: data.file.name,
        type: data.file.type,
        size: data.file.size
      }))
    };
    
    // Pass the saved images back to the parent component
    onImagesReady(savedImages);
    
    // Close the modal and reset state
    setIsOpen(false);
    setOriginalImage(null);
    setPreviewUrl(null);
    setCurrentStep(0);
    setCompletedCrops({});
  }, [originalImage, completedCrops, onImagesReady]);
  
  // Navigate to next step
  const handleNext = useCallback(() => {
    // Make sure current crop is completed before moving to next step
    const currentRatio = ASPECT_RATIOS[currentStep - 1]?.name;
    
    if (currentStep > 0 && currentStep <= ASPECT_RATIOS.length && !completedCrops[currentRatio]) {
      // If no crop is completed for the current ratio, force a crop completion
      if (imgRef.current) {
        onCropComplete(crops[currentRatio]);
      }
    }
    
    // Small delay to ensure crop completion processes
    setTimeout(() => {
      if (currentStep < ASPECT_RATIOS.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Final step - save all images
        handleSave();
      }
    }, 100);
  }, [currentStep, crops, completedCrops, onCropComplete, handleSave]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Cancel the process
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setOriginalImage(null);
    setPreviewUrl(null);
    setCurrentStep(0);
    setCompletedCrops({});
  }, []);
  
  // Set up the crop when the step changes
  useEffect(() => {
    if (currentStep > 0 && currentStep <= ASPECT_RATIOS.length && imgRef.current) {
      const currentRatio = ASPECT_RATIOS[currentStep - 1];
      const { width, height } = imgRef.current;
      
      // Calculate crop dimensions based on aspect ratio
      const aspectRatio = currentRatio.ratio;
      let cropWidth = width * 0.8;
      let cropHeight = cropWidth / aspectRatio;
      
      // If crop height is too large, adjust both dimensions
      if (cropHeight > height * 0.8) {
        cropHeight = height * 0.8;
        cropWidth = cropHeight * aspectRatio;
      }
      
      // Center the crop
      const x = (width - cropWidth) / 2;
      const y = (height - cropHeight) / 2;
      
      // Update the crop for the current ratio
      setCrops(prev => ({
        ...prev,
        [currentRatio.name]: {
          unit: 'px',
          width: cropWidth,
          height: cropHeight,
          x: x,
          y: y
        }
      }));
      
      console.log(`Set up crop for ${currentRatio.name}`, {
        aspectRatio,
        cropWidth,
        cropHeight,
        x,
        y
      });
    }
  }, [currentStep]);

  // Render crop preview
  const renderCropPreview = useCallback(() => {
    if (!originalImage) return null;
    
    const currentRatio = ASPECT_RATIOS[currentStep - 1];
    const crop = crops[currentRatio.name];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
          Step {currentStep}: Crop for {currentRatio.label}
        </h3>
        <div style={{ maxWidth: '48rem', maxHeight: '24rem', overflow: 'auto' }}>
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            onComplete={onCropComplete}
            aspect={currentRatio.ratio}
            minWidth={50}
          >
            <img 
              ref={imgRef}
              alt="Crop preview" 
              src={previewUrl}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </ReactCrop>
        </div>
      </div>
    );
  }, [currentStep, originalImage, previewUrl, crops, onCropChange, onCropComplete]);

  // Render completed crops preview
  const renderCompletedCropsPreview = useCallback(() => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {Object.entries(completedCrops).map(([ratioName, cropData]) => (
          <div key={ratioName} style={{ border: '1px solid #ddd', borderRadius: '0.5rem', padding: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem', textTransform: 'capitalize' }}>{ratioName}</h4>
            <img 
              src={cropData.preview} 
              alt={`${ratioName} preview`}
              style={{ width: '100%', height: 'auto', borderRadius: '0.25rem' }}
            />
          </div>
        ))}
      </div>
    );
  }, [completedCrops]);

  // Final confirmation step
  const renderConfirmationStep = useCallback(() => {
    if (Object.keys(completedCrops).length !== ASPECT_RATIOS.length) return null;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
          Final Step: Confirm Your Crops
        </h3>
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Please review your cropped images below. If you're satisfied, click "Save" to proceed.
        </p>
        {renderCompletedCropsPreview()}
      </div>
    );
  }, [completedCrops, renderCompletedCropsPreview]);

  return (
    <div style={{ width: '100%' }}>
      {/* Upload Zone */}
      <div 
        style={{ 
          border: '2px dashed #e5e7eb', 
          borderRadius: '0.5rem', 
          padding: '3rem', 
          textAlign: 'center', 
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: 'white',
        }}
        onClick={() => document.getElementById('file-input').click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.style.backgroundColor = 'white';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.style.backgroundColor = 'white';
          handleFileSelected(e.dataTransfer.files);
        }}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelected(e.target.files)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ color: '#9ca3af' }}
          >
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
            Drag and drop an image, or click to select
          </p>
        </div>
      </div>

      {/* Cropping Modal */}
      {isOpen && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.5rem', 
            maxWidth: '64rem', 
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1.5rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {currentStep <= ASPECT_RATIOS.length 
                  ? `Crop Your Image (${currentStep}/${ASPECT_RATIOS.length})` 
                  : 'Confirm Your Crops'}
              </h2>
            </div>
            
            {currentStep <= ASPECT_RATIOS.length 
              ? renderCropPreview() 
              : renderConfirmationStep()}
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '1rem'
            }}>
              <button 
                onClick={handleCancel}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {currentStep > 1 && (
                  <button 
                    onClick={handlePrevious}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '0.25rem', 
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Previous
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  disabled={currentStep <= ASPECT_RATIOS.length && !completedCrops[ASPECT_RATIOS[currentStep - 1].name]}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.25rem', 
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: (currentStep <= ASPECT_RATIOS.length && !completedCrops[ASPECT_RATIOS[currentStep - 1].name]) ? 0.5 : 1
                  }}
                >
                  {currentStep < ASPECT_RATIOS.length ? 'Next' : 
                    currentStep === ASPECT_RATIOS.length ? 'Review' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;